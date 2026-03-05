import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

/**
 * PSD generálás, Photoshop kezelés, elrendezés és minta generálás.
 * A TabloEditorActionsService facade hívja.
 */
@Injectable()
export class TabloEditorPsdService {
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
  readonly sampleResult = signal<{ localPaths: string[]; uploadedCount: number; generatedAt: string } | null>(null);

  /** PSD útvonalak */
  readonly currentPsdPath = signal<string | null>(null);
  readonly resolvedPsdPath = signal<string | null>(null);
  readonly psdExists = signal(false);
  readonly psdHasLayouts = signal(false);

  /** Layout dialógus */
  readonly showLayoutDialog = signal(false);
  readonly lastLayoutConfig = signal<TabloLayoutConfig | null>(null);
  readonly pendingGenerate = signal(false);

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

  /** Méret érték feloldása board dimenzióra (helper a facade-nak) */
  resolveBoardSize(size: TabloSize): { widthCm: number; heightCm: number } | null {
    return this.ps.parseSizeValue(size.value);
  }

  // --- Photoshop path & launch ---

  async selectPsPath(
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    const path = await this.ps.browseForPhotoshop();
    if (!path) return;
    const ok = await this.ps.setPath(path);
    if (ok) {
      onSuccess('Photoshop sikeresen beállítva!');
    } else {
      onError('A kiválasztott fájl nem egy érvényes Photoshop alkalmazás.');
    }
  }

  async launchPs(
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    this.launching.set(true);
    try {
      const result = await this.ps.launchPhotoshop();
      if (result.success) {
        onSuccess('Photoshop elindítva!');
      } else {
        onError(result.error || 'Nem sikerült elindítani a Photoshop-ot.');
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
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    this.showLayoutDialog.set(false);
    this.lastLayoutConfig.set(config);

    this.ps.setGapH(config.gapHCm);
    this.ps.setGapV(config.gapVCm);
    this.ps.setGridAlign(config.gridAlign);

    if (this.pendingGenerate()) {
      this.pendingGenerate.set(false);
      await this.doGeneratePsd(config, selectedSize, project, persons, onSuccess, onError);
    } else {
      await this.doArrangeTabloLayout(config, selectedSize, onSuccess, onError);
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
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    if (!size) return;

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
        onError(result.error || 'PSD generálás sikertelen.');
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

      // Layer nevek javítása: kötőjel → alulvonás (a --- előtti slug részben)
      if (persons.length > 0) {
        const renameMap: Array<{ old: string; new: string }> = [];
        for (const p of persons) {
          const stripped = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const badSlug = stripped.replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
          const goodSlug = stripped.replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
          if (badSlug !== goodSlug) {
            renameMap.push({ old: `${badSlug}---${p.id}`, new: `${goodSlug}---${p.id}` });
          }
        }
        if (renameMap.length > 0) {
          await window.electronAPI?.photoshop.runJsx({
            scriptName: 'actions/rename-layers.jsx',
            jsonData: { renameMap },
          });
        }
      }

      const psdFileName = result.outputPath?.split('/').pop() || undefined;

      const guideResult = await this.ps.addGuides(psdFileName);
      if (!guideResult.success) onError(`Guide-ok: ${guideResult.error}`);

      const subtitles = this.ps.buildSubtitles({
        schoolName: project?.school?.name,
        className: project?.className,
        classYear: project?.classYear,
      });
      if (subtitles.length > 0) {
        const subResult = await this.ps.addSubtitleLayers(subtitles, psdFileName);
        if (!subResult.success) onError(`Feliratok: ${subResult.error}`);
      }

      if (personsData.length > 0) {
        const nameResult = await this.ps.addNameLayers(personsData, psdFileName);
        const imageResult = await this.ps.addImageLayers(personsData, undefined, psdFileName);

        if (imageResult.success) {
          const boardSize = this.ps.parseSizeValue(size.value);
          if (boardSize) {
            const layoutResult = await this.ps.arrangeTabloLayout(boardSize, psdFileName, undefined, config);
            if (!layoutResult.success) onError(`Tablóelrendezés: ${layoutResult.error}`);
            await this.autoSaveSnapshot(result.outputPath, size);
          }
        }

        if (nameResult.success && imageResult.success) {
          onSuccess(`PSD generálva: ${personsData.length} név + kép layer: ${size.label}`);
        } else {
          onSuccess(`PSD generálva és megnyitva: ${size.label}`);
          const errors: string[] = [];
          if (!nameResult.success) errors.push(`Név layerek: ${nameResult.error}`);
          if (!imageResult.success) errors.push(`Image layerek: ${imageResult.error}`);
          onError(errors.join(' | '));
        }
      } else {
        onSuccess(`PSD generálva és megnyitva: ${size.label}`);
      }
    } finally {
      this.generating.set(false);
    }
  }

  // --- PSD megnyitás / mappa ---

  async openPsdFile(onError: (msg: string) => void): Promise<void> {
    const psdPath = this.currentPsdPath();
    if (!psdPath) return;

    this.opening.set(true);
    try {
      const result = await this.ps.openPsdFile(psdPath);
      if (!result.success) onError(result.error || 'Nem sikerült megnyitni a PSD fájlt.');
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

  private async doArrangeTabloLayout(
    config: TabloLayoutConfig,
    size: TabloSize | null,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeTabloLayout(boardSize, undefined, undefined, config);
      if (result.success) {
        onSuccess('Tablóelrendezés kész!');
        await this.autoSaveSnapshot(null, size);
      } else {
        onError(result.error || 'Tablóelrendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeGrid(
    size: TabloSize | null,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeGrid(boardSize);
      if (result.success) {
        onSuccess('Rácsba rendezés kész!');
        await this.autoSaveSnapshot(null, size);
      } else {
        onError(result.error || 'Rácsba rendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeNames(
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    this.arrangingNames.set(true);
    try {
      const result = await this.ps.arrangeNames();
      if (result.success) {
        onSuccess('Nevek rendezése kész!');
        await this.autoSaveSnapshot(null, null);
      } else {
        onError(result.error || 'Nevek rendezése sikertelen.');
      }
    } finally {
      this.arrangingNames.set(false);
    }
  }

  // --- Minta generálás ---

  async generateSample(
    project: PartnerProjectDetails | null,
    sampleLargeSize: boolean,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    if (this.generatingSample() || !project) return;

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
        onSuccess(`Minta generálás kész! ${result.localPaths?.length || 0} fájl mentve, ${result.uploadedCount || 0} feltöltve.`);
      } else {
        onError(result.error || 'Minta generálás sikertelen.');
      }
    } finally {
      this.generatingSample.set(false);
    }
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
