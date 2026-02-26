import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ProjectDetailHeaderComponent } from '@shared/components/project-detail/project-detail-header/project-detail-header.component';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ProjectDetailData } from '@shared/components/project-detail/project-detail.types';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { TabloEditorDebugService } from './tablo-editor-debug.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { TabloEditorCommandsService } from './tablo-editor-commands.service';
import { TabloEditorDesignerBridgeService } from './tablo-editor-designer-bridge.service';
import { TabloEditorSampleActionsService } from './tablo-editor-sample-actions.service';
import { SnapshotListItem, SnapshotLayer } from '@core/services/electron.types';
import { SnapshotRestoreDialogComponent } from './snapshot-restore-dialog.component';
import { TemplateSaveDialogComponent } from './template-save-dialog.component';
import { TemplateApplyDialogComponent } from './template-apply-dialog.component';
import { LayoutDesignerComponent } from './layout-designer/layout-designer.component';
import { TabloLayoutDialogComponent, BoardDimensions } from './tablo-layout-dialog/tablo-layout-dialog.component';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

type EditorTab = 'commands' | 'settings' | 'debug';

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent, MatTooltipModule, DialogWrapperComponent,
    SnapshotRestoreDialogComponent, TemplateSaveDialogComponent, TemplateApplyDialogComponent,
    LayoutDesignerComponent, TabloLayoutDialogComponent],
  providers: [TabloEditorDebugService, TabloEditorSnapshotService, TabloEditorTemplateService,
    TabloEditorCommandsService, TabloEditorDesignerBridgeService, TabloEditorSampleActionsService],
  templateUrl: './project-tablo-editor.component.html',
  styleUrl: './project-tablo-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabloEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly debugService = inject(TabloEditorDebugService);
  readonly snapshotService = inject(TabloEditorSnapshotService);
  readonly templateService = inject(TabloEditorTemplateService);
  private readonly cmd = inject(TabloEditorCommandsService);
  private readonly designerBridge = inject(TabloEditorDesignerBridgeService);
  private readonly sampleActions = inject(TabloEditorSampleActionsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  readonly activeTab = signal<EditorTab>('commands');
  readonly loading = signal(true);
  private readonly project = signal<PartnerProjectDetails | null>(null);
  readonly projectData = computed<ProjectDetailData | null>(() => {
    const p = this.project();
    return p ? { ...p, contacts: p.contacts ?? [], activeQrCodes: p.activeQrCodes ?? [],
      qrCodesHistory: p.qrCodesHistory ?? [] } as ProjectDetailData : null;
  });
  readonly projectExtraNames = computed(() => this.project()?.extraNames ?? null);
  readonly psPath = this.ps.path;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;
  readonly launching = signal(false);
  readonly marginCm = this.ps.marginCm;
  readonly studentSizeCm = this.ps.studentSizeCm;
  readonly teacherSizeCm = this.ps.teacherSizeCm;
  readonly gapHCm = this.ps.gapHCm;
  readonly gapVCm = this.ps.gapVCm;
  readonly nameGapCm = this.ps.nameGapCm;
  readonly nameBreakAfter = this.ps.nameBreakAfter;
  readonly textAlign = this.ps.textAlign;
  readonly gridAlign = this.ps.gridAlign;
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  readonly currentPsdPath = signal<string | null>(null);
  readonly resolvedPsdPath = signal<string | null>(null);
  readonly persons = signal<TabloPersonItem[]>([]);
  readonly generating = this.cmd.generating; readonly opening = this.cmd.opening;
  readonly arranging = this.cmd.arranging; readonly arrangingNames = this.cmd.arrangingNames;
  readonly showLayoutDesigner = this.designerBridge.showLayoutDesigner;
  readonly designerSnapshotPath = this.designerBridge.designerSnapshotPath;
  readonly designerPsdPath = this.designerBridge.designerPsdPath;
  readonly designerBoardConfig = this.designerBridge.designerBoardConfig;
  readonly showDesignerSaveDialog = this.designerBridge.showDesignerSaveDialog;
  readonly designerSaveName = this.designerBridge.designerSaveName;
  readonly designerSaving = this.designerBridge.designerSaving;
  readonly debugLogs = this.debugService.debugLogs;
  readonly collapsedGroups = this.snapshotService.collapsedGroups;
  readonly groupedSnapshots = this.snapshotService.groupedSnapshots;
  readonly psdExists = signal(false); readonly psdHasLayouts = signal(false);
  readonly generatingInitialSnapshot = signal(false);
  readonly error = signal<string | null>(null); readonly successMessage = signal<string | null>(null);
  readonly pendingGenerate = signal(false); readonly showLayoutDialog = signal(false);
  readonly lastLayoutConfig = signal<TabloLayoutConfig | null>(null);
  readonly studentCountForDialog = computed(() => this.persons().filter(p => p.type !== 'teacher').length);
  readonly teacherCountForDialog = computed(() => this.persons().filter(p => p.type === 'teacher').length);
  readonly boardDimensionsForDialog = computed<BoardDimensions | null>(() => {
    const s = this.selectedSize(); if (!s) return null; const bs = this.ps.parseSizeValue(s.value);
    return bs ? { boardWidthCm: bs.widthCm, boardHeightCm: bs.heightCm, marginCm: this.ps.marginCm(), studentSizeCm: this.ps.studentSizeCm(), teacherSizeCm: this.ps.teacherSizeCm() } : null;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) { this.loading.set(false); return; }
    this.configureServices();
    this.loadProject(id);
    this.ps.detectPhotoshop();
    this.loadTabloSizes();
    window.electronAPI?.overlay.setContext({ mode: 'normal', projectId: id });
  }

  private configureServices(): void {
    const s = { getProject: () => this.project(), clearMessages: () => this.clearMessages(),
      setError: (m: string) => this.error.set(m), setSuccess: (m: string) => this.successMessage.set(m) };
    this.cmd.configure({ ...s, getPersons: () => this.persons(), getSelectedSize: () => this.selectedSize(),
      getCurrentPsdPath: () => this.currentPsdPath(), setCurrentPsdPath: (p: string) => this.currentPsdPath.set(p),
      resolvePsdPath: (sz?) => this.resolvePsdPath(sz) });
    this.designerBridge.configure({ ...s, setProject: (p: PartnerProjectDetails) => this.project.set(p),
      resolvePsdPath: () => this.resolvePsdPath(), loadSnapshots: () => this.loadSnapshots() });
    this.sampleActions.configure(s);
  }

  private loadProject(id: number): void {
    this.partnerService.getProjectDetails(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (p) => { this.project.set(p); this.loading.set(false); this.loadPersons(id); this.tryLoadSnapshots(); },
      error: () => this.loading.set(false),
    });
  }

  private loadPersons(id: number): void {
    this.partnerService.getProjectPersons(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => this.persons.set(r.data), error: () => {},
    });
  }

  private loadTabloSizes(): void {
    this.loadingSizes.set(true);
    this.partnerService.getTabloSizes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => { this.tabloSizes.set(r.sizes); if (r.sizes.length) this.selectedSize.set(r.sizes[0]); this.loadingSizes.set(false); this.tryLoadSnapshots(); },
      error: () => this.loadingSizes.set(false),
    });
  }

  goBack(): void { this.location.back(); } selectSize(s: TabloSize): void { this.selectedSize.set(s); }
  getSizePixels(s: TabloSize): string {
    const d = this.ps.parseSizeValue(s.value);
    return d ? `${Math.round(d.widthCm * 200 / 2.54)}×${Math.round(d.heightCm * 200 / 2.54)} px` : '';
  }

  private async setNum(e: Event, min: number, max: number, fn: (v: number) => Promise<boolean>): Promise<void> {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= min && v <= max) await fn(v);
  }
  setMarginValue(e: Event) { this.setNum(e, 0, 10, v => this.ps.setMargin(v)); }
  setStudentSizeValue(e: Event) { this.setNum(e, 1, 30, v => this.ps.setStudentSize(v)); }
  setTeacherSizeValue(e: Event) { this.setNum(e, 1, 30, v => this.ps.setTeacherSize(v)); }
  setGapHValue(e: Event) { this.setNum(e, 0, 10, v => this.ps.setGapH(v)); }
  setGapVValue(e: Event) { this.setNum(e, 0, 10, v => this.ps.setGapV(v)); }
  setNameGapValue(e: Event) { this.setNum(e, 0, 5, v => this.ps.setNameGap(v)); }
  setNameBreakAfterValue(e: Event) { this.setNum(e, 0, 5, v => this.ps.setNameBreakAfter(v)); }
  setTextAlignValue(a: string) { this.ps.setTextAlign(a); }
  setGridAlignValue(a: string) { this.ps.setGridAlign(a); }

  async selectPsPath(): Promise<void> {
    this.clearMessages(); const path = await this.ps.browseForPhotoshop();
    if (path) this.showResult(await this.ps.setPath(path), 'Photoshop sikeresen beállítva!', 'A kiválasztott fájl nem egy érvényes Photoshop alkalmazás.');
  }

  async launchPs(): Promise<void> {
    this.clearMessages(); this.launching.set(true);
    try { const r = await this.ps.launchPhotoshop(); this.showResult(r.success, 'Photoshop elindítva!', r.error || 'Nem sikerült elindítani a Photoshop-ot.'); } finally { this.launching.set(false); }
  }

  generatePsd(): void { this.pendingGenerate.set(true); this.showLayoutDialog.set(true); }
  closeLayoutDialog(): void { this.showLayoutDialog.set(false); this.pendingGenerate.set(false); }
  arrangeTabloLayout(): void { this.pendingGenerate.set(false); this.showLayoutDialog.set(true); }
  openPsdFile(): Promise<void> { return this.cmd.openPsdFile(); } openProjectFolder(): void { this.cmd.openProjectFolder(); }
  arrangeGrid(): Promise<void> { return this.cmd.arrangeGrid(); } arrangeNames(): Promise<void> { return this.cmd.arrangeNames(); }
  generatePsdDebug(): Promise<void> { return this.cmd.generatePsdDebug(); } clearDebugLogs(): void { this.debugService.clearLogs(); }

  async onLayoutConfigApplyInternal(c: TabloLayoutConfig): Promise<void> {
    this.showLayoutDialog.set(false); this.lastLayoutConfig.set(c);
    this.ps.setGapH(c.gapHCm); this.ps.setGapV(c.gapVCm); this.ps.setGridAlign(c.gridAlign);
    if (this.pendingGenerate()) { this.pendingGenerate.set(false); await this.cmd.doGeneratePsd(c); }
    else { await this.cmd.doArrangeTabloLayout(c); }
  }

  toggleGroupCollapse(n: string): void { this.snapshotService.toggleGroupCollapse(n); } isGroupCollapsed(n: string): boolean { return this.snapshotService.isGroupCollapsed(n); }
  private snapshotsInitLoaded = false;
  private async tryLoadSnapshots(): Promise<void> {
    if (this.snapshotsInitLoaded || !this.project() || !this.selectedSize()) return;
    this.snapshotsInitLoaded = true;
    const pp = await this.resolvePsdPath(); if (!pp) return;
    const c = await this.ps.checkPsdExists(pp);
    this.psdExists.set(c.exists); this.psdHasLayouts.set(c.hasLayouts);
    if (c.exists) { this.currentPsdPath.set(pp); if (c.hasLayouts) await this.snapshotService.loadSnapshots(pp); }
  }

  async loadSnapshots(): Promise<void> { const pp = await this.resolvePsdPath(); if (pp) await this.snapshotService.loadSnapshots(pp); }

  async updateSnapshot(): Promise<void> {
    const ctx = await this.prepareBoardAndPath(true); if (!ctx) return;
    const snaps = this.snapshotService.snapshots();
    if (snaps.length > 1) { this.snapshotService.openUpdatePicker(); return; }
    this.clearMessages();
    this.showResult((await this.snapshotService.updateSnapshot(snaps[0] ?? null, ctx.bs, ctx.pp)).success, 'Elrendezés frissítve!', 'Elrendezés frissítése sikertelen.');
  }

  async updateSnapshotWithPick(snap: SnapshotListItem): Promise<void> {
    const ctx = await this.prepareBoardAndPath(true); if (!ctx) return;
    this.clearMessages(); const r = await this.snapshotService.updateSnapshot(snap, ctx.bs, ctx.pp);
    this.showResult(r.success, `Pillanatkép frissítve: ${snap.snapshotName}`, r.error || 'Pillanatkép frissítése sikertelen.');
  }

  async generateSnapshotFromExistingPsd(): Promise<void> {
    const ctx = await this.prepareBoardAndPath(); if (!ctx) return;
    this.generatingInitialSnapshot.set(true); this.clearMessages();
    const r = await this.snapshotService.saveSnapshot('Kezdeti elrendezés', ctx.bs, ctx.pp, ctx.pp.split('/').pop() || undefined);
    this.generatingInitialSnapshot.set(false);
    if (r.success) { this.psdHasLayouts.set(true); this.successMessage.set('Pillanatkép létrehozva a meglévő PSD-ből!'); }
    else { this.error.set(r.error || 'Nem sikerült kiolvasni az elrendezést. Győződj meg, hogy a PSD meg van nyitva a Photoshop-ban!'); }
  }

  async saveSnapshotFromDialog(): Promise<void> {
    const ctx = await this.prepareBoardAndPath(true); if (!ctx) return;
    this.clearMessages();
    this.showResult((await this.snapshotService.saveSnapshot(this.snapshotService.snapshotName(), ctx.bs, ctx.pp)).success, 'Pillanatkép mentve!', 'Pillanatkép mentés sikertelen.');
  }

  async restoreSnapshot(snap: SnapshotListItem): Promise<void> { await this.snapshotService.openRestoreDialog(snap); }

  async restoreWithGroups(groups: string[][]): Promise<void> {
    const snap = this.snapshotService.restoreDialogSnapshot(); if (!snap) return;
    const pp = await this.resolvePsdPath(); if (!pp) return;
    this.clearMessages(); const r = await this.snapshotService.restoreSnapshot(snap.filePath, pp, undefined, groups);
    this.snapshotService.closeRestoreDialog();
    this.showResult(r.success, `Pillanatkép visszaállítva: ${snap.snapshotName}`, r.error || 'Visszaállítás sikertelen.');
  }

  async commitSnapshotRename(): Promise<void> {
    const pp = await this.resolvePsdPath();
    if (!pp) { this.snapshotService.cancelEditing(); return; }
    const r = await this.snapshotService.commitEditing(pp); if (r.success) this.successMessage.set('Pillanatkép átnevezve.'); else if (r.error) this.error.set(r.error);
  }

  async deleteSnapshot(snap: SnapshotListItem): Promise<void> {
    const pp = await this.resolvePsdPath(); if (!pp) return;
    this.clearMessages(); this.showResult((await this.snapshotService.deleteSnapshot(snap.filePath, pp)).success, 'Pillanatkép törölve.', 'Törlés sikertelen.');
  }

  async saveTemplateFromDialog(): Promise<void> {
    const ctx = await this.prepareBoardAndPath(); if (!ctx) return;
    this.clearMessages();
    this.showResult((await this.templateService.saveTemplate(ctx.bs)).success, 'Sablon mentve!', 'Sablon mentés sikertelen.');
  }

  async applyTemplate(id: string): Promise<void> { this.clearMessages(); this.showResult((await this.templateService.applyTemplate(id)).success, 'Sablon alkalmazva!', 'Sablon alkalmazás sikertelen.'); }
  async deleteTemplate(id: string): Promise<void> { this.clearMessages(); this.showResult((await this.templateService.deleteTemplate(id)).success, 'Sablon törölve.', 'Sablon törlés sikertelen.'); }
  async commitTemplateRename(): Promise<void> { const r = await this.templateService.commitEditing(); if (r.success && r.error) this.error.set(r.error); }

  get currentStudentCount(): number { return this.persons().filter(p => p.type !== 'teacher').length; }

  openLayoutDesigner(): Promise<void> { return this.designerBridge.openLayoutDesigner(this.selectedSize(), s => this.resolvePsdPath(s)); }
  onDesignerSave(ev: { layers: SnapshotLayer[]; isLivePsd: boolean }): void { this.designerBridge.onDesignerSave(ev); }
  confirmDesignerSave(): Promise<void> { return this.designerBridge.confirmDesignerSave(); }
  onDesignerAutoSave(ev: { layers: SnapshotLayer[] }): Promise<void> { return this.designerBridge.onDesignerAutoSave(ev); }
  onExtraNamesUpdated(en: { students: string; teachers: string }): void { this.designerBridge.onExtraNamesUpdated(en); }
  cancelDesignerSave(): void { this.designerBridge.cancelDesignerSave(); } closeLayoutDesigner(): void { this.designerBridge.closeLayoutDesigner(); }

  private async prepareBoardAndPath(useSize = false): Promise<{ bs: { widthCm: number; heightCm: number }; pp: string } | null> {
    const s = this.selectedSize(); if (!s) return null;
    const bs = this.ps.parseSizeValue(s.value); if (!bs) return null;
    const pp = await this.resolvePsdPath(useSize ? s : undefined); if (!pp) return null;
    return { bs, pp };
  }

  private async resolvePsdPath(size?: TabloSize | null): Promise<string | null> {
    if (this.currentPsdPath()) return this.currentPsdPath();
    const s = size ?? this.selectedSize(), p = this.project();
    if (!s) return null;
    const resolved = await this.ps.computePsdPath(s.value, p ? { projectName: p.name,
      schoolName: p.school?.name ?? null, className: p.className, brandName: this.branding.brandName() } : undefined);
    if (resolved) { this.ps.psdPath.set(resolved); this.resolvedPsdPath.set(resolved); }
    return resolved;
  }

  private clearMessages(): void { this.error.set(null); this.successMessage.set(null); }
  private showResult(ok: boolean, okMsg: string, errMsg: string): void { if (ok) this.successMessage.set(okMsg); else this.error.set(errMsg); }
}
