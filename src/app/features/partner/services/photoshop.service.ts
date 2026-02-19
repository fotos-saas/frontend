import { Injectable, inject, signal, computed } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { TabloSize } from '../models/partner.models';

/** Kistablo alias merete */
const KISTABLO_ALIAS = { widthCm: 100, heightCm: 70 };

/**
 * PhotoshopService - Photoshop eleresi ut es inditas kezelese
 *
 * Electron IPC-n keresztul kommunikal a main process-szel.
 * Bongeszoben nem mukodik (isElectron check).
 */
@Injectable({
  providedIn: 'root'
})
export class PhotoshopService {
  private readonly logger = inject(LoggerService);

  /** Photoshop eleresi ut */
  readonly path = signal<string | null>(null);

  /** Munka mappa */
  readonly workDir = signal<string | null>(null);

  /** Tabló margó (cm) */
  readonly marginCm = signal<number>(2);

  /** Konfiguralt-e (van mentett path) */
  readonly isConfigured = computed(() => !!this.path());

  /** Ellenorzes folyamatban */
  readonly checking = signal(false);

  private get api() {
    return window.electronAPI?.photoshop;
  }

  /** Mentett path betoltese + auto-detektalas */
  async detectPhotoshop(): Promise<void> {
    if (!this.api) return;

    this.checking.set(true);
    try {
      const [result, savedWorkDir, savedMargin] = await Promise.all([
        this.api.checkInstalled(),
        this.api.getWorkDir(),
        this.api.getMargin(),
      ]);
      if (result.found && result.path) {
        this.path.set(result.path);
      }
      if (savedWorkDir) {
        this.workDir.set(savedWorkDir);
      }
      if (savedMargin !== undefined) {
        this.marginCm.set(savedMargin);
      }
    } catch (err) {
      this.logger.error('Photoshop detektalasi hiba', err);
    } finally {
      this.checking.set(false);
    }
  }

  /** Path beallitasa es mentese */
  async setPath(psPath: string): Promise<boolean> {
    if (!this.api) return false;

    try {
      const result = await this.api.setPath(psPath);
      if (result.success) {
        this.path.set(psPath);
        return true;
      }
      this.logger.warn('Photoshop path beallitas sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Photoshop path beallitasi hiba', err);
      return false;
    }
  }

  /** Photoshop inditasa */
  async launchPhotoshop(): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron kornyezet' };

    try {
      return await this.api.launch();
    } catch (err) {
      this.logger.error('Photoshop inditasi hiba', err);
      return { success: false, error: 'Nem sikerult elinditani' };
    }
  }

  /** Munka mappa beallitasa */
  async setWorkDir(dirPath: string): Promise<boolean> {
    if (!this.api) return false;

    try {
      const result = await this.api.setWorkDir(dirPath);
      if (result.success) {
        this.workDir.set(dirPath);
        return true;
      }
      this.logger.warn('Munka mappa beallitas sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Munka mappa beallitasi hiba', err);
      return false;
    }
  }

  /** Munka mappa tallozas */
  async browseForWorkDir(): Promise<string | null> {
    if (!this.api) return null;

    try {
      const result = await this.api.browseWorkDir();
      if (!result.cancelled && result.path) {
        return result.path;
      }
      return null;
    } catch (err) {
      this.logger.error('Munka mappa browse hiba', err);
      return null;
    }
  }

  /** Margó beállítása */
  async setMargin(marginCm: number): Promise<boolean> {
    if (!this.api) return false;

    try {
      const result = await this.api.setMargin(Number(marginCm));
      if (result.success) {
        this.marginCm.set(marginCm);
        return true;
      }
      this.logger.warn('Margó beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Margó beállítási hiba', err);
      return false;
    }
  }

  /** Tallozas file picker-rel */
  async browseForPhotoshop(): Promise<string | null> {
    if (!this.api) return null;

    try {
      const result = await this.api.browsePath();
      if (!result.cancelled && result.path) {
        return result.path;
      }
      return null;
    } catch (err) {
      this.logger.error('Photoshop browse hiba', err);
      return null;
    }
  }

  /**
   * Meret ertek parszolasa (pl. "80x120" → {heightCm: 80, widthCm: 120})
   * Formatum: HxW (magassag x szelesseg) cm-ben
   */
  parseSizeValue(value: string): { widthCm: number; heightCm: number } | null {
    if (value === 'kistablo') {
      return KISTABLO_ALIAS;
    }

    const match = value.match(/^(\d+)x(\d+)$/);
    if (!match) return null;

    return {
      heightCm: parseInt(match[1], 10),
      widthCm: parseInt(match[2], 10),
    };
  }

  /**
   * PSD generalas es megnyitas Photoshopban
   * 1. Meret parszolas + kistablo alias
   * 2. Downloads/PhotoStack/ mappa keszites
   * 3. Python script futtatasa IPC-n keresztul
   * 4. PSD megnyitasa Photoshopban
   */
  async generateAndOpenPsd(size: TabloSize): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const dimensions = this.parseSizeValue(size.value);
    if (!dimensions) {
      return { success: false, error: `Érvénytelen méret formátum: ${size.value}` };
    }

    try {
      // Downloads path lekerdezese
      const downloadsPath = await this.api.getDownloadsPath();
      const outputDir = `${downloadsPath}/PhotoStack`;
      const outputPath = `${outputDir}/${size.value}.psd`;

      // PSD generalas
      const genResult = await this.api.generatePsd({
        widthCm: dimensions.widthCm,
        heightCm: dimensions.heightCm,
        dpi: 200,
        mode: 'RGB',
        outputPath,
      });

      if (!genResult.success) {
        return { success: false, error: genResult.error || 'PSD generálás sikertelen' };
      }

      // Megnyitas Photoshopban
      const openResult = await this.api.openFile(outputPath);
      if (!openResult.success) {
        return { success: false, error: openResult.error || 'Nem sikerült megnyitni a PSD-t' };
      }

      return { success: true };
    } catch (err) {
      this.logger.error('PSD generalas hiba', err);
      return { success: false, error: 'Váratlan hiba történt a PSD generálás során' };
    }
  }
}
