import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloSize } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';
import { SnapshotLayer } from '@core/services/electron.types';

/**
 * Vizuális szerkesztő (Layout Designer) dialógus kezelés.
 * A TabloEditorActionsService facade hívja.
 */
@Injectable()
export class TabloEditorDesignerActionsService {
  private readonly ps = inject(PhotoshopService);
  private readonly snapshotService = inject(TabloEditorSnapshotService);

  /** Designer mentés dialógus */
  readonly showDesignerSaveDialog = signal(false);
  readonly designerSaveName = signal('');
  readonly designerSaving = signal(false);
  private pendingDesignerSave: { layers: SnapshotLayer[]; isLivePsd: boolean } | null = null;

  /** Vizuális szerkesztő */
  readonly showLayoutDesigner = signal(false);
  readonly designerSnapshotPath = signal<string | null>(null);
  readonly designerPsdPath = signal<string | null>(null);
  readonly designerBoardConfig = signal<{ widthCm: number; heightCm: number } | null>(null);

  /** Kezdeti pillanatkép generálás */
  readonly generatingInitialSnapshot = signal(false);

  async openLayoutDesigner(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    resolvePsdPath: (size: TabloSize | null, project: PartnerProjectDetails | null) => Promise<string | null>,
  ): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    if (!latest || !size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await resolvePsdPath(size, project);
    if (!psdPath) return;

    this.designerSnapshotPath.set(latest.filePath);
    this.designerPsdPath.set(psdPath);
    this.designerBoardConfig.set(boardSize);
    this.showLayoutDesigner.set(true);
  }

  onDesignerSave(event: { layers: SnapshotLayer[]; isLivePsd: boolean }): void {
    this.pendingDesignerSave = event;
    this.showLayoutDesigner.set(false);

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

  async confirmDesignerSave(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    resolvePsdPath: (size: TabloSize | null, project: PartnerProjectDetails | null) => Promise<string | null>,
    loadSnapshotsFn: () => Promise<void>,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    const event = this.pendingDesignerSave;
    if (!event) return;

    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await resolvePsdPath(size, project);
    if (!latest || !psdPath) {
      this.showDesignerSaveDialog.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    this.designerSaving.set(true);

    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) {
      onError('Nem sikerült betölteni a pillanatképet a mentéshez.');
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
      onSuccess(`Pillanatkép mentve: ${name}`);
      await loadSnapshotsFn();
    } else {
      onError(saveResult.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  async onDesignerAutoSave(
    event: { layers: SnapshotLayer[] },
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    resolvePsdPath: (size: TabloSize | null, project: PartnerProjectDetails | null) => Promise<string | null>,
    loadSnapshotsFn: () => Promise<void>,
  ): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await resolvePsdPath(size, project);
    if (!latest || !psdPath) return;

    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) return;

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    snapshotData['snapshotName'] = `Élő PSD ${timeStr}`;
    snapshotData['createdAt'] = now.toISOString();

    const saveResult = await this.ps.saveSnapshotWithFileName(psdPath, snapshotData, '_elo-psd.json');
    if (saveResult.success) await loadSnapshotsFn();
  }

  cancelDesignerSave(): void {
    this.showDesignerSaveDialog.set(false);
    this.pendingDesignerSave = null;
  }

  closeLayoutDesigner(): void {
    this.showLayoutDesigner.set(false);
  }

  async generateSnapshotFromExistingPsd(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    resolvePsdPath: (size: TabloSize | null, project: PartnerProjectDetails | null) => Promise<string | null>,
    psdHasLayoutsSetter: (v: boolean) => void,
    openDesignerFn: () => Promise<void>,
    onError: (msg: string) => void,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await resolvePsdPath(size, project);
    if (!psdPath) return;

    this.generatingInitialSnapshot.set(true);
    const psdFileName = psdPath.split('/').pop() || undefined;

    const result = await this.snapshotService.saveSnapshot('Kezdeti elrendezés', boardSize, psdPath, psdFileName);
    this.generatingInitialSnapshot.set(false);

    if (result.success) {
      psdHasLayoutsSetter(true);
      await openDesignerFn();
    } else {
      onError(result.error || 'Nem sikerült kiolvasni az elrendezést. Győződj meg, hogy a PSD meg van nyitva a Photoshop-ban!');
    }
  }
}
