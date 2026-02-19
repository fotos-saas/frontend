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

  /** Diák fotó layer mérete (cm) */
  readonly studentSizeCm = signal<number>(6);

  /** Tanár fotó layer mérete (cm) */
  readonly teacherSizeCm = signal<number>(6);

  /** Vízszintes gap — képek közötti távolság egy soron belül (cm) */
  readonly gapHCm = signal<number>(2);

  /** Függőleges gap — sorok közötti távolság (cm) */
  readonly gapVCm = signal<number>(3);

  /** Név távolsága a kép aljától (cm) */
  readonly nameGapCm = signal<number>(0.5);

  /** Tördelés: hány valódi szó után sortörés (3+ szavas neveknél) */
  readonly nameBreakAfter = signal<number>(1);

  /** Nevek text igazítás (left/center/right) */
  readonly textAlign = signal<string>('center');

  /** Képek sor-igazítás a gridben (left/center/right) */
  readonly gridAlign = signal<string>('center');

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
      const safe = <T>(fn: (() => Promise<T>) | undefined, fallback: T): Promise<T> =>
        typeof fn === 'function' ? fn().catch(() => fallback) : Promise.resolve(fallback);

      const [result, savedWorkDir, savedMargin, savedStudentSize, savedTeacherSize, savedGapH, savedGapV, savedNameGap, savedNameBreak, savedTextAlign, savedGridAlign] = await Promise.all([
        this.api.checkInstalled(),
        safe(this.api.getWorkDir, null as string | null),
        safe(this.api.getMargin, undefined as number | undefined),
        safe(this.api.getStudentSize, undefined as number | undefined),
        safe(this.api.getTeacherSize, undefined as number | undefined),
        safe(this.api.getGapH, undefined as number | undefined),
        safe(this.api.getGapV, undefined as number | undefined),
        safe(this.api.getNameGap, undefined as number | undefined),
        safe(this.api.getNameBreakAfter, undefined as number | undefined),
        safe(this.api.getTextAlign, undefined as string | undefined),
        safe(this.api.getGridAlign, undefined as string | undefined),
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
      if (savedStudentSize !== undefined) {
        this.studentSizeCm.set(savedStudentSize);
      }
      if (savedTeacherSize !== undefined) {
        this.teacherSizeCm.set(savedTeacherSize);
      }
      if (savedGapH !== undefined) {
        this.gapHCm.set(savedGapH);
      }
      if (savedGapV !== undefined) {
        this.gapVCm.set(savedGapV);
      }
      if (savedNameGap !== undefined) {
        this.nameGapCm.set(savedNameGap);
      }
      if (savedNameBreak !== undefined) {
        this.nameBreakAfter.set(savedNameBreak);
      }
      if (savedTextAlign !== undefined) {
        this.textAlign.set(savedTextAlign);
      }
      if (savedGridAlign !== undefined) {
        this.gridAlign.set(savedGridAlign);
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
    if (!this.api || typeof this.api.setMargin !== 'function') return false;

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

  /** Diák képméret beállítása */
  async setStudentSize(sizeCm: number): Promise<boolean> {
    if (!this.api || typeof this.api.setStudentSize !== 'function') return false;
    try {
      const result = await this.api.setStudentSize(Number(sizeCm));
      if (result.success) { this.studentSizeCm.set(sizeCm); return true; }
      this.logger.warn('Diák képméret beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Diák képméret beállítási hiba', err);
      return false;
    }
  }

  /** Tanár képméret beállítása */
  async setTeacherSize(sizeCm: number): Promise<boolean> {
    if (!this.api || typeof this.api.setTeacherSize !== 'function') return false;
    try {
      const result = await this.api.setTeacherSize(Number(sizeCm));
      if (result.success) { this.teacherSizeCm.set(sizeCm); return true; }
      this.logger.warn('Tanár képméret beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Tanár képméret beállítási hiba', err);
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
   * Szöveget fájlrendszer-biztos névre alakít.
   * Ékezetek eltávolítása, kisbetűsítés, nem alfanumerikus → kötőjel.
   */
  sanitizeName(text: string): string {
    const accents: Record<string, string> = {
      á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u',
      Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ö: 'O', Ő: 'O', Ú: 'U', Ü: 'U', Ű: 'U',
    };
    return text
      .split('').map(c => accents[c] || c).join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * JSX script futtatása a megnyitott Photoshop dokumentumon.
   * 4 guide hozzáadása a beállított margó (cm) értékkel.
   */
  async addGuides(
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const marginCm = this.marginCm();
    if (marginCm <= 0) {
      return { success: true }; // 0 margó = nincs guide
    }

    try {
      const result = await this.api.runJsx({
        scriptName: 'actions/add-guides.jsx',
        jsonData: { marginCm },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addGuides hiba', err);
      return { success: false, error: 'Váratlan hiba a guide-ok hozzáadásakor' };
    }
  }

  /**
   * JSX script futtatása a megnyitott Photoshop dokumentumon.
   * Személynevek text layerként hozzáadása a Names/Students és Names/Teachers csoportba.
   */
  async addNameLayers(
    persons: Array<{ id: number; name: string; type: string }>,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    if (!persons || persons.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.api.runJsx({
        scriptName: 'actions/add-name-layers.jsx',
        personsData: persons,
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addNameLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a név layerek hozzáadásakor' };
    }
  }

  /**
   * JSX script futtatása a megnyitott Photoshop dokumentumon.
   * Smart Object placeholder layerek hozzáadása az Images/Students és Images/Teachers csoportba.
   * Méret: 10.4 x 15.4 cm @ 300 DPI (SO belső méret), layer átméretezése photoSizeCm-re.
   */
  async addImageLayers(
    persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>,
    imageSizeCm: { widthCm: number; heightCm: number; dpi: number } = { widthCm: 10.4, heightCm: 15.4, dpi: 300 },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    if (!persons || persons.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.api.runJsx({
        scriptName: 'actions/add-image-layers.jsx',
        imageData: { persons, ...imageSizeCm, studentSizeCm: this.studentSizeCm(), teacherSizeCm: this.teacherSizeCm() },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addImageLayers hiba', err);
      return { success: false, error: 'Váratlan hiba az image layerek hozzáadásakor' };
    }
  }

  /** Vízszintes gap beállítása */
  async setGapH(gapCm: number): Promise<boolean> {
    if (!this.api || typeof this.api.setGapH !== 'function') return false;
    try {
      const result = await this.api.setGapH(Number(gapCm));
      if (result.success) { this.gapHCm.set(gapCm); return true; }
      this.logger.warn('Vízszintes gap beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Vízszintes gap beállítási hiba', err);
      return false;
    }
  }

  /** Függőleges gap beállítása */
  async setGapV(gapCm: number): Promise<boolean> {
    if (!this.api || typeof this.api.setGapV !== 'function') return false;
    try {
      const result = await this.api.setGapV(Number(gapCm));
      if (result.success) { this.gapVCm.set(gapCm); return true; }
      this.logger.warn('Függőleges gap beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Függőleges gap beállítási hiba', err);
      return false;
    }
  }

  /** Név gap beállítása (távolság kép aljától cm-ben) */
  async setNameGap(gapCm: number): Promise<boolean> {
    if (!this.api || typeof this.api.setNameGap !== 'function') return false;
    try {
      const result = await this.api.setNameGap(Number(gapCm));
      if (result.success) { this.nameGapCm.set(gapCm); return true; }
      this.logger.warn('Név gap beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Név gap beállítási hiba', err);
      return false;
    }
  }

  /** Név tördelés beállítása */
  async setNameBreakAfter(breakAfter: number): Promise<boolean> {
    if (!this.api || typeof this.api.setNameBreakAfter !== 'function') return false;
    try {
      const result = await this.api.setNameBreakAfter(Number(breakAfter));
      if (result.success) { this.nameBreakAfter.set(breakAfter); return true; }
      this.logger.warn('Név tördelés beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Név tördelés beállítási hiba', err);
      return false;
    }
  }

  /** Text igazítás beállítása */
  async setTextAlign(align: string): Promise<boolean> {
    if (!this.api || typeof this.api.setTextAlign !== 'function') return false;
    try {
      const result = await this.api.setTextAlign(align);
      if (result.success) { this.textAlign.set(align); return true; }
      this.logger.warn('Text igazítás beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Text igazítás beállítási hiba', err);
      return false;
    }
  }

  /** Grid igazítás beállítása */
  async setGridAlign(align: string): Promise<boolean> {
    if (!this.api || typeof this.api.setGridAlign !== 'function') return false;
    try {
      const result = await this.api.setGridAlign(align);
      if (result.success) { this.gridAlign.set(align); return true; }
      this.logger.warn('Grid igazítás beállítás sikertelen:', result.error);
      return false;
    } catch (err) {
      this.logger.error('Grid igazítás beállítási hiba', err);
      return false;
    }
  }

  /**
   * Grid elrendezés: layerek rácsba pozícionálása a megadott paraméterek alapján.
   * boardSize: a tabló méretei cm-ben (widthCm, heightCm)
   */
  async arrangeGrid(
    boardSize: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const result = await this.api.runJsx({
        scriptName: 'actions/arrange-grid.jsx',
        jsonData: {
          boardWidthCm: boardSize.widthCm,
          boardHeightCm: boardSize.heightCm,
          marginCm: this.marginCm(),
          studentSizeCm: this.studentSizeCm(),
          teacherSizeCm: this.teacherSizeCm(),
          gapHCm: this.gapHCm(),
          gapVCm: this.gapVCm(),
          gridAlign: this.gridAlign(),
        },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeGrid hiba', err);
      return { success: false, error: 'Váratlan hiba a grid elrendezésnél' };
    }
  }

  /**
   * Nevek rendezése: név layerek pozícionálása a képek alá.
   * A nameGapCm és textAlign beállítások alapján.
   */
  async arrangeNames(
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const result = await this.api.runJsx({
        scriptName: 'actions/arrange-names.jsx',
        jsonData: {
          nameGapCm: this.nameGapCm(),
          textAlign: this.textAlign(),
        },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeNames hiba', err);
      return { success: false, error: 'Váratlan hiba a nevek rendezésénél' };
    }
  }

  /**
   * PSD generálás és megnyitás Photoshopban.
   *
   * Ha van projekt kontextus + workDir:
   *   workDir/partner-slug/2026/projekt-nev-12a/projekt-nev-12a.psd
   *
   * Ha nincs kontextus (globális designer):
   *   Downloads/PhotoStack/80x120.psd
   */
  async generateAndOpenPsd(
    size: TabloSize,
    context?: {
      projectName: string;
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

      if (context && this.workDir()) {
        // Projekt kontextus → workDir/partner/év/projekt-osztály/projekt-osztály.psd
        const partnerDir = context.brandName ? this.sanitizeName(context.brandName) : 'photostack';
        const year = new Date().getFullYear().toString();
        const folderName = this.sanitizeName(
          context.className ? `${context.projectName}-${context.className}` : context.projectName,
        );
        outputPath = `${this.workDir()}/${partnerDir}/${year}/${folderName}/${folderName}.psd`;
      } else {
        // Nincs kontextus → Downloads/PhotoStack/méret.psd
        const downloadsPath = await this.api.getDownloadsPath();
        outputPath = `${downloadsPath}/PhotoStack/${size.value}.psd`;
      }

      // PSD generálás
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

      // Megnyitás Photoshopban
      const openResult = await this.api.openFile(outputPath);
      if (!openResult.success) {
        return { success: false, error: openResult.error || 'Nem sikerült megnyitni a PSD-t', stdout: genResult.stdout, stderr: genResult.stderr };
      }

      return { success: true, outputPath, stdout: genResult.stdout, stderr: genResult.stderr };
    } catch (err) {
      this.logger.error('PSD generalas hiba', err);
      return { success: false, error: 'Váratlan hiba történt a PSD generálás során' };
    }
  }
}
