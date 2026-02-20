import { Injectable, inject } from '@angular/core';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';

/** Sorok Y-threshold: ezen belüli Y-ú elemek egy sorba tartoznak */
const ROW_THRESHOLD_PX = 20;

/**
 * Layout Designer igazítás algoritmusok.
 * Mind PSD koordinátákban dolgozik.
 */
@Injectable()
export class LayoutDesignerActionsService {
  private readonly state = inject(LayoutDesignerStateService);

  /** Felsők igazítása: kijelölt elemek Y → min(Y) */
  alignTop(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;

    const minY = Math.min(...selected.map(l => l.editedY ?? l.y));
    const ids = new Set(selected.map(l => l.layerId));

    this.state.updateLayers(
      this.state.layers().map(l => {
        if (!ids.has(l.layerId)) return l;
        return { ...l, editedY: minY };
      }),
    );
  }

  /** Vízszintes elosztás: egyenletes gap a kijelölt elemek között (X tengely) */
  distributeHorizontal(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 3) return;

    const sorted = [...selected].sort((a, b) => (a.editedX ?? a.x) - (b.editedX ?? b.x));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const firstX = first.editedX ?? first.x;
    const lastX = last.editedX ?? last.x;
    const totalSpan = lastX - firstX;
    const step = totalSpan / (sorted.length - 1);

    const updates = new Map<number, number>();
    sorted.forEach((l, i) => {
      updates.set(l.layerId, firstX + step * i);
    });

    this.state.updateLayers(
      this.state.layers().map(l => {
        const newX = updates.get(l.layerId);
        if (newX == null) return l;
        return { ...l, editedX: Math.round(newX) };
      }),
    );
  }

  /** Függőleges elosztás: egyenletes gap a kijelölt elemek között (Y tengely) */
  distributeVertical(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 3) return;

    const sorted = [...selected].sort((a, b) => (a.editedY ?? a.y) - (b.editedY ?? b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const firstY = first.editedY ?? first.y;
    const lastY = last.editedY ?? last.y;
    const totalSpan = lastY - firstY;
    const step = totalSpan / (sorted.length - 1);

    const updates = new Map<number, number>();
    sorted.forEach((l, i) => {
      updates.set(l.layerId, firstY + step * i);
    });

    this.state.updateLayers(
      this.state.layers().map(l => {
        const newY = updates.get(l.layerId);
        if (newY == null) return l;
        return { ...l, editedY: Math.round(newY) };
      }),
    );
  }

  /**
   * Sorok automatikus igazítása:
   * Hasonló Y-ú elemeket csoportosítja (threshold alapján),
   * és soron belül min(Y)-ra igazít.
   */
  alignRows(): void {
    const selected = this.state.selectedLayers();
    if (selected.length < 2) return;

    // Csoportosítás hasonló Y alapján
    const rows = this.groupIntoRows(selected);

    const updates = new Map<number, number>();
    for (const row of rows) {
      if (row.length < 2) continue;
      const minY = Math.min(...row.map(l => l.editedY ?? l.y));
      for (const l of row) {
        updates.set(l.layerId, minY);
      }
    }

    if (updates.size === 0) return;

    this.state.updateLayers(
      this.state.layers().map(l => {
        const newY = updates.get(l.layerId);
        if (newY == null) return l;
        return { ...l, editedY: newY };
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

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }
}
