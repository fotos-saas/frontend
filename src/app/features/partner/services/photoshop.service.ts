import { Injectable, inject, signal, computed } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotListItem, SnapshotLayer, TemplateSlot, TemplateFixedLayer, TemplateListItem, GlobalTemplate } from '@core/services/electron.types';
import { TabloSize } from '../models/partner.models';
import { environment } from '../../../../environments/environment';

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

  /** Aktuálisan nyitott PSD fájl útvonala (auto-open-hez) */
  readonly psdPath = signal<string | null>(null);

  /** Minta beállítások */
  readonly sampleSizeLarge = signal(4000);
  readonly sampleSizeSmall = signal(2000);
  readonly sampleWatermarkText = signal('MINTA');
  readonly sampleWatermarkColor = signal<'white' | 'black'>('white');
  readonly sampleWatermarkOpacity = signal(0.15);
  readonly sampleUseLargeSize = signal(false);

  /** Konfiguralt-e (van mentett path) */
  readonly isConfigured = computed(() => !!this.path());

  /** Ellenorzes folyamatban */
  readonly checking = signal(false);

  private get api() {
    return window.electronAPI?.photoshop;
  }

  private get sampleApi() {
    return window.electronAPI?.sample;
  }

  private get finalizerApi() {
    return window.electronAPI?.finalizer;
  }

  /** runJsx wrapper — automatikusan hozzáadja a psdFilePath-ot (auto-open) */
  private runJsx(params: Parameters<NonNullable<typeof this.api>['runJsx']>[0]) {
    return this.api!.runJsx({ ...params, psdFilePath: this.psdPath() ?? undefined });
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

      // Minta beallitasok betoltese
      if (this.sampleApi) {
        try {
          const sampleResult = await this.sampleApi.getSettings();
          if (sampleResult.success && sampleResult.settings) {
            this.sampleSizeLarge.set(sampleResult.settings.sizeLarge);
            this.sampleSizeSmall.set(sampleResult.settings.sizeSmall);
            this.sampleWatermarkText.set(sampleResult.settings.watermarkText);
            this.sampleWatermarkColor.set(sampleResult.settings.watermarkColor);
            this.sampleWatermarkOpacity.set(sampleResult.settings.watermarkOpacity);
            if (sampleResult.settings.useLargeSize !== undefined) {
              this.sampleUseLargeSize.set(sampleResult.settings.useLargeSize);
            }
          }
        } catch (_) { /* Minta beallitasok nem kritikus */ }
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
      const result = await this.runJsx({
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
      const result = await this.runJsx({
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
      const result = await this.runJsx({
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

  /**
   * Extra nevek beillesztése/frissítése a megnyitott PSD-ben.
   * ExtraNames group létrehozása header + names text layer párokkal.
   */
  async addExtraNames(
    extraNames: { students: string; teachers: string },
    options: { includeStudents: boolean; includeTeachers: boolean },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const jsonData: Record<string, unknown> = {
        includeStudents: options.includeStudents,
        includeTeachers: options.includeTeachers,
        font: 'ArialMT',
        fontSize: 20,
        headerFontSize: 22,
        textColor: { r: 0, g: 0, b: 0 },
        textAlign: this.textAlign(),
      };

      // Nevek normalizálása: \n → \r (Photoshop ExtendScript \r-t használ sortörésnek)
      const normalizeNames = (text: string): string =>
        text.split(/\n/).map(n => n.trim()).filter(Boolean).join('\r');

      if (options.includeStudents && extraNames.students) {
        jsonData['students'] = {
          header: 'Osztálytársaink voltak még:',
          names: normalizeNames(extraNames.students),
        };
      }

      if (options.includeTeachers && extraNames.teachers) {
        jsonData['teachers'] = {
          header: 'Tanítottak még:',
          names: normalizeNames(extraNames.teachers),
        };
      }

      const result = await this.runJsx({
        scriptName: 'actions/add-extra-names.jsx',
        jsonData,
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addExtraNames hiba', err);
      return { success: false, error: 'Váratlan hiba az extra nevek beillesztésekor' };
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
   * linkedLayerNames: linkelt layer nevek — rendezés előtt unlink, utána EGYENKÉNT relink
   */
  async arrangeGrid(
    boardSize: { widthCm: number; heightCm: number },
    targetDocName?: string,
    linkedLayerNames?: string[],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      // Linkelések leszedése a rendezés előtt
      if (linkedLayerNames?.length) {
        await this.unlinkLayers(linkedLayerNames, targetDocName);
      }

      const result = await this.runJsx({
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

      // Linkelések visszaállítása — NEMENKÉNT külön (minden név = 1 link csoport)
      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) {
          await this.linkLayers([name], targetDocName);
        }
      }

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeGrid hiba', err);
      return { success: false, error: 'Váratlan hiba a grid elrendezésnél' };
    }
  }

  /**
   * Nevek rendezése: név layerek pozícionálása a képek alá.
   * A nameGapCm és textAlign beállítások alapján.
   * linkedLayerNames: linkelt layer nevek — rendezés előtt unlink, utána EGYENKÉNT relink
   */
  async arrangeNames(
    targetDocName?: string,
    linkedLayerNames?: string[],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      // Linkelések leszedése a rendezés előtt
      if (linkedLayerNames?.length) {
        await this.unlinkLayers(linkedLayerNames, targetDocName);
      }

      const result = await this.runJsx({
        scriptName: 'actions/arrange-names.jsx',
        jsonData: {
          nameGapCm: this.nameGapCm(),
          textAlign: this.textAlign(),
          nameBreakAfter: this.nameBreakAfter(),
        },
        targetDocName,
      });

      // Linkelések visszaállítása — NEMENKÉNT külön (minden név = 1 link csoport)
      if (linkedLayerNames?.length) {
        for (const name of linkedLayerNames) {
          await this.linkLayers([name], targetDocName);
        }
      }

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX arrangeNames hiba', err);
      return { success: false, error: 'Váratlan hiba a nevek rendezésénél' };
    }
  }

  /**
   * PSD elérési út kiszámítása a projekt kontextus alapján.
   * Ugyanazt a logikát követi mint a generateAndOpenPsd().
   */
  async computePsdPath(
    sizeValue: string,
    context?: { projectName: string; brandName?: string | null },
  ): Promise<string | null> {
    if (!this.api) return null;

    try {
      if (context && this.workDir()) {
        const partnerDir = context.brandName ? this.sanitizeName(context.brandName) : 'photostack';
        const year = new Date().getFullYear().toString();
        const folderName = this.sanitizeName(context.projectName);
        return `${this.workDir()}/${partnerDir}/${year}/${folderName}/${folderName}.psd`;
      }

      const downloadsPath = await this.api.getDownloadsPath();
      return `${downloadsPath}/PhotoStack/${sizeValue}.psd`;
    } catch {
      return null;
    }
  }

  /**
   * Layout pozíció-regiszter kiolvasása a Photoshopból és mentése JSON fájlba a PSD mellé.
   *
   * 1. Futtatja a read-layout.jsx-et → kinyeri a layer pozíciókat
   * 2. Kiegészíti a board config-gal (cm méretek, gap-ek)
   * 3. Elmenti a PSD mellé (.json kiterjesztéssel)
   */
  async readAndSaveLayout(
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
    projectId?: number,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      // 1. JSX futtatása — layout adatok kiolvasása a Photoshopból
      const jsxResult = await this.runJsx({
        scriptName: 'actions/read-layout.jsx',
        targetDocName,
      });

      if (!jsxResult.success || !jsxResult.output) {
        return { success: false, error: jsxResult.error || 'Layout kiolvasás sikertelen' };
      }

      // 2. Parse: a JSX __LAYOUT_JSON__ prefix után JSON string-et ad vissza
      const output = jsxResult.output;
      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = output.indexOf(jsonPrefix);
      if (jsonStart === -1) {
        return { success: false, error: 'A JSX nem adott vissza layout adatot' };
      }

      const jsonStr = output.substring(jsonStart + jsonPrefix.length).trim();
      let layoutResult: {
        document: { name: string; widthPx: number; heightPx: number; dpi: number };
        layers: SnapshotLayer[];
      };

      try {
        layoutResult = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      // 3. Teljes layout objektum összeállítása
      const layoutData: Record<string, unknown> = {
        version: 3,
        updatedAt: new Date().toISOString(),
        document: layoutResult.document,
        board: {
          widthCm: boardConfig.widthCm,
          heightCm: boardConfig.heightCm,
          marginCm: this.marginCm(),
          gapHCm: this.gapHCm(),
          gapVCm: this.gapVCm(),
          gridAlign: this.gridAlign(),
        },
        layers: layoutResult.layers || [],
      };
      if (projectId) {
        layoutData['projectId'] = projectId;
      }

      // 4. Mentés a PSD mellé
      const saveResult = await this.api.saveLayoutJson({
        psdPath,
        layoutData,
      });

      if (!saveResult.success) {
        return { success: false, error: saveResult.error || 'Layout JSON mentés sikertelen' };
      }

      this.logger.info(`Layout JSON mentve: ${(layoutResult.layers || []).length} layer`);
      return { success: true };
    } catch (err) {
      this.logger.error('Layout kiolvasás/mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a layout mentésnél' };
    }
  }

  /**
   * Teljes layout kiolvasás v3 formátumban: layers[] pass-through.
   * A read-layout.jsx v3 kimenetét (layers[]) közvetlenül visszaadja.
   */
  async readFullLayout(
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    data?: {
      document: { name: string; widthPx: number; heightPx: number; dpi: number };
      layers: SnapshotLayer[];
      board: Record<string, unknown>;
      nameSettings: Record<string, unknown>;
    };
  }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const jsxResult = await this.runJsx({
        scriptName: 'actions/read-layout.jsx',
        targetDocName,
      });

      if (!jsxResult.success || !jsxResult.output) {
        return { success: false, error: jsxResult.error || 'Layout kiolvasás sikertelen' };
      }

      const output = jsxResult.output;
      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = output.indexOf(jsonPrefix);
      if (jsonStart === -1) {
        return { success: false, error: 'A JSX nem adott vissza layout adatot' };
      }

      const jsonStr = output.substring(jsonStart + jsonPrefix.length).trim();
      let layoutResult: {
        document: { name: string; widthPx: number; heightPx: number; dpi: number };
        layers: SnapshotLayer[];
      };

      try {
        layoutResult = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      return {
        success: true,
        data: {
          document: layoutResult.document,
          layers: layoutResult.layers || [],
          board: {
            widthCm: boardConfig.widthCm,
            heightCm: boardConfig.heightCm,
            marginCm: this.marginCm(),
            gapHCm: this.gapHCm(),
            gapVCm: this.gapVCm(),
            gridAlign: this.gridAlign(),
          },
          nameSettings: {
            nameGapCm: this.nameGapCm(),
            textAlign: this.textAlign(),
            nameBreakAfter: this.nameBreakAfter(),
          },
        },
      };
    } catch (err) {
      this.logger.error('readFullLayout hiba', err);
      return { success: false, error: 'Váratlan hiba a layout olvasásnál' };
    }
  }

  /**
   * Snapshot mentés: kiolvas a Photoshopból (v2) + elmenti a layouts/ mappába.
   */
  async saveSnapshot(
    name: string,
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const layoutResult = await this.readFullLayout(boardConfig, targetDocName);
    if (!layoutResult.success || !layoutResult.data) {
      return { success: false, error: layoutResult.error || 'Layout kiolvasás sikertelen' };
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = this.sanitizeName(name);
    const fileName = `${dateStr}_${slugName}.json`;

    const snapshotData = {
      version: 3,
      snapshotName: name,
      createdAt: now.toISOString(),
      document: layoutResult.data.document,
      board: layoutResult.data.board,
      nameSettings: layoutResult.data.nameSettings,
      layers: layoutResult.data.layers,
    };

    try {
      const result = await this.api.saveSnapshot({
        psdPath,
        snapshotData,
        fileName,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      }

      this.logger.info(`Snapshot mentve: ${name} (${layoutResult.data.layers.length} layer)`);
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot lista lekérés */
  async listSnapshots(psdPath: string): Promise<SnapshotListItem[]> {
    if (!this.api) return [];

    try {
      const result = await this.api.listSnapshots({ psdPath });
      return result.success ? result.snapshots : [];
    } catch (err) {
      this.logger.error('Snapshot lista hiba', err);
      return [];
    }
  }

  /**
   * Snapshot visszaállítás: beolvassa a JSON-t + futtatja a restore-layout.jsx-et.
   * restoreGroups: opcionális — ha megadva, csak a megadott csoport prefixek layereit állítja vissza.
   * Pl. [["Images"], ["Names"]] → csak Images/* és Names/* layerek.
   */
  async restoreSnapshot(
    snapshotPath: string,
    targetDocName?: string,
    restoreGroups?: string[][],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      // 1. Snapshot JSON betöltése
      const loadResult = await this.api.loadSnapshot({ snapshotPath });
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Snapshot betöltés sikertelen' };
      }

      // 2. restore-layout.jsx futtatása a snapshot adatokkal
      const snapshotData = loadResult.data as Record<string, unknown>;

      // v3: layers[], v2: persons[]
      const layerCount = Array.isArray(snapshotData['layers'])
        ? (snapshotData['layers'] as unknown[]).length
        : Array.isArray(snapshotData['persons'])
          ? (snapshotData['persons'] as unknown[]).length
          : 0;

      this.logger.info('Snapshot restore indul:', {
        layerCount,
        version: snapshotData['version'],
        restoreGroups: restoreGroups?.length ?? 'all',
      });

      // restoreGroups szűrő hozzáadása a snapshot adatokhoz
      if (restoreGroups && restoreGroups.length > 0) {
        snapshotData['restoreGroups'] = restoreGroups;
      }

      const jsxResult = await this.runJsx({
        scriptName: 'actions/restore-layout.jsx',
        jsonData: snapshotData,
        targetDocName,
      });

      if (!jsxResult.success) {
        this.logger.error('Snapshot restore JSX hiba:', jsxResult.error);
        return { success: false, error: jsxResult.error || 'Snapshot visszaállítás sikertelen' };
      }

      // JSX log output kiírása (debug)
      if (jsxResult.output) {
        this.logger.info('Snapshot restore JSX output:', jsxResult.output);
      }

      this.logger.info('Snapshot visszaállítva');
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot visszaállítás hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot visszaállításnál' };
    }
  }

  /** Snapshot törlés */
  async deleteSnapshot(snapshotPath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      return await this.api.deleteSnapshot({ snapshotPath });
    } catch (err) {
      this.logger.error('Snapshot törlés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot törlésnél' };
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

  /** Snapshot betöltése (JSON tartalom visszaadása) */
  async loadSnapshot(snapshotPath: string): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      return await this.api.loadSnapshot({ snapshotPath });
    } catch (err) {
      this.logger.error('Snapshot betöltés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot betöltésnél' };
    }
  }

  /**
   * Snapshot közvetlen mentése (módosított adatokkal, Photoshop nélkül).
   * A vizuális szerkesztőből használjuk: a meglévő snapshot layereit felülírjuk.
   */
  async saveSnapshotData(
    psdPath: string,
    snapshotData: Record<string, unknown>,
    fileName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) {
        return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      }
      this.logger.info(`Snapshot mentve (vizuális szerkesztő): ${fileName}`);
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot közvetlen mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /**
   * Snapshot mentése ÚJ fájlként (az eredetit nem módosítja).
   * A vizuális szerkesztőből használjuk: az eredeti megmarad, új "(szerkesztett)" snapshot keletkezik.
   */
  async saveSnapshotDataAsNew(
    psdPath: string,
    snapshotData: Record<string, unknown>,
    originalName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = this.sanitizeName(originalName);
    const fileName = `${dateStr}_${slugName}-szerkesztett.json`;

    snapshotData['snapshotName'] = `${originalName} (szerkesztett)`;
    snapshotData['createdAt'] = now.toISOString();

    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) {
        return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      }
      this.logger.info(`Új snapshot mentve (szerkesztett): ${fileName}`);
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot új mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /**
   * Snapshot mentése megadott fájlnévvel (a snapshotData már tartalmazza a nevet és dátumot).
   * A vizuális szerkesztő elnevezési dialógusából használjuk.
   */
  async saveSnapshotWithFileName(
    psdPath: string,
    snapshotData: Record<string, unknown>,
    fileName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) {
        return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      }
      this.logger.info(`Snapshot mentve: ${fileName}`);
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot átnevezése (a JSON fájlban a snapshotName mező módosítása) */
  async renameSnapshot(snapshotPath: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      return await this.api.renameSnapshot({ snapshotPath, newName });
    } catch (err) {
      this.logger.error('Snapshot átnevezés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot átnevezésnél' };
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
        const folderName = this.sanitizeName(context.projectName);
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

  // ============ Globális sablon rendszer ============

  /**
   * Slot extraction: layers[] tömbből studentSlots, teacherSlots, fixedLayers szétválogatás.
   * Images/Students → diák kép, Images/Teachers → tanár kép,
   * Names/Students → diák név, Names/Teachers → tanár név,
   * Minden más → fixedLayers.
   */
  private extractSlotsFromLayers(layers: SnapshotLayer[]): {
    studentSlots: TemplateSlot[];
    teacherSlots: TemplateSlot[];
    fixedLayers: TemplateFixedLayer[];
  } {
    const studentImages: SnapshotLayer[] = [];
    const teacherImages: SnapshotLayer[] = [];
    const studentNames: SnapshotLayer[] = [];
    const teacherNames: SnapshotLayer[] = [];
    const fixedLayers: TemplateFixedLayer[] = [];

    for (const l of layers) {
      const gp = l.groupPath;
      if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Students') {
        studentImages.push(l);
      } else if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Teachers') {
        teacherImages.push(l);
      } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Students') {
        studentNames.push(l);
      } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Teachers') {
        teacherNames.push(l);
      } else {
        fixedLayers.push({
          layerName: l.layerName,
          groupPath: l.groupPath,
          x: l.x, y: l.y, width: l.width, height: l.height,
          kind: l.kind,
        });
      }
    }

    // Kép-név párosítás layerName alapján
    const buildSlots = (images: SnapshotLayer[], names: SnapshotLayer[]): TemplateSlot[] => {
      const nameMap = new Map<string, SnapshotLayer>();
      for (const n of names) nameMap.set(n.layerName, n);

      return images.map((img, index) => {
        const nameLayer = nameMap.get(img.layerName);
        return {
          index,
          image: { x: img.x, y: img.y, width: img.width, height: img.height },
          name: nameLayer ? {
            x: nameLayer.x, y: nameLayer.y,
            width: nameLayer.width, height: nameLayer.height,
            justification: (nameLayer.justification || 'center') as 'left' | 'center' | 'right',
          } : null,
        };
      });
    };

    return {
      studentSlots: buildSlots(studentImages, studentNames),
      teacherSlots: buildSlots(teacherImages, teacherNames),
      fixedLayers,
    };
  }

  /**
   * Sablon mentése: readFullLayout + slot extraction + IPC save.
   */
  async saveTemplate(
    name: string,
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const layoutResult = await this.readFullLayout(boardConfig, targetDocName);
    if (!layoutResult.success || !layoutResult.data) {
      return { success: false, error: layoutResult.error || 'Layout kiolvasás sikertelen' };
    }

    const { studentSlots, teacherSlots, fixedLayers } = this.extractSlotsFromLayers(layoutResult.data.layers);

    const template: GlobalTemplate = {
      version: 1,
      type: 'template',
      id: `tmpl-${Date.now()}`,
      templateName: name.trim(),
      createdAt: new Date().toISOString(),
      source: {
        documentName: layoutResult.data.document.name,
        widthPx: layoutResult.data.document.widthPx,
        heightPx: layoutResult.data.document.heightPx,
        dpi: layoutResult.data.document.dpi,
      },
      board: layoutResult.data.board as GlobalTemplate['board'],
      nameSettings: layoutResult.data.nameSettings as GlobalTemplate['nameSettings'],
      studentSlots,
      teacherSlots,
      fixedLayers,
    };

    try {
      const result = await this.api.saveTemplate({ templateData: template });
      if (!result.success) {
        return { success: false, error: result.error || 'Sablon mentés sikertelen' };
      }
      this.logger.info(`Sablon mentve: ${name} (${studentSlots.length} diák + ${teacherSlots.length} tanár slot)`);
      return { success: true };
    } catch (err) {
      this.logger.error('Sablon mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon mentésnél' };
    }
  }

  /** Sablon lista lekérés */
  async listTemplates(): Promise<TemplateListItem[]> {
    if (!this.api) return [];
    try {
      const result = await this.api.listTemplates();
      return result.success ? result.templates : [];
    } catch (err) {
      this.logger.error('Sablon lista hiba', err);
      return [];
    }
  }

  /** Sablon betöltése (teljes JSON) */
  async loadTemplate(templateId: string): Promise<{ success: boolean; error?: string; data?: GlobalTemplate }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.loadTemplate({ templateId });
    } catch (err) {
      this.logger.error('Sablon betöltés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon betöltésnél' };
    }
  }

  /** Sablon törlése */
  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.deleteTemplate({ templateId });
    } catch (err) {
      this.logger.error('Sablon törlés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon törlésnél' };
    }
  }

  /** Sablon átnevezése */
  async renameTemplate(templateId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.renameTemplate({ templateId, newName });
    } catch (err) {
      this.logger.error('Sablon átnevezés hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon átnevezésnél' };
    }
  }

  /**
   * Fotók behelyezése meglévő Smart Object layerekbe.
   * A megadott layerName + photoUrl párok alapján letölti a fotókat
   * és az SO tartalmát cseréli (placedLayerReplaceContents).
   */
  async placePhotos(
    layers: Array<{ layerName: string; photoUrl: string }>,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    if (!layers || layers.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.api.placePhotos({ layers, targetDocName, psdFilePath: this.psdPath() ?? undefined });
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX placePhotos hiba', err);
      return { success: false, error: 'Váratlan hiba a fotók behelyezésekor' };
    }
  }

  /**
   * Layerek összelinkelése a Photoshopban név alapján.
   * A megadott layerName-ek MINDEN előfordulását megkeresi a teljes dokumentumban
   * (Images + Names csoportokban is), majd összelinkeli őket.
   */
  async linkLayers(
    layerNames: string[],
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    if (!layerNames || layerNames.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.runJsx({
        scriptName: 'actions/link-layers.jsx',
        jsonData: { layerNames },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX linkLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a layerek összelinkelésekor' };
    }
  }

  /**
   * Layerek linkelésének megszüntetése a Photoshopban név alapján.
   * A megadott layerName-ek MINDEN előfordulásán futtatja az unlink()-et.
   */
  async unlinkLayers(
    layerNames: string[],
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    if (!layerNames || layerNames.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.runJsx({
        scriptName: 'actions/unlink-layers.jsx',
        jsonData: { layerNames },
        targetDocName,
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX unlinkLayers hiba', err);
      return { success: false, error: 'Váratlan hiba a layerek linkelés megszüntetésekor' };
    }
  }

  /**
   * Layerek atmeretezese nev alapjan.
   * width/height kozul legalabb az egyik kitoltve (a masik null → aranyos).
   * unit: "cm" vagy "px"
   */
  async resizeLayers(params: {
    layerNames: string[];
    width: number | null;
    height: number | null;
    unit: 'cm' | 'px';
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron kornyezet' };

    if (!params.layerNames || params.layerNames.length === 0) {
      return { success: true };
    }

    try {
      const result = await this.runJsx({
        scriptName: 'actions/resize-layers.jsx',
        jsonData: params,
      });

      if (!result.success) {
        this.logger.error('resizeLayers JSX error:', result.error);
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX resizeLayers hiba', err);
      return { success: false, error: 'Varatlan hiba az atmeretezeskor' };
    }
  }

  /**
   * Csoport + SO layerek hozzaadasa a megnyitott dokumentumhoz.
   * Forraskepekbol Smart Object duplicate-ot keszit minden szemelyhez,
   * es a megadott poziciokra helyezi oket.
   */
  async addGroupLayers(params: {
    groupName: string;
    sourceFiles: Array<{ filePath: string }>;
    layers: Array<{
      layerName: string;
      group: 'Students' | 'Teachers';
      x: number;
      y: number;
      sourceIndex: number;
    }>;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron kornyezet' };

    try {
      this.logger.info('addGroupLayers params:', {
        groupName: params.groupName,
        sourceFiles: params.sourceFiles,
        layerCount: params.layers.length,
      });
      const result = await this.runJsx({
        scriptName: 'actions/add-group-layers.jsx',
        jsonData: params,
      });
      this.logger.info('addGroupLayers JSX output:', result.output);
      if (!result.success) {
        this.logger.error('addGroupLayers JSX error:', result.error);
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('JSX addGroupLayers hiba', err);
      return { success: false, error: 'Varatlan hiba a csoport layerek hozzaadasakor' };
    }
  }

  /**
   * Fajlok mentese temp konyvtarba az Electron main process-en keresztul.
   * A renderer process-ben a File.path nem elerheto (contextIsolation),
   * ezert a fajl tartalmat ArrayBuffer-kent kuldjuk at IPC-n.
   */
  async saveTempFiles(files: File[]): Promise<{ success: boolean; paths: string[]; error?: string }> {
    if (!this.api) return { success: false, paths: [], error: 'Nem Electron kornyezet' };

    const fileData: Array<{ name: string; data: ArrayBuffer }> = [];
    for (const f of files) {
      const buffer = await f.arrayBuffer();
      fileData.push({ name: f.name, data: buffer });
    }

    return this.api.saveTempFiles({ files: fileData });
  }

  /** Sablon alkalmazása a megnyitott dokumentumra */
  async applyTemplate(
    templateId: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.api.applyTemplate({ templateId, targetDocName, psdFilePath: this.psdPath() ?? undefined });
      if (result.success) {
        this.logger.info('Sablon alkalmazva');
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      this.logger.error('Sablon alkalmazás hiba', err);
      return { success: false, error: 'Váratlan hiba a sablon alkalmazásnál' };
    }
  }

  // ============ Minta generálás ============

  /** Minta beállítás mentése */
  async setSampleSettings(settings: Partial<{
    sizeLarge: number;
    sizeSmall: number;
    watermarkText: string;
    watermarkColor: 'white' | 'black';
    watermarkOpacity: number;
    useLargeSize: boolean;
  }>): Promise<boolean> {
    if (!this.sampleApi) return false;
    try {
      const result = await this.sampleApi.setSettings(settings);
      if (result.success) {
        if (settings.sizeLarge !== undefined) this.sampleSizeLarge.set(settings.sizeLarge);
        if (settings.sizeSmall !== undefined) this.sampleSizeSmall.set(settings.sizeSmall);
        if (settings.watermarkText !== undefined) this.sampleWatermarkText.set(settings.watermarkText);
        if (settings.watermarkColor !== undefined) this.sampleWatermarkColor.set(settings.watermarkColor);
        if (settings.watermarkOpacity !== undefined) this.sampleWatermarkOpacity.set(settings.watermarkOpacity);
        if (settings.useLargeSize !== undefined) this.sampleUseLargeSize.set(settings.useLargeSize);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error('Minta beállítás mentési hiba', err);
      return false;
    }
  }

  /**
   * Minta generálás: flatten → resize → watermark → save + upload.
   *
   * 1. JSX flatten-export.jsx futtatása → temp JPG
   * 2. sample:generate IPC hívás → resize + watermark + mentés + feltöltés
   */
  async generateSample(
    projectId: number,
    projectName: string,
    largeSize = false,
  ): Promise<{
    success: boolean;
    localPaths?: string[];
    uploadedCount?: number;
    error?: string;
    errors?: string[];
  }> {
    if (!this.api || !this.sampleApi) {
      return { success: false, error: 'Nem Electron környezet' };
    }

    const psdFilePath = this.psdPath();
    if (!psdFilePath) {
      return { success: false, error: 'Nincs megnyitott PSD fájl' };
    }

    try {
      // 1. Flatten export JSX futtatás → temp JPG
      // A JSX maga hatarozza meg a temp utat (Folder.temp), az outputban adja vissza
      const flattenResult = await this.runJsx({
        scriptName: 'actions/flatten-export.jsx',
        jsonData: { quality: 95 },
      });

      if (!flattenResult.success) {
        return { success: false, error: flattenResult.error || 'Flatten export sikertelen' };
      }

      // Az OK marker tartalmazza a tényleges temp JPG útvonalat
      const output = flattenResult.output || '';
      const okMatch = output.match(/__FLATTEN_RESULT__OK:(.+)/);
      if (!okMatch) {
        return { success: false, error: `A flatten export nem adott vissza OK eredményt. Output: ${output.slice(-200)}` };
      }

      const tempJpgPath = okMatch[1].trim();

      // 2. Sample generálás (resize + watermark + upload)
      const authToken = sessionStorage.getItem('marketer_token') || '';

      // Az outputDir a PSD eredeti mappája (nem a temp JPG mappája)
      const psdDirPath = psdFilePath.replace(/[/\\][^/\\]+$/, '');

      const result = await this.sampleApi.generate({
        psdFilePath: tempJpgPath,
        outputDir: psdDirPath,
        projectId,
        projectName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        watermarkText: this.sampleWatermarkText(),
        watermarkColor: this.sampleWatermarkColor(),
        watermarkOpacity: this.sampleWatermarkOpacity(),
        sizes: [
          { name: 'minta', width: largeSize ? this.sampleSizeLarge() : this.sampleSizeSmall() },
        ],
      });

      return result;
    } catch (err) {
      this.logger.error('Minta generálás hiba', err);
      return { success: false, error: 'Váratlan hiba a minta generálásnál' };
    }
  }

  /**
   * Véglegesített tablókép generálása és feltöltése.
   * Flatten export → közvetlen feltöltés, nincs resize, nincs watermark.
   * API: POST /partner/finalizations/{projectId}/upload (type=flat)
   */
  async generateFinal(
    projectId: number,
    projectName: string,
  ): Promise<{
    success: boolean;
    localPath?: string;
    uploadedCount?: number;
    error?: string;
  }> {
    if (!this.api || !this.finalizerApi) {
      return { success: false, error: 'Nem Electron környezet' };
    }

    const psdFilePath = this.psdPath();
    if (!psdFilePath) {
      return { success: false, error: 'Nincs megnyitott PSD fájl' };
    }

    try {
      // 1. Flatten export JSX futtatás → temp JPG (eredeti színprofil megtartva)
      const flattenResult = await this.runJsx({
        scriptName: 'actions/flatten-export.jsx',
        jsonData: { quality: 12 },
      });

      if (!flattenResult.success) {
        return { success: false, error: flattenResult.error || 'Flatten export sikertelen' };
      }

      const output = flattenResult.output || '';
      const okMatch = output.match(/__FLATTEN_RESULT__OK:(.+)/);
      if (!okMatch) {
        return { success: false, error: `A flatten export nem adott vissza OK eredményt. Output: ${output.slice(-200)}` };
      }

      const tempJpgPath = okMatch[1].trim();

      // 2. Közvetlen feltöltés (resize/watermark nélkül)
      const authToken = sessionStorage.getItem('marketer_token') || '';
      const psdDirPath = psdFilePath.replace(/[/\\][^/\\]+$/, '');

      const result = await this.finalizerApi.upload({
        flattenedJpgPath: tempJpgPath,
        outputDir: psdDirPath,
        projectId,
        projectName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        type: 'flat',
      });

      return result;
    } catch (err) {
      this.logger.error('Véglegesítés hiba', err);
      return { success: false, error: 'Váratlan hiba a véglegesítésnél' };
    }
  }

  /**
   * Kistabló generálása és feltöltése.
   * Flatten export → 3000px resize (leghosszabb oldal) → feltöltés.
   * Eredeti színprofil megtartva, nincs watermark.
   */
  async generateSmallTablo(
    projectId: number,
    projectName: string,
  ): Promise<{
    success: boolean;
    localPath?: string;
    uploadedCount?: number;
    error?: string;
  }> {
    if (!this.api || !this.finalizerApi) {
      return { success: false, error: 'Nem Electron környezet' };
    }

    const psdFilePath = this.psdPath();
    if (!psdFilePath) {
      return { success: false, error: 'Nincs megnyitott PSD fájl' };
    }

    try {
      // 1. Flatten export (eredeti színprofil megtartva)
      const flattenResult = await this.runJsx({
        scriptName: 'actions/flatten-export.jsx',
        jsonData: { quality: 12 },
      });

      if (!flattenResult.success) {
        return { success: false, error: flattenResult.error || 'Flatten export sikertelen' };
      }

      const output = flattenResult.output || '';
      const okMatch = output.match(/__FLATTEN_RESULT__OK:(.+)/);
      if (!okMatch) {
        return { success: false, error: `A flatten export nem adott vissza OK eredményt.` };
      }

      const tempJpgPath = okMatch[1].trim();

      // 2. Feltöltés (3000px resize-szal)
      const authToken = sessionStorage.getItem('marketer_token') || '';
      const psdDirPath = psdFilePath.replace(/[/\\][^/\\]+$/, '');

      const result = await this.finalizerApi.upload({
        flattenedJpgPath: tempJpgPath,
        outputDir: psdDirPath,
        projectId,
        projectName,
        apiBaseUrl: environment.apiUrl,
        authToken,
        type: 'small_tablo',
        maxSize: 3000,
      });

      return result;
    } catch (err) {
      this.logger.error('Kistabló generálás hiba', err);
      return { success: false, error: 'Váratlan hiba a kistabló generálásnál' };
    }
  }
}
