import { Injectable, inject, signal } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer, SwapCandidate } from './layout-designer.types';
import { overlapPercent } from './layout-designer.utils';

/** Minimális overlap százalék a swap aktiválásához */
const SWAP_THRESHOLD = 0.4;

/**
 * Swap jelölt keresés és végrehajtás.
 * Bármely image↔image swap megengedett (diák↔tanár is).
 */
@Injectable()
export class LayoutDesignerSwapService {
  private readonly state = inject(LayoutDesignerStateService);

  /** Aktuális swap jelölt (drag közben) */
  readonly swapCandidate = signal<SwapCandidate | null>(null);

  /**
   * Swap jelölt keresése a fogott layer eltolt pozíciója alapján.
   * Csak single image drag-nél működik.
   */
  findSwapCandidate(draggedLayerIds: Set<number>, deltaXPsd: number, deltaYPsd: number): void {
    const layers = this.state.layers();

    // Csak single image a fogottak között
    const draggedImages = layers.filter(
      l => draggedLayerIds.has(l.layerId) && this.isImageLayer(l),
    );
    if (draggedImages.length !== 1) {
      this.swapCandidate.set(null);
      return;
    }

    const draggedImage = draggedImages[0];
    const draggedRect = {
      x: (draggedImage.editedX ?? draggedImage.x) + deltaXPsd,
      y: (draggedImage.editedY ?? draggedImage.y) + deltaYPsd,
      width: draggedImage.width,
      height: draggedImage.height,
    };

    let best: SwapCandidate | null = null;

    for (const layer of layers) {
      // Nem saját maga, és image layer
      if (draggedLayerIds.has(layer.layerId)) continue;
      if (!this.isImageLayer(layer)) continue;

      const targetRect = {
        x: layer.editedX ?? layer.x,
        y: layer.editedY ?? layer.y,
        width: layer.width,
        height: layer.height,
      };

      const overlap = overlapPercent(draggedRect, targetRect);
      if (overlap >= SWAP_THRESHOLD && (!best || overlap > best.overlapPercent)) {
        best = { targetLayerId: layer.layerId, overlapPercent: overlap };
      }
    }

    this.swapCandidate.set(best);
  }

  /**
   * Swap végrehajtása: két image pozíciójának cseréje (+ coupled name-ek).
   */
  executeSwap(layerIdA: number, layerIdB: number): void {
    const layers = this.state.layers();
    const layerA = layers.find(l => l.layerId === layerIdA);
    const layerB = layers.find(l => l.layerId === layerIdB);
    if (!layerA || !layerB) return;

    const posA = { x: layerA.editedX ?? layerA.x, y: layerA.editedY ?? layerA.y };
    const posB = { x: layerB.editedX ?? layerB.x, y: layerB.editedY ?? layerB.y };

    // Coupled name layerek keresése
    const nameA = this.findCoupledName(layerA, layers);
    const nameB = this.findCoupledName(layerB, layers);

    const namePosA = nameA ? { x: nameA.editedX ?? nameA.x, y: nameA.editedY ?? nameA.y } : null;
    const namePosB = nameB ? { x: nameB.editedX ?? nameB.x, y: nameB.editedY ?? nameB.y } : null;

    // Pozíció csere
    const updatedLayers = layers.map(l => {
      if (l.layerId === layerIdA) {
        return { ...l, editedX: posB.x, editedY: posB.y };
      }
      if (l.layerId === layerIdB) {
        return { ...l, editedX: posA.x, editedY: posA.y };
      }
      // Name layerek cseréje
      if (nameA && nameB && l.layerId === nameA.layerId) {
        return { ...l, editedX: namePosB!.x, editedY: namePosB!.y };
      }
      if (nameA && nameB && l.layerId === nameB.layerId) {
        return { ...l, editedX: namePosA!.x, editedY: namePosA!.y };
      }
      // Ha csak az egyiknek van name párja
      if (nameA && !nameB && l.layerId === nameA.layerId) {
        // A name átkerül B pozíciójára (arányosan)
        const deltaX = posB.x - posA.x;
        const deltaY = posB.y - posA.y;
        return { ...l, editedX: (namePosA!.x + deltaX), editedY: (namePosA!.y + deltaY) };
      }
      if (!nameA && nameB && l.layerId === nameB.layerId) {
        const deltaX = posA.x - posB.x;
        const deltaY = posA.y - posB.y;
        return { ...l, editedX: (namePosB!.x + deltaX), editedY: (namePosB!.y + deltaY) };
      }
      return l;
    });

    this.state.updateLayers(updatedLayers);
  }

  /** Swap jelölt reset */
  reset(): void {
    this.swapCandidate.set(null);
  }

  private isImageLayer(layer: DesignerLayer): boolean {
    return layer.category === 'student-image' || layer.category === 'teacher-image';
  }

  /** Coupled name layer keresése person ID alapján */
  private findCoupledName(imageLayer: DesignerLayer, layers: DesignerLayer[]): DesignerLayer | null {
    if (!imageLayer.personMatch) return null;

    const nameCat = imageLayer.category === 'student-image' ? 'student-name' : 'teacher-name';
    return layers.find(
      l => l.category === nameCat && l.personMatch?.id === imageLayer.personMatch!.id,
    ) ?? null;
  }
}
