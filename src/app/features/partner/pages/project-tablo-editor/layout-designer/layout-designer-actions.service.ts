import { Injectable, inject } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';
import { expandWithCoupledLayers } from './layout-designer.utils';

/** Sorok Y-threshold: ezen belüli Y-ú elemek egy sorba tartoznak */
const ROW_THRESHOLD_PX = 20;

/**
 * Layout Designer igazítás algoritmusok.
 * Mind PSD koordinátákban dolgozik.
 */
@Injectable()
export class LayoutDesignerActionsService {
  private readonly state = inject(LayoutDesignerStateService);

  /** Balra igazítás: X → min(X) */
  alignLeft(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const minX = Math.min(...selected.map(l => l.editedX ?? l.x));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: minX, y: l.editedY ?? l.y,
    }));
  }

  /** Jobbra igazítás: jobb szél → max(X + width) */
  alignRight(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const maxRight = Math.max(...selected.map(l => (l.editedX ?? l.x) + l.width));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: maxRight - l.width, y: l.editedY ?? l.y,
    }));
  }

  /** Tetejére igazítás: Y → min(Y) */
  alignTop(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const minY = Math.min(...selected.map(l => l.editedY ?? l.y));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: l.editedX ?? l.x, y: minY,
    }));
  }

  /** Aljára igazítás: alsó szél → max(Y + height) */
  alignBottom(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const maxBottom = Math.max(...selected.map(l => (l.editedY ?? l.y) + l.height));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: l.editedX ?? l.x, y: maxBottom - l.height,
    }));
  }

  /** Vízszintes középre: X középpont → átlag(X középpont) */
  alignCenterHorizontal(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const avgCx = selected.reduce((s, l) =>
      s + (l.editedX ?? l.x) + l.width / 2, 0) / selected.length;
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: Math.round(avgCx - l.width / 2), y: l.editedY ?? l.y,
    }));
  }

  /** Függőleges középre: Y középpont → átlag(Y középpont) */
  alignCenterVertical(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const avgCy = selected.reduce((s, l) =>
      s + (l.editedY ?? l.y) + l.height / 2, 0) / selected.length;
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: l.editedX ?? l.x, y: Math.round(avgCy - l.height / 2),
    }));
  }

  /** Vízszintes elosztás: egyenletes X gap (≥3 elem) */
  distributeHorizontal(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 3) return;
    const sorted = [...selected].sort((a, b) => (a.editedX ?? a.x) - (b.editedX ?? b.x));
    const firstX = sorted[0].editedX ?? sorted[0].x;
    const lastX = sorted[sorted.length - 1].editedX ?? sorted[sorted.length - 1].x;
    const step = (lastX - firstX) / (sorted.length - 1);
    const posMap = new Map<number, number>();
    sorted.forEach((l, i) => posMap.set(l.layerId, Math.round(firstX + step * i)));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: posMap.get(l.layerId) ?? (l.editedX ?? l.x), y: l.editedY ?? l.y,
    }));
  }

  /** Függőleges elosztás: egyenletes Y gap (≥3 elem) */
  distributeVertical(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 3) return;
    const sorted = [...selected].sort((a, b) => (a.editedY ?? a.y) - (b.editedY ?? b.y));
    const firstY = sorted[0].editedY ?? sorted[0].y;
    const lastY = sorted[sorted.length - 1].editedY ?? sorted[sorted.length - 1].y;
    const step = (lastY - firstY) / (sorted.length - 1);
    const posMap = new Map<number, number>();
    sorted.forEach((l, i) => posMap.set(l.layerId, Math.round(firstY + step * i)));
    this.applyAlignmentWithCoupled(selected, (l) => ({
      x: l.editedX ?? l.x, y: posMap.get(l.layerId) ?? (l.editedY ?? l.y),
    }));
  }

  /** Sorok automatikus igazítása: hasonló Y-ú elemek → min(Y) */
  alignRows(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const rows = this.groupIntoRows(selected);
    const rowYMap = new Map<number, number>();
    for (const row of rows) {
      if (row.length < 2) continue;
      const minY = Math.min(...row.map(l => l.editedY ?? l.y));
      for (const l of row) rowYMap.set(l.layerId, minY);
    }
    if (rowYMap.size === 0) return;
    const affected = selected.filter(l => rowYMap.has(l.layerId));
    this.applyAlignmentWithCoupled(affected, (l) => ({
      x: l.editedX ?? l.x, y: rowYMap.get(l.layerId) ?? (l.editedY ?? l.y),
    }));
  }

  /** Igazítás végrehajtása coupled párokkal */
  private applyAlignmentWithCoupled(
    selected: DesignerLayer[],
    positionFn: (l: DesignerLayer) => { x: number; y: number },
  ): void {
    const expandedIds = expandWithCoupledLayers(
      this.state.selectedLayerIds(), this.state.layers(),
    );
    const updates = new Map<number, { x: number; y: number }>();

    for (const sel of selected) {
      const newPos = positionFn(sel);
      const deltaX = newPos.x - (sel.editedX ?? sel.x);
      const deltaY = newPos.y - (sel.editedY ?? sel.y);
      updates.set(sel.layerId, newPos);

      for (const id of expandedIds) {
        if (updates.has(id)) continue;
        const layer = this.state.layers().find(l => l.layerId === id);
        if (layer && !this.state.selectedLayerIds().has(id)) {
          const isLinked = layer.personMatch && sel.personMatch
            && layer.personMatch.id === sel.personMatch.id;
          if (isLinked) {
            updates.set(id, {
              x: (layer.editedX ?? layer.x) + deltaX,
              y: (layer.editedY ?? layer.y) + deltaY,
            });
          }
        }
      }
    }

    this.state.updateLayers(
      this.state.layers().map(l => {
        const u = updates.get(l.layerId);
        if (!u) return l;
        return { ...l, editedX: u.x, editedY: u.y };
      }),
    );
  }

  /** Elemek csoportosítása sorokba hasonló Y pozíció alapján */
  private groupIntoRows(layers: DesignerLayer[]): DesignerLayer[][] {
    const sorted = [...layers].sort((a, b) => (a.editedY ?? a.y) - (b.editedY ?? b.y));
    const rows: DesignerLayer[][] = [];
    let currentRow: DesignerLayer[] = [];
    let currentRowY = -Infinity;
    for (const layer of sorted) {
      const y = layer.editedY ?? layer.y;
      if (currentRow.length === 0 || Math.abs(y - currentRowY) <= ROW_THRESHOLD_PX) {
        currentRow.push(layer);
        if (currentRow.length === 1) currentRowY = y;
      } else {
        rows.push(currentRow);
        currentRow = [layer];
        currentRowY = y;
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
  }
}
