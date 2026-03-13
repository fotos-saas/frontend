import {
  Component, ChangeDetectionStrategy, ViewEncapsulation, signal, computed,
  OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
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
import { OverlayDragOrderService } from './overlay-drag-order.service';
import { OverlayDragGroupsService } from './overlay-drag-groups.service';
import { OverlayEffectsService } from './overlay-effects.service';
import { OverlayEmailService } from './overlay-email.service';
import { OverlayUploadPanelComponent } from './components/overlay-upload-panel/overlay-upload-panel.component';
import { OverlayEmailPanelComponent } from './components/overlay-email-panel/overlay-email-panel.component';
import { OverlayRenamePanelComponent } from './components/overlay-rename-panel/overlay-rename-panel.component';
import { OverlayRefreshRosterPanelComponent } from './components/overlay-refresh-roster-panel/overlay-refresh-roster-panel.component';
import { OverlayDragOrderPanelComponent } from './components/overlay-drag-order-panel/overlay-drag-order-panel.component';
import { OverlayQaPanelsComponent } from './components/overlay-qa-panels/overlay-qa-panels.component';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, TeacherLinkDialogComponent, TeacherPhotoChooserDialogComponent, OverlayUploadPanelComponent, OverlayEmailPanelComponent, OverlayRenamePanelComponent, OverlayRefreshRosterPanelComponent, OverlayDragOrderPanelComponent, OverlayQaPanelsComponent],
  providers: [
    OverlayUploadService, OverlayProjectService, OverlayPhotoshopService,
    OverlayPollingService, OverlaySettingsService, OverlaySortService,
    OverlaySyncService, OverlayLayerManagementService, OverlayGenerateService,
    OverlayQuickActionsService, OverlayDragOrderService, OverlayDragGroupsService,
    OverlayEffectsService, OverlayUploadPanelService, OverlayEmailService,
  ],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  encapsulation: ViewEncapsulation.None,
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
  readonly refreshRosterDialogOpen = this.layerMgmt.refreshRosterDialogOpen;

  readonly dragOrderPanelOpen = this.dragOrder.panelOpen;
  readonly dragOrderSaving = this.dragOrder.saving;
  readonly linkResult = this.qa.result;

  readonly showTeacherLinkDialog = signal(false);
  readonly showPhotoChooserDialog = signal(false);
  readonly linkDialogTeacher = signal<TeacherListItem | null>(null);
  readonly linkDialogAllTeachers = signal<TeacherListItem[]>([]);
  readonly photoChooserPhotos = signal<LinkedGroupPhoto[]>([]);
  readonly photoChooserMode = signal<PhotoChooserMode | null>(null);

  readonly uploadPanelOpen = this.uploadPanel.panelOpen;

  readonly emailPanelOpen = this.emailService.panelOpen;
  readonly generating = this.generateService.generating;
  readonly generateResult = this.generateService.generateResult;
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
    // Auth szinkron kérése a main window-ból MIELŐTT bármilyen API hívás indul
    this.requestAuthSyncThenInit();
    this.listenContextChanges();
    this.projectService.listenAuthSync(this.destroyRef, this.ngZone, () => this.context());
    this.loadActiveDoc();
    this.listenActiveDocChanges();
    this.polling.startPolling(this.destroyRef, () => this.pollActiveDoc());
    this.setupClickThrough();
    this.polling.listenVisibility(this.destroyRef);
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

  closeRenameDialog(): void { this.layerMgmt.closeRenameDialog(); }
  closeRefreshRosterDialog(): void { this.layerMgmt.closeRefreshRosterDialog(); }

  toggleUploadPanel(): void {
    if (this.uploadPanelOpen()) { this.uploadPanel.closePanel(); } else { this.closeSubmenu(); this.uploadPanel.openPanel(); }
  }
  closeUploadPanel(): void { this.uploadPanel.closePanel(); }
  toggleQuickActions(): void { this.qa.togglePanel(); }
  closeQuickActions(): void { this.qa.closePanel(); }
  toggleSpecPanel(): void { this.qa.toggleSpecPanel(); }
  toggleGridPanel(): void { this.qa.toggleGridPanel(); }

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

  /** Auth tokenek szinkronizálása a main window-ból, AZTÁN context + persons betöltése */
  private async requestAuthSyncThenInit(): Promise<void> {
    if (window.electronAPI) {
      try {
        await window.electronAPI.overlay.requestAuthSync();
      } catch { /* main window may not be ready yet — periodic sync will catch up */ }
    }
    await this.loadContext();
    const pid = this.context().projectId || this.projectService.getLastProjectId();
    this.settings.loadSettings(pid);
    this.settings.syncWithBorder.set(this.settings.loadSyncBorderForProject(this.context().projectId));
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
