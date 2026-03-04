import { Injectable, inject, signal, computed } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';
import { SnapshotLayer, SnapshotListItem } from '@core/services/electron.types';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

/**
 * Tabló Editor Actions Service
 * Kiemelt logika: PSD generálás, elrendezés, snapshot wrapper-ek,
 * minta generálás, vizuális szerkesztő mentés.
 */
@Injectable()
export class TabloEditorActionsService {
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly snapshotService = inject(TabloEditorSnapshotService);

  // --- Állapot signal-ok ---
  readonly generating = signal(false);
  readonly opening = signal(false);
  readonly arranging = signal(false);
  readonly arrangingNames = signal(false);
  readonly launching = signal(false);
  readonly generatingSample = signal(false);
  readonly generatingInitialSnapshot = signal(false);
  readonly sampleResult = signal<{ localPaths: string[]; uploadedCount: number; generatedAt: string } | null>(null);

  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  /** PSD útvonalak */
  readonly currentPsdPath = signal<string | null>(null);
  readonly resolvedPsdPath = signal<string | null>(null);
  readonly psdExists = signal(false);
  readonly psdHasLayouts = signal(false);

  /** Layout dialógus */
  readonly showLayoutDialog = signal(false);
  readonly lastLayoutConfig = signal<TabloLayoutConfig | null>(null);
  readonly pendingGenerate = signal(false);

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

  clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  // --- PSD path feloldás ---

  async resolvePsdPath(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<string | null> {
    if (this.currentPsdPath()) return this.currentPsdPath();
    if (!size) return null;

    const resolved = await this.ps.computePsdPath(size.value, project ? {
      projectName: project.name,
      schoolName: project.school?.name ?? null,
      className: project.className,
      brandName: this.branding.brandName(),
    } : undefined);

    if (resolved) {
      this.ps.psdPath.set(resolved);
      this.resolvedPsdPath.set(resolved);
    }
    return resolved;
  }

  // --- Photoshop path & launch ---

  async selectPsPath(): Promise<void> {
    this.clearMessages();
    const path = await this.ps.browseForPhotoshop();
    if (!path) return;
    const ok = await this.ps.setPath(path);
    if (ok) {
      this.successMessage.set('Photoshop sikeresen beállítva!');
    } else {
      this.error.set('A kiválasztott fájl nem egy érvényes Photoshop alkalmazás.');
    }
  }

  async launchPs(): Promise<void> {
    this.clearMessages();
    this.launching.set(true);
    try {
      const result = await this.ps.launchPhotoshop();
      if (result.success) {
        this.successMessage.set('Photoshop elindítva!');
      } else {
        this.error.set(result.error || 'Nem sikerült elindítani a Photoshop-ot.');
      }
    } finally {
      this.launching.set(false);
    }
  }

  // --- PSD generálás ---

  generatePsd(): void {
    this.pendingGenerate.set(true);
    this.showLayoutDialog.set(true);
  }

  async onLayoutConfigApply(
    config: TabloLayoutConfig,
    selectedSize: TabloSize | null,
    project: PartnerProjectDetails | null,
    persons: TabloPersonItem[],
  ): Promise<void> {
    this.showLayoutDialog.set(false);
    this.lastLayoutConfig.set(config);

    this.ps.setGapH(config.gapHCm);
    this.ps.setGapV(config.gapVCm);
    this.ps.setGridAlign(config.gridAlign);

    if (this.pendingGenerate()) {
      this.pendingGenerate.set(false);
      await this.doGeneratePsd(config, selectedSize, project, persons);
    } else {
      await this.doArrangeTabloLayout(config, selectedSize);
    }
  }

  closeLayoutDialog(): void {
    this.showLayoutDialog.set(false);
    this.pendingGenerate.set(false);
  }

  private async doGeneratePsd(
    config: TabloLayoutConfig,
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    persons: TabloPersonItem[],
  ): Promise<void> {
    if (!size) return;

    this.clearMessages();
    this.generating.set(true);
    try {
      const personsData = persons.map(person => ({
        id: person.id,
        name: person.name,
        type: person.type,
        photoUrl: person.photoUrl,
      }));

      const result = await this.ps.generateAndOpenPsd(size, project ? {
        projectName: project.name,
        schoolName: project.school?.name ?? null,
        className: project.className,
        brandName: this.branding.brandName(),
        persons: personsData.length > 0 ? personsData : undefined,
      } : undefined);

      if (!result.success) {
        this.error.set(result.error || 'PSD generálás sikertelen.');
        return;
      }

      if (result.outputPath) {
        this.currentPsdPath.set(result.outputPath);
        this.snapshotService.loadSnapshots(result.outputPath);

        if (project) {
          window.electronAPI?.photoshop.writeProjectInfo({
            psdFilePath: result.outputPath,
            projectId: project.id,
            projectName: project.name,
            schoolName: project.school?.name ?? undefined,
            className: project.className ?? undefined,
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const psdFileName = result.outputPath?.split('/').pop() || undefined;

      const guideResult = await this.ps.addGuides(psdFileName);
      if (!guideResult.success) this.error.set(`Guide-ok: ${guideResult.error}`);

      const subtitles = this.ps.buildSubtitles({
        schoolName: project?.school?.name,
        className: project?.className,
        classYear: project?.classYear,
      });
      if (subtitles.length > 0) {
        const subResult = await this.ps.addSubtitleLayers(subtitles, psdFileName);
        if (!subResult.success) this.error.set(`Feliratok: ${subResult.error}`);
      }

      if (personsData.length > 0) {
        const nameResult = await this.ps.addNameLayers(personsData, psdFileName);
        const imageResult = await this.ps.addImageLayers(personsData, undefined, psdFileName);

        if (imageResult.success) {
          const boardSize = this.ps.parseSizeValue(size.value);
          if (boardSize) {
            const layoutResult = await this.ps.arrangeTabloLayout(boardSize, psdFileName, undefined, config);
            if (!layoutResult.success) this.error.set(`Tablóelrendezés: ${layoutResult.error}`);
            await this.autoSaveSnapshot(result.outputPath, size);
          }
        }

        if (nameResult.success && imageResult.success) {
          this.successMessage.set(`PSD generálva: ${personsData.length} név + kép layer: ${size.label}`);
        } else {
          this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
          const errors: string[] = [];
          if (!nameResult.success) errors.push(`Név layerek: ${nameResult.error}`);
          if (!imageResult.success) errors.push(`Image layerek: ${imageResult.error}`);
          this.error.set(errors.join(' | '));
        }
      } else {
        this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
      }
    } finally {
      this.generating.set(false);
    }
  }

  // --- PSD megnyitás / mappa ---

  async openPsdFile(): Promise<void> {
    const psdPath = this.currentPsdPath();
    if (!psdPath) return;

    this.clearMessages();
    this.opening.set(true);
    try {
      const result = await this.ps.openPsdFile(psdPath);
      if (!result.success) this.error.set(result.error || 'Nem sikerült megnyitni a PSD fájlt.');
    } finally {
      this.opening.set(false);
    }
  }

  openProjectFolder(): void {
    const psdPath = this.currentPsdPath();
    if (psdPath) this.ps.revealInFinder(psdPath);
  }

  // --- Elrendezés ---

  arrangeTabloLayout(): void {
    this.pendingGenerate.set(false);
    this.showLayoutDialog.set(true);
  }

  private async doArrangeTabloLayout(config: TabloLayoutConfig, size: TabloSize | null): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeTabloLayout(boardSize, undefined, undefined, config);
      if (result.success) {
        this.successMessage.set('Tablóelrendezés kész!');
        await this.autoSaveSnapshot(null, size);
      } else {
        this.error.set(result.error || 'Tablóelrendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeGrid(size: TabloSize | null): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeGrid(boardSize);
      if (result.success) {
        this.successMessage.set('Rácsba rendezés kész!');
        await this.autoSaveSnapshot(null, size);
      } else {
        this.error.set(result.error || 'Rácsba rendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeNames(): Promise<void> {
    this.clearMessages();
    this.arrangingNames.set(true);
    try {
      const result = await this.ps.arrangeNames();
      if (result.success) {
        this.successMessage.set('Nevek rendezése kész!');
        await this.autoSaveSnapshot(null, null);
      } else {
        this.error.set(result.error || 'Nevek rendezése sikertelen.');
      }
    } finally {
      this.arrangingNames.set(false);
    }
  }

  // --- Snapshot wrapper-ek ---

  async updateSnapshot(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
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
    const boardSize = this.ps.parseSizeValue(size.value);
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
    const boardSize = this.ps.parseSizeValue(size.value);
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

  async generateSnapshotFromExistingPsd(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    openDesignerFn: () => Promise<void>,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    this.generatingInitialSnapshot.set(true);
    this.clearMessages();
    const psdFileName = psdPath.split('/').pop() || undefined;

    const result = await this.snapshotService.saveSnapshot('Kezdeti elrendezés', boardSize, psdPath, psdFileName);
    this.generatingInitialSnapshot.set(false);

    if (result.success) {
      this.psdHasLayouts.set(true);
      await openDesignerFn();
    } else {
      this.error.set(result.error || 'Nem sikerült kiolvasni az elrendezést. Győződj meg, hogy a PSD meg van nyitva a Photoshop-ban!');
    }
  }

  // --- Minta generálás ---

  async generateSample(project: PartnerProjectDetails | null, sampleLargeSize: boolean): Promise<void> {
    if (this.generatingSample() || !project) return;

    this.clearMessages();
    this.generatingSample.set(true);
    try {
      const result = await this.ps.generateSample(project.id, project.name, sampleLargeSize, {
        schoolName: project.school?.name ?? null,
        className: project.className ?? null,
      });
      if (result.success) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        this.sampleResult.set({
          localPaths: result.localPaths || [],
          uploadedCount: result.uploadedCount || 0,
          generatedAt: timeStr,
        });
        this.successMessage.set(`Minta generálás kész! ${result.localPaths?.length || 0} fájl mentve, ${result.uploadedCount || 0} feltöltve.`);
      } else {
        this.error.set(result.error || 'Minta generálás sikertelen.');
      }
    } finally {
      this.generatingSample.set(false);
    }
  }

  // --- Vizuális szerkesztő ---

  async openLayoutDesigner(
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
  ): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    if (!latest || !size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size, project);
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
    loadSnapshotsFn: () => Promise<void>,
  ): Promise<void> {
    const event = this.pendingDesignerSave;
    if (!event) return;

    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.resolvePsdPath(size, project);
    if (!latest || !psdPath) {
      this.showDesignerSaveDialog.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    this.designerSaving.set(true);
    this.clearMessages();

    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) {
      this.error.set('Nem sikerült betölteni a pillanatképet a mentéshez.');
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
      this.successMessage.set(`Pillanatkép mentve: ${name}`);
      await loadSnapshotsFn();
    } else {
      this.error.set(saveResult.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  async onDesignerAutoSave(
    event: { layers: SnapshotLayer[] },
    size: TabloSize | null,
    project: PartnerProjectDetails | null,
    loadSnapshotsFn: () => Promise<void>,
  ): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.resolvePsdPath(size, project);
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

  // --- Snapshot betöltés init ---

  async tryLoadSnapshots(
    project: PartnerProjectDetails | null,
    size: TabloSize | null,
  ): Promise<void> {
    const psdPath = await this.resolvePsdPath(size, project);
    if (!psdPath) return;

    const check = await this.ps.checkPsdExists(psdPath);
    this.psdExists.set(check.exists);
    this.psdHasLayouts.set(check.hasLayouts);

    if (check.exists) {
      this.currentPsdPath.set(psdPath);

      if (project) {
        window.electronAPI?.photoshop.writeProjectInfo({
          psdFilePath: psdPath,
          projectId: project.id,
          projectName: project.name,
          schoolName: project.school?.name ?? undefined,
          className: project.className ?? undefined,
        });
      }

      if (check.hasLayouts) {
        await this.snapshotService.loadSnapshots(psdPath);
      }
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

  // --- Private helpers ---

  private async autoSaveSnapshot(psdPath?: string | null, size?: TabloSize | null): Promise<void> {
    const path = psdPath ?? this.currentPsdPath();
    if (!path || !size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const latest = this.snapshotService.latestSnapshot();
    await this.snapshotService.updateSnapshot(latest, boardSize, path);
  }
}
