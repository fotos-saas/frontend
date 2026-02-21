import {
  Component, ChangeDetectionStrategy, input, output, inject,
  OnInit, OnDestroy, ElementRef, viewChild, signal, computed, HostListener,
} from '@angular/core';
import { SnapshotLayer, SnapshotListItem } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { PhotoshopService } from '../../../services/photoshop.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerActionsService } from './layout-designer-actions.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerDragService } from './layout-designer-drag.service';
import { LayoutDesignerSwapService } from './layout-designer-swap.service';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSortService } from './layout-designer-sort.service';
import { LayoutToolbarComponent } from './components/layout-toolbar/layout-toolbar.component';
import { LayoutCanvasComponent } from './components/layout-canvas/layout-canvas.component';
import { LayoutSortPanelComponent } from './components/layout-sort-panel/layout-sort-panel.component';
import { LayoutSortCustomDialogComponent } from './components/layout-sort-custom-dialog/layout-sort-custom-dialog.component';
import { LayoutPhotoUploadDialogComponent, PhotoUploadPerson, PhotoUploadResult } from './components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';
import { LayoutPhotoBulkDialogComponent } from './components/layout-photo-bulk-dialog/layout-photo-bulk-dialog.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DesignerDocument } from './layout-designer.types';
import { firstValueFrom } from 'rxjs';

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
    LayoutPhotoBulkDialogComponent, LucideAngularModule,
  ],
  providers: [
    LayoutDesignerStateService,
    LayoutDesignerActionsService,
    LayoutDesignerGridService,
    LayoutDesignerDragService,
    LayoutDesignerSwapService,
    LayoutDesignerHistoryService,
    LayoutDesignerSortService,
  ],
  template: `
    <div
      class="layout-designer-overlay"
      #overlayEl
    >
      @if (loading()) {
        <div class="layout-designer__loading">
          <lucide-icon [name]="ICONS.LOADER" [size]="32" class="spin" />
          <span>Pillanatkép betöltése...</span>
        </div>
      } @else if (loadError()) {
        <div class="layout-designer__error">
          <lucide-icon [name]="ICONS.X_CIRCLE" [size]="32" />
          <span>{{ loadError() }}</span>
          <button class="designer-btn" (click)="close()">Bezárás</button>
        </div>
      } @else {
        <app-layout-toolbar
          [refreshing]="refreshing()"
          [snapshots]="snapshots()"
          [switchingSnapshot]="switchingSnapshot()"
          (refreshClicked)="refresh()"
          (snapshotSelected)="switchSnapshot($event)"
          (saveClicked)="save()"
          (closeClicked)="close()"
        />
        <div class="layout-designer__content">
          <app-layout-sort-panel (openCustomDialog)="showCustomDialog.set(true)" />
          <div class="layout-designer__canvas-area" #canvasArea>
            <app-layout-canvas
              [linking]="linking()"
              (uploadPhotoClicked)="openPhotoDialog()"
              (linkLayersClicked)="onLinkLayers()"
              (unlinkLayersClicked)="onUnlinkLayers()"
            />
          </div>
        </div>
        @if (showCustomDialog()) {
          <app-layout-sort-custom-dialog (close)="showCustomDialog.set(false)" />
        }
        @if (showPhotoDialog(); as dialogPerson) {
          <app-layout-photo-upload-dialog
            [person]="dialogPerson"
            [projectId]="projectId()"
            (close)="showPhotoDialog.set(null)"
            (photoUploaded)="onPhotoUploaded($event)"
          />
        }
        @if (showBulkPhotoDialog()) {
          <app-layout-photo-bulk-dialog
            [persons]="bulkDialogPersons()"
            [projectId]="projectId()"
            (close)="showBulkPhotoDialog.set(false)"
            (photosAssigned)="onBulkPhotosAssigned($event)"
          />
        }
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .layout-designer-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      -webkit-app-region: no-drag;
      /* Electron frameless: ne lógjon a macOS traffic lights alá */
      padding-top: 38px;
    }

    .layout-designer__loading,
    .layout-designer__error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }

    .layout-designer__error {
      color: #fca5a5;
    }

    .layout-designer__content {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
    }

    .layout-designer__canvas-area {
      flex: 1;
      min-width: 0;
      position: relative;
      overflow: hidden;
    }

    .layout-designer__canvas-area app-layout-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .designer-btn {
      margin-top: 8px;
      padding: 8px 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDesignerComponent implements OnInit, OnDestroy {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly ps = inject(PhotoshopService);
  private readonly projectService = inject(PartnerProjectService);
  protected readonly ICONS = ICONS;
  readonly showCustomDialog = signal(false);

  /** Single person dialógus: a kijelölt személy adatai, vagy null ha nem látszik */
  readonly showPhotoDialog = signal<PhotoUploadPerson | null>(null);

  /** Bulk dialógus megjelenítése */
  readonly showBulkPhotoDialog = signal(false);

  /** Bulk dialógus személyei */
  readonly bulkDialogPersons = computed<PhotoUploadPerson[]>(() => {
    if (!this.showBulkPhotoDialog()) return [];
    return this.getSelectedImagePersons();
  });

  /** Betöltendő snapshot fájl útvonala */
  readonly snapshotPath = input.required<string>();

  /** PSD fájl útvonala (frissítéshez szükséges) */
  readonly psdPath = input.required<string>();

  /** Projekt személyei */
  readonly persons = input.required<TabloPersonItem[]>();

  /** Tábló méret konfiguráció */
  readonly boardConfig = input.required<{ widthCm: number; heightCm: number }>();

  /** Projekt azonosító (fotó feltöltéshez) */
  readonly projectId = input.required<number>();

  /** Bezárás event */
  readonly closeEvent = output<void>();

  /** Mentés event — módosított layerek + forrás információ */
  readonly saveEvent = output<{ layers: SnapshotLayer[]; isLivePsd: boolean }>();

  readonly overlayEl = viewChild.required<ElementRef<HTMLElement>>('overlayEl');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly refreshing = signal(false);

  /** Elérhető snapshotok a picker-hez */
  readonly snapshots = signal<SnapshotListItem[]>([]);
  readonly switchingSnapshot = signal(false);
  readonly linking = signal(false);
  readonly placingPhotos = signal(false);

  private resizeObserver: ResizeObserver | null = null;
  private originalOverflow = '';

  ngOnInit(): void {
    // Body scroll lock
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this.loadSnapshotData();
    this.loadSnapshotList();
    this.setupResize();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.originalOverflow;
    this.resizeObserver?.disconnect();
  }

  close(): void {
    this.closeEvent.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Textarea/input-ban ne kapjuk el (pl. egyedi sorrend dialógus)
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (event.key === 'Escape') {
      // Ha dialógus nyitva, az ESC azt zárja be (DialogWrapper kezeli)
      if (this.showPhotoDialog() || this.showBulkPhotoDialog() || this.showCustomDialog()) return;
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

  save(): void {
    const layers = this.state.exportChanges();
    const isLivePsd = this.state.sourceLabel() === 'Friss PSD beolvasás';
    this.saveEvent.emit({ layers, isLivePsd });
  }

  /** Frissítés Photoshopból: PSD megnyitás → JSX kiolvasás → state közvetlen frissítés */
  async refresh(): Promise<void> {
    this.refreshing.set(true);
    this.loadError.set(null);

    try {
      // 1. PSD megnyitása Photoshopban (ha nincs nyitva)
      const openResult = await this.ps.openPsdFile(this.psdPath());
      if (!openResult.success) {
        this.loadError.set(openResult.error || 'PSD megnyitás sikertelen.');
        this.refreshing.set(false);
        return;
      }

      // 2. Várakozás hogy a Photoshop teljesen betöltse a dokumentumot
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Layout kiolvasás JSX-szel (mentés nélkül)
      const readResult = await this.ps.readFullLayout(this.boardConfig());

      if (!readResult.success || !readResult.data) {
        this.loadError.set(readResult.error || 'Photoshop kiolvasás sikertelen.');
        this.refreshing.set(false);
        return;
      }

      // 4. State közvetlen frissítés a friss adatokkal
      this.state.sourceLabel.set('Friss PSD beolvasás');
      this.state.sourceDate.set(new Date().toISOString());
      this.state.loadSnapshot(
        { document: readResult.data.document, layers: readResult.data.layers },
        this.persons(),
      );
    } catch {
      this.loadError.set('Váratlan hiba a frissítéskor.');
    }

    this.refreshing.set(false);
  }

  /** Snapshot váltás a picker-ből */
  async switchSnapshot(snapshot: SnapshotListItem): Promise<void> {
    this.switchingSnapshot.set(true);
    try {
      const result = await this.ps.loadSnapshot(snapshot.filePath);
      if (!result.success || !result.data) {
        this.loadError.set(result.error || 'Nem sikerült betölteni a pillanatképet.');
        return;
      }

      const data = result.data as Record<string, unknown>;
      const doc = data['document'] as DesignerDocument | undefined;
      const layers = (data['layers'] as SnapshotLayer[] | undefined) ?? [];

      if (!doc) {
        this.loadError.set('Érvénytelen pillanatkép formátum.');
        return;
      }

      this.state.sourceLabel.set(snapshot.snapshotName);
      this.state.sourceDate.set(snapshot.createdAt);
      this.state.loadSnapshot({ document: doc, layers }, this.persons());
    } catch {
      this.loadError.set('Váratlan hiba a pillanatkép váltásakor.');
    } finally {
      this.switchingSnapshot.set(false);
    }
  }

  /** Fotó dialógus megnyitása — 1 elem: single, 2+: bulk */
  openPhotoDialog(): void {
    const imagePersons = this.getSelectedImagePersons();
    if (imagePersons.length === 0) return;

    if (imagePersons.length === 1) {
      this.showPhotoDialog.set(imagePersons[0]);
    } else {
      this.showBulkPhotoDialog.set(true);
    }
  }

  /** Single fotó feltöltés sikeres */
  onPhotoUploaded(result: PhotoUploadResult): void {
    this.showPhotoDialog.set(null);
    this.refreshPersonsInState();
  }

  /** Bulk fotó feltöltés sikeres */
  onBulkPhotosAssigned(_result: { assignedCount: number }): void {
    this.showBulkPhotoDialog.set(false);
    this.refreshPersonsInState();
  }

  /** Floating toolbar-ról: link gomb */
  onLinkLayers(): void {
    const names = this.getSelectedLayerNames();
    if (names.length === 0) return;
    this.linkLayers(names);
  }

  /** Floating toolbar-ról: unlink gomb */
  onUnlinkLayers(): void {
    const names = this.getSelectedLayerNames();
    if (names.length === 0) return;
    this.unlinkLayers(names);
  }

  /** Fotók behelyezése a kijelölt Smart Object layerekbe */
  async placePhotos(layers: Array<{ layerName: string; photoUrl: string }>): Promise<void> {
    this.placingPhotos.set(true);
    try {
      await this.ps.placePhotos(layers);
    } finally {
      this.placingPhotos.set(false);
    }
  }

  /** Kijelölt layerek összelinkelése a Photoshopban */
  async linkLayers(layerNames: string[]): Promise<void> {
    this.linking.set(true);
    try {
      const result = await this.ps.linkLayers(layerNames);
      if (result.success) {
        // State frissítés: az érintett layerek linked = true
        this.updateLinkedState(layerNames, true);
      }
    } finally {
      this.linking.set(false);
    }
  }

  /** Kijelölt layerek linkelésének megszüntetése a Photoshopban */
  async unlinkLayers(layerNames: string[]): Promise<void> {
    this.linking.set(true);
    try {
      const result = await this.ps.unlinkLayers(layerNames);
      if (result.success) {
        // State frissítés: az érintett layerek linked = false
        this.updateLinkedState(layerNames, false);
      }
    } finally {
      this.linking.set(false);
    }
  }

  /** State linked flag frissítése adott layerName-ekre */
  private updateLinkedState(layerNames: string[], linked: boolean): void {
    const nameSet = new Set(layerNames);
    const updated = this.state.layers().map(l => {
      if (!nameSet.has(l.layerName)) return l;
      return { ...l, linked };
    });
    this.state.layers.set(updated);
  }

  /** Kijelölt image layerekhez tartozó személyek */
  private getSelectedImagePersons(): PhotoUploadPerson[] {
    const selected = this.state.selectedLayers();
    const persons: PhotoUploadPerson[] = [];
    const seenIds = new Set<number>();

    for (const l of selected) {
      if ((l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch) {
        if (!seenIds.has(l.personMatch.id)) {
          seenIds.add(l.personMatch.id);
          // Keressük meg a teljes TabloPersonItem-et
          const fullPerson = this.persons().find(p => p.id === l.personMatch!.id);
          persons.push({
            id: l.personMatch.id,
            name: l.personMatch.name,
            type: l.category === 'teacher-image' ? 'teacher' : 'student',
            archiveId: fullPerson?.archiveId ?? null,
          });
        }
      }
    }

    return persons;
  }

  /** Kijelölt layerek nevei (deduplikálva) */
  private getSelectedLayerNames(): string[] {
    const selected = this.state.selectedLayers();
    const nameSet = new Set<string>();
    for (const l of selected) {
      if (l.category !== 'fixed') {
        nameSet.add(l.layerName);
      }
    }
    return Array.from(nameSet);
  }

  /** Személyek frissítése a backendről és state újratöltése */
  private refreshPersonsInState(): void {
    firstValueFrom(
      this.projectService.getProjectPersons(this.projectId()),
    ).then(res => {
      // A personMatch-ek frissülnek a loadSnapshot-ban
      // De mi nem akarjuk a teljes snapshotot újratölteni, csak a személyeket
      const updatedPersons = res.data;
      const personMap = new Map(updatedPersons.map(p => [p.id, p]));

      const updatedLayers = this.state.layers().map(l => {
        if (!l.personMatch) return l;
        const person = personMap.get(l.personMatch.id);
        if (!person) return l;
        return {
          ...l,
          personMatch: {
            ...l.personMatch,
            photoThumbUrl: person.photoThumbUrl,
            photoUrl: person.photoUrl,
          },
        };
      });

      this.state.layers.set(updatedLayers);
    });
  }

  private async loadSnapshotList(): Promise<void> {
    const list = await this.ps.listSnapshots(this.psdPath());
    this.snapshots.set(list);
  }

  private async loadSnapshotData(): Promise<void> {
    try {
      const result = await this.ps.loadSnapshot(this.snapshotPath());
      if (!result.success || !result.data) {
        this.loadError.set(result.error || 'Nem sikerült betölteni a pillanatképet.');
        this.loading.set(false);
        return;
      }

      const data = result.data as Record<string, unknown>;
      const doc = data['document'] as DesignerDocument | undefined;
      const layers = (data['layers'] as SnapshotLayer[] | undefined) ?? [];

      if (!doc) {
        this.loadError.set('Érvénytelen pillanatkép formátum (hiányzó document mező).');
        this.loading.set(false);
        return;
      }

      const snapshotName = data['snapshotName'] as string | undefined;
      const createdAt = data['createdAt'] as string | undefined;
      this.state.sourceLabel.set(snapshotName || 'Pillanatkép');
      this.state.sourceDate.set(createdAt || null);
      this.state.loadSnapshot({ document: doc, layers }, this.persons());
      this.loading.set(false);
    } catch {
      this.loadError.set('Váratlan hiba a pillanatkép betöltésekor.');
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

    // Overlay-t figyeljük (mindig elérhető, nem feltételes renderelés)
    requestAnimationFrame(() => {
      const el = this.overlayEl().nativeElement;
      this.resizeObserver!.observe(el);
      this.state.containerWidth.set(el.clientWidth);
      this.state.containerHeight.set(el.clientHeight);
    });
  }
}
