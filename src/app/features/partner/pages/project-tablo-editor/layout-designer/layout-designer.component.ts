import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy, ElementRef, viewChild, signal, computed, HostListener } from '@angular/core';
import { SnapshotLayer, SnapshotListItem } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { PhotoshopService } from '../../../services/photoshop.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerActionsService } from './layout-designer-actions.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerDragService } from './layout-designer-drag.service';
import { LayoutDesignerSwapService } from './layout-designer-swap.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';
import { LayoutDesignerSortService } from './layout-designer-sort.service';
import { LayoutDesignerPsBridgeService } from './layout-designer-ps-bridge.service';
import { LayoutDesignerSampleService } from './layout-designer-sample.service';
import { LayoutToolbarComponent } from './components/layout-toolbar/layout-toolbar.component';
import { LayoutCanvasComponent } from './components/layout-canvas/layout-canvas.component';
import { LayoutSortPanelComponent } from './components/layout-sort-panel/layout-sort-panel.component';
import { LayoutSortCustomDialogComponent } from './components/layout-sort-custom-dialog/layout-sort-custom-dialog.component';
import { LayoutPhotoUploadDialogComponent, PhotoUploadPerson } from './components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';
import { LayoutPhotoBulkDialogComponent } from './components/layout-photo-bulk-dialog/layout-photo-bulk-dialog.component';
import { LayoutActionsDialogComponent } from './components/layout-actions-dialog/layout-actions-dialog.component';
import { ExtraNamesDialogComponent } from './components/extra-names-dialog/extra-names-dialog.component';
import { LayoutCommandOverlayComponent } from './components/layout-command-overlay/layout-command-overlay.component';
import { ActionPersonItem } from './components/layout-actions-dialog/layout-actions.types';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { parseSnapshotData, extractImagePersons } from './layout-designer.utils';

/**
 * Vizuális Tábló Szerkesztő — fullscreen overlay.
 * A snapshot adatai alapján arányosan megjeleníti a tábló elrendezését.
 */
@Component({
  selector: 'app-layout-designer',
  standalone: true,
  imports: [
    LayoutToolbarComponent, LayoutCanvasComponent, LayoutSortPanelComponent,
    LayoutSortCustomDialogComponent, LayoutPhotoUploadDialogComponent,
    LayoutPhotoBulkDialogComponent, LayoutActionsDialogComponent, ExtraNamesDialogComponent,
    LayoutCommandOverlayComponent, LucideAngularModule, MatTooltipModule,
  ],
  providers: [
    LayoutDesignerStateService, LayoutDesignerActionsService,
    LayoutDesignerGridService, LayoutDesignerDragService,
    LayoutDesignerSwapService, LayoutDesignerHistoryService,
    LayoutDesignerSelectionService, LayoutDesignerSortService,
    LayoutDesignerPsBridgeService, LayoutDesignerSampleService,
  ],
  templateUrl: './layout-designer.component.html',
  styleUrl: './layout-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDesignerComponent implements OnInit, OnDestroy {
  private readonly state = inject(LayoutDesignerStateService);
  protected readonly ps = inject(PhotoshopService);
  private readonly sortService = inject(LayoutDesignerSortService);
  private readonly gridService = inject(LayoutDesignerGridService);
  private readonly actionsService = inject(LayoutDesignerActionsService);
  protected readonly psBridge = inject(LayoutDesignerPsBridgeService);
  protected readonly sampleActions = inject(LayoutDesignerSampleService);
  protected readonly ICONS = ICONS;

  readonly commandOverlay = viewChild(LayoutCommandOverlayComponent);
  private lastCtrlTime = 0;
  private readonly DOUBLE_TAP_THRESHOLD = 400;

  readonly showCustomDialog = signal(false);
  readonly showPhotoDialog = signal<PhotoUploadPerson | null>(null);
  readonly showBulkPhotoDialog = signal(false);
  readonly showActionsDialog = signal(false);
  readonly showExtraNamesDialog = signal(false);
  readonly bulkDialogPersons = computed<PhotoUploadPerson[]>(() =>
    this.showBulkPhotoDialog() ? extractImagePersons(this.state.selectedLayers(), this.persons()) : [],
  );
  readonly actionPersons = computed<ActionPersonItem[]>(() => {
    const result: ActionPersonItem[] = [];
    const seen = new Set<number>();
    for (const l of this.state.layers()) {
      if ((l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch && !seen.has(l.personMatch.id)) {
        seen.add(l.personMatch.id);
        result.push({ id: l.personMatch.id, name: l.personMatch.name, type: l.category === 'teacher-image' ? 'teacher' : 'student', layerName: l.layerName, x: l.editedX ?? l.x, y: l.editedY ?? l.y });
      }
    }
    return result;
  });
  readonly preSelectedActionPersonIds = computed<number[]>(() =>
    this.state.selectedLayers()
      .filter(l => (l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch)
      .map(l => l.personMatch!.id)
  );

  readonly snapshotPath = input.required<string>();
  readonly psdPath = input.required<string>();
  readonly persons = input.required<TabloPersonItem[]>();
  readonly boardConfig = input.required<{ widthCm: number; heightCm: number }>();
  readonly projectId = input.required<number>();
  readonly projectName = input.required<string>();
  readonly schoolName = input<string | null>(null);
  readonly className = input<string | null>(null);
  readonly extraNames = input<{ students: string; teachers: string } | null>(null);
  readonly closeEvent = output<void>();
  readonly saveEvent = output<{ layers: SnapshotLayer[]; isLivePsd: boolean }>();
  readonly autoSaveEvent = output<{ layers: SnapshotLayer[] }>();
  readonly extraNamesUpdated = output<{ students: string; teachers: string }>();
  readonly overlayEl = viewChild.required<ElementRef<HTMLElement>>('overlayEl');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly refreshing = signal(false);
  readonly snapshots = signal<SnapshotListItem[]>([]);
  readonly switchingSnapshot = signal(false);
  readonly sampleLargeSize = this.ps.sampleUseLargeSize;
  private resizeObserver: ResizeObserver | null = null;
  private originalOverflow = '';
  private overlayCommandCleanup: (() => void) | null = null;

  ngOnInit(): void {
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.ps.psdPath.set(this.psdPath());
    this.psBridge.configure({
      psdPath: this.psdPath(), persons: this.persons(), projectId: this.projectId(),
      extraNames: this.extraNames(),
      autoSaveEmitter: (layers) => this.autoSaveEvent.emit({ layers }),
      extraNamesUpdatedEmitter: (en) => this.extraNamesUpdated.emit(en),
      showPhotoDialogSetter: (v) => this.showPhotoDialog.set(v),
      showBulkPhotoDialogSetter: (v) => this.showBulkPhotoDialog.set(v),
      refreshFn: () => this.refresh(),
    });
    this.sampleActions.configure({
      projectId: this.projectId(), projectName: this.projectName(),
      schoolName: this.schoolName(), className: this.className(),
    });
    this.loadSnapshotData();
    this.loadSnapshotList();
    this.setupResize();
    window.electronAPI?.overlay.setContext({ mode: 'designer', projectId: this.projectId() });
    this.overlayCommandCleanup = window.electronAPI?.overlay.onCommand((cmd) => this.onOverlayCommand(cmd)) ?? null;
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.originalOverflow;
    this.resizeObserver?.disconnect();
    window.electronAPI?.overlay.setContext({ mode: 'normal', projectId: this.projectId() });
    this.overlayCommandCleanup?.();
    this.overlayCommandCleanup = null;
  }

  close(): void { this.closeEvent.emit(); }
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Control' && !event.metaKey && !event.shiftKey && !event.altKey) {
      const now = Date.now();
      if (now - this.lastCtrlTime < this.DOUBLE_TAP_THRESHOLD) {
        this.commandOverlay()?.toggle();
        this.lastCtrlTime = 0;
      } else { this.lastCtrlTime = now; }
      return;
    }

    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (event.key === 'Escape') {
      if (this.commandOverlay()?.visible()) { this.commandOverlay()?.close(); return; }
      if (this.showPhotoDialog() || this.showBulkPhotoDialog() || this.showCustomDialog() || this.showActionsDialog() || this.showExtraNamesDialog()) return;
      this.close();
      return;
    }

    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod) return;
    if (event.key === 'a') { event.preventDefault(); this.state.selectAll(); }
    else if (event.key === 'z' && !event.shiftKey) { event.preventDefault(); this.state.undo(); }
    else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') { event.preventDefault(); this.state.redo(); }
  }

  onOverlayCommand(commandId: string): void {
    this.commandOverlay()?.close();
    const commands: Record<string, () => void> = {
      'sync-photos': () => this.psBridge.syncAllPhotos(),
      'arrange-names': () => this.psBridge.arrangeNames(),
      'update-positions': () => this.psBridge.updatePositions(),
      'open-project': () => this.psBridge.onOpenProject(),
      'open-workdir': () => this.psBridge.onOpenWorkDir(),
      'refresh': () => this.refresh(),
      'sort-abc': () => this.sortService.sortByAbc(),
      'sort-gender': () => this.sortService.sortByGender(),
      'sort-custom': () => this.showCustomDialog.set(true),
      'generate-sample': () => this.sampleActions.onGenerateSample(),
      'generate-final': () => this.sampleActions.onGenerateFinal(),
      'upload-photo': () => this.openPhotoDialog(),
      'link-layers': () => this.psBridge.onLinkLayers(),
      'unlink-layers': () => this.psBridge.onUnlinkLayers(),
      'extra-names': () => this.showExtraNamesDialog.set(true),
      'toggle-grid': () => this.gridService.cycleGridMode(),
      'snap-grid': () => this.gridService.snapAllToGrid(),
      'save': () => this.save(),
      'batch-actions': () => this.showActionsDialog.set(true),
      'bulk-photos': () => this.showBulkPhotoDialog.set(true),
      'align-left': () => this.actionsService.alignLeft(),
      'align-center-h': () => this.actionsService.alignCenterHorizontal(),
      'align-right': () => this.actionsService.alignRight(),
      'align-top': () => this.actionsService.alignTop(),
      'align-center-v': () => this.actionsService.alignCenterVertical(),
      'align-bottom': () => this.actionsService.alignBottom(),
      'distribute-h': () => this.actionsService.distributeHorizontal(),
      'distribute-v': () => this.actionsService.distributeVertical(),
      'center-document': () => this.actionsService.centerOnDocument(),
      'arrange-grid': () => this.actionsService.arrangeToGrid(),
    };
    commands[commandId]?.();
  }

  save(): void {
    const layers = this.state.exportChanges();
    const isLivePsd = this.state.sourceLabel() === 'Friss PSD beolvasás';
    this.saveEvent.emit({ layers, isLivePsd });
  }

  async refresh(): Promise<void> {
    this.refreshing.set(true);
    this.loadError.set(null);
    try {
      const readResult = await this.ps.readFullLayout(this.boardConfig());
      if (!readResult.success || !readResult.data) {
        this.loadError.set(readResult.error || 'Photoshop kiolvasás sikertelen.');
        this.refreshing.set(false);
        return;
      }
      this.state.sourceLabel.set('Friss PSD beolvasás');
      this.state.sourceDate.set(new Date().toISOString());
      this.state.loadSnapshot(
        { document: readResult.data.document, layers: readResult.data.layers },
        this.persons(),
      );
      this.autoSaveEvent.emit({ layers: this.state.exportChanges() });
    } catch { this.loadError.set('Váratlan hiba a frissítéskor.'); }
    this.refreshing.set(false);
  }

  async switchSnapshot(snapshot: SnapshotListItem): Promise<void> {
    this.switchingSnapshot.set(true);
    try {
      const result = await this.ps.loadSnapshot(snapshot.filePath);
      if (!result.success || !result.data) { this.loadError.set(result.error || 'Nem sikerült betölteni a pillanatképet.'); return; }
      const parsed = parseSnapshotData(result.data as Record<string, unknown>);
      if (!parsed) { this.loadError.set('Érvénytelen pillanatkép formátum.'); return; }
      this.state.sourceLabel.set(snapshot.snapshotName);
      this.state.sourceDate.set(snapshot.createdAt);
      this.state.loadSnapshot(parsed, this.persons());
    } catch { this.loadError.set('Váratlan hiba a pillanatkép váltásakor.'); }
    finally { this.switchingSnapshot.set(false); }
  }

  openPhotoDialog(): void {
    const imagePersons = extractImagePersons(this.state.selectedLayers(), this.persons());
    if (imagePersons.length === 0) return;
    if (imagePersons.length === 1) this.showPhotoDialog.set(imagePersons[0]);
    else this.showBulkPhotoDialog.set(true);
  }

  async onActionsExecuted(): Promise<void> {
    this.showActionsDialog.set(false);
    await this.refresh();
  }

  private async loadSnapshotList(): Promise<void> {
    const list = await this.ps.listSnapshots(this.psdPath());
    this.snapshots.set(list);
  }

  private async loadSnapshotData(): Promise<void> {
    try {
      const result = await this.ps.loadSnapshot(this.snapshotPath());
      if (!result.success || !result.data) { this.loadError.set(result.error || 'Nem sikerült betölteni a pillanatképet.'); this.loading.set(false); return; }
      const data = result.data as Record<string, unknown>;
      const parsed = parseSnapshotData(data);
      if (!parsed) { this.loadError.set('Érvénytelen pillanatkép formátum (hiányzó document mező).'); this.loading.set(false); return; }
      this.state.sourceLabel.set(data['snapshotName'] as string || 'Pillanatkép');
      this.state.sourceDate.set(data['createdAt'] as string || null);
      this.state.loadSnapshot(parsed, this.persons());
      this.loading.set(false);
    } catch { this.loadError.set('Váratlan hiba a pillanatkép betöltésekor.'); this.loading.set(false); }
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.state.containerWidth.set(entry.contentRect.width);
        this.state.containerHeight.set(entry.contentRect.height);
      }
    });
    requestAnimationFrame(() => {
      const el = this.overlayEl().nativeElement;
      this.resizeObserver!.observe(el);
      this.state.containerWidth.set(el.clientWidth);
      this.state.containerHeight.set(el.clientHeight);
    });
  }
}
