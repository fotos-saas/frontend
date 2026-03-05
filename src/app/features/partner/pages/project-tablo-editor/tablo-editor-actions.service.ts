import { Injectable, inject, signal } from '@angular/core';
import { TabloEditorPsdService } from './tablo-editor-psd.service';
import { TabloEditorDesignerActionsService } from './tablo-editor-designer-actions.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';
import { SnapshotListItem, SnapshotLayer } from '@core/services/electron.types';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

/**
 * Tabló Editor Actions Facade
 * Delegálja a hívásokat a PSD és Designer sub-service-ekbe.
 * A template (HTML) közvetlenül ezt a service-t használja.
 */
@Injectable()
export class TabloEditorActionsService {
  private readonly psd = inject(TabloEditorPsdService);
  private readonly designer = inject(TabloEditorDesignerActionsService);
  private readonly snapshotService = inject(TabloEditorSnapshotService);

  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // --- PSD signal delegáció ---
  readonly generating = this.psd.generating;
  readonly opening = this.psd.opening;
  readonly arranging = this.psd.arranging;
  readonly arrangingNames = this.psd.arrangingNames;
  readonly launching = this.psd.launching;
  readonly generatingSample = this.psd.generatingSample;
  readonly sampleResult = this.psd.sampleResult;
  readonly currentPsdPath = this.psd.currentPsdPath;
  readonly resolvedPsdPath = this.psd.resolvedPsdPath;
  readonly psdExists = this.psd.psdExists;
  readonly psdHasLayouts = this.psd.psdHasLayouts;
  readonly showLayoutDialog = this.psd.showLayoutDialog;
  readonly lastLayoutConfig = this.psd.lastLayoutConfig;
  readonly pendingGenerate = this.psd.pendingGenerate;

  // --- Designer signal delegáció ---
  readonly showDesignerSaveDialog = this.designer.showDesignerSaveDialog;
  readonly designerSaveName = this.designer.designerSaveName;
  readonly designerSaving = this.designer.designerSaving;
  readonly showLayoutDesigner = this.designer.showLayoutDesigner;
  readonly designerSnapshotPath = this.designer.designerSnapshotPath;
  readonly designerPsdPath = this.designer.designerPsdPath;
  readonly designerBoardConfig = this.designer.designerBoardConfig;
  readonly generatingInitialSnapshot = this.designer.generatingInitialSnapshot;

  clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  // --- PSD delegáció ---

  async resolvePsdPath(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<string | null> {
    return this.psd.resolvePsdPath(size, project);
  }

  async selectPsPath(): Promise<void> {
    this.clearMessages();
    await this.psd.selectPsPath(
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  async launchPs(): Promise<void> {
    this.clearMessages();
    await this.psd.launchPs(
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  generatePsd(): void {
    this.psd.generatePsd();
  }

  async onLayoutConfigApply(
    config: TabloLayoutConfig,
    selectedSize: TabloSize | null,
    project: PartnerProjectDetails | null,
    persons: TabloPersonItem[],
  ): Promise<void> {
    this.clearMessages();
    await this.psd.onLayoutConfigApply(
      config, selectedSize, project, persons,
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  closeLayoutDialog(): void {
    this.psd.closeLayoutDialog();
  }

  async openPsdFile(): Promise<void> {
    this.clearMessages();
    await this.psd.openPsdFile(msg => this.error.set(msg));
  }

  openProjectFolder(): void {
    this.psd.openProjectFolder();
  }

  arrangeTabloLayout(): void {
    this.psd.arrangeTabloLayout();
  }

  async arrangeGrid(size: TabloSize | null): Promise<void> {
    this.clearMessages();
    await this.psd.arrangeGrid(
      size,
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  async arrangeNames(): Promise<void> {
    this.clearMessages();
    await this.psd.arrangeNames(
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  async generateSample(project: PartnerProjectDetails | null, sampleLargeSize: boolean): Promise<void> {
    this.clearMessages();
    await this.psd.generateSample(
      project, sampleLargeSize,
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  async tryLoadSnapshots(
    project: PartnerProjectDetails | null,
    size: TabloSize | null,
  ): Promise<void> {
    await this.psd.tryLoadSnapshots(project, size);
  }

  // --- Snapshot wrapper-ek ---

  async updateSnapshot(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.psd.resolveBoardSize(size);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    const snapshots = this.snapshotService.snapshots();
    if (snapshots.length > 1) {
      this.snapshotService.openUpdatePicker();
      return;
    }

    this.clearMessages();
    const target = snapshots.length === 1 ? snapshots[0] : null;
    const result = await this.snapshotService.updateSnapshot(target, boardSize, psdPath);

    if (result.success) {
      this.successMessage.set('Elrendezés frissítve!');
    } else {
      this.error.set(result.error || 'Elrendezés frissítése sikertelen.');
    }
  }

  async updateSnapshotWithPick(
    snapshot: SnapshotListItem,
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.psd.resolveBoardSize(size);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.updateSnapshot(snapshot, boardSize, psdPath);

    if (result.success) {
      this.successMessage.set(`Pillanatkép frissítve: ${snapshot.snapshotName}`);
    } else {
      this.error.set(result.error || 'Pillanatkép frissítése sikertelen.');
    }
  }

  async saveSnapshotFromDialog(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.psd.resolveBoardSize(size);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.saveSnapshot(
      this.snapshotService.snapshotName(), boardSize, psdPath,
    );

    if (result.success) {
      this.successMessage.set('Pillanatkép mentve!');
    } else {
      this.error.set(result.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  async restoreSnapshot(snapshot: SnapshotListItem): Promise<void> {
    await this.snapshotService.openRestoreDialog(snapshot);
  }

  async restoreWithGroups(
    groups: string[][],
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    const snapshot = this.snapshotService.restoreDialogSnapshot();
    if (!snapshot) return;

    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.restoreSnapshot(snapshot.filePath, psdPath, undefined, groups);
    this.snapshotService.closeRestoreDialog();

    if (result.success) {
      this.successMessage.set(`Pillanatkép visszaállítva: ${snapshot.snapshotName}`);
    } else {
      this.error.set(result.error || 'Visszaállítás sikertelen.');
    }
  }

  async commitSnapshotRename(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) {
      this.snapshotService.cancelEditing();
      return;
    }

    const result = await this.snapshotService.commitEditing(psdPath);
    if (result.success) {
      this.successMessage.set('Pillanatkép átnevezve.');
    } else if (result.error) {
      this.error.set(result.error);
    }
  }

  async deleteSnapshot(
    snapshot: SnapshotListItem,
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.deleteSnapshot(snapshot.filePath, psdPath);

    if (result.success) {
      this.successMessage.set('Pillanatkép törölve.');
    } else {
      this.error.set(result.error || 'Törlés sikertelen.');
    }
  }

  async loadSnapshots(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;
    await this.snapshotService.loadSnapshots(psdPath);
  }

  // --- Designer delegáció ---

  async openLayoutDesigner(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    await this.designer.openLayoutDesigner(
      size, project,
      (s, p) => this.psd.resolvePsdPath(s, p),
    );
  }

  onDesignerSave(event: { layers: SnapshotLayer[]; isLivePsd: boolean }): void {
    this.designer.onDesignerSave(event);
  }

  async confirmDesignerSave(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    loadSnapshotsFn: () => Promise<void>,
  ): Promise<void> {
    this.clearMessages();
    await this.designer.confirmDesignerSave(
      size, project,
      (s, p) => this.psd.resolvePsdPath(s, p),
      loadSnapshotsFn,
      msg => this.successMessage.set(msg),
      msg => this.error.set(msg),
    );
  }

  async onDesignerAutoSave(
    event: { layers: SnapshotLayer[] },
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    loadSnapshotsFn: () => Promise<void>,
  ): Promise<void> {
    await this.designer.onDesignerAutoSave(
      event, size, project,
      (s, p) => this.psd.resolvePsdPath(s, p),
      loadSnapshotsFn,
    );
  }

  cancelDesignerSave(): void {
    this.designer.cancelDesignerSave();
  }

  closeLayoutDesigner(): void {
    this.designer.closeLayoutDesigner();
  }

  async generateSnapshotFromExistingPsd(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    openDesignerFn: () => Promise<void>,
  ): Promise<void> {
    this.clearMessages();
    await this.designer.generateSnapshotFromExistingPsd(
      size, project,
      (s, p) => this.psd.resolvePsdPath(s, p),
      v => this.psd.psdHasLayouts.set(v),
      openDesignerFn,
      msg => this.error.set(msg),
    );
  }
}
