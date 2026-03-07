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
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { PartnerFinalizationService } from '../../services/partner-finalization.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { TabloSize, TabloSizeThreshold, TabloPersonItem } from '../../models/partner.models';
import { selectTabloSize } from '@shared/utils/tablo-size.util';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { SnapshotListItem } from '@core/services/electron.types';
import { SnapshotRestoreDialogComponent } from './snapshot-restore-dialog.component';
import { TemplateSaveDialogComponent } from './template-save-dialog.component';
import { TemplateApplyDialogComponent } from './template-apply-dialog.component';
import { LayoutDesignerComponent } from './layout-designer/layout-designer.component';
import { TabloLayoutDialogComponent, BoardDimensions } from './tablo-layout-dialog/tablo-layout-dialog.component';
import { TabloEditorActionsService } from './tablo-editor-actions.service';
import { TabloEditorPsdService } from './tablo-editor-psd.service';
import { TabloEditorDesignerActionsService } from './tablo-editor-designer-actions.service';

type EditorTab = 'commands' | 'settings';

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent, MatTooltipModule, DialogWrapperComponent, SnapshotRestoreDialogComponent, TemplateSaveDialogComponent, TemplateApplyDialogComponent, LayoutDesignerComponent, TabloLayoutDialogComponent],
  providers: [TabloEditorSnapshotService, TabloEditorTemplateService, TabloEditorPsdService, TabloEditorDesignerActionsService, TabloEditorActionsService],
  templateUrl: './project-tablo-editor.component.html',
  styleUrl: './project-tablo-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabloEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService);
  private readonly finalizationService = inject(PartnerFinalizationService);
  private readonly toast = inject(ToastService);
  private readonly ps = inject(PhotoshopService);
  readonly snapshotService = inject(TabloEditorSnapshotService);
  readonly templateService = inject(TabloEditorTemplateService);
  readonly actions = inject(TabloEditorActionsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  readonly activeTab = signal<EditorTab>('commands');
  readonly loading = signal(true);
  readonly project = signal<PartnerProjectDetails | null>(null);

  readonly projectData = computed<ProjectDetailData | null>(() => {
    const p = this.project();
    if (!p) return null;
    return {
      id: p.id, name: p.name, school: p.school, partner: p.partner,
      className: p.className, classYear: p.classYear, status: p.status,
      statusLabel: p.statusLabel, statusColor: p.statusColor, tabloStatus: p.tabloStatus,
      photoDate: p.photoDate, deadline: p.deadline, expectedClassSize: p.expectedClassSize,
      orderSubmittedAt: p.orderSubmittedAt, draftPhotoCount: p.draftPhotoCount,
      contact: p.contact, contacts: p.contacts ?? [], qrCode: p.qrCode,
      activeQrCodes: p.activeQrCodes ?? [], qrCodesHistory: p.qrCodesHistory ?? [],
      tabloGalleryId: p.tabloGalleryId, createdAt: p.createdAt, updatedAt: p.updatedAt,
    };
  });

  readonly projectExtraNames = computed(() => this.project()?.extraNames ?? null);
  readonly projectStatus = computed(() => this.project()?.status ?? null);

  /** Photoshop állapot */
  readonly psPath = this.ps.path;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;

  /** Beállítások */
  readonly marginCm = this.ps.marginCm;
  readonly studentSizeCm = this.ps.studentSizeCm;
  readonly teacherSizeCm = this.ps.teacherSizeCm;
  readonly gapHCm = this.ps.gapHCm;
  readonly gapVCm = this.ps.gapVCm;
  readonly nameGapCm = this.ps.nameGapCm;
  readonly nameBreakAfter = this.ps.nameBreakAfter;
  readonly textAlign = this.ps.textAlign;
  readonly gridAlign = this.ps.gridAlign;

  /** PSD méretek */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  private sizeThreshold: TabloSizeThreshold | null = null;
  private sizeResolved = false;

  /** Személyek */
  readonly persons = signal<TabloPersonItem[]>([]);

  /** Minta beállítások */
  readonly sampleSizeLarge = this.ps.sampleSizeLarge;
  readonly sampleSizeSmall = this.ps.sampleSizeSmall;
  readonly sampleLargeSize = this.ps.sampleUseLargeSize;
  readonly sampleWatermarkText = this.ps.sampleWatermarkText;
  readonly sampleWatermarkColor = this.ps.sampleWatermarkColor;
  readonly sampleWatermarkOpacity = this.ps.sampleWatermarkOpacity;
  readonly opacityPercent = computed(() => Math.round(this.sampleWatermarkOpacity() * 100));

  /** Csoportosított snapshot lista */
  readonly collapsedGroups = signal<Set<string>>(new Set());

  readonly groupedSnapshots = computed(() => {
    const all = this.snapshotService.snapshots();
    const originals: SnapshotListItem[] = [];
    const editedMap = new Map<string, SnapshotListItem[]>();

    for (const snap of all) {
      if (snap.snapshotName.endsWith('(szerkesztett)')) {
        const baseName = snap.snapshotName.replace(/ \(szerkesztett\)$/, '');
        const list = editedMap.get(baseName) ?? [];
        list.push(snap);
        editedMap.set(baseName, list);
      } else {
        originals.push(snap);
      }
    }

    const groups: Array<{ original: SnapshotListItem; edited: SnapshotListItem[] }> = [];
    const usedEdited = new Set<string>();

    for (const orig of originals) {
      const edited = editedMap.get(orig.snapshotName) ?? [];
      groups.push({ original: orig, edited });
      if (edited.length) usedEdited.add(orig.snapshotName);
    }

    for (const [baseName, editedList] of editedMap) {
      if (!usedEdited.has(baseName)) {
        for (const snap of editedList) groups.push({ original: snap, edited: [] });
      }
    }

    return groups;
  });

  /** Számított értékek a dialógusokhoz */
  readonly studentCountForDialog = computed(() => this.persons().filter(p => p.type !== 'teacher').length);
  readonly teacherCountForDialog = computed(() => this.persons().filter(p => p.type === 'teacher').length);

  readonly boardDimensionsForDialog = computed<BoardDimensions | null>(() => {
    const size = this.selectedSize();
    if (!size) return null;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return null;
    return {
      boardWidthCm: boardSize.widthCm, boardHeightCm: boardSize.heightCm,
      marginCm: this.ps.marginCm(), studentSizeCm: this.ps.studentSizeCm(),
      teacherSizeCm: this.ps.teacherSizeCm(),
    };
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) { this.loading.set(false); return; }

    this.loadProject(id);
    this.ps.detectPhotoshop();
    this.loadTabloSizes();
    window.electronAPI?.overlay.setContext({ mode: 'normal', projectId: id });
  }

  private loadProject(id: number): void {
    this.partnerService.getProjectDetails(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPersons(id);
        this.tryResolveSize();
        this.tryLoadSnapshots();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadPersons(projectId: number): void {
    this.partnerService.getProjectPersons(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.persons.set(res.data),
      error: () => {},
    });
  }

  private loadTabloSizes(): void {
    this.loadingSizes.set(true);
    this.partnerService.getTabloSizes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.tabloSizes.set(res.sizes);
        this.sizeThreshold = res.threshold;
        this.tryResolveSize();
        this.loadingSizes.set(false);
        this.tryLoadSnapshots();
      },
      error: () => this.loadingSizes.set(false),
    });
  }

  private tryResolveSize(): void {
    if (this.sizeResolved) return;
    const sizes = this.tabloSizes();
    const project = this.project();
    if (sizes.length === 0 || !project) return;

    this.sizeResolved = true;

    if (project.tabloSize) {
      const match = sizes.find(s => s.value === project.tabloSize);
      if (match) { this.selectedSize.set(match); return; }
    }

    let resolved: TabloSize | null = null;
    if (this.sizeThreshold) {
      const studentCount = project.studentsCount ?? project.expectedClassSize ?? 0;
      if (studentCount > 0) resolved = selectTabloSize(studentCount, sizes, this.sizeThreshold);
    }
    if (!resolved) resolved = sizes[0];
    this.selectedSize.set(resolved);
    this.saveTabloSize(resolved.value);
  }

  private snapshotsInitLoaded = false;
  private async tryLoadSnapshots(): Promise<void> {
    if (this.snapshotsInitLoaded) return;
    if (!this.project() || !this.selectedSize()) return;
    this.snapshotsInitLoaded = true;
    await this.actions.tryLoadSnapshots(this.project(), this.selectedSize());
  }

  goBack(): void { this.location.back(); }

  onStatusChange(event: { value: string; label: string; color: string }): void {
    const id = this.project()?.id;
    if (!id) return;
    this.partnerService.updateProject(id, { status: event.value }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const current = this.project();
        if (current) this.project.set({ ...current, status: event.value, statusLabel: event.label, statusColor: event.color });
      },
    });
  }

  selectSize(size: TabloSize): void {
    this.selectedSize.set(size);
    this.saveTabloSize(size.value);
  }

  private saveTabloSize(sizeValue: string): void {
    const projectId = this.project()?.id;
    if (!projectId) return;
    this.finalizationService.updateTabloSize(projectId, sizeValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toast.success('Mentve', 'Tablóméret elmentve'),
        error: () => this.toast.error('Hiba', 'Tablóméret mentése sikertelen'),
      });
  }

  /** Input event -> szám validáció -> setter hívás */
  private async setNumericValue(event: Event, min: number, max: number, setter: (v: number) => Promise<boolean>): Promise<void> {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= min && v <= max) await setter(v);
  }

  setMarginValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setMargin(v)); }
  setStudentSizeValue(e: Event) { this.setNumericValue(e, 1, 30, v => this.ps.setStudentSize(v)); }
  setTeacherSizeValue(e: Event) { this.setNumericValue(e, 1, 30, v => this.ps.setTeacherSize(v)); }
  setGapHValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setGapH(v)); }
  setGapVValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setGapV(v)); }
  setNameGapValue(e: Event) { this.setNumericValue(e, 0, 5, v => this.ps.setNameGap(v)); }
  setNameBreakAfterValue(e: Event) { this.setNumericValue(e, 0, 5, v => this.ps.setNameBreakAfter(v)); }
  setTextAlignValue(align: string) { this.ps.setTextAlign(align); }
  setGridAlignValue(align: string) { this.ps.setGridAlign(align); }

  toggleGroupCollapse(name: string): void {
    const next = new Set(this.collapsedGroups());
    if (next.has(name)) next.delete(name); else next.add(name);
    this.collapsedGroups.set(next);
  }

  isGroupCollapsed(name: string): boolean { return this.collapsedGroups().has(name); }

  getSizePixels(size: TabloSize): string {
    const dims = this.ps.parseSizeValue(size.value);
    if (!dims) return '';
    return `${Math.round(dims.widthCm * 200 / 2.54)}×${Math.round(dims.heightCm * 200 / 2.54)} px`;
  }

  // --- Template wrapper-ek ---

  async saveTemplateFromDialog(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.actions.clearMessages();
    const result = await this.templateService.saveTemplate(boardSize);
    if (result.success) this.actions.successMessage.set('Sablon mentve!');
    else this.actions.error.set(result.error || 'Sablon mentés sikertelen.');
  }

  async applyTemplate(templateId: string): Promise<void> {
    this.actions.clearMessages();
    const result = await this.templateService.applyTemplate(templateId);
    if (result.success) this.actions.successMessage.set('Sablon alkalmazva!');
    else this.actions.error.set(result.error || 'Sablon alkalmazás sikertelen.');
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.actions.clearMessages();
    const result = await this.templateService.deleteTemplate(templateId);
    if (result.success) this.actions.successMessage.set('Sablon törölve.');
    else this.actions.error.set(result.error || 'Sablon törlés sikertelen.');
  }

  async commitTemplateRename(): Promise<void> {
    const result = await this.templateService.commitEditing();
    if (result.success && result.error) this.actions.error.set(result.error);
  }

  get currentStudentCount(): number { return this.persons().filter(p => p.type !== 'teacher').length; }

  // --- Minta beállítások ---

  toggleLargeSize(): void {
    const next = !this.sampleLargeSize();
    this.sampleLargeSize.set(next);
    this.ps.setSampleSettings({ useLargeSize: next });
  }

  toggleWatermarkColor(): void {
    const next = this.sampleWatermarkColor() === 'white' ? 'black' : 'white';
    this.sampleWatermarkColor.set(next);
    this.ps.setSampleSettings({ watermarkColor: next });
  }

  cycleWatermarkOpacity(): void {
    const pct = Math.round(this.sampleWatermarkOpacity() * 100);
    const next = (pct >= 23 ? 10 : pct + 1) / 100;
    this.sampleWatermarkOpacity.set(next);
    this.ps.setSampleSettings({ watermarkOpacity: next });
  }

  setSampleSizeLargeValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeLarge: v });
  }

  setSampleSizeSmallValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeSmall: v });
  }

  setSampleWatermarkTextValue(e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    if (v.length > 0) this.ps.setSampleSettings({ watermarkText: v });
  }

  setSampleWatermarkColorValue(color: 'white' | 'black') {
    this.ps.setSampleSettings({ watermarkColor: color });
  }

  setSampleWatermarkOpacityValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0.05 && v <= 0.50) this.ps.setSampleSettings({ watermarkOpacity: v });
  }

  /** Extra nevek frissítése a layout designer dialógusból */
  onExtraNamesUpdated(extraNames: { students: string; teachers: string }): void {
    const p = this.project();
    if (p) this.project.set({ ...p, extraNames });
  }

  /** Snapshot betöltés wrapper */
  async loadSnapshots(): Promise<void> {
    await this.actions.loadSnapshots(this.selectedSize(), this.project());
  }
}
