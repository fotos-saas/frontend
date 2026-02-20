import { Injectable, inject, signal } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer, SwapCandidate, SwapPair } from './layout-designer.types';
import { overlapPercent } from './layout-designer.utils';

/** Minimális overlap százalék a swap aktiválásához */
const SWAP_THRESHOLD = 0.3;

/**
 * Swap jelölt keresés és végrehajtás.
 * Multi-select támogatás: minden fogott image kap saját swap partner-t.
 */
@Injectable()
export class LayoutDesignerSwapService {
  private readonly state = inject(LayoutDesignerStateService);

  /** Aktuális swap jelöltek (drag közben) */
  readonly swapCandidate = signal<SwapCandidate | null>(null);

  /**
   * Swap jelöltek keresése az összes fogott image eltolt pozíciója alapján.
   * Minden fogott image → legközelebbi nem-fogott image (≥threshold overlap).
   * Egy target csak egyszer párosítható.
   */
  findSwapCandidate(
    originLayerId: number,
    draggedLayerIds: Set<number>,
    deltaXPsd: number,
    deltaYPsd: number,
  ): void {
    const layers = this.state.layers();

    // Fogott image layerek
    const draggedImages = layers.filter(
      l => draggedLayerIds.has(l.layerId) && this.isImageLayer(l),
    );
    if (draggedImages.length === 0) {
      this.swapCandidate.set(null);
      return;
    }

    // Nem-fogott image layerek (lehetséges target-ek)
    const targetImages = layers.filter(
      l => !draggedLayerIds.has(l.layerId) && this.isImageLayer(l),
    );

    // Minden fogott image-hez megkeressük a legjobb target-et
    const allMatches: Array<{ source: number; target: number; overlap: number }> = [];

    for (const src of draggedImages) {
      const srcRect = {
        x: (src.editedX ?? src.x) + deltaXPsd,
        y: (src.editedY ?? src.y) + deltaYPsd,
        width: src.width,
        height: src.height,
      };

      for (const tgt of targetImages) {
        const tgtRect = {
          x: tgt.editedX ?? tgt.x,
          y: tgt.editedY ?? tgt.y,
          width: tgt.width,
          height: tgt.height,
        };

        const overlap = overlapPercent(srcRect, tgtRect);
        if (overlap >= SWAP_THRESHOLD) {
          allMatches.push({ source: src.layerId, target: tgt.layerId, overlap });
        }
      }
    }

    if (allMatches.length === 0) {
      this.swapCandidate.set(null);
      return;
    }

    // Greedy párosítás: overlap csökkenő sorrendben, egy target csak egyszer
    allMatches.sort((a, b) => b.overlap - a.overlap);
    const usedTargets = new Set<number>();
    const usedSources = new Set<number>();
    const pairs: SwapPair[] = [];

    for (const m of allMatches) {
      if (usedSources.has(m.source) || usedTargets.has(m.target)) continue;
      pairs.push({
        sourceLayerId: m.source,
        targetLayerId: m.target,
        overlapPercent: m.overlap,
      });
      usedSources.add(m.source);
      usedTargets.add(m.target);
    }

    if (pairs.length === 0) {
      this.swapCandidate.set(null);
      return;
    }

    // Az origin layer swap partner-e a preview-hoz (sárga keret)
    const originPair = pairs.find(p => p.sourceLayerId === originLayerId);
    const previewTarget = originPair ?? pairs[0];

    this.swapCandidate.set({
      targetLayerId: previewTarget.targetLayerId,
      overlapPercent: previewTarget.overlapPercent,
      pairs,
    });
  }

  /**
   * Multi-swap végrehajtása: minden pár pozícióját cseréli (+ coupled name-ek).
   */
  executeSwaps(pairs: SwapPair[]): void {
    let layers = [...this.state.layers()];

    for (const pair of pairs) {
      layers = this.swapTwo(pair.sourceLayerId, pair.targetLayerId, layers);
    }

    this.state.updateLayers(layers);
  }

  /** Swap jelölt reset */
  reset(): void {
    this.swapCandidate.set(null);
  }

  /** Két image pozíciójának cseréje (+ coupled name-ek) egy layers tömbön */
  private swapTwo(layerIdA: number, layerIdB: number, layers: DesignerLayer[]): DesignerLayer[] {
    const layerA = layers.find(l => l.layerId === layerIdA);
    const layerB = layers.find(l => l.layerId === layerIdB);
    if (!layerA || !layerB) return layers;

    const posA = { x: layerA.editedX ?? layerA.x, y: layerA.editedY ?? layerA.y };
    const posB = { x: layerB.editedX ?? layerB.x, y: layerB.editedY ?? layerB.y };

    const nameA = this.findCoupledName(layerA, layers);
    const nameB = this.findCoupledName(layerB, layers);
    const namePosA = nameA ? { x: nameA.editedX ?? nameA.x, y: nameA.editedY ?? nameA.y } : null;
    const namePosB = nameB ? { x: nameB.editedX ?? nameB.x, y: nameB.editedY ?? nameB.y } : null;

    return layers.map(l => {
      // Image pozíció csere
      if (l.layerId === layerIdA) {
        return { ...l, editedX: posB.x, editedY: posB.y };
      }
      if (l.layerId === layerIdB) {
        return { ...l, editedX: posA.x, editedY: posA.y };
      }
      // Name pozíció csere (mindkettőnek van)
      if (nameA && nameB) {
        if (l.layerId === nameA.layerId) {
          return { ...l, editedX: namePosB!.x, editedY: namePosB!.y };
        }
        if (l.layerId === nameB.layerId) {
          return { ...l, editedX: namePosA!.x, editedY: namePosA!.y };
        }
      }
      // Csak az egyiknek van name
      if (nameA && !nameB && l.layerId === nameA.layerId) {
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        return { ...l, editedX: namePosA!.x + dx, editedY: namePosA!.y + dy };
      }
      if (!nameA && nameB && l.layerId === nameB.layerId) {
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        return { ...l, editedX: namePosB!.x + dx, editedY: namePosB!.y + dy };
      }
      return l;
    });
  }

  private isImageLayer(layer: DesignerLayer): boolean {
    return layer.category === 'student-image' || layer.category === 'teacher-image';
  }

  private findCoupledName(imageLayer: DesignerLayer, layers: DesignerLayer[]): DesignerLayer | null {
    if (!imageLayer.personMatch) return null;
    const nameCat = imageLayer.category === 'student-image' ? 'student-name' : 'teacher-name';
    return layers.find(
      l => l.category === nameCat && l.personMatch?.id === imageLayer.personMatch!.id,
    ) ?? null;
  }
}
