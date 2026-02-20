import { Injectable, inject, signal, computed } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotListItem } from '@core/services/electron.types';
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
          nameBreakAfter: this.nameBreakAfter(),
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
   * PSD elérési út kiszámítása a projekt kontextus alapján.
   * Ugyanazt a logikát követi mint a generateAndOpenPsd().
   */
  async computePsdPath(
    sizeValue: string,
    context?: { projectName: string; className?: string | null; brandName?: string | null },
  ): Promise<string | null> {
    if (!this.api) return null;

    try {
      if (context && this.workDir()) {
        const partnerDir = context.brandName ? this.sanitizeName(context.brandName) : 'photostack';
        const year = new Date().getFullYear().toString();
        const folderName = this.sanitizeName(
          context.className ? `${context.projectName}-${context.className}` : context.projectName,
        );
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
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      // 1. JSX futtatása — layout adatok kiolvasása a Photoshopból
      const jsxResult = await this.api.runJsx({
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
        persons: Array<{ personId: number | null; name: string; type: string; layerName: string; x: number; y: number; width: number; height: number }>;
      };

      try {
        layoutResult = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      // 3. Teljes layout objektum összeállítása
      const layoutData = {
        version: 1,
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
        persons: layoutResult.persons,
      };

      // 4. Mentés a PSD mellé
      const saveResult = await this.api.saveLayoutJson({
        psdPath,
        layoutData,
      });

      if (!saveResult.success) {
        return { success: false, error: saveResult.error || 'Layout JSON mentés sikertelen' };
      }

      this.logger.info(`Layout JSON mentve: ${layoutResult.persons.length} személy`);
      return { success: true };
    } catch (err) {
      this.logger.error('Layout kiolvasás/mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a layout mentésnél' };
    }
  }

  /**
   * Teljes layout kiolvasás v2 formátumban: images + names összefésülés layerName alapján.
   * A read-layout.jsx v2 kimenetét (persons + namePersons) egyetlen persons tömbbé egyesíti.
   */
  async readFullLayout(
    boardConfig: { widthCm: number; heightCm: number },
    targetDocName?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    data?: {
      document: { name: string; widthPx: number; heightPx: number; dpi: number };
      persons: Array<{
        personId: number | null;
        name: string;
        type: string;
        layerName: string;
        image: { x: number; y: number; width: number; height: number };
        nameLayer?: { x: number; y: number; width: number; height: number; text: string; justification: string };
      }>;
      board: Record<string, unknown>;
      nameSettings: Record<string, unknown>;
    };
  }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    try {
      const jsxResult = await this.api.runJsx({
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
        persons: Array<{ personId: number | null; name: string; type: string; layerName: string; x: number; y: number; width: number; height: number }>;
        namePersons: Array<{ personId: number | null; name: string; type: string; layerName: string; x: number; y: number; width: number; height: number; text: string; justification: string }>;
      };

      try {
        layoutResult = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      // Images + names összefésülés layerName alapján
      const nameMap = new Map<string, typeof layoutResult.namePersons[0]>();
      for (const np of (layoutResult.namePersons || [])) {
        nameMap.set(np.layerName, np);
      }

      const persons = layoutResult.persons.map(p => {
        const nameData = nameMap.get(p.layerName);
        return {
          personId: p.personId,
          name: p.name,
          type: p.type,
          layerName: p.layerName,
          image: { x: p.x, y: p.y, width: p.width, height: p.height },
          ...(nameData ? {
            nameLayer: {
              x: nameData.x,
              y: nameData.y,
              width: nameData.width,
              height: nameData.height,
              text: nameData.text,
              justification: nameData.justification,
            },
          } : {}),
        };
      });

      return {
        success: true,
        data: {
          document: layoutResult.document,
          persons,
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
      version: 2,
      snapshotName: name,
      createdAt: now.toISOString(),
      document: layoutResult.data.document,
      board: layoutResult.data.board,
      nameSettings: layoutResult.data.nameSettings,
      persons: layoutResult.data.persons,
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

      this.logger.info(`Snapshot mentve: ${name} (${layoutResult.data.persons.length} személy)`);
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
   */
  async restoreSnapshot(
    snapshotPath: string,
    targetDocName?: string,
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
      this.logger.info('Snapshot restore indul:', {
        personCount: Array.isArray(snapshotData['persons']) ? (snapshotData['persons'] as unknown[]).length : 0,
        version: snapshotData['version'],
      });

      const jsxResult = await this.api.runJsx({
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
