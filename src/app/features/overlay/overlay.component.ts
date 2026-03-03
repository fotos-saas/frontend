import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayContext, ActiveDocInfo } from '../../core/services/electron.types';
import { environment } from '../../../environments/environment';
import { OverlayUploadService, PsLayerPerson, BatchProgress } from './overlay-upload.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlaySyncService } from './overlay-sync.service';
import { OverlayLayerManagementService } from './overlay-layer-management.service';
import { OverlayGenerateService } from './overlay-generate.service';
import { TOOLBAR_GROUPS, ALIGN_MAP, SUBMENU_IDS } from './overlay-toolbar.const';
import { PartnerTeacherService } from '../partner/services/partner-teacher.service';
import { TeacherLinkDialogComponent } from '../partner/components/teacher-link-dialog/teacher-link-dialog.component';
import { TeacherPhotoChooserDialogComponent } from '../partner/components/teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import { TeacherListItem, LinkedGroupPhoto } from '../partner/models/teacher.models';

interface UploadResult {
  success: boolean;
  message?: string;
  photo?: { thumbUrl: string; url?: string };
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, TeacherLinkDialogComponent, TeacherPhotoChooserDialogComponent],
  providers: [
    OverlayUploadService, OverlayProjectService, OverlayPhotoshopService,
    OverlayPollingService, OverlaySettingsService, OverlaySortService,
    OverlaySyncService, OverlayLayerManagementService, OverlayGenerateService,
  ],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);
  private readonly uploadService = inject(OverlayUploadService);
  private readonly teacherService = inject(PartnerTeacherService);

  // Kiemelt service-ek
  readonly projectService = inject(OverlayProjectService);
  readonly ps = inject(OverlayPhotoshopService);
  readonly polling = inject(OverlayPollingService);
  readonly settings = inject(OverlaySettingsService);
  readonly sortService = inject(OverlaySortService);
  readonly syncService = inject(OverlaySyncService);
  readonly layerMgmt = inject(OverlayLayerManagementService);
  readonly generateService = inject(OverlayGenerateService);

  // ============ Service signal alias-ok (template backward compat) ============
  readonly context = signal<OverlayContext>({ mode: 'normal' });
  readonly isDesignerMode = computed(() => this.context().mode === 'designer');
  readonly openSubmenu = signal<string | null>(null);
  private collapseTimer: ReturnType<typeof setTimeout> | null = null;
  private collapseHover = false;

  // Alias-ok a service signal-ekre (template compatibility)
  readonly activeDoc = this.polling.activeDoc;
  readonly isTurbo = this.polling.isTurbo;
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

  // Quick actions panel state
  readonly quickActionsPanelOpen = signal(false);
  readonly qaRefreshNames = signal(true);
  readonly qaRefreshPositions = signal(false);
  readonly qaPositionNames = signal(true);
  readonly qaPositionPositions = signal(false);
  readonly qaConfirm = signal<{ action: string; target: string } | null>(null);

  // Custom order panel state
  readonly customOrderPanelOpen = signal(false);
  readonly customOrderText = signal('');
  readonly customOrderResult = signal<{ success: boolean; message: string } | null>(null);

  // Link/unlink eredmény visszajelzés
  readonly linkResult = signal<{ success: boolean; message: string } | null>(null);
  private linkResultTimer: ReturnType<typeof setTimeout> | null = null;

  // Upload panel state
  readonly uploadPanelOpen = signal(false);
  readonly selectedPerson = signal<PersonItem | null>(null);
  readonly searchQuery = signal('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResult | null>(null);
  readonly dragOver = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly panelHeight = signal(300);
  private resizing = false;
  private resizeStartY = 0;
  private resizeStartH = 0;
  private filePreviewCache = new Map<File, string>();
  private static readonly PANEL_MIN_H = 200;
  private static readonly PANEL_MAX_H_OFFSET = 120;

  // v2 — PS layer-alapú batch upload
  readonly psLayers = signal<PsLayerPerson[]>([]);
  readonly batchUploading = signal(false);
  readonly batchProgress = signal<BatchProgress>({ done: 0, total: 0 });
  readonly placing = signal(false);
  readonly unmatchedFiles = signal<File[]>([]);
  readonly selectedUnmatchedFile = signal<File | null>(null);
  readonly matching = signal(false);
  readonly batchResult = signal<{ success: boolean; message: string } | null>(null);
  private skipLayerMerge = false;

  // Generate state (alias)
  readonly generating = this.generateService.generating;
  readonly generateResult = this.generateService.generateResult;

  // Teacher link & photo chooser dialog state
  readonly showTeacherLinkDialog = signal(false);
  readonly showPhotoChooserDialog = signal(false);
  readonly linkDialogTeacher = signal<TeacherListItem | null>(null);
  readonly linkDialogAllTeachers = signal<TeacherListItem[]>([]);
  readonly photoChooserPhotos = signal<LinkedGroupPhoto[]>([]);
  readonly photoChooserLinkedGroup = signal('');

  readonly hasPsLayers = computed(() => this.psLayers().length > 0);
  readonly uploadableLayers = computed(() => this.psLayers().filter(l => l.file && l.uploadStatus !== 'done'));
  readonly placableLayers = computed(() => this.psLayers().filter(l => l.uploadStatus === 'done' && l.photoUrl));
  readonly filteredPersons = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.persons();
    if (!q) return list;
    return list.filter(p => p.name.toLowerCase().includes(q));
  });
  readonly canUpload = computed(() => !!this.selectedPerson() && !!this.selectedFile() && !this.uploading());
  readonly activeDocLabel = computed(() => {
    const name = this.activeDoc().name;
    if (!name) return null;
    const base = name.replace(/\.(psd|psb|pdd)$/i, '');
    if (base.length <= 30) return base;
    return base.slice(0, 12) + '...' + base.slice(-12);
  });
  readonly selectedLayers = computed(() => this.activeDoc().selectedLayers ?? 0);

  readonly groups = computed(() => TOOLBAR_GROUPS.filter(g => !g.designerOnly));

  // ============ Lifecycle ============

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
  }

  // ============ Command router ============

  onCommand(commandId: string): void {
    if (commandId === 'upload-photo') { this.toggleUploadPanel(); return; }
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
    if (this.resizing) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.toolbar-wrap')) {
      if (this.openSubmenu()) this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
      if (this.customOrderPanelOpen()) this.closeCustomOrderPanel();
    }
  }

  // ============ Rendezés delegálás ============

  arrangeNames(textAlign: string): void { this.closeSubmenu(); this.sortService.arrangeNames(textAlign); }
  cycleBreakAfter(): void { this.settings.cycleBreakAfter(); }
  adjustGap(delta: number): void { this.settings.adjustGap(delta); }
  async sortAbc(): Promise<void> { this.closeSubmenu(); await this.sortService.sortAbc(); }
  async sortGender(): Promise<void> { this.closeSubmenu(); await this.sortService.sortGender(); }
  async sortGrid(): Promise<void> { this.closeSubmenu(); await this.sortService.sortGrid(this.activeDoc()); }

  // ============ Custom Order Panel ============

  toggleCustomOrderPanel(): void {
    if (this.customOrderPanelOpen()) { this.closeCustomOrderPanel(); } else {
      this.customOrderPanelOpen.set(true);
      this.customOrderResult.set(null);
      this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
    }
  }
  closeCustomOrderPanel(): void { this.customOrderPanelOpen.set(false); this.customOrderResult.set(null); }

  async submitCustomOrder(): Promise<void> {
    const result = await this.sortService.submitCustomOrder(this.customOrderText().trim());
    if (result.message) this.ngZone.run(() => this.customOrderResult.set(result));
  }

  // ============ Sync & Generate delegálás ============

  syncPhotos(mode: 'all' | 'missing' | 'selected'): void {
    console.log('🔴 syncPhotos CALLED, mode:', mode);
    this.closeSubmenu();
    this.syncService.syncPhotos(mode, this.context());
  }

  confirmRefreshPlacedJson(): void { this.closeSubmenu(); this.syncService.refreshPlacedJson(this.context()); }

  toggleSyncBorder(): void { this.settings.toggleSyncBorder(this.context().projectId); }

  private get pid(): number | null { return this.context().projectId || this.projectService.getLastProjectId(); }

  toggleSampleSize(): void { this.settings.toggleSampleSize(this.pid); }
  toggleWatermarkColor(): void { this.settings.toggleWatermarkColor(this.pid); }
  cycleOpacity(direction: 1 | -1 = 1): void { this.settings.cycleOpacity(direction, this.pid); }
  cycleSampleVersion(direction: 1 | -1 = 1): void { this.settings.cycleSampleVersion(direction, this.pid); }

  async confirmGenerate(type: 'sample' | 'final'): Promise<void> {
    this.closeSubmenu();
    this.generateService.confirmGenerate(type, this.context());
  }
  cancelGenerate(): void { this.closeSubmenu(); }

  // ============ Rename & Roster delegálás ============

  updateUnmatchedId(index: number, newId: string): void { this.layerMgmt.updateUnmatchedId(index, newId); }
  applyRename(): Promise<void> { return this.layerMgmt.applyRename(); }
  closeRenameDialog(): void { this.layerMgmt.closeRenameDialog(); }
  applyRefreshRoster(): Promise<void> { return this.layerMgmt.applyRefreshRoster(); }
  closeRefreshRosterDialog(): void { this.layerMgmt.closeRefreshRosterDialog(); }

  // ============ Upload Panel ============

  toggleUploadPanel(): void {
    if (this.uploadPanelOpen()) { this.closeUploadPanel(); } else { this.openUploadPanel(); }
  }

  private async openUploadPanel(): Promise<void> {
    this.uploadPanelOpen.set(true);
    this.closeSubmenu();
    let pid = await this.projectService.resolveProjectId(this.context());

    if (!pid) {
      await this.loadPsLayers();
      const layers = this.psLayers();
      if (layers.length > 0) {
        pid = await this.projectService.lookupProjectIdFromPerson(layers[0].personId);
      }
    }

    if (pid) this.projectService.loadPersons(pid);
    this.loadPsLayers();
  }

  closeUploadPanel(): void {
    this.uploadPanelOpen.set(false);
    this.selectedPerson.set(null);
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.searchQuery.set('');
    this.batchResult.set(null);
    this.selectedUnmatchedFile.set(null);
    this.filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewCache.clear();
  }

  // ============ Resize panel ============
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeStartY = event.clientY;
    this.resizeStartH = this.panelHeight();
    const onMove = (e: MouseEvent) => {
      if (!this.resizing) return;
      const delta = this.resizeStartY - e.clientY;
      const maxH = window.innerHeight - OverlayComponent.PANEL_MAX_H_OFFSET;
      const newH = Math.max(OverlayComponent.PANEL_MIN_H, Math.min(maxH, this.resizeStartH + delta));
      this.ngZone.run(() => this.panelHeight.set(newH));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setTimeout(() => { this.resizing = false; }, 200);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    const onBlur = () => { onUp(); window.removeEventListener('blur', onBlur); };
    window.addEventListener('blur', onBlur);
  }

  onSearchInput(event: Event): void { this.searchQuery.set((event.target as HTMLInputElement).value); }
  selectPerson(person: PersonItem): void { this.selectedPerson.set(person); this.uploadResult.set(null); }
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }
  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.dragOver.set(true); }
  onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.dragOver.set(false); }
  onDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation(); this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (this.hasPsLayers()) { this.matchDroppedFiles(files); } else { this.setFile(files[0]); }
  }
  onBatchFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.matchDroppedFiles(input.files);
    input.value = '';
  }

  upload(): void {
    const person = this.selectedPerson();
    const file = this.selectedFile();
    const pid = this.context().projectId;
    if (!person || !file || !pid) return;
    this.uploading.set(true);
    this.uploadResult.set(null);
    const formData = new FormData();
    formData.append('photo', file);
    const url = `${environment.apiUrl}/partner/projects/${pid}/persons/${person.id}/photo`;
    this.http.post<UploadResult>(url, formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.uploading.set(false);
        this.uploadResult.set(res);
        this.selectedFile.set(null);
        if (res.success) {
          this.projectService.persons.update(list =>
            list.map(p => p.id === person.id ? { ...p, hasPhoto: true, photoThumbUrl: res.photo?.thumbUrl ?? p.photoThumbUrl } : p)
          );
        }
      }),
      error: (err) => this.ngZone.run(() => {
        this.uploading.set(false);
        this.uploadResult.set({ success: false, message: err.error?.message || 'Hiba történt a feltöltés során.' });
      }),
    });
  }

  // ============ v2 — PS Layer batch upload ============
  refreshPsLayers(): void { this.loadPsLayers(); }

  resetUploadState(event?: MouseEvent): void {
    if (event) {
      const btn = (event.target as HTMLElement).closest('button');
      if (btn) { btn.removeAttribute('data-tip'); setTimeout(() => btn.setAttribute('data-tip', 'Reset'), 500); }
    }
    this.filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewCache.clear();
    this.unmatchedFiles.set([]);
    this.selectedUnmatchedFile.set(null);
    this.batchResult.set(null);
    this.batchUploading.set(false);
    this.placing.set(false);
    this.batchProgress.set({ done: 0, total: 0 });
    this.skipLayerMerge = true;
    this.psLayers.update(layers => layers.map(l => ({
      ...l, file: undefined, uploadStatus: 'pending' as const,
      photoUrl: undefined, errorMsg: undefined, matchType: undefined, matchConfidence: undefined,
    })));
  }

  matchDroppedFiles(fileList: FileList): void {
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE) files.push(f);
    }
    if (files.length === 0) return;
    const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.persons());
    this.psLayers.set(matched);
    this.unmatchedFiles.set(unmatched);
    this.batchResult.set(null);
  }

  assignFileToLayer(layerIndex: number, file: File): void {
    this.psLayers.update(layers => layers.map((l, i) => i === layerIndex ? { ...l, file, matchType: 'manual' as const, matchConfidence: 100 } : l));
    this.unmatchedFiles.update(files => files.filter(f => f !== file));
    this.selectedUnmatchedFile.set(null);
  }
  selectUnmatchedFile(file: File): void { this.selectedUnmatchedFile.update(current => current === file ? null : file); }
  onLayerRowClick(index: number): void {
    const file = this.selectedUnmatchedFile();
    if (!file) return;
    const layer = this.psLayers()[index];
    if (layer.file || layer.uploadStatus === 'done') return;
    this.assignFileToLayer(index, file);
  }
  retrySmartMatch(): void {
    const files = this.unmatchedFiles();
    if (files.length === 0 || this.matching()) return;
    this.matching.set(true);
    setTimeout(() => this.ngZone.run(() => {
      const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.persons());
      this.psLayers.set(matched);
      this.unmatchedFiles.set(unmatched);
      this.matching.set(false);
    }), 300);
  }
  clearUnmatchedFiles(): void {
    this.unmatchedFiles().forEach(f => this.revokeFilePreview(f));
    this.unmatchedFiles.set([]);
    this.selectedUnmatchedFile.set(null);
  }
  getFilePreview(file: File): string {
    let url = this.filePreviewCache.get(file);
    if (!url) { url = URL.createObjectURL(file); this.filePreviewCache.set(file, url); }
    return url;
  }
  removeFileFromLayer(layerIndex: number): void {
    const layer = this.psLayers()[layerIndex];
    if (!layer?.file) return;
    const removedFile = layer.file;
    this.revokeFilePreview(removedFile);
    this.psLayers.update(layers => layers.map((l, i) => i === layerIndex ? { ...l, file: undefined } : l));
    this.unmatchedFiles.update(files => [...files, removedFile]);
  }

  async uploadAndPlace(): Promise<void> {
    let pid = this.context().projectId || this.projectService.getLastProjectId();
    if (this.batchUploading() || this.placing()) return;
    if (!pid) {
      const layers = this.psLayers();
      if (layers.length > 0) {
        this.batchUploading.set(true);
        pid = await this.projectService.lookupProjectIdFromPerson(layers[0].personId);
        if (!pid) { this.batchUploading.set(false); this.batchResult.set({ success: false, message: 'Nem sikerült a projekt azonosítása' }); return; }
      } else { this.batchResult.set({ success: false, message: 'Nincsenek PS layerek kijelölve' }); return; }
    }
    this.batchUploading.set(true);
    this.batchResult.set(null);
    this.batchProgress.set({ done: 0, total: this.uploadableLayers().length });
    this.uploadService.uploadBatch(
      pid, this.psLayers(),
      (progress) => this.ngZone.run(() => this.batchProgress.set(progress)),
      (index, update) => this.ngZone.run(() => this.psLayers.update(layers => layers.map((l, i) => i === index ? { ...l, ...update } : l))),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        const doneCount = updated.filter(l => l.uploadStatus === 'done').length;
        const errCount = updated.filter(l => l.uploadStatus === 'error').length;
        this.ngZone.run(() => { this.psLayers.set(updated); this.batchUploading.set(false); });
        if (doneCount > 0) {
          this.ngZone.run(() => this.placing.set(true));
          this.uploadService.placePhotosInPs(updated, this.syncWithBorder(), this.activeDoc().path ?? undefined).then(result => {
            this.ngZone.run(() => {
              this.placing.set(false);
              this.batchResult.set({
                success: result.success && errCount === 0,
                message: result.success
                  ? (errCount > 0 ? `${doneCount} behelyezve, ${errCount} hibás` : `${doneCount} fotó behelyezve`)
                  : (result.error || 'Hiba a behelyezés során'),
              });
            });
          });
        } else {
          this.ngZone.run(() => this.batchResult.set({ success: false, message: errCount > 0 ? `${errCount} feltöltés hibás` : 'Nincs feltölthető fotó' }));
        }
      },
      error: () => this.ngZone.run(() => this.batchUploading.set(false)),
    });
  }

  async placeInPs(): Promise<void> {
    this.placing.set(true);
    this.batchResult.set(null);
    const result = await this.uploadService.placePhotosInPs(this.psLayers(), this.syncWithBorder(), this.activeDoc().path ?? undefined);
    this.ngZone.run(() => {
      this.placing.set(false);
      this.batchResult.set({ success: result.success, message: result.success ? 'Fotók behelyezve a Photoshopba' : (result.error || 'Hiba a behelyezés során') });
    });
  }

  // ============ Quick actions ============
  toggleQuickActions(): void { this.quickActionsPanelOpen.update(v => !v); }
  closeQuickActions(): void { this.quickActionsPanelOpen.set(false); }
  toggleQaType(action: 'refresh' | 'position', type: 'names' | 'positions'): void {
    if (action === 'refresh') { if (type === 'names') this.qaRefreshNames.update(v => !v); else this.qaRefreshPositions.update(v => !v); }
    else { if (type === 'names') this.qaPositionNames.update(v => !v); else this.qaPositionPositions.update(v => !v); }
  }
  onQuickAction(action: string, target: string): void { this.qaConfirm.set({ action, target }); }
  async confirmQuickAction(): Promise<void> {
    const c = this.qaConfirm();
    if (!c) return;
    this.qaConfirm.set(null);

    if (c.action === 'link') {
      await this.executeLinkQuickAction(c.target);
    } else {
      console.log('[QuickAction] TODO:', c.action, c.target);
    }
  }
  cancelQuickAction(): void { this.qaConfirm.set(null); }

  // ============ Turbo & UI ============
  toggleTurbo(): void { this.polling.toggleTurbo(); }
  hide(): void { window.electronAPI?.overlay.hide(); }
  showLogin(): void { window.electronAPI?.overlay.showMainWindow(); }
  openActiveDocDir(): void { this.onCommand('ps-open-workdir'); }

  // ============ Teacher link & photo chooser ============
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
    this.teacherService.getLinkedGroupPhotos(person.linkedGroup).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.photoChooserPhotos.set(res.data || []);
        this.photoChooserLinkedGroup.set(person.linkedGroup!);
        this.showPhotoChooserDialog.set(true);
      }),
    });
  }
  onOpenPhotoChooserFromLink(groupId: string): void {
    this.showTeacherLinkDialog.set(false);
    this.teacherService.getLinkedGroupPhotos(groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.photoChooserPhotos.set(res.data || []);
        this.photoChooserLinkedGroup.set(groupId);
        this.showPhotoChooserDialog.set(true);
      }),
    });
  }
  onPhotoChosen(): void { this.showPhotoChooserDialog.set(false); this.reloadPersons(); }

  // ============ Submenu / collapse ============
  onCollapseEnter(): void { this.collapseHover = true; this.clearCollapseTimer(); }
  onCollapseLeave(): void {
    this.collapseHover = false;
    if (this.openSubmenu()) this.resetCollapseTimer(this.openSubmenu());
  }

  // ============ Private helpers ============

  private async executeLinkQuickAction(target: string): Promise<void> {
    // 1. Összes image layer név lekérése PS-ből
    const allNames = await this.ps.getImageLayerNames();
    if (allNames.length === 0) { this.setLinkResult(false, 'Nincsenek image layerek'); return; }

    // 2. Szűrés target alapján
    let layerNames: string[];
    if (target === 'all') {
      layerNames = allNames;
    } else {
      const persons = this.persons();
      const typeFilter = target === 'teachers' ? 'teacher' : 'student';
      const personIds = new Set(persons.filter(p => p.type === typeFilter).map(p => p.id));
      layerNames = allNames.filter(name => {
        const match = name.match(/---(\d+)$/);
        return match && personIds.has(Number(match[1]));
      });
    }
    if (layerNames.length === 0) {
      this.setLinkResult(false, target === 'teachers' ? 'Nincsenek tanár layerek' : 'Nincsenek diák layerek');
      return;
    }

    // 3. JSX hívás — pipe-separated nevek CONFIG.LAYER_NAMES-ben
    const result = await this.ps.runJsx(
      'link-layers',
      'actions/link-selected.jsx',
      { LAYER_NAMES: layerNames.join('|') },
    );
    this.showLinkResult(result, 'link');
  }

  private async runLinkCommand(commandId: string, script: string, type: 'link' | 'unlink'): Promise<void> {
    const result = await this.ps.runJsx(commandId, script);
    this.showLinkResult(result, type);
  }

  private showLinkResult(result: any, type: 'link' | 'unlink'): void {
    if (this.linkResultTimer) { clearTimeout(this.linkResultTimer); this.linkResultTimer = null; }
    // DEBUG: nyers result kiírása
    console.log('[LINK-DEBUG] raw result:', JSON.stringify(result, null, 2));
    try {
      if (!result) { this.setLinkResult(false, `[DBG] result=null/undefined`); return; }
      if (!result.output) { this.setLinkResult(false, `[DBG] no output, success=${result.success}, keys=${Object.keys(result).join(',')}`); return; }
      const cleaned = result.output.trim();
      console.log('[LINK-DEBUG] cleaned output:', cleaned.substring(0, 300));
      if (!cleaned.startsWith('{')) { this.setLinkResult(false, `[DBG] output nem JSON: "${cleaned.substring(0, 80)}"`); return; }
      const data = JSON.parse(cleaned);
      if (data.error) { this.setLinkResult(false, data.error); return; }
      const count = type === 'link' ? data.linked : data.unlinked;
      const verb = type === 'link' ? 'linkelve' : 'szétlinkelve';
      const nameCount = data.names?.length || 0;
      if (count === 0) { this.setLinkResult(false, 'Nem találtam linkelhető layereket'); return; }
      this.setLinkResult(true, `${count} layer ${verb} (${nameCount} név)`);
    } catch (e) { this.setLinkResult(false, `[DBG] parse error: ${(e as Error).message}`); }
  }

  private setLinkResult(success: boolean, message: string): void {
    this.ngZone.run(() => this.linkResult.set({ success, message }));
    this.linkResultTimer = setTimeout(() => this.ngZone.run(() => this.linkResult.set(null)), 3000);
  }

  private closeSubmenu(): void { if (this.openSubmenu()) { this.openSubmenu.set(null); this.clearCollapseTimer(); } }
  private resetCollapseTimer(submenuId: string | null): void {
    this.clearCollapseTimer();
    if (submenuId && !this.collapseHover) {
      this.collapseTimer = setTimeout(() => this.ngZone.run(() => this.closeSubmenu()), 5000);
    }
  }
  private clearCollapseTimer(): void { if (this.collapseTimer) { clearTimeout(this.collapseTimer); this.collapseTimer = null; } }

  private setFile(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) { this.uploadResult.set({ success: false, message: 'Csak képfájlok engedélyezettek (JPG, PNG, WebP, HEIC).' }); return; }
    if (file.size > MAX_FILE_SIZE) { this.uploadResult.set({ success: false, message: 'A fájl túl nagy (max 100 MB).' }); return; }
    this.selectedFile.set(file);
    this.uploadResult.set(null);
  }

  private revokeFilePreview(file: File): void {
    const url = this.filePreviewCache.get(file);
    if (url) { URL.revokeObjectURL(url); this.filePreviewCache.delete(file); }
  }

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
        if (this.isLoggedOut() && ctx.projectId) {
          this.isLoggedOut.set(false);
          this.projectService.loadPersons(ctx.projectId);
        } else if (ctx.projectId && this.uploadPanelOpen()) {
          this.projectService.loadPersons(ctx.projectId);
        }
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
            if (this.uploadPanelOpen()) this.updatePsLayersFromDoc(doc);
          });
          window.electronAPI.overlay.setActiveDoc(doc);
        }
      }
    } catch { /* PS nem elerheto */ }
  }

  private async loadPsLayers(): Promise<void> {
    const doc = this.activeDoc();
    if (doc.selectedLayerNames && doc.selectedLayerNames.length > 0) { this.updatePsLayersFromDoc(doc); return; }
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const freshDoc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => { this.polling.activeDoc.set(freshDoc); this.updatePsLayersFromDoc(freshDoc); });
        }
      }
    } catch { /* PS nem elérhető */ }
  }

  private updatePsLayersFromDoc(doc: ActiveDocInfo): void {
    const names = doc.selectedLayerNames || [];
    const parsed = this.uploadService.parseLayerNames(names);
    if (parsed.length === 0) { this.psLayers.set([]); return; }
    if (this.skipLayerMerge) {
      this.skipLayerMerge = false;
      const persons = this.persons();
      this.psLayers.set(persons.length > 0 ? this.uploadService.enrichWithPersons(parsed, persons) : parsed);
      return;
    }
    const existing = new Map(this.psLayers().map(l => [l.personId, l]));
    const merged = parsed.map(p => {
      const prev = existing.get(p.personId);
      return prev ? { ...p, file: prev.file, uploadStatus: prev.uploadStatus, photoUrl: prev.photoUrl, personName: prev.personName, photoThumbUrl: prev.photoThumbUrl, errorMsg: prev.errorMsg } : p;
    });
    const persons = this.persons();
    this.psLayers.set(persons.length > 0 ? this.uploadService.enrichWithPersons(merged, persons) : merged);
  }

}
