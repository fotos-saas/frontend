import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorDebugService, DebugLogEntry } from './tablo-editor-debug.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

interface CommandsConfig {
  getProject: () => PartnerProjectDetails | null;
  getPersons: () => TabloPersonItem[];
  getSelectedSize: () => TabloSize | null;
  getCurrentPsdPath: () => string | null;
  setCurrentPsdPath: (path: string) => void;
  clearMessages: () => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  resolvePsdPath: (size?: TabloSize | null) => Promise<string | null>;
}

/**
 * PSD generálás és elrendezési parancsok.
 * Komponens-szintű service (providers tömb).
 */
@Injectable()
export class TabloEditorCommandsService {
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly snapshotService = inject(TabloEditorSnapshotService);
  private readonly debugService = inject(TabloEditorDebugService);

  private config!: CommandsConfig;

  /** Állapotok */
  readonly generating = signal(false);
  readonly opening = signal(false);
  readonly arranging = signal(false);
  readonly arrangingNames = signal(false);

  configure(config: CommandsConfig): void {
    this.config = config;
  }

  /** Tényleges PSD generálás (a dialógus után) */
  async doGeneratePsd(layoutConfig: TabloLayoutConfig): Promise<void> {
    const size = this.config.getSelectedSize();
    const p = this.config.getProject();
    if (!size) return;

    this.config.clearMessages();
    this.generating.set(true);
    try {
      const personsData = this.config.getPersons().map(person => ({
        id: person.id,
        name: person.name,
        type: person.type,
        photoUrl: person.photoUrl,
      }));

      const result = await this.ps.generateAndOpenPsd(size, p ? {
        projectName: p.name,
        schoolName: p.school?.name ?? null,
        className: p.className,
        brandName: this.branding.brandName(),
        persons: personsData.length > 0 ? personsData : undefined,
      } : undefined);
      if (!result.success) {
        this.config.setError(result.error || 'PSD generálás sikertelen.');
        return;
      }

      // PSD path mentése a layout funkciókhoz + snapshot lista frissítés
      if (result.outputPath) {
        this.config.setCurrentPsdPath(result.outputPath);
        this.snapshotService.loadSnapshots(result.outputPath);
      }

      // Várunk hogy a Photoshop megnyissa a PSD-t
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PSD fájlnév kiszámítása a cél dokumentum név-alapú aktiválásához
      const psdFileName = result.outputPath
        ? result.outputPath.split('/').pop() || undefined
        : undefined;

      // 0. Margó guide-ok
      const guideResult = await this.ps.addGuides(psdFileName);
      if (!guideResult.success) {
        this.config.setError(`Guide-ok: ${guideResult.error}`);
      }

      // 0.5 Subtitle feliratok
      const subtitles = this.ps.buildSubtitles({
        schoolName: p?.school?.name,
        className: p?.className,
        classYear: p?.classYear,
      });
      if (subtitles.length > 0) {
        const subResult = await this.ps.addSubtitleLayers(subtitles, psdFileName);
        if (!subResult.success) {
          this.config.setError(`Feliratok: ${subResult.error}`);
        }
      }

      // PSD megnyitás után: JSX layerek hozzáadása (ha vannak személyek)
      if (personsData.length > 0) {
        const nameResult = await this.ps.addNameLayers(personsData, psdFileName);
        const imageResult = await this.ps.addImageLayers(personsData, undefined, psdFileName);

        const nameOk = nameResult.success;
        const imageOk = imageResult.success;

        // Tablóelrendezés: tanárok fent, feliratok középen, diákok lent + nevek
        if (imageOk) {
          const boardSize = this.ps.parseSizeValue(size.value);
          if (boardSize) {
            const layoutResult = await this.ps.arrangeTabloLayout(boardSize, psdFileName, undefined, layoutConfig);
            if (!layoutResult.success) {
              this.config.setError(`Tablóelrendezés: ${layoutResult.error}`);
            }

            // Layout JSON automatikus mentése a PSD mellé
            await this.autoSaveSnapshot(result.outputPath);
          }
        }

        if (nameOk && imageOk) {
          this.config.setSuccess(`PSD generálva: ${personsData.length} név + kép layer: ${size.label}`);
        } else {
          this.config.setSuccess(`PSD generálva és megnyitva: ${size.label}`);
          const errors: string[] = [];
          if (!nameOk) errors.push(`Név layerek: ${nameResult.error}`);
          if (!imageOk) errors.push(`Image layerek: ${imageResult.error}`);
          this.config.setError(errors.join(' | '));
        }
      } else {
        this.config.setSuccess(`PSD generálva és megnyitva: ${size.label}`);
      }
    } finally {
      this.generating.set(false);
    }
  }

  /** Tényleges újrarendezés (a dialógus után, nem generálás) */
  async doArrangeTabloLayout(config: TabloLayoutConfig): Promise<void> {
    const size = this.config.getSelectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.config.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeTabloLayout(boardSize, undefined, undefined, config);
      if (result.success) {
        this.config.setSuccess('Tablóelrendezés kész!');
        await this.autoSaveSnapshot();
      } else {
        this.config.setError(result.error || 'Tablóelrendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeGrid(): Promise<void> {
    const size = this.config.getSelectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.config.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeGrid(boardSize);
      if (result.success) {
        this.config.setSuccess('Rácsba rendezés kész!');
        await this.autoSaveSnapshot();
      } else {
        this.config.setError(result.error || 'Rácsba rendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeNames(): Promise<void> {
    this.config.clearMessages();
    this.arrangingNames.set(true);
    try {
      const result = await this.ps.arrangeNames();
      if (result.success) {
        this.config.setSuccess('Nevek rendezése kész!');
        await this.autoSaveSnapshot();
      } else {
        this.config.setError(result.error || 'Nevek rendezése sikertelen.');
      }
    } finally {
      this.arrangingNames.set(false);
    }
  }

  /** PSD fájl megnyitása Photoshopban */
  async openPsdFile(): Promise<void> {
    const psdPath = this.config.getCurrentPsdPath();
    if (!psdPath) return;

    this.config.clearMessages();
    this.opening.set(true);
    try {
      const result = await this.ps.openPsdFile(psdPath);
      if (!result.success) {
        this.config.setError(result.error || 'Nem sikerült megnyitni a PSD fájlt.');
      }
    } finally {
      this.opening.set(false);
    }
  }

  /** Projekt mappa megnyitása Finderben */
  openProjectFolder(): void {
    const psdPath = this.config.getCurrentPsdPath();
    if (!psdPath) return;
    this.ps.revealInFinder(psdPath);
  }

  /** Debug PSD generálás */
  async generatePsdDebug(): Promise<void> {
    const size = this.config.getSelectedSize();
    if (!size) {
      this.debugService.addLog('Méret', 'Nincs méret kiválasztva!', 'error');
      return;
    }

    this.generating.set(true);
    try {
      await this.debugService.runDebugGeneration({
        size,
        project: this.config.getProject(),
        persons: this.config.getPersons(),
      });
    } catch (err) {
      this.debugService.addLog('Váratlan hiba', String(err), 'error');
    } finally {
      this.generating.set(false);
    }
  }

  /** Automatikus snapshot frissítés (csendes — nem jelenít meg hibaüzenetet) */
  private async autoSaveSnapshot(psdPath?: string | null): Promise<void> {
    const size = this.config.getSelectedSize();
    const path = psdPath ?? await this.config.resolvePsdPath();
    if (!path || !size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const latest = this.snapshotService.latestSnapshot();
    await this.snapshotService.updateSnapshot(latest, boardSize, path);
  }
}
