import { Injectable, Signal, signal, computed } from '@angular/core';
import { DesignerLayer, ScaleInfo, LayerCategory } from './layout-designer.types';

/** Toolbar magassága px-ben */
const TOOLBAR_HEIGHT = 56;
/** Sidebar szélessége px-ben */
const SIDEBAR_WIDTH = 220;

/**
 * Layout Designer kijelöléskezelő service (komponens-szintű).
 * A kijelölt layerek állapotát és a hozzájuk tartozó számított értékeket kezeli.
 */
@Injectable()
export class LayoutDesignerSelectionService {

  /** Külső signal referenciák (configure()-ből) */
  private layersRef!: Signal<DesignerLayer[]>;
  private scaleInfoRef!: Signal<ScaleInfo>;

  /** Kijelölt layer ID-k */
  readonly selectedLayerIds = signal<Set<number>>(new Set());

  /** Kijelölt layerek */
  readonly selectedLayers = computed(() => {
    const ids = this.selectedLayerIds();
    return this.layersRef().filter(l => ids.has(l.layerId));
  });

  /** Van-e kijelölés */
  readonly hasSelection = computed(() => this.selectedLayerIds().size > 0);

  /** Kijelölés darabszáma */
  readonly selectionCount = computed(() => this.selectedLayerIds().size);

  /**
   * Kijelölt layerek bounding box-a screen px-ben (canvas wrapper-hez relatív).
   * A floating toolbar pozícionálásához használjuk.
   */
  readonly selectionScreenBounds = computed(() => {
    const selected = this.selectedLayers();
    const si = this.scaleInfoRef();
    if (selected.length === 0 || si.displayWidth === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of selected) {
      if (l.category === 'student-name' || l.category === 'teacher-name') continue;
      const lx = l.editedX ?? l.x;
      const ly = l.editedY ?? l.y;
      minX = Math.min(minX, lx);
      minY = Math.min(minY, ly);
      maxX = Math.max(maxX, lx + l.width);
      maxY = Math.max(maxY, ly + l.height);
    }

    if (minX === Infinity) return null;

    // PSD -> screen px konverzio (canvas wrapper-hez relativ)
    const canvasLeft = si.offsetX - SIDEBAR_WIDTH;
    const canvasTopPx = si.offsetY - TOOLBAR_HEIGHT;

    return {
      left: minX * si.scale + canvasLeft,
      top: minY * si.scale + canvasTopPx,
      right: maxX * si.scale + canvasLeft,
      bottom: maxY * si.scale + canvasTopPx,
      centerX: ((minX + maxX) / 2) * si.scale + canvasLeft,
    };
  });

  /**
   * Inicializálás: a state service átadja a szükséges signal referenciákat.
   * A computed signal-ok csak a configure() hívás után működnek helyesen.
   */
  configure(layersRef: Signal<DesignerLayer[]>, scaleInfoRef: Signal<ScaleInfo>): void {
    this.layersRef = layersRef;
    this.scaleInfoRef = scaleInfoRef;
  }

  /** Kijelölés toggle (klikk/Cmd+klikk) */
  toggleSelection(layerId: number, additive: boolean): void {
    const current = new Set(this.selectedLayerIds());

    if (additive) {
      if (current.has(layerId)) {
        current.delete(layerId);
      } else {
        current.add(layerId);
      }
    } else {
      if (current.has(layerId) && current.size === 1) {
        current.clear();
      } else {
        current.clear();
        current.add(layerId);
      }
    }

    this.selectedLayerIds.set(current);
  }

  /** Kijelölés törlése */
  clearSelection(): void {
    this.selectedLayerIds.set(new Set());
  }

  /** Layerek kijelölése (marquee) */
  selectLayers(ids: Set<number>): void {
    this.selectedLayerIds.set(ids);
  }

  /** Összes nem-fixed layer kijelölése (Cmd+A) */
  selectAll(): void {
    const ids = new Set(
      this.layersRef()
        .filter(l => l.category !== 'fixed')
        .map(l => l.layerId),
    );
    this.selectedLayerIds.set(ids);
  }

  /** Meglévő kijelöléshez hozzáadás (Cmd+marquee) */
  addToSelection(ids: Set<number>): void {
    const current = new Set(this.selectedLayerIds());
    for (const id of ids) current.add(id);
    this.selectedLayerIds.set(current);
  }
}
