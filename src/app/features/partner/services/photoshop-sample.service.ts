import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { environment } from '../../../../environments/environment';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';

/**
 * PhotoshopSampleService — Sample/final/kistabló generálás.
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopSampleService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);
  private readonly settings = inject(PhotoshopSettingsService);
  private readonly psdService = inject(PhotoshopPsdService);

  private get sampleApi() { return window.electronAPI?.sample; }
  private get finalizerApi() { return window.electronAPI?.finalizer; }

  /** Flatten export végrehajtása → temp JPG útvonal */
  private async flattenExport(quality: number): Promise<{ success: boolean; tempJpgPath?: string; error?: string }> {
    const api = this.pathService.api;
    if (!api) return { success: false, error: 'Nem Electron környezet' };

    const flattenResult = await this.pathService.runJsx({
      scriptName: 'actions/flatten-export.jsx',
      jsonData: { quality },
    });

    if (!flattenResult.success) {
      return { success: false, error: flattenResult.error || 'Flatten export sikertelen' };
    }

    const output = flattenResult.output || '';
    const okMatch = output.match(/__FLATTEN_RESULT__OK:(.+)/);
    if (!okMatch) {
      return { success: false, error: `A flatten export nem adott vissza OK eredményt.` };
    }

    return { success: true, tempJpgPath: okMatch[1].trim() };
  }

  /** Közös kontextus adat lekérése */
  private getContext(projectName: string, context?: { schoolName?: string | null; className?: string | null }) {
    const psdFilePath = this.pathService.psdPath();
    const authToken = sessionStorage.getItem('marketer_token') || '';
    const psdDirPath = psdFilePath ? psdFilePath.replace(/[/\\][^/\\]+$/, '') : '';
    const folderName = this.psdService.buildProjectFolderName({
      schoolName: context?.schoolName,
      projectName,
      className: context?.className,
    });
    return { psdFilePath, authToken, psdDirPath, folderName };
  }

  /** Minta generálás: flatten → resize → watermark → save + upload */
  async generateSample(
    projectId: number,
    projectName: string,
    largeSize = false,
    context?: { schoolName?: string | null; className?: string | null },
  ): Promise<{
    success: boolean; localPaths?: string[]; uploadedCount?: number; error?: string; errors?: string[];
  }> {
    if (!this.pathService.api || !this.sampleApi) return { success: false, error: 'Nem Electron környezet' };

    const { psdFilePath, authToken, psdDirPath, folderName } = this.getContext(projectName, context);
    if (!psdFilePath) return { success: false, error: 'Nincs megnyitott PSD fájl' };

    try {
      const flatten = await this.flattenExport(95);
      if (!flatten.success) return { success: false, error: flatten.error };

      const result = await this.sampleApi.generate({
        psdFilePath: flatten.tempJpgPath!,
        outputDir: psdDirPath,
        projectId,
        projectName: folderName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        watermarkText: this.settings.sampleWatermarkText(),
        watermarkColor: this.settings.sampleWatermarkColor(),
        watermarkOpacity: this.settings.sampleWatermarkOpacity(),
        sizes: [
          { name: 'minta', width: largeSize ? this.settings.sampleSizeLarge() : this.settings.sampleSizeSmall() },
        ],
      });

      return result;
    } catch (err) {
      this.logger.error('Minta generálás hiba', err);
      return { success: false, error: 'Váratlan hiba a minta generálásnál' };
    }
  }

  /** Véglegesített tablókép generálása és feltöltése */
  async generateFinal(
    projectId: number,
    projectName: string,
    context?: { schoolName?: string | null; className?: string | null },
  ): Promise<{
    success: boolean; localPath?: string; uploadedCount?: number; error?: string;
  }> {
    if (!this.pathService.api || !this.finalizerApi) return { success: false, error: 'Nem Electron környezet' };

    const { psdFilePath, authToken, psdDirPath, folderName } = this.getContext(projectName, context);
    if (!psdFilePath) return { success: false, error: 'Nincs megnyitott PSD fájl' };

    try {
      const flatten = await this.flattenExport(12);
      if (!flatten.success) return { success: false, error: flatten.error };

      return await this.finalizerApi.upload({
        flattenedJpgPath: flatten.tempJpgPath!,
        outputDir: psdDirPath,
        projectId,
        projectName: folderName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        type: 'flat',
      });
    } catch (err) {
      this.logger.error('Véglegesítés hiba', err);
      return { success: false, error: 'Váratlan hiba a véglegesítésnél' };
    }
  }

  /** Kistabló generálása és feltöltése */
  async generateSmallTablo(
    projectId: number,
    projectName: string,
    context?: { schoolName?: string | null; className?: string | null },
  ): Promise<{
    success: boolean; localPath?: string; uploadedCount?: number; error?: string;
  }> {
    if (!this.pathService.api || !this.finalizerApi) return { success: false, error: 'Nem Electron környezet' };

    const { psdFilePath, authToken, psdDirPath, folderName } = this.getContext(projectName, context);
    if (!psdFilePath) return { success: false, error: 'Nincs megnyitott PSD fájl' };

    try {
      const flatten = await this.flattenExport(12);
      if (!flatten.success) return { success: false, error: flatten.error };

      return await this.finalizerApi.upload({
        flattenedJpgPath: flatten.tempJpgPath!,
        outputDir: psdDirPath,
        projectId,
        projectName: folderName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        type: 'small_tablo',
        maxSize: 3000,
      });
    } catch (err) {
      this.logger.error('Kistabló generálás hiba', err);
      return { success: false, error: 'Váratlan hiba a kistabló generálásnál' };
    }
  }
}
