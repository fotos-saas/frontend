/**
 * PsdCacheService — Munkakönyvtár PSD fájlok és placed-photos.json gyorsítótár
 *
 * Chokidar-ral figyeli a workDir-t, és cache-eli a PSD fájlokat
 * + a hozzájuk tartozó placed-photos.json tartalmát.
 * IPC-n keresztül értesíti a renderert a változásokról.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ipcMain, BrowserWindow } from 'electron';
import { watch, type FSWatcher } from 'chokidar';
import Store from 'electron-store';
import log from 'electron-log/main';
import type { PhotoshopSchema } from '../services/jsx-runner.service';

// ============ Típusok ============

interface PlacedPhotoEntry {
  mediaId: number | null;
  photoUrl: string;
  withFrame: boolean;
  placedAt: string;
}

type PlacedPhotosMap = Record<string, PlacedPhotoEntry>;

export interface PsdCacheEntry {
  folderPath: string;
  psdPath: string;
  psdLastModified: string;
  placedPhotos: Record<string, number> | null;
  placedPhotosLastModified: string | null;
}

// ============ Konstansok ============

const IGNORED_PATTERNS = [
  '**/scripts/**',
  '**/node_modules/**',
  '**/.git/**',
  '**/backups/**',
];

// ============ Service ============

export class PsdCacheService {
  private cache = new Map<string, PsdCacheEntry>();
  private watcher: FSWatcher | null = null;
  private workDir: string | null = null;
  private watching = false;

  constructor(
    private psStore: Store<PhotoshopSchema>,
    private mainWindow: BrowserWindow | null,
  ) {}

  // ---- Publikus API ----

  start(): void {
    this.registerIpcHandlers();

    this.workDir = this.psStore.get('workDirectory') ?? null;

    if (!this.workDir) {
      log.info('[PsdCache] Nincs workDir, várakozás a beállításra...');
    } else {
      log.info(`[PsdCache] Indítás: ${this.workDir}`);
      this.startWatching();
    }

    // workDir változás figyelése — újraindítás
    this.psStore.onDidChange('workDirectory', (newVal) => {
      if (newVal && newVal !== this.workDir) {
        log.info(`[PsdCache] workDir megváltozott: ${newVal}`);
        this.workDir = newVal;
        this.restartWatching();
      } else if (newVal && !this.watching) {
        this.workDir = newVal;
        log.info(`[PsdCache] workDir beállítva: ${newVal}`);
        this.startWatching();
      }
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.cache.clear();
    this.watching = false;
    log.info('[PsdCache] Leállítva');
  }

  getCache(): PsdCacheEntry[] {
    return Array.from(this.cache.values());
  }

  async rescan(): Promise<PsdCacheEntry[]> {
    log.info('[PsdCache] Teljes újraszkennelés...');
    this.cache.clear();

    if (this.workDir && fs.existsSync(this.workDir)) {
      this.scanDirectory(this.workDir, 0);
    }

    log.info(`[PsdCache] Újraszkennelés kész: ${this.cache.size} bejegyzés`);
    return this.getCache();
  }

  // ---- Belső logika ----

  private startWatching(): void {
    if (!this.workDir || !fs.existsSync(this.workDir)) {
      log.warn(`[PsdCache] workDir nem létezik: ${this.workDir}`);
      return;
    }

    // Kezdeti szkennelés
    this.scanDirectory(this.workDir, 0);
    log.info(`[PsdCache] Kezdeti szkennelés kész: ${this.cache.size} bejegyzés`);

    // Chokidar figyelés
    this.watcher = watch(
      [
        path.join(this.workDir, '**/*.psd'),
        path.join(this.workDir, '**/placed-photos.json'),
      ],
      {
        ignored: IGNORED_PATTERNS,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 500,
        },
        depth: 4,
      },
    );

    this.watcher.on('add', (filePath: string) => this.handleFileChange(filePath));
    this.watcher.on('change', (filePath: string) => this.handleFileChange(filePath));
    this.watcher.on('unlink', (filePath: string) => this.handleFileUnlink(filePath));

    this.watching = true;
    log.info(`[PsdCache] Figyelés elindítva: ${this.workDir}`);
  }

  private restartWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.cache.clear();
    this.watching = false;
    this.startWatching();
  }

  private registerIpcHandlers(): void {
    ipcMain.handle('psd-cache:get-all', () => {
      return this.getCache();
    });

    ipcMain.handle('psd-cache:rescan', async () => {
      return await this.rescan();
    });

    ipcMain.handle('psd-cache:get-status', () => {
      return {
        watching: this.watching,
        entryCount: this.cache.size,
        workDir: this.workDir,
      };
    });
  }

  /**
   * Rekurzív könyvtár szkennelés PSD fájlokért.
   * Max mélység: 4 szint.
   */
  private scanDirectory(dirPath: string, depth: number): void {
    if (depth > 4) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    const skipDirs = new Set(['scripts', 'node_modules', '.git', 'backups']);

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        this.scanDirectory(path.join(dirPath, entry.name), depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.psd')) {
        this.processPsdFile(path.join(dirPath, entry.name));
      }
    }
  }

  /**
   * PSD fájl feldolgozása: cache bejegyzés létrehozása/frissítése.
   */
  private processPsdFile(psdPath: string): void {
    const folderPath = path.dirname(psdPath);

    let psdStat: fs.Stats;
    try {
      psdStat = fs.statSync(psdPath);
    } catch {
      return;
    }

    const entry: PsdCacheEntry = {
      folderPath,
      psdPath,
      psdLastModified: psdStat.mtime.toISOString(),
      placedPhotos: null,
      placedPhotosLastModified: null,
    };

    // placed-photos.json beolvasása ha létezik
    const placedJsonPath = path.join(folderPath, 'placed-photos.json');
    this.readPlacedPhotos(placedJsonPath, entry);

    this.cache.set(folderPath, entry);
  }

  /**
   * placed-photos.json beolvasása és personId→mediaId kinyerése.
   */
  private readPlacedPhotos(jsonPath: string, entry: PsdCacheEntry): void {
    if (!fs.existsSync(jsonPath)) return;

    try {
      const stat = fs.statSync(jsonPath);
      const raw: PlacedPhotosMap = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const placedPhotos: Record<string, number> = {};

      for (const [personId, photoEntry] of Object.entries(raw)) {
        if (photoEntry.mediaId !== null) {
          placedPhotos[personId] = photoEntry.mediaId;
        }
      }

      entry.placedPhotos = Object.keys(placedPhotos).length > 0 ? placedPhotos : null;
      entry.placedPhotosLastModified = stat.mtime.toISOString();
    } catch (err) {
      log.warn(`[PsdCache] placed-photos.json olvasási hiba: ${jsonPath}`, err);
    }
  }

  /**
   * Fájl változás/hozzáadás kezelése.
   */
  private handleFileChange(filePath: string): void {
    const folderPath = path.dirname(filePath);
    const fileName = path.basename(filePath);

    if (fileName.endsWith('.psd')) {
      log.info(`[PsdCache] PSD változás: ${filePath}`);

      const existing = this.cache.get(folderPath);
      if (existing) {
        // Meglévő bejegyzés frissítése
        try {
          const stat = fs.statSync(filePath);
          existing.psdPath = filePath;
          existing.psdLastModified = stat.mtime.toISOString();
        } catch {
          return;
        }
      } else {
        // Új bejegyzés
        this.processPsdFile(filePath);
      }

      const entry = this.cache.get(folderPath);
      if (entry) {
        this.sendUpdate(folderPath, entry);
      }
    } else if (fileName === 'placed-photos.json') {
      log.info(`[PsdCache] placed-photos.json változás: ${filePath}`);

      const existing = this.cache.get(folderPath);
      if (existing) {
        this.readPlacedPhotos(filePath, existing);
        this.sendUpdate(folderPath, existing);
      }
      // Ha nincs PSD a mappában, nem hozunk létre bejegyzést
    }
  }

  /**
   * Fájl törlés kezelése.
   */
  private handleFileUnlink(filePath: string): void {
    const folderPath = path.dirname(filePath);
    const fileName = path.basename(filePath);

    if (fileName.endsWith('.psd')) {
      log.info(`[PsdCache] PSD törölve: ${filePath}`);
      this.cache.delete(folderPath);
      this.sendRemoved(folderPath);
    } else if (fileName === 'placed-photos.json') {
      log.info(`[PsdCache] placed-photos.json törölve: ${filePath}`);
      const existing = this.cache.get(folderPath);
      if (existing) {
        existing.placedPhotos = null;
        existing.placedPhotosLastModified = null;
        this.sendUpdate(folderPath, existing);
      }
    }
  }

  // ---- IPC események ----

  private sendUpdate(folderPath: string, entry: PsdCacheEntry): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('psd-cache:updated', { folderPath, entry });
    }
  }

  private sendRemoved(folderPath: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('psd-cache:removed', { folderPath });
    }
  }
}
