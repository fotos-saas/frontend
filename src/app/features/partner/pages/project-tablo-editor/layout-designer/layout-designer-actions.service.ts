import { Injectable, inject } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerGridService } from './layout-designer-grid.service';
import { DesignerLayer } from './layout-designer.types';

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
    this.applyAlignment(selected, (l) => ({
      x: minX, y: l.editedY ?? l.y,
    }));
  }

  /** Jobbra igazítás: jobb szél → max(X + width) */
  alignRight(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const maxRight = Math.max(...selected.map(l => (l.editedX ?? l.x) + l.width));
    this.applyAlignment(selected, (l) => ({
      x: maxRight - l.width, y: l.editedY ?? l.y,
    }));
  }

  /** Tetejére igazítás: Y → min(Y) */
  alignTop(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const minY = Math.min(...selected.map(l => l.editedY ?? l.y));
    this.applyAlignment(selected, (l) => ({
      x: l.editedX ?? l.x, y: minY,
    }));
  }

  /** Aljára igazítás: alsó szél → max(Y + height) */
  alignBottom(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const maxBottom = Math.max(...selected.map(l => (l.editedY ?? l.y) + l.height));
    this.applyAlignment(selected, (l) => ({
      x: l.editedX ?? l.x, y: maxBottom - l.height,
    }));
  }

  /** Vízszintes középre: X középpont → átlag(X középpont) */
  alignCenterHorizontal(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const avgCx = selected.reduce((s, l) =>
      s + (l.editedX ?? l.x) + l.width / 2, 0) / selected.length;
    this.applyAlignment(selected, (l) => ({
      x: Math.round(avgCx - l.width / 2), y: l.editedY ?? l.y,
    }));
  }

  /** Függőleges középre: Y középpont → átlag(Y középpont) */
  alignCenterVertical(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;
    const avgCy = selected.reduce((s, l) =>
      s + (l.editedY ?? l.y) + l.height / 2, 0) / selected.length;
    this.applyAlignment(selected, (l) => ({
      x: l.editedX ?? l.x, y: Math.round(avgCy - l.height / 2),
    }));
  }

  /** Dokumentum közepére igazítás: a kijelölt image-ek bounding box-a a dokumentum közepére kerül */
  centerOnDocument(): void {
    const selected = this.state.selectedLayers();
    if (selected.length === 0) return;

    const doc = this.state.document();
    if (!doc) return;

    // Csak image/fixed layerek alapján számolunk bounding box-ot
    const images = selected.filter(l =>
      l.category !== 'student-name' && l.category !== 'teacher-name',
    );
    if (images.length === 0) return;

    const minX = Math.min(...images.map(l => l.editedX ?? l.x));
    const minY = Math.min(...images.map(l => l.editedY ?? l.y));
    const maxX = Math.max(...images.map(l => (l.editedX ?? l.x) + l.width));
    const maxY = Math.max(...images.map(l => (l.editedY ?? l.y) + l.height));
    const bbWidth = maxX - minX;
    const bbHeight = maxY - minY;

    const targetX = Math.round((doc.widthPx - bbWidth) / 2);
    const targetY = Math.round((doc.heightPx - bbHeight) / 2);
    const deltaX = targetX - minX;
    const deltaY = targetY - minY;

    if (deltaX === 0 && deltaY === 0) return;

    this.applyAlignment(selected, (l) => ({
      x: (l.editedX ?? l.x) + deltaX,
      y: (l.editedY ?? l.y) + deltaY,
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
    this.applyAlignment(selected, (l) => ({
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
    this.applyAlignment(selected, (l) => ({
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

    this.applyAlignment(images, (l) =>
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
    this.applyAlignment(affected, (l) => ({
      x: l.editedX ?? l.x, y: rowYMap.get(l.layerId) ?? (l.editedY ?? l.y),
    }));
  }

  /**
   * Oszlopok automatikus igazítása: egymás alatti elemek X → legközelebbi grid oszlop X.
   * Minden kijelölt elemet a legközelebbi grid oszlop X pozíciójára snap-el.
   */
  alignColumns(): void {
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

    if (!grid) return;

    // Oszlop X pozíciók a gridből
    const colPositions: number[] = [];
    for (let c = 0; c < grid.cols; c++) {
      colPositions.push(grid.originX + c * grid.cellWidth);
    }

    // Minden image-et a legközelebbi oszlop X-re snap-elünk
    const posMap = new Map<number, number>();
    for (const img of images) {
      const imgX = img.editedX ?? img.x;
      let bestX = colPositions[0];
      let bestDist = Math.abs(imgX - bestX);
      for (const cx of colPositions) {
        const dist = Math.abs(imgX - cx);
        if (dist < bestDist) {
          bestDist = dist;
          bestX = cx;
        }
      }
      posMap.set(img.layerId, bestX);
    }

    this.applyAlignment(images, (l) => ({
      x: posMap.get(l.layerId) ?? (l.editedX ?? l.x),
      y: l.editedY ?? l.y,
    }));
  }

  /**
   * Igazítás végrehajtása — csak image/fixed layerekre.
   * A name layerek pozícióit az updateLayers() automatikusan a képek alá igazítja.
   */
  private applyAlignment(
    selected: DesignerLayer[],
    positionFn: (l: DesignerLayer) => { x: number; y: number },
  ): void {
    const updates = new Map<number, { x: number; y: number }>();

    for (const sel of selected) {
      // Name layereket kihagyjuk — realignNamesToImages kezeli
      if (sel.category === 'student-name' || sel.category === 'teacher-name') continue;
      updates.set(sel.layerId, positionFn(sel));
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
