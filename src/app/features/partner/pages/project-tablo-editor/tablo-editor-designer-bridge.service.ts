import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { SnapshotLayer } from '@core/services/electron.types';
import { PartnerProjectDetails } from '../../services/partner.service';
import { TabloSize } from '../../models/partner.models';

interface DesignerBridgeConfig {
  getProject: () => PartnerProjectDetails | null;
  setProject: (p: PartnerProjectDetails) => void;
  clearMessages: () => void;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  resolvePsdPath: () => Promise<string | null>;
  loadSnapshots: () => Promise<void>;
}

/**
 * Layout designer nyitás/mentés/auto-save/bezárás orchestráció.
 * Komponens-szintű service (providers tömb).
 */
@Injectable()
export class TabloEditorDesignerBridgeService {
  private readonly ps = inject(PhotoshopService);
  private readonly snapshotService = inject(TabloEditorSnapshotService);

  private config!: DesignerBridgeConfig;

  /** Vizuális szerkesztő állapot */
  readonly showLayoutDesigner = signal(false);
  readonly designerSnapshotPath = signal<string | null>(null);
  readonly designerPsdPath = signal<string | null>(null);
  readonly designerBoardConfig = signal<{ widthCm: number; heightCm: number } | null>(null);

  /** Mentés elnevezési dialógus */
  readonly showDesignerSaveDialog = signal(false);
  readonly designerSaveName = signal('');
  readonly designerSaving = signal(false);
  private pendingDesignerSave: { layers: SnapshotLayer[]; isLivePsd: boolean } | null = null;

  configure(config: DesignerBridgeConfig): void {
    this.config = config;
  }

  /** Vizuális szerkesztő megnyitása a legutolsó snapshot-tal */
  async openLayoutDesigner(selectedSize: TabloSize | null, resolvePsdPath: (size?: TabloSize | null) => Promise<string | null>): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    if (!latest || !selectedSize) return;

    const boardSize = this.ps.parseSizeValue(selectedSize.value);
    if (!boardSize) return;

    const psdPath = await resolvePsdPath(selectedSize);
    if (!psdPath) return;

    this.designerSnapshotPath.set(latest.filePath);
    this.designerPsdPath.set(psdPath);
    this.designerBoardConfig.set(boardSize);
    this.showLayoutDesigner.set(true);
  }

  /** Vizuális szerkesztő mentés: dialógust nyit az elnevezéshez */
  onDesignerSave(event: { layers: SnapshotLayer[]; isLivePsd: boolean }): void {
    this.pendingDesignerSave = event;
    this.showLayoutDesigner.set(false);

    // Auto név generálás
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (event.isLivePsd) {
      this.designerSaveName.set(`Élő PSD ${dateStr}`);
    } else {
      const latest = this.snapshotService.latestSnapshot();
      const baseName = latest?.snapshotName.replace(/ \(szerkesztett\)$/, '') || 'Pillanatkép';
      this.designerSaveName.set(`${baseName} (szerkesztett)`);
    }

    this.showDesignerSaveDialog.set(true);
  }

  /** Mentés elnevezési dialógus — tényleges mentés */
  async confirmDesignerSave(): Promise<void> {
    const event = this.pendingDesignerSave;
    if (!event) return;

    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.config.resolvePsdPath();
    if (!latest || !psdPath) {
      this.showDesignerSaveDialog.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    this.designerSaving.set(true);
    this.config.clearMessages();

    // Snapshot betöltése → layers felülírása → új snapshot mentés
    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) {
      this.config.setError('Nem sikerült betölteni a pillanatképet a mentéshez.');
      this.showDesignerSaveDialog.set(false);
      this.designerSaving.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    const name = this.designerSaveName().trim() || 'Szerkesztett';
    snapshotData['snapshotName'] = name;
    snapshotData['createdAt'] = new Date().toISOString();

    // Fájlnév generálás
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = name.toLowerCase().replace(/[^a-z0-9áéíóöőúüű]+/gi, '-').replace(/-+$/, '');
    const fileName = `${dateStr}_${slugName}.json`;

    const saveResult = await this.ps.saveSnapshotWithFileName(psdPath, snapshotData, fileName);

    this.showDesignerSaveDialog.set(false);
    this.designerSaving.set(false);
    this.pendingDesignerSave = null;

    if (saveResult.success) {
      this.config.setSuccess(`Pillanatkép mentve: ${name}`);
      await this.config.loadSnapshots();
    } else {
      this.config.setError(saveResult.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  /** Auto-mentés a designer-ből (pl. frissítés után) — dialógus nélkül, nem lép ki */
  async onDesignerAutoSave(event: { layers: SnapshotLayer[] }): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.config.resolvePsdPath();
    if (!latest || !psdPath) return;

    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) return;

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    // Auto cím: "Élő PSD HH:MM"
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    snapshotData['snapshotName'] = `Élő PSD ${timeStr}`;
    snapshotData['createdAt'] = now.toISOString();

    // Fix fájlnév — mindig felülírja az előzőt, nem halmozódik
    const saveResult = await this.ps.saveSnapshotWithFileName(psdPath, snapshotData, '_elo-psd.json');

    if (saveResult.success) {
      await this.config.loadSnapshots();
    }
  }

  /** Extra nevek frissítése a layout designer dialógusból */
  onExtraNamesUpdated(extraNames: { students: string; teachers: string }): void {
    const p = this.config.getProject();
    if (p) {
      this.config.setProject({ ...p, extraNames });
    }
  }

  /** Mentés elnevezési dialógus bezárása (nem ment) */
  cancelDesignerSave(): void {
    this.showDesignerSaveDialog.set(false);
    this.pendingDesignerSave = null;
  }

  /** Vizuális szerkesztő bezárása */
  closeLayoutDesigner(): void {
    this.showLayoutDesigner.set(false);
  }
}
