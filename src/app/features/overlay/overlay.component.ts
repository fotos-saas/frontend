import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayContext, ActiveDocInfo } from '../../core/services/electron.types';
import { OverlayUploadService } from './overlay-upload.service';
import { OverlayUploadPanelService } from './overlay-upload-panel.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayQuickActionsService } from './overlay-quick-actions.service';
import { OverlaySyncService } from './overlay-sync.service';
import { OverlayLayerManagementService } from './overlay-layer-management.service';
import { OverlayGenerateService } from './overlay-generate.service';
import { TOOLBAR_GROUPS, ALIGN_MAP, SUBMENU_IDS } from './overlay-toolbar.const';
import { PartnerTeacherService } from '../partner/services/partner-teacher.service';
import { TeacherLinkDialogComponent } from '../partner/components/teacher-link-dialog/teacher-link-dialog.component';
import { TeacherPhotoChooserDialogComponent } from '../partner/components/teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import { TeacherListItem, LinkedGroupPhoto, PhotoChooserMode } from '../partner/models/teacher.models';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayDragOrderService } from './overlay-drag-order.service';
import { OverlayDragGroupsService } from './overlay-drag-groups.service';
import { OverlayEffectsService } from './overlay-effects.service';
import { OverlayEmailService } from './overlay-email.service';
import { DragOrderColorPipe } from '@shared/pipes/drag-order-color.pipe';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DragDropModule, TeacherLinkDialogComponent, TeacherPhotoChooserDialogComponent, DragOrderColorPipe],
  providers: [
    OverlayUploadService, OverlayProjectService, OverlayPhotoshopService,
    OverlayPollingService, OverlaySettingsService, OverlaySortService,
    OverlaySyncService, OverlayLayerManagementService, OverlayGenerateService,
    OverlayQuickActionsService, OverlayDragOrderService, OverlayDragGroupsService,
    OverlayEffectsService, OverlayUploadPanelService, OverlayEmailService,
  ],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly teacherService = inject(PartnerTeacherService);

  readonly projectService = inject(OverlayProjectService);
  readonly ps = inject(OverlayPhotoshopService);
  readonly polling = inject(OverlayPollingService);
  readonly settings = inject(OverlaySettingsService);
  readonly sortService = inject(OverlaySortService);
  readonly syncService = inject(OverlaySyncService);
  readonly layerMgmt = inject(OverlayLayerManagementService);
  readonly generateService = inject(OverlayGenerateService);
  readonly qa = inject(OverlayQuickActionsService);
  readonly dragOrder = inject(OverlayDragOrderService);
  readonly uploadPanel = inject(OverlayUploadPanelService);
  readonly emailService = inject(OverlayEmailService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly context = signal<OverlayContext>({ mode: 'normal' });
  readonly isDesignerMode = computed(() => this.context().mode === 'designer');
  readonly openSubmenu = signal<string | null>(null);
  private collapseTimer: ReturnType<typeof setTimeout> | null = null;
  private collapseHover = false;

  readonly activeDoc = this.polling.activeDoc;
  readonly isTurbo = this.polling.isTurbo;
  readonly isPollingEnabled = this.polling.isEnabled;
  readonly busyCommand = this.ps.busyCommand;
  readonly persons = this.projectService.persons;
  readonly loadingPersons = this.projectService.loadingPersons;
  readonly isLoggedOut = this.projectService.isLoggedOut;
  readonly sorting = this.sortService.sorting;
  readonly syncWithBorder = this.settings.syncWithBorder;
  readonly nameBreakAfter = this.settings.nameBreakAfter;
  readonly nameGapCm = this.settings.nameGapCm;
  readonly sampleUseLargeSize = this.settings.sampleUseLargeSize;
  readonly sampleWatermarkColor = this.settings.sampleWatermarkColor;
  readonly sampleWatermarkOpacity = this.settings.sampleWatermarkOpacity;
  readonly sampleVersion = this.settings.sampleVersion;
  readonly renameDialogOpen = this.layerMgmt.renameDialogOpen;
  readonly renameMatched = this.layerMgmt.renameMatched;
  readonly renameUnmatched = this.layerMgmt.renameUnmatched;
  readonly renameApplying = this.layerMgmt.renameApplying;
  readonly refreshRosterDialogOpen = this.layerMgmt.refreshRosterDialogOpen;
  readonly refreshRosterToRemove = this.layerMgmt.refreshRosterToRemove;
  readonly refreshRosterToAdd = this.layerMgmt.refreshRosterToAdd;
  readonly refreshRosterApplying = this.layerMgmt.refreshRosterApplying;
  readonly renameCanApply = computed(() => {
    if (this.renameApplying()) return false;
    if (this.renameMatched().length > 0) return true;
    return this.renameUnmatched().some(u => u.newId.trim().length > 0);
  });

  readonly dragOrderPanelOpen = this.dragOrder.panelOpen;
  readonly dragOrderSaving = this.dragOrder.saving;
  readonly dragOrderRefreshing = this.dragOrder.refreshing;
  readonly dragOrderScope = this.dragOrder.scope;
  readonly dragOrderList = this.dragOrder.filteredList;
  readonly dragOrderSearchQuery = this.dragOrder.searchQuery;
  readonly dragOrderSelected = this.dragOrder.selected;
  readonly dragOrderGenderLoading = this.dragOrder.genderLoading;
  readonly dragOrderGroups = this.dragOrder.filteredGroups;
  readonly dragOrderUngrouped = this.dragOrder.filteredUngrouped;
  readonly dragOrderHasGroups = this.dragOrder.hasGroups;
  readonly dragOrderGroupsRaw = this.dragOrder.groups;
  readonly dragOrderUngroupedRaw = this.dragOrder.ungrouped;
  readonly dragOrderCustomOpen = this.dragOrder.customOrderOpen;
  readonly dragOrderCustomText = this.dragOrder.customOrderText;
  readonly dragOrderCustomLoading = this.dragOrder.customOrderLoading;
  readonly dragOrderCustomResult = this.dragOrder.customOrderResult;
  readonly linkResult = this.qa.result;

  readonly showTeacherLinkDialog = signal(false);
  readonly showPhotoChooserDialog = signal(false);
  readonly linkDialogTeacher = signal<TeacherListItem | null>(null);
  readonly linkDialogAllTeachers = signal<TeacherListItem[]>([]);
  readonly photoChooserPhotos = signal<LinkedGroupPhoto[]>([]);
  readonly photoChooserMode = signal<PhotoChooserMode | null>(null);

  readonly uploadPanelOpen = this.uploadPanel.panelOpen;
  readonly selectedPerson = this.uploadPanel.selectedPerson;
  readonly searchQuery = this.uploadPanel.searchQuery;
  readonly uploading = this.uploadPanel.uploading;
  readonly uploadResult = this.uploadPanel.uploadResult;
  readonly dragOver = this.uploadPanel.dragOver;
  readonly selectedFile = this.uploadPanel.selectedFile;
  readonly panelHeight = this.uploadPanel.panelHeight;
  readonly psLayers = this.uploadPanel.psLayers;
  readonly batchUploading = this.uploadPanel.batchUploading;
  readonly batchProgress = this.uploadPanel.batchProgress;
  readonly placing = this.uploadPanel.placing;
  readonly unmatchedFiles = this.uploadPanel.unmatchedFiles;
  readonly selectedUnmatchedFile = this.uploadPanel.selectedUnmatchedFile;
  readonly matching = this.uploadPanel.matching;
  readonly batchResult = this.uploadPanel.batchResult;

  readonly emailPanelOpen = this.emailService.panelOpen;
  readonly emailLoading = this.emailService.loading;
  readonly emailTemplates = this.emailService.templates;
  readonly emailSelectedTemplate = this.emailService.selectedTemplateName;
  readonly emailSubject = this.emailService.resolvedSubject;
  readonly emailBodyHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.emailService.resolvedBodyHtml()));
  readonly emailContactName = this.emailService.contactName;
  readonly emailContactEmail = this.emailService.contactEmail;
  readonly emailCopyFeedback = this.emailService.copyFeedback;
  readonly generating = this.generateService.generating;
  readonly generateResult = this.generateService.generateResult;
  readonly hasPsLayers = this.uploadPanel.hasPsLayers;
  readonly uploadableLayers = this.uploadPanel.uploadableLayers;
  readonly placableLayers = this.uploadPanel.placableLayers;
  readonly filteredPersons = this.uploadPanel.filteredPersons;
  readonly canUpload = this.uploadPanel.canUpload;
  readonly activeDocLabel = computed(() => {
    const name = this.activeDoc().name;
    if (!name) return null;
    const base = name.replace(/\.(psd|psb|pdd)$/i, '');
    return base.length <= 30 ? base : base.slice(0, 12) + '...' + base.slice(-12);
  });
  readonly selectedLayers = computed(() => this.activeDoc().selectedLayers ?? 0);
  readonly groups = computed(() => TOOLBAR_GROUPS.filter(g => !g.designerOnly));

  ngOnInit(): void {
    document.body.classList.add('overlay-mode');
    this.loadContext();
    this.listenContextChanges();
    this.loadActiveDoc();
    this.listenActiveDocChanges();
    this.polling.startPolling(this.destroyRef, () => this.pollActiveDoc());
    this.setupClickThrough();
    this.polling.listenVisibility(this.destroyRef);
    this.settings.loadSettings(this.context().projectId || this.projectService.getLastProjectId());
    this.settings.syncWithBorder.set(this.settings.loadSyncBorderForProject(this.context().projectId));
    this.qa.setProjectIdResolver(() => this.context().projectId);
    this.dragOrder.setProjectIdResolver(() => this.pid);
    this.uploadPanel.setContextResolver(() => this.context());
  }

  onCommand(commandId: string): void {
    if (commandId === 'upload-photo') { this.toggleUploadPanel(); return; }
    if (commandId === 'email-template') { this.toggleEmailPanel(); return; }
    if (SUBMENU_IDS.has(commandId)) {
      const isOpen = this.openSubmenu() === commandId;
      this.openSubmenu.set(isOpen ? null : commandId);
      this.resetCollapseTimer(isOpen ? null : commandId);
      return;
    }
    this.closeSubmenu();
    if (commandId === 'rename-layer-ids') { this.layerMgmt.renameLayerIds(this.context()); return; }
    if (commandId === 'refresh-roster') { this.layerMgmt.refreshRoster(this.context()); return; }
    if (commandId === 'link-layers') { this.runLinkCommand(commandId, 'actions/link-selected.jsx', 'link'); return; }
    if (commandId === 'unlink-layers') { this.runLinkCommand(commandId, 'actions/unlink-selected.jsx', 'unlink'); return; }
    const alignType = ALIGN_MAP[commandId];
    if (alignType) { this.ps.runJsx(commandId, 'actions/align-linked.jsx', { ALIGN_TYPE: alignType }); return; }
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.uploadPanel.resizing) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.toolbar-wrap')) {
      if (this.openSubmenu()) this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
      if (this.dragOrderPanelOpen()) this.closeDragOrderPanel();
      if (this.emailPanelOpen()) this.closeEmailPanel();
    }
  }

  arrangeNames(textAlign: string): void { this.closeSubmenu(); this.sortService.arrangeNames(textAlign); }
  cycleBreakAfter(): void { this.settings.cycleBreakAfter(); }
  adjustGap(delta: number): void { this.settings.adjustGap(delta); }
  async sortAbc(): Promise<void> { this.closeSubmenu(); await this.sortService.sortAbc(); }
  async sortGender(): Promise<void> { this.closeSubmenu(); await this.sortService.sortGender(); }
  async sortGrid(): Promise<void> { this.closeSubmenu(); await this.sortService.sortGrid(this.activeDoc()); }

  async toggleDragOrderPanel(): Promise<void> {
    if (this.dragOrderPanelOpen()) { this.dragOrder.closePanel(); } else {
      this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
      if (this.qa.panelOpen()) this.closeQuickActions();
      await this.dragOrder.openPanel();
    }
  }
  closeDragOrderPanel(): void { this.dragOrder.closePanel(); }
  clearDragOrderSelection(): void { this.dragOrder.clearSelection(); }
  setDragOrderScope(scope: 'all' | 'teachers' | 'students'): void { this.dragOrder.setScope(scope); }
  toggleDragOrderSelect(personId: number, event: MouseEvent): void { this.dragOrder.toggleSelect(personId, event); }
  isDragOrderSelected(personId: number): boolean { return this.dragOrder.isSelected(personId); }
  dragOrderSortAbc(): void { this.dragOrder.sortAbc(); }
  dragOrderSortGender(): Promise<void> { return this.dragOrder.sortGender(); }
  dragOrderSortLeadership(): void { this.dragOrder.sortLeadership(); }
  onDragOrderDrop(event: CdkDragDrop<PersonItem[]>): void { this.dragOrder.onDrop(event); }
  saveDragOrder(): Promise<void> { return this.dragOrder.save(); }
  refreshDragOrder(): Promise<void> { return this.dragOrder.refreshFromDb(); }
  setDragOrderSearch(value: string): void { this.dragOrder.searchQuery.set(value); }
  createDragOrderGroup(): void { this.dragOrder.createGroup('Új csoport'); }
  createDragOrderGroupFromSelection(): void { this.dragOrder.createGroupFromSelection('Új csoport'); }
  removeDragOrderGroup(id: string): void { this.dragOrder.removeGroup(id); }
  onDragOrderGroupNameBlur(event: FocusEvent, groupId: string): void {
    const el = event.target as HTMLElement;
    const name = el.textContent?.trim();
    if (name) this.dragOrder.renameGroup(groupId, name);
    else el.textContent = this.dragOrder.groups().find(g => g.id === groupId)?.name ?? 'Csoport';
  }
  onDragOrderGroupNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLElement).blur(); }
  }
  toggleDragOrderGroupCollapse(id: string): void { this.dragOrder.toggleGroupCollapse(id); }
  onDropToGroup(event: CdkDragDrop<PersonItem[]>, groupId: string): void { this.dragOrder.onDropToGroup(event, groupId); }
  onDropToUngrouped(event: CdkDragDrop<PersonItem[]>): void { this.dragOrder.onDropToUngrouped(event); }
  moveDragOrderGroup(id: string, direction: -1 | 1): void { this.dragOrder.moveGroup(id, direction); }

  syncPhotos(mode: 'all' | 'missing' | 'selected'): void { this.closeSubmenu(); this.syncService.syncPhotos(mode, this.context()); }
  confirmRefreshPlacedJson(): void { this.closeSubmenu(); this.syncService.refreshPlacedJson(this.context()); }
  toggleSyncBorder(): void { this.settings.toggleSyncBorder(this.context().projectId); }
  private get pid(): number | null { return this.context().projectId || this.projectService.getLastProjectId(); }
  toggleSampleSize(): void { this.settings.toggleSampleSize(this.pid); }
  toggleWatermarkColor(): void { this.settings.toggleWatermarkColor(this.pid); }
  cycleOpacity(direction: 1 | -1 = 1): void { this.settings.cycleOpacity(direction, this.pid); }
  cycleSampleVersion(direction: 1 | -1 = 1): void { this.settings.cycleSampleVersion(direction, this.pid); }
  async confirmGenerate(type: 'sample' | 'final'): Promise<void> { this.closeSubmenu(); this.generateService.confirmGenerate(type, this.context()); }
  cancelGenerate(): void { this.closeSubmenu(); }

  updateUnmatchedId(index: number, newId: string): void { this.layerMgmt.updateUnmatchedId(index, newId); }
  applyRename(): Promise<void> { return this.layerMgmt.applyRename(); }
  closeRenameDialog(): void { this.layerMgmt.closeRenameDialog(); }
  applyRefreshRoster(): Promise<void> { return this.layerMgmt.applyRefreshRoster(); }
  closeRefreshRosterDialog(): void { this.layerMgmt.closeRefreshRosterDialog(); }

  toggleUploadPanel(): void {
    if (this.uploadPanelOpen()) { this.uploadPanel.closePanel(); } else { this.closeSubmenu(); this.uploadPanel.openPanel(); }
  }
  closeUploadPanel(): void { this.uploadPanel.closePanel(); }
  onResizeStart(event: MouseEvent): void { this.uploadPanel.startResize(event); }
  onSearchInput(event: Event): void { this.uploadPanel.onSearchInput(event); }
  selectPerson(person: PersonItem): void { this.uploadPanel.selectPerson(person); }
  onFileSelect(event: Event): void { this.uploadPanel.onFileSelect(event); }
  onDragOver(event: DragEvent): void { this.uploadPanel.onDragOver(event); }
  onDragLeave(event: DragEvent): void { this.uploadPanel.onDragLeave(event); }
  onDrop(event: DragEvent): void { this.uploadPanel.onDrop(event); }
  onBatchFileSelect(event: Event): void { this.uploadPanel.onBatchFileSelect(event); }
  upload(): void { this.uploadPanel.upload(); }
  refreshPsLayers(): void { this.uploadPanel.refreshPsLayers(); }
  resetUploadState(): void { this.uploadPanel.resetUploadState(); }
  matchDroppedFiles(fileList: FileList): void { this.uploadPanel.matchDroppedFiles(fileList); }
  assignFileToLayer(layerIndex: number, file: File): void { this.uploadPanel.assignFileToLayer(layerIndex, file); }
  selectUnmatchedFile(file: File): void { this.uploadPanel.selectUnmatchedFile(file); }
  onLayerRowClick(index: number): void { this.uploadPanel.onLayerRowClick(index); }
  retrySmartMatch(): void { this.uploadPanel.retrySmartMatch(); }
  clearUnmatchedFiles(): void { this.uploadPanel.clearUnmatchedFiles(); }
  getFilePreview(file: File): string { return this.uploadPanel.getFilePreview(file); }
  removeFileFromLayer(layerIndex: number): void { this.uploadPanel.removeFileFromLayer(layerIndex); }
  uploadAndPlace(): Promise<void> { return this.uploadPanel.uploadAndPlace(); }
  placeInPs(): Promise<void> { return this.uploadPanel.placeInPs(); }

  toggleQuickActions(): void { this.qa.togglePanel(); }
  closeQuickActions(): void { this.qa.closePanel(); }
  toggleSpecPanel(): void { this.qa.toggleSpecPanel(); }
  closeSpecPanel(): void { this.qa.closeSpecPanel(); }
  toggleGridPanel(): void { this.qa.toggleGridPanel(); }
  toggleRotatePanel(): void { this.qa.toggleRotatePanel(); }
  applyBorderRadius(): void { this.qa.applyBorderRadiusSelected(); }
  applyRotate(): void { this.qa.applyRotateSelected(); }

  toggleEmailPanel(): void {
    if (this.emailPanelOpen()) { this.emailService.closePanel(); } else {
      this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
      if (this.dragOrderPanelOpen()) this.closeDragOrderPanel();
      if (this.qa.panelOpen()) this.closeQuickActions();
      this.emailService.openPanel(this.pid);
    }
  }
  closeEmailPanel(): void { this.emailService.closePanel(); }
  onEmailTemplateChange(name: string): void { this.emailService.selectTemplate(name); }
  copyEmailText(text: string, label: string): void { this.emailService.copyText(text, label); }
  copyEmailHtml(html: string, label: string): void { this.emailService.copyHtml(html, label); }

  togglePolling(): void { this.polling.toggleEnabled(); }
  toggleTurbo(): void { this.polling.toggleTurbo(); }
  hide(): void { window.electronAPI?.overlay.hide(); }
  showLogin(): void { window.electronAPI?.overlay.showMainWindow(); }
  openActiveDocDir(): void { this.onCommand('ps-open-workdir'); }

  openLinkDialog(person: PersonItem): void {
    if (!person.archiveId) return;
    forkJoin({
      teacher: this.teacherService.getTeacher(person.archiveId),
      allTeachers: this.teacherService.getAllTeachers(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ teacher: res, allTeachers }) => {
        const t = res.data;
        const teacherListItem: TeacherListItem = {
          id: t.id, canonicalName: t.canonicalName, titlePrefix: t.titlePrefix,
          position: t.position ?? null, fullDisplayName: t.fullDisplayName,
          schoolId: t.schoolId, schoolName: t.schoolName ?? null, isActive: true,
          photoThumbUrl: t.photoThumbUrl ?? null, photoMiniThumbUrl: t.photoThumbUrl ?? null,
          photoUrl: t.photoUrl ?? null, aliasesCount: t.aliases?.length ?? 0,
          photosCount: t.photos?.length ?? 0, linkedGroup: t.linkedGroup ?? null,
          groupSize: 0, projectsCount: t.projects?.length ?? 0,
        };
        const enriched = allTeachers.some(at => at.id === teacherListItem.id) ? allTeachers : [teacherListItem, ...allTeachers];
        this.ngZone.run(() => {
          this.linkDialogTeacher.set(teacherListItem);
          this.linkDialogAllTeachers.set(enriched);
          this.showTeacherLinkDialog.set(true);
        });
      },
    });
  }
  onTeacherLinked(): void { this.showTeacherLinkDialog.set(false); this.reloadPersons(); }
  openPhotoChooser(person: PersonItem): void {
    if (!person.linkedGroup) return;
    const group = person.linkedGroup;
    this.teacherService.getLinkedGroupPhotos(group).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.photoChooserPhotos.set(res.data || []);
          this.photoChooserMode.set({ kind: 'linkedGroup', linkedGroup: group });
          this.showPhotoChooserDialog.set(true);
        });
      },
    });
  }
  onOpenPhotoChooserFromLink(groupId: string): void {
    this.showTeacherLinkDialog.set(false);
    this.teacherService.getLinkedGroupPhotos(groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.photoChooserPhotos.set(res.data || []);
          this.photoChooserMode.set({ kind: 'linkedGroup', linkedGroup: groupId });
          this.showPhotoChooserDialog.set(true);
        });
      },
    });
  }
  onPhotoChosen(): void { this.showPhotoChooserDialog.set(false); this.reloadPersons(); }

  onCollapseEnter(): void { this.collapseHover = true; this.clearCollapseTimer(); }
  onCollapseLeave(): void {
    this.collapseHover = false;
    if (this.openSubmenu()) this.resetCollapseTimer(this.openSubmenu());
  }

  private async runLinkCommand(commandId: string, script: string, type: 'link' | 'unlink'): Promise<void> {
    const result = await this.ps.runJsx(commandId, script);
    this.qa.showLinkResult(result, type);
  }

  private closeSubmenu(): void { if (this.openSubmenu()) { this.openSubmenu.set(null); this.clearCollapseTimer(); } }
  private resetCollapseTimer(submenuId: string | null): void {
    this.clearCollapseTimer();
    if (submenuId && !this.collapseHover) {
      this.collapseTimer = setTimeout(() => this.ngZone.run(() => this.closeSubmenu()), 5000);
    }
  }
  private clearCollapseTimer(): void { if (this.collapseTimer) { clearTimeout(this.collapseTimer); this.collapseTimer = null; } }

  private reloadPersons(): void {
    const pid = this.projectService.getLastProjectId() || this.context().projectId;
    if (pid) this.projectService.loadPersons(pid);
  }

  private setupClickThrough(): void {
    if (!window.electronAPI) return;
    document.addEventListener('mousemove', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === document.documentElement || target === document.body) {
        window.electronAPI!.overlay.setIgnoreMouseEvents(true);
      }
    });
    document.addEventListener('mouseenter', () => { window.electronAPI!.overlay.setIgnoreMouseEvents(false); }, true);
  }

  private async loadContext(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const ctx = await window.electronAPI.overlay.getContext();
      this.ngZone.run(() => this.context.set(ctx));
    } catch { /* default: normal */ }
  }

  private listenContextChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onContextChanged((ctx) => {
      this.ngZone.run(() => {
        this.context.set(ctx);
        this.settings.syncWithBorder.set(this.settings.loadSyncBorderForProject(ctx.projectId));
        if (ctx.projectId) this.settings.loadSampleSettingsForProject(ctx.projectId);
        if (this.isLoggedOut() && ctx.projectId) this.isLoggedOut.set(false);
        if (ctx.projectId) this.projectService.loadPersons(ctx.projectId);
      });
    });
    this.destroyRef.onDestroy(cleanup);
  }

  private async loadActiveDoc(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const doc = await window.electronAPI.overlay.getActiveDoc();
      this.ngZone.run(() => this.polling.mergeActiveDoc(doc));
    } catch { /* ignore */ }
  }

  private listenActiveDocChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onActiveDocChanged((doc) => {
      this.ngZone.run(() => this.polling.mergeActiveDoc(doc));
    });
    this.destroyRef.onDestroy(cleanup);
  }

  private async pollActiveDoc(): Promise<void> {
    if (!window.electronAPI || !this.polling.getIsVisible()) return;
    if (this.isLoggedOut()) this.projectService.tryAuthRecovery(this.context());
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const doc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => {
            this.polling.activeDoc.set(doc);
            if (this.uploadPanelOpen()) this.uploadPanel.updatePsLayersFromDoc(doc);
          });
          window.electronAPI.overlay.setActiveDoc(doc);
        }
      }
    } catch { /* PS nem elérhető */ }
  }
}
