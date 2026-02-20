import { Injectable, inject } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { DesignerLayer } from './layout-designer.types';
import { expandWithCoupledLayers } from './layout-designer.utils';

/** Sorok Y-threshold: ezen belüli Y-ú elemek egy sorba tartoznak */
const ROW_THRESHOLD_PX = 20;
/** Fallback gap ha nincs grid konfig (PSD px) */
const DEFAULT_GAP_PX = 10;

/**
 * Layout Designer igazítás algoritmusok.
 * Mind PSD koordinátákban dolgozik.
 */
@Injectable()
export class LayoutDesignerActionsService {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly gridService = inject(LayoutDesignerGridService);

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

  /**
   * Kijelölt elemek rácsba rendezése: a bal felső elemtől indulva
   * egyforma gap-pel sorokba és oszlopokba rendezi a kijelölteket.
   * Az oszlopszámot a grid konfigból veszi, a gap-et szintén.
   */
  arrangeToGrid(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;

    const images = selected.filter(l =>
      l.category === 'student-image' || l.category === 'teacher-image',
    );
    if (images.length === 0) return;

    const hasStudent = images.some(l => l.category === 'student-image');
    const grid = hasStudent
      ? this.gridService.studentGrid()
      : this.gridService.teacherGrid();

    const gapH = grid ? Math.max(0, grid.cellWidth - grid.imageWidth) : DEFAULT_GAP_PX;
    const gapV = grid ? Math.max(0, grid.cellHeight - grid.imageHeight) : DEFAULT_GAP_PX;
    const cols = grid ? grid.cols : Math.ceil(Math.sqrt(images.length));

    // Rendezés: sor → oszlop (bal felülről jobbra-lefele)
    const sorted = [...images].sort((a, b) => {
      const dy = (a.editedY ?? a.y) - (b.editedY ?? b.y);
      if (Math.abs(dy) > (images[0]?.height ?? 100) / 2) return dy;
      return (a.editedX ?? a.x) - (b.editedX ?? b.x);
    });

    // Kiindulópont: a legbalra-feljebb lévő elem pozíciója
    const originX = Math.min(...images.map(l => l.editedX ?? l.x));
    const originY = Math.min(...images.map(l => l.editedY ?? l.y));

    const posMap = new Map<number, { x: number; y: number }>();
    for (let i = 0; i < sorted.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const img = sorted[i];
      posMap.set(img.layerId, {
        x: Math.round(originX + col * (img.width + gapH)),
        y: Math.round(originY + row * (img.height + gapV)),
      });
    }

    this.applyAlignmentWithCoupled(images, (l) =>
      posMap.get(l.layerId) ?? { x: l.editedX ?? l.x, y: l.editedY ?? l.y },
    );
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

  /** Oszlopok automatikus igazítása: hasonló X-ű elemek → min(X) */
  alignColumns(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const cols = this.groupIntoColumns(selected);
    const colXMap = new Map<number, number>();
    for (const col of cols) {
      if (col.length < 2) continue;
      const minX = Math.min(...col.map(l => l.editedX ?? l.x));
      for (const l of col) colXMap.set(l.layerId, minX);
    }
    if (colXMap.size === 0) return;
    const affected = selected.filter(l => colXMap.has(l.layerId));
    this.applyAlignmentWithCoupled(affected, (l) => ({
      x: colXMap.get(l.layerId) ?? (l.editedX ?? l.x), y: l.editedY ?? l.y,
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

  /** Elemek csoportosítása oszlopokba hasonló X pozíció alapján */
  private groupIntoColumns(layers: DesignerLayer[]): DesignerLayer[][] {
    // Threshold: elemszélesség fele, de min ROW_THRESHOLD_PX
    const threshold = Math.max(ROW_THRESHOLD_PX, (layers[0]?.width ?? 100) / 2);
    const sorted = [...layers].sort((a, b) => (a.editedX ?? a.x) - (b.editedX ?? b.x));
    const cols: DesignerLayer[][] = [];
    let currentCol: DesignerLayer[] = [];
    let currentColX = -Infinity;
    for (const layer of sorted) {
      const x = layer.editedX ?? layer.x;
      if (currentCol.length === 0 || Math.abs(x - currentColX) <= threshold) {
        currentCol.push(layer);
        if (currentCol.length === 1) currentColX = x;
      } else {
        cols.push(currentCol);
        currentCol = [layer];
        currentColX = x;
      }
    }
    if (currentCol.length > 0) cols.push(currentCol);
    return cols;
  }
}
