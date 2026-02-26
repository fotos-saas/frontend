import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from './logger.service';
import { PortraitProcessResult, PortraitBatchResult, PortraitProcessingSettings } from './electron.types';

/**
 * ElectronPortraitService - Lokalis portre hatter feldolgozas
 *
 * Funkcionalitas:
 * - Python + InSPyReNet elérhetoseg ellenorzese
 * - Egyedi es kotegelt portre feldolgozas
 * - Hatterkep letoltese API-bol
 * - Temp konyvtar kezeles
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronPortraitService {
  private readonly logger = inject(LoggerService);

  /** Python elérhetoseg cache-elese (null = meg nem ellenoriztuk) */
  private readonly _pythonAvailable = signal<boolean | null>(null);
  readonly pythonAvailable = this._pythonAvailable.asReadonly();

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  // ============ Python Elérhetőség ============

  /** Python + InSPyReNet elérhetőség ellenőrzése (cache-elt) */
  async checkPython(): Promise<{ available: boolean; error?: string }> {
    if (!this.isElectron) {
      return { available: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    const result = await window.electronAPI!.portrait.checkPython();
    this._pythonAvailable.set(result.available);
    this.logger.info('Portrait Python elérhetőség:', result.available);
    return result;
  }

  /** Cache-elt érték visszaadása, vagy friss ellenőrzés */
  async isPythonAvailable(): Promise<boolean> {
    if (this._pythonAvailable() !== null) {
      return this._pythonAvailable()!;
    }
    const result = await this.checkPython();
    return result.available;
  }

  // ============ Feldolgozás ============

  /** Egyedi portré feldolgozása */
  async processSingle(
    inputPath: string,
    outputPath: string,
    settings: PortraitProcessingSettings,
  ): Promise<PortraitProcessResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    this.logger.info('Portrait feldolgozás indítása:', inputPath);
    return window.electronAPI!.portrait.processSingle({ inputPath, outputPath, settings });
  }

  /** Kötegelt portré feldolgozás */
  async processBatch(
    items: Array<{ input: string; output: string }>,
    settings: PortraitProcessingSettings,
  ): Promise<PortraitBatchResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    this.logger.info(`Portrait kötegelt feldolgozás: ${items.length} elem`);
    return window.electronAPI!.portrait.processBatch({ items, settings });
  }

  // ============ Háttérkép Kezelés ============

  /** Háttérkép letöltése az API-ból lokálisan */
  async downloadBackground(
    url: string,
    outputPath: string,
  ): Promise<{ success: boolean; error?: string; path?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    // Alapvető URL validáció renderer oldalon is (defense-in-depth)
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return { success: false, error: 'Csak HTTPS URL megengedett' };
      }
    } catch {
      return { success: false, error: 'Érvénytelen URL formátum' };
    }

    return window.electronAPI!.portrait.downloadBackground({ url, outputPath });
  }

  // ============ Temp Kezelés ============

  /** Temp könyvtár lekérdezése portrait feldolgozáshoz */
  async getTempDir(): Promise<string | null> {
    if (!this.isElectron) return null;
    return window.electronAPI!.portrait.getTempDir();
  }

  /** Temp fájlok törlése */
  async cleanupTemp(filePaths: string[]): Promise<{ success: boolean; cleaned?: number }> {
    if (!this.isElectron) return { success: false };
    return window.electronAPI!.portrait.cleanupTemp(filePaths);
  }
}
