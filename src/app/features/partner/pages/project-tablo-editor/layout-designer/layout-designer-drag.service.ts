import { Injectable, inject, signal, NgZone } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { LayoutDesignerSwapService } from './layout-designer-swap.service';
import { DesignerLayer, DragState } from './layout-designer.types';
import { expandWithCoupledLayers } from './layout-designer.utils';

/** Minimális pixel mozgás, ami drag-nek számít (nem click) */
const DRAG_THRESHOLD_PX = 3;

/**
 * Natív mouse event-ekkel működő drag rendszer.
 * CDK Drag helyett — multi-select group drag, coupled drag, snap-to-grid.
 */
@Injectable()
export class LayoutDesignerDragService {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly gridService = inject(LayoutDesignerGridService);
  private readonly swapService = inject(LayoutDesignerSwapService);
  private readonly zone = inject(NgZone);

  /** Aktuális drag állapot */
  readonly dragState = signal<DragState | null>(null);

  /** Volt-e valódi mozgás a drag során (nem click) */
  readonly hasMoved = signal(false);

  /** DOM elem ↔ layerId mapping */
  private readonly elementMap = new Map<number, HTMLElement>();

  /** Drag session belső állapot */
  private startClientX = 0;
  private startClientY = 0;
  private currentScale = 1;
  private draggedIds = new Set<number>();
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;

  /** Layer DOM elem regisztrálása */
  registerLayerElement(layerId: number, element: HTMLElement): void {
    this.elementMap.set(layerId, element);
  }

  /** Layer DOM elem törlése */
  unregisterLayerElement(layerId: number): void {
    this.elementMap.delete(layerId);
  }

  /**
   * Drag indítás egy layer mousedown event-jéből.
   * @param layerId A fogott layer ID
   * @param event MouseEvent
   * @param scale Aktuális canvas scale (PSD→screen)
   */
  startDrag(layerId: number, event: MouseEvent, scale: number): void {
    // Jobb klikk kihagyása
    if (event.button !== 0) return;

    event.preventDefault();

    const currentSelection = this.state.selectedLayerIds();
    const isAdditive = event.metaKey || event.ctrlKey;

    // Cmd+klikk már kijelölt elemre → kijelölés levétele, NEM drag
    if (isAdditive && currentSelection.has(layerId)) {
      this.state.toggleSelection(layerId, true);
      return;
    }

    // Ha a fogott elem nincs kijelölve → kijelölés cserélése/hozzáadása
    if (!currentSelection.has(layerId)) {
      this.state.toggleSelection(layerId, isAdditive);
    }

    // Kijelölt ID-k bővítése coupled párokkal
    const selection = this.state.selectedLayerIds();
    this.draggedIds = expandWithCoupledLayers(selection, this.state.layers());

    this.startClientX = event.clientX;
    this.startClientY = event.clientY;
    this.currentScale = scale;
    this.hasMoved.set(false);

    this.dragState.set({
      deltaXPsd: 0,
      deltaYPsd: 0,
      originLayerId: layerId,
      active: true,
    });

    // Globális listener-ek zone-on kívül (performance)
    this.zone.runOutsideAngular(() => {
      this.mouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
      this.mouseUpHandler = (e: MouseEvent) => this.onMouseUp(e);
      document.addEventListener('mousemove', this.mouseMoveHandler);
      document.addEventListener('mouseup', this.mouseUpHandler);
    });
  }

  private onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - this.startClientX;
    const dy = e.clientY - this.startClientY;

    // Threshold ellenőrzés — nem drag, hanem click lesz
    if (!this.hasMoved() && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!this.hasMoved()) {
      this.hasMoved.set(true);
    }

    const scale = this.currentScale;
    if (scale === 0) return;

    // Minden fogott elem DOM-jára CSS transform
    for (const id of this.draggedIds) {
      const el = this.elementMap.get(id);
      if (el) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.zIndex = '100';
        el.style.opacity = '0.8';
      }
    }

    // DragState frissítés (PSD koordinátákban)
    const deltaXPsd = Math.round(dx / scale);
    const deltaYPsd = Math.round(dy / scale);

    this.dragState.set({
      deltaXPsd,
      deltaYPsd,
      originLayerId: this.dragState()?.originLayerId ?? 0,
      active: true,
    });

    // Swap preview keresés az origin layer alapján
    const originId = this.dragState()?.originLayerId ?? 0;
    this.swapService.findSwapCandidate(originId, this.draggedIds, deltaXPsd, deltaYPsd);
  }

  private onMouseUp(e: MouseEvent): void {
    // Listener-ek eltávolítása
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.mouseUpHandler) {
      document.removeEventListener('mouseup', this.mouseUpHandler);
      this.mouseUpHandler = null;
    }

    // CSS transform reset minden fogott elemen
    for (const id of this.draggedIds) {
      const el = this.elementMap.get(id);
      if (el) {
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.opacity = '';
      }
    }

    // Ha nem mozdult → click volt, nem drag
    if (!this.hasMoved()) {
      this.cleanup();
      return;
    }

    // Zone-ba lépés a state update-ekhez
    this.zone.run(() => {
      const ds = this.dragState();

      // Végső swap keresés az utolsó pozícióra
      if (ds) {
        this.swapService.findSwapCandidate(ds.originLayerId, this.draggedIds, ds.deltaXPsd, ds.deltaYPsd);
      }
      const swap = this.swapService.swapCandidate();

      if (swap && ds) {
        this.swapService.executeSwaps(swap.pairs);
      } else if (ds && (ds.deltaXPsd !== 0 || ds.deltaYPsd !== 0)) {
        if (this.gridService.gridEnabled()) {
          this.snapAndMove(ds.deltaXPsd, ds.deltaYPsd);
        } else {
          this.state.moveSelectedLayers(ds.deltaXPsd, ds.deltaYPsd);
        }
      }

      this.cleanup();
    });
  }

  /**
   * Snap-to-grid mozgatás: az image layereket a legközelebbi grid cellába snap-eli,
   * majd a coupled name layereket a state service igazítja.
   */
  private snapAndMove(deltaXPsd: number, deltaYPsd: number): void {
    const layers = this.state.layers();
    const ids = this.draggedIds;

    // Először a normál delta-t alkalmazzuk, majd az image layereket snap-eljük
    const updatedLayers = layers.map(l => {
      if (!ids.has(l.layerId)) return l;

      const currentX = l.editedX ?? l.x;
      const currentY = l.editedY ?? l.y;
      const newX = currentX + deltaXPsd;
      const newY = currentY + deltaYPsd;

      // Image layer → snap-to-grid
      const isImage = l.category === 'student-image' || l.category === 'teacher-image';
      if (isImage) {
        const snapped = this.gridService.snapToGrid(newX, newY, l.width, l.height, l.category);
        if (snapped) {
          return { ...l, editedX: snapped.x, editedY: snapped.y };
        }
      }

      return { ...l, editedX: newX, editedY: newY };
    });

    // Name layerek igazítása a snap-elt image alá
    this.alignNamesToImages(updatedLayers);
    this.state.updateLayers(updatedLayers);
  }

  /** Name layerek X/Y igazítása a coupled image layerhez */
  private alignNamesToImages(layers: DesignerLayer[]): void {
    const GAP = 8;
    const pairs: Array<[string, string]> = [
      ['student-image', 'student-name'],
      ['teacher-image', 'teacher-name'],
    ];

    for (const [imageCat, nameCat] of pairs) {
      const imageMap = new Map<number, typeof layers[0]>();
      for (const l of layers) {
        if (l.category === imageCat && l.personMatch) {
          imageMap.set(l.personMatch.id, l);
        }
      }

      for (const nameLayer of layers) {
        if (nameLayer.category !== nameCat || !nameLayer.personMatch) continue;
        if (!this.draggedIds.has(nameLayer.layerId)) continue;

        const imageLayer = imageMap.get(nameLayer.personMatch.id);
        if (!imageLayer) continue;

        const imgX = imageLayer.editedX ?? imageLayer.x;
        const imgY = imageLayer.editedY ?? imageLayer.y;

        nameLayer.editedX = imgX;
        nameLayer.editedY = imgY + imageLayer.height + GAP;
      }
    }
  }

  private cleanup(): void {
    this.dragState.set(null);
    this.swapService.reset();
    this.draggedIds = new Set();
  }
}
