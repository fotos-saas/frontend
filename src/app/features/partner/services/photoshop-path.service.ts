import { Injectable, inject, signal, computed } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';

/**
 * PhotoshopPathService — Photoshop elérési út detektálás, indítás, tallózás, munka mappa.
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopPathService {
  private readonly logger = inject(LoggerService);

  /** Photoshop elérési út */
  readonly path = signal<string | null>(null);

  /** Munka mappa */
  readonly workDir = signal<string | null>(null);

  /** Konfigurált-e (van mentett path) */
  readonly isConfigured = computed(() => !!this.path());

  /** Ellenőrzés folyamatban */
  readonly checking = signal(false);

  /** Aktuálisan nyitott PSD fájl útvonala (auto-open-hez) */
  readonly psdPath = signal<string | null>(null);

  get api() {
    return window.electronAPI?.photoshop;
  }

  /** Mentett path betöltése + auto-detektálás */
  async detectPath(): Promise<void> {
    if (!this.api) return;

    this.checking.set(true);
    try {
      const result = await this.api.checkInstalled();
      if (result.found && result.path) {
        this.path.set(result.path);
      }

      const safe = <T>(fn: (() => Promise<T>) | undefined, fallback: T): Promise<T> =>
        typeof fn === 'function' ? fn().catch(() => fallback) : Promise.resolve(fallback);

      const savedWorkDir = await safe(this.api.getWorkDir, null as string | null);
      if (savedWorkDir) {
        this.workDir.set(savedWorkDir);
      }
    } catch (err) {
      this.logger.error('Photoshop detektálási hiba', err);
    } finally {
      this.checking.set(false);
    }
  }

  /** Path beállítása és mentése */
  async setPath(psPath: string): Promise<boolean> {
    if (!this.api) return false;
    try {
      const result = await this.api.setPath(psPath);
      if (result.success) {
        this.path.set(psPath);
        return true;
      }
      this.logger.warn('Photoshop path beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Photoshop path beállítási hiba', err);
      return false;
    }
  }

  /** Photoshop indítása */
  async launchPhotoshop(): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.launch();
    } catch (err) {
      this.logger.error('Photoshop indítási hiba', err);
      return { success: false, error: 'Nem sikerült elindítani' };
    }
  }

  /** Tallózás file picker-rel */
  async browseForPhotoshop(): Promise<string | null> {
    if (!this.api) return null;
    try {
      const result = await this.api.browsePath();
      return (!result.cancelled && result.path) ? result.path : null;
    } catch (err) {
      this.logger.error('Photoshop browse hiba', err);
      return null;
    }
  }

  /** Munka mappa beállítása */
  async setWorkDir(dirPath: string): Promise<boolean> {
    if (!this.api) return false;
    try {
      const result = await this.api.setWorkDir(dirPath);
      if (result.success) {
        this.workDir.set(dirPath);
        return true;
      }
      this.logger.warn('Munka mappa beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Munka mappa beállítási hiba', err);
      return false;
    }
  }

  /** Munka mappa tallózás */
  async browseForWorkDir(): Promise<string | null> {
    if (!this.api) return null;
    try {
      const result = await this.api.browseWorkDir();
      return (!result.cancelled && result.path) ? result.path : null;
    } catch (err) {
      this.logger.error('Munka mappa browse hiba', err);
      return null;
    }
  }

  /** PSD fájl megnyitása Photoshopban */
  async openPsdFile(psdPath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.openFile(psdPath);
    } catch (err) {
      this.logger.error('PSD megnyitás hiba', err);
      return { success: false, error: 'Váratlan hiba a PSD megnyitásnál' };
    }
  }

  /** Fájl megmutatása a Finderben / Explorerben */
  revealInFinder(filePath: string): void {
    this.api?.revealInFinder(filePath);
  }

  /** PSD fájl létezés ellenőrzés (layouts/ mappa is) */
  async checkPsdExists(psdPath: string): Promise<{ exists: boolean; hasLayouts: boolean }> {
    if (!this.api) return { exists: false, hasLayouts: false };
    try {
      const result = await this.api.checkPsdExists({ psdPath });
      return result.success ? { exists: result.exists, hasLayouts: result.hasLayouts } : { exists: false, hasLayouts: false };
    } catch (err) {
      this.logger.error('PSD létezés ellenőrzés hiba', err);
      return { exists: false, hasLayouts: false };
    }
  }

  /** PSD backup készítése */
  async backupPsd(psdPath: string): Promise<{ success: boolean; error?: string; backupPath?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.backupPsd({ psdPath });
    } catch (err) {
      this.logger.error('PSD backup hiba', err);
      return { success: false, error: 'Backup készítés sikertelen' };
    }
  }

  /** Downloads mappa lekérése */
  async getDownloadsPath(): Promise<string> {
    if (!this.api) return '';
    return this.api.getDownloadsPath();
  }

  /** runJsx wrapper — automatikusan hozzáadja a psdFilePath-ot (auto-open) */
  runJsx(params: Parameters<NonNullable<typeof this.api>['runJsx']>[0]) {
    return this.api!.runJsx({ ...params, psdFilePath: this.psdPath() ?? undefined });
  }
}
