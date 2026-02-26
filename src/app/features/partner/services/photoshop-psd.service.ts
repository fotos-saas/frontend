import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { TabloSize } from '../models/partner.models';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';

/** Kistabló alias mérete */
const KISTABLO_ALIAS = { widthCm: 100, heightCm: 70 };

/**
 * PhotoshopPsdService — PSD generálás, fájl ops, path compute, slug utility-k.
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopPsdService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);
  private readonly settings = inject(PhotoshopSettingsService);

  private get api() { return this.pathService.api; }

  /**
   * Méret érték parszolása (pl. "80x120" → {heightCm: 80, widthCm: 120})
   * Formátum: HxW (magasság x szélesség) cm-ben
   */
  parseSizeValue(value: string): { widthCm: number; heightCm: number } | null {
    if (value === 'kistablo') return KISTABLO_ALIAS;
    const match = value.match(/^(\d+)x(\d+)$/);
    if (!match) return null;
    return { heightCm: parseInt(match[1], 10), widthCm: parseInt(match[2], 10) };
  }

  /** Szöveget fájlrendszer-biztos névre alakít */
  sanitizeName(text: string): string {
    return this.slugify(text, '-');
  }

  /** Fájl/mappa név generálás (aláhúzásos szeparátor) */
  sanitizePathName(text: string): string {
    return this.slugify(text, '_');
  }

  /** Projekt mappa név generálása: iskolaNév + osztály */
  buildProjectFolderName(
    ctx: { schoolName?: string | null; projectName: string; className?: string | null },
  ): string {
    const baseName = ctx.schoolName || ctx.projectName;
    const classCompact = ctx.className
      ? ctx.className.replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, '')
      : '';
    return this.sanitizePathName(classCompact ? `${baseName} ${classCompact}` : baseName);
  }

  private slugify(text: string, separator: string): string {
    const accents: Record<string, string> = {
      á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u',
      Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ö: 'O', Ő: 'O', Ú: 'U', Ü: 'U', Ű: 'U',
    };
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text
      .split('').map(c => accents[c] || c).join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, separator)
      .replace(new RegExp(`^${escaped}+|${escaped}+$`, 'g'), '');
  }

  /** PSD elérési út kiszámítása a projekt kontextus alapján */
  async computePsdPath(
    sizeValue: string,
    context?: { projectName: string; schoolName?: string | null; className?: string | null; brandName?: string | null },
  ): Promise<string | null> {
    if (!this.api) return null;
    try {
      if (context && this.pathService.workDir()) {
        const partnerDir = context.brandName ? this.sanitizePathName(context.brandName) : 'photostack';
        const folderName = this.buildProjectFolderName(context);
        const year = new Date().getFullYear().toString();
        const dpi = 200;
        const psdFileName = `${folderName}_${sizeValue}_${dpi}dpi`;
        return `${this.pathService.workDir()}/${partnerDir}/${year}/${folderName}/${psdFileName}.psd`;
      }
      const downloadsPath = await this.pathService.getDownloadsPath();
      return `${downloadsPath}/PhotoStack/${sizeValue}.psd`;
    } catch {
      return null;
    }
  }

  /** PSD generálás és megnyitás Photoshopban */
  async generateAndOpenPsd(
    size: TabloSize,
    context?: {
      projectName: string;
      schoolName?: string | null;
      className?: string | null;
      brandName?: string | null;
      persons?: Array<{ id: number; name: string; type: string }>;
    },
  ): Promise<{ success: boolean; error?: string; outputPath?: string; stdout?: string; stderr?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const dimensions = this.parseSizeValue(size.value);
    if (!dimensions) {
      return { success: false, error: `Érvénytelen méret formátum: ${size.value}` };
    }

    try {
      let outputPath: string;

      if (context && this.pathService.workDir()) {
        const partnerDir = context.brandName ? this.sanitizePathName(context.brandName) : 'photostack';
        const year = new Date().getFullYear().toString();
        const folderName = this.buildProjectFolderName(context);
        const dpi = 200;
        const psdFileName = `${folderName}_${size.value}_${dpi}dpi`;
        outputPath = `${this.pathService.workDir()}/${partnerDir}/${year}/${folderName}/${psdFileName}.psd`;
      } else {
        const downloadsPath = await this.pathService.getDownloadsPath();
        outputPath = `${downloadsPath}/PhotoStack/${size.value}.psd`;
      }

      const genResult = await this.api.generatePsd({
        widthCm: dimensions.widthCm,
        heightCm: dimensions.heightCm,
        dpi: 200,
        mode: 'RGB',
        outputPath,
        persons: context?.persons,
      });

      if (!genResult.success) {
        return { success: false, error: genResult.error || 'PSD generálás sikertelen', stdout: genResult.stdout, stderr: genResult.stderr };
      }

      const openResult = await this.api.openFile(outputPath);
      if (!openResult.success) {
        return { success: false, error: openResult.error || 'Nem sikerült megnyitni a PSD-t', stdout: genResult.stdout, stderr: genResult.stderr };
      }

      return { success: true, outputPath, stdout: genResult.stdout, stderr: genResult.stderr };
    } catch (err) {
      this.logger.error('PSD generálás hiba', err);
      return { success: false, error: 'Váratlan hiba történt a PSD generálás során' };
    }
  }

  /** Fájlok mentése temp könyvtárba */
  async saveTempFiles(files: File[]): Promise<{ success: boolean; paths: string[]; error?: string }> {
    if (!this.api) return { success: false, paths: [], error: 'Nem Electron környezet' };

    const fileData: Array<{ name: string; data: ArrayBuffer }> = [];
    for (const f of files) {
      const buffer = await f.arrayBuffer();
      fileData.push({ name: f.name, data: buffer });
    }

    return this.api.saveTempFiles({ files: fileData });
  }

  /** Dokumentum mentése és bezárása Photoshopban */
  async saveAndCloseDocument(targetDocName?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.pathService.runJsx({
        scriptName: 'actions/save-and-close.jsx',
        targetDocName,
      });
      if (!result.success) {
        return { success: false, error: result.error || 'Mentés és bezárás sikertelen' };
      }
      const output = result.output ?? '';
      if (output.indexOf('__SAVE_CLOSE__OK') === -1) {
        const errorMatch = output.match(/\[JSX\] HIBA: (.+)/);
        return { success: false, error: errorMatch?.[1] || 'Ismeretlen hiba a mentésnél' };
      }
      return { success: true };
    } catch (err) {
      this.logger.error('Dokumentum mentés/bezárás hiba', err);
      return { success: false, error: 'Váratlan hiba a dokumentum mentésnél' };
    }
  }
}
