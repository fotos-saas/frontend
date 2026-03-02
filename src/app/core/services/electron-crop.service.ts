import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from './logger.service';
import {
  CropDetectResult,
  CropBatchDetectResult,
  CropExecuteResult,
  CropBatchExecuteResult,
  CropFaceLandmarks,
  CropProcessingSettings,
} from './electron.types';

/**
 * ElectronCropService - Lokális automatikus portrévágás
 *
 * Funkcionalitás:
 * - Python + MediaPipe elérhetőség ellenőrzése
 * - Arc detektálás (egyedi és kötegelt)
 * - Sharp vágás végrehajtása (egyedi és kötegelt)
 * - Fotó letöltés API-ból
 * - Temp könyvtár kezelés
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronCropService {
  private readonly logger = inject(LoggerService);

  /** MediaPipe elérhetőség cache (null = még nem ellenőriztük) */
  private readonly _mediapipeAvailable = signal<boolean | null>(null);
  readonly mediapipeAvailable = this._mediapipeAvailable.asReadonly();

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  // ============ MediaPipe Elérhetőség ============

  /** Python + MediaPipe Face Mesh elérhetőség ellenőrzése (cache-elt) */
  async checkPython(): Promise<{ available: boolean; error?: string }> {
    if (!this.isElectron) {
      return { available: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    const result = await window.electronAPI!.crop.checkPython();
    this._mediapipeAvailable.set(result.available);
    this.logger.info('Crop MediaPipe elérhetőség:', result.available);
    return result;
  }

  /** Cache-elt érték visszaadása, vagy friss ellenőrzés */
  async isMediapipeAvailable(): Promise<boolean> {
    if (this._mediapipeAvailable() !== null) {
      return this._mediapipeAvailable()!;
    }
    const result = await this.checkPython();
    return result.available;
  }

  // ============ Arc Detektálás ============

  /** Egy kép arc detektálása */
  async detectFaces(inputPath: string): Promise<CropDetectResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    this.logger.info('Crop arc detektálás:', inputPath);
    return window.electronAPI!.crop.detectFaces({ inputPath });
  }

  /** Kötegelt arc detektálás */
  async detectBatch(items: Array<{ input: string }>): Promise<CropBatchDetectResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    this.logger.info(`Crop kötegelt detektálás: ${items.length} elem`);
    return window.electronAPI!.crop.detectBatch({ items });
  }

  // ============ Vágás Végrehajtás ============

  /** Egyedi kép vágása */
  async executeCrop(
    inputPath: string,
    outputPath: string,
    face: CropFaceLandmarks,
    settings: Partial<CropProcessingSettings>,
    thumbnailPath?: string,
  ): Promise<CropExecuteResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    return window.electronAPI!.crop.executeCrop({
      inputPath, outputPath, thumbnailPath, face, settings,
    });
  }

  /** Kötegelt vágás */
  async executeBatchCrop(
    items: Array<{
      inputPath: string;
      outputPath: string;
      thumbnailPath: string;
      face: CropFaceLandmarks;
    }>,
    settings: Partial<CropProcessingSettings>,
  ): Promise<CropBatchExecuteResult> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    this.logger.info(`Crop kötegelt vágás: ${items.length} elem`);
    return window.electronAPI!.crop.executeBatchCrop({ items, settings });
  }

  // ============ Fotó Letöltés ============

  /** Fotó letöltése az API-ból lokálisan */
  async downloadPhoto(
    url: string,
    outputPath: string,
  ): Promise<{ success: boolean; error?: string; path?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }

    return window.electronAPI!.crop.downloadPhoto({ url, outputPath });
  }

  // ============ Temp Kezelés ============

  /** Temp könyvtár lekérdezése crop feldolgozáshoz */
  async getTempDir(): Promise<string | null> {
    if (!this.isElectron) return null;
    return window.electronAPI!.crop.getTempDir();
  }

  /** Temp fájlok törlése */
  async cleanupTemp(filePaths: string[]): Promise<{ success: boolean; cleaned?: number }> {
    if (!this.isElectron) return { success: false };
    return window.electronAPI!.crop.cleanupTemp(filePaths);
  }

  /** Feldolgozott fájl beolvasása (batch upload-hoz) */
  async readProcessedFile(filePath: string): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }
    return window.electronAPI!.crop.readProcessedFile({ filePath });
  }

  /** Böngésző File objektum mentése temp könyvtárba (kalibráció) */
  async saveTempFile(fileName: string, data: ArrayBuffer): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: 'Csak Electron alkalmazásban érhető el' };
    }
    return window.electronAPI!.crop.saveTempFile({ fileName, data });
  }
}
