import {
  Component, ChangeDetectionStrategy, input, output, inject,
  OnInit, OnDestroy, ElementRef, viewChild, signal, computed, HostListener,
} from '@angular/core';
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
import { ICONS } from '@shared/constants/icons.constants';
import { DesignerDocument } from './layout-designer.types';

/**
 * Vizualis Tablo Szerkeszto — fullscreen overlay.
 * A snapshot adatai alapjan aranyosan megjeleníti a tablo elrendezeset.
 */
@Component({
  selector: 'app-layout-designer',
  standalone: true,
  imports: [
    LayoutToolbarComponent, LayoutCanvasComponent, LayoutSortPanelComponent,
    LayoutSortCustomDialogComponent, LayoutPhotoUploadDialogComponent,
    LayoutPhotoBulkDialogComponent, LayoutActionsDialogComponent, ExtraNamesDialogComponent,
    LayoutCommandOverlayComponent, LucideAngularModule,
  ],
  providers: [
    LayoutDesignerStateService,
    LayoutDesignerActionsService,
    LayoutDesignerGridService,
    LayoutDesignerDragService,
    LayoutDesignerSwapService,
    LayoutDesignerHistoryService,
    LayoutDesignerSelectionService,
    LayoutDesignerSortService,
    LayoutDesignerPsBridgeService,
    LayoutDesignerSampleService,
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

  /** Command Overlay referencia */
  readonly commandOverlay = viewChild(LayoutCommandOverlayComponent);

  /** Dupla Ctrl detekció */
  private lastCtrlTime = 0;
  private readonly DOUBLE_TAP_THRESHOLD = 400;

  // --- Dialog signals ---
  readonly showCustomDialog = signal(false);
  readonly showPhotoDialog = signal<PhotoUploadPerson | null>(null);
  readonly showBulkPhotoDialog = signal(false);
  readonly showActionsDialog = signal(false);
  readonly showExtraNamesDialog = signal(false);

  /** Bulk dialogus szemelyei */
  readonly bulkDialogPersons = computed<PhotoUploadPerson[]>(() => {
    if (!this.showBulkPhotoDialog()) return [];
    return this.psBridge.getSelectedImagePersons(this.persons());
  });

  /** Az osszes image layer szemely osszegyujtese poziciokkal */
  readonly actionPersons = computed<ActionPersonItem[]>(() => {
    const layers = this.state.layers();
    const result: ActionPersonItem[] = [];
    const seen = new Set<number>();
    for (const l of layers) {
      if ((l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch) {
        if (!seen.has(l.personMatch.id)) {
          seen.add(l.personMatch.id);
          result.push({
            id: l.personMatch.id,
            name: l.personMatch.name,
            type: l.category === 'teacher-image' ? 'teacher' : 'student',
            layerName: l.layerName,
            x: l.editedX ?? l.x,
            y: l.editedY ?? l.y,
          });
        }
      }
    }
    return result;
  });

  /** A canvason kijelolt image layerek szemely ID-i */
  readonly preSelectedActionPersonIds = computed<number[]>(() =>
    this.state.selectedLayers()
      .filter(l => l.category === 'student-image' || l.category === 'teacher-image')
      .filter(l => l.personMatch)
      .map(l => l.personMatch!.id)
  );

  // --- Inputs ---
  readonly snapshotPath = input.required<string>();
  readonly psdPath = input.required<string>();
  readonly persons = input.required<TabloPersonItem[]>();
  readonly boardConfig = input.required<{ widthCm: number; heightCm: number }>();
  readonly projectId = input.required<number>();
  readonly projectName = input.required<string>();
  readonly schoolName = input<string | null>(null);
  readonly className = input<string | null>(null);
  readonly extraNames = input<{ students: string; teachers: string } | null>(null);

  // --- Outputs ---
  readonly closeEvent = output<void>();
  readonly saveEvent = output<{ layers: SnapshotLayer[]; isLivePsd: boolean }>();
  readonly autoSaveEvent = output<{ layers: SnapshotLayer[] }>();
  readonly extraNamesUpdated = output<{ students: string; teachers: string }>();

  // --- Component signals ---
  readonly overlayEl = viewChild.required<ElementRef<HTMLElement>>('overlayEl');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly refreshing = signal(false);
  readonly snapshots = signal<SnapshotListItem[]>([]);
  readonly switchingSnapshot = signal(false);
  readonly relocating = signal(false);
  readonly syncBorder = signal(false);
  readonly sampleLargeSize = this.ps.sampleUseLargeSize;

  private resizeObserver: ResizeObserver | null = null;
  private originalOverflow = '';
  private overlayCommandCleanup: (() => void) | null = null;

  ngOnInit(): void {
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this.ps.psdPath.set(this.psdPath());

    // Service-ek konfiguracioja
    this.psBridge.configure({
      psdPath: this.psdPath(),
      persons: this.persons(),
      projectId: this.projectId(),
      extraNames: this.extraNames(),
      autoSaveEmitter: (layers) => this.autoSaveEvent.emit({ layers }),
      extraNamesUpdatedEmitter: (en) => this.extraNamesUpdated.emit(en),
      showPhotoDialogSetter: (v) => this.showPhotoDialog.set(v),
      showBulkPhotoDialogSetter: (v) => this.showBulkPhotoDialog.set(v),
      refreshFn: () => this.refresh(),
    });

    this.sampleActions.configure({
      projectId: this.projectId(),
      projectName: this.projectName(),
      schoolName: this.schoolName(),
      className: this.className(),
    });

    this.loadSnapshotData();
    this.loadSnapshotList();
    this.setupResize();

    window.electronAPI?.overlay.setContext({ mode: 'designer', projectId: this.projectId() });

    this.overlayCommandCleanup = window.electronAPI?.overlay.onCommand((commandId) => {
      this.onOverlayCommand(commandId);
    }) ?? null;
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.originalOverflow;
    this.resizeObserver?.disconnect();
    window.electronAPI?.overlay.setContext({ mode: 'normal', projectId: this.projectId() });
    this.overlayCommandCleanup?.();
    this.overlayCommandCleanup = null;
  }

  close(): void {
    this.closeEvent.emit();
  }

  save(): void {
    const layers = this.state.exportChanges();
    const isLivePsd = this.state.sourceLabel() === 'Friss PSD beolvasas';
    this.saveEvent.emit({ layers, isLivePsd });
  }

  /** Frissites Photoshopbol: JSX kiolvasas -> state kozvetlen frissites */
  async refresh(): Promise<void> {
    this.refreshing.set(true);
    this.loadError.set(null);

    try {
      const readResult = await this.ps.readFullLayout(this.boardConfig());
      if (!readResult.success || !readResult.data) {
        this.loadError.set(readResult.error || 'Photoshop kiolvasas sikertelen.');
        this.refreshing.set(false);
        return;
      }

      this.state.sourceLabel.set('Friss PSD beolvasas');
      this.state.sourceDate.set(new Date().toISOString());
      this.state.loadSnapshot(
        { document: readResult.data.document, layers: readResult.data.layers },
        this.persons(),
      );

      this.autoSaveEvent.emit({ layers: this.state.exportChanges() });
    } catch {
      this.loadError.set('Varatlan hiba a frissiteskor.');
    }

    this.refreshing.set(false);
  }

  /** Snapshot valtas a picker-bol */
  async switchSnapshot(snapshot: SnapshotListItem): Promise<void> {
    this.switchingSnapshot.set(true);
    try {
      const result = await this.ps.loadSnapshot(snapshot.filePath);
      if (!result.success || !result.data) {
        this.loadError.set(result.error || 'Nem sikerult betolteni a pillanaткepet.');
        return;
      }

      const data = result.data as Record<string, unknown>;
      const doc = data['document'] as DesignerDocument | undefined;
      const layers = (data['layers'] as SnapshotLayer[] | undefined) ?? [];

      if (!doc) {
        this.loadError.set('Ervenytelen pillanatkep formatum.');
        return;
      }

      this.state.sourceLabel.set(snapshot.snapshotName);
      this.state.sourceDate.set(snapshot.createdAt);
      this.state.loadSnapshot({ document: doc, layers }, this.persons());
    } catch {
      this.loadError.set('Varatlan hiba a pillanatkep valtasakor.');
    } finally {
      this.switchingSnapshot.set(false);
    }
  }

  /** Foto dialogus megnyitasa — 1 elem: single, 2+: bulk */
  openPhotoDialog(): void {
    const imagePersons = this.psBridge.getSelectedImagePersons(this.persons());
    if (imagePersons.length === 0) return;

    if (imagePersons.length === 1) {
      this.showPhotoDialog.set(imagePersons[0]);
    } else {
      this.showBulkPhotoDialog.set(true);
    }
  }

  /** Akciok dialogus sikeres vegrehajtas -> PSD ujraolvasas */
  async onActionsExecuted(): Promise<void> {
    this.showActionsDialog.set(false);
    await this.refresh();
  }

  /** Elrendezes szinkronizalasa a Photoshopba — editor-beli poziciok atkuldes */
  async relocateToPhotoshop(): Promise<void> {
    const allLayers = this.state.layers();
    const selectedIds = this.state.selectedLayerIds();

    const isImage = (l: { category: string }) =>
      l.category === 'student-image' || l.category === 'teacher-image';

    let layersToSync: typeof allLayers;
    if (selectedIds.size > 0) {
      layersToSync = allLayers.filter(l => selectedIds.has(l.layerId) && isImage(l));
    } else {
      layersToSync = allLayers.filter(l => isImage(l) && (l.editedX !== null || l.editedY !== null));
    }

    if (layersToSync.length === 0) return;

    this.relocating.set(true);
    try {
      await this.ps.relocateLayers(
        layersToSync.map(l => ({
          layerId: l.layerId,
          layerName: l.layerName,
          groupPath: l.groupPath,
          x: l.editedX ?? l.x,
          y: l.editedY ?? l.y,
          width: l.width,
          height: l.height,
          kind: l.kind,
        })),
        undefined,
        this.psBridge.getLinkedLayerNames(),
      );
    } finally {
      this.relocating.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Control' && !event.metaKey && !event.shiftKey && !event.altKey) {
      const now = Date.now();
      if (now - this.lastCtrlTime < this.DOUBLE_TAP_THRESHOLD) {
        this.commandOverlay()?.toggle();
        this.lastCtrlTime = 0;
      } else {
        this.lastCtrlTime = now;
      }
      return;
    }

    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (event.key === 'Escape') {
      if (this.commandOverlay()?.visible()) {
        this.commandOverlay()?.close();
        return;
      }
      if (this.showPhotoDialog() || this.showBulkPhotoDialog() || this.showCustomDialog() || this.showActionsDialog() || this.showExtraNamesDialog()) return;
      this.close();
      return;
    }

    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod) return;

    if (event.key === 'a') {
      event.preventDefault();
      this.state.selectAll();
    } else if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.state.undo();
    } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
      event.preventDefault();
      this.state.redo();
    }
  }

  /** Command Overlay parancs vegrehajtasa */
  onOverlayCommand(commandId: string): void {
    this.commandOverlay()?.close();
    switch (commandId) {
      case 'relocate-layout': this.relocateToPhotoshop(); break;
      case 'sync-photos': this.psBridge.syncAllPhotos(this.syncBorder()); break;
      case 'arrange-names': this.psBridge.arrangeNames(); break;
      case 'update-positions': this.psBridge.updatePositions(); break;
      case 'open-project': this.psBridge.onOpenProject(); break;
      case 'open-workdir': this.psBridge.onOpenWorkDir(); break;
      case 'refresh': this.refresh(); break;
      case 'sort-abc': this.sortService.sortByAbc(); break;
      case 'sort-gender': this.sortService.sortByGender(); break;
      case 'sort-custom': this.showCustomDialog.set(true); break;
      case 'generate-sample': this.sampleActions.onGenerateSample(); break;
      case 'generate-final': this.sampleActions.onGenerateFinal(); break;
      case 'upload-photo': this.openPhotoDialog(); break;
      case 'link-layers': this.psBridge.onLinkLayers(); break;
      case 'unlink-layers': this.psBridge.onUnlinkLayers(); break;
      case 'extra-names': this.showExtraNamesDialog.set(true); break;
      case 'toggle-grid': this.gridService.cycleGridMode(); break;
      case 'snap-grid': this.gridService.snapAllToGrid(); break;
      case 'save': this.save(); break;
      case 'batch-actions': this.showActionsDialog.set(true); break;
      case 'bulk-photos': this.showBulkPhotoDialog.set(true); break;
      case 'align-left': this.actionsService.alignLeft(); break;
      case 'align-center-h': this.actionsService.alignCenterHorizontal(); break;
      case 'align-right': this.actionsService.alignRight(); break;
      case 'align-top': this.actionsService.alignTop(); break;
      case 'align-center-v': this.actionsService.alignCenterVertical(); break;
      case 'align-bottom': this.actionsService.alignBottom(); break;
      case 'distribute-h': this.actionsService.distributeHorizontal(); break;
      case 'distribute-v': this.actionsService.distributeVertical(); break;
      case 'center-document': this.actionsService.centerOnDocument(); break;
      case 'arrange-grid': this.actionsService.arrangeToGrid(); break;
      case 'sync-border-on': this.syncBorder.set(true); break;
      case 'sync-border-off': this.syncBorder.set(false); break;
    }
  }

  // --- Privat segédek ---

  private async loadSnapshotList(): Promise<void> {
    const list = await this.ps.listSnapshots(this.psdPath());
    this.snapshots.set(list);
  }

  private async loadSnapshotData(): Promise<void> {
    try {
      const result = await this.ps.loadSnapshot(this.snapshotPath());
      if (!result.success || !result.data) {
        this.loadError.set(result.error || 'Nem sikerult betolteni a pillanaткepet.');
        this.loading.set(false);
        return;
      }

      const data = result.data as Record<string, unknown>;
      const doc = data['document'] as DesignerDocument | undefined;
      const layers = (data['layers'] as SnapshotLayer[] | undefined) ?? [];

      if (!doc) {
        this.loadError.set('Ervenytelen pillanatkep formatum (hianyzo document mezo).');
        this.loading.set(false);
        return;
      }

      const snapshotName = data['snapshotName'] as string | undefined;
      const createdAt = data['createdAt'] as string | undefined;
      this.state.sourceLabel.set(snapshotName || 'Pillanatkep');
      this.state.sourceDate.set(createdAt || null);
      this.state.loadSnapshot({ document: doc, layers }, this.persons());
      this.loading.set(false);
    } catch {
      this.loadError.set('Varatlan hiba a pillanatkep betoltesekor.');
      this.loading.set(false);
    }
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.state.containerWidth.set(width);
        this.state.containerHeight.set(height);
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
