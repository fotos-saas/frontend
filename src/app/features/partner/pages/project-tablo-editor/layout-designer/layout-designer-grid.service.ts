import { Injectable, inject, signal, computed } from '@angular/core';
import { PhotoshopService } from '../../../services/photoshop.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { GroupGridConfig, GridCell, LayerCategory, DesignerLayer } from './layout-designer.types';
import { cmToPx } from './layout-designer.utils';

/**
 * Grid konfig számítás és snap-to-grid logika.
 * Komponens-szintű injectable — a layout-designer providers-ben.
 */
@Injectable()
export class LayoutDesignerGridService {
  private readonly ps = inject(PhotoshopService);
  private readonly state = inject(LayoutDesignerStateService);

  /** Grid megjelenítés be/ki */
  readonly gridEnabled = signal(false);

  /** Diák grid konfiguráció */
  readonly studentGrid = computed<GroupGridConfig | null>(() => {
    const doc = this.state.document();
    if (!doc) return null;
    return this.buildGrid('student', doc.dpi, doc.widthPx, doc.heightPx);
  });

  /** Tanár grid konfiguráció */
  readonly teacherGrid = computed<GroupGridConfig | null>(() => {
    const doc = this.state.document();
    if (!doc) return null;
    return this.buildGrid('teacher', doc.dpi, doc.widthPx, doc.heightPx);
  });

  /** Grid toggle */
  toggleGrid(): void {
    this.gridEnabled.update(v => !v);
  }

  /**
   * Legközelebbi grid cellába snap-elés.
   * @returns snap-elt pozíció, vagy null ha nincs matching grid
   */
  snapToGrid(x: number, y: number, width: number, height: number, category: LayerCategory): { x: number; y: number } | null {
    const grid = this.getGridForCategory(category);
    if (!grid) return null;

    const cells = this.generateCells(grid);
    if (cells.length === 0) return null;

    // A kép közepét a legközelebbi cella közepéhez keressük
    const cx = x + width / 2;
    const cy = y + height / 2;

    let bestCell: GridCell | null = null;
    let bestDist = Infinity;

    for (const cell of cells) {
      const cellCx = cell.x + grid.imageWidth / 2;
      const cellCy = cell.y + grid.imageHeight / 2;
      const dist = Math.hypot(cx - cellCx, cy - cellCy);

      if (dist < bestDist) {
        bestDist = dist;
        bestCell = cell;
      }
    }

    if (!bestCell) return null;

    // A kép bal felső sarkát a cella bal felső sarkába snap-eljük
    return { x: bestCell.x, y: bestCell.y };
  }

  /** Grid konfiguráció a kategória alapján */
  private getGridForCategory(category: LayerCategory): GroupGridConfig | null {
    if (category === 'student-image' || category === 'student-name') {
      return this.studentGrid();
    }
    if (category === 'teacher-image' || category === 'teacher-name') {
      return this.teacherGrid();
    }
    return null;
  }

  /** Grid cellák generálása */
  private generateCells(grid: GroupGridConfig): GridCell[] {
    const cells: GridCell[] = [];
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        cells.push({
          col,
          row,
          x: grid.originX + col * grid.cellWidth,
          y: grid.originY + row * grid.cellHeight,
        });
      }
    }
    return cells;
  }

  /**
   * Tényleges image magasság kiolvasása a layerekből.
   * A képek nem mindig négyzetesek — a medián magasságot használjuk.
   */
  private getActualImageHeight(category: 'student-image' | 'teacher-image'): number | null {
    const layers = this.state.layers();
    const group = layers.filter(l => l.category === category);
    if (group.length === 0) return null;

    const heights = group.map(l => l.height).sort((a, b) => a - b);
    return heights[Math.floor(heights.length / 2)];
  }

  /**
   * Grid építése a PhotoshopService signal-okból.
   * Szélesség: cm konfig alapján, magasság: tényleges layer méretekből.
   * GridAlign (left/center/right) figyelembevételével.
   */
  private buildGrid(
    type: 'student' | 'teacher',
    dpi: number,
    docWidth: number,
    docHeight: number,
  ): GroupGridConfig | null {
    const marginPx = cmToPx(this.ps.marginCm(), dpi);
    const sizeCm = type === 'student' ? this.ps.studentSizeCm() : this.ps.teacherSizeCm();
    const imageWidthPx = cmToPx(sizeCm, dpi);
    const gapHPx = cmToPx(this.ps.gapHCm(), dpi);
    const gapVPx = cmToPx(this.ps.gapVCm(), dpi);
    const gridAlign = this.ps.gridAlign();

    if (imageWidthPx <= 0) return null;

    // Tényleges image magasság a layerekből (nem négyzetes!)
    const imageCat = type === 'student' ? 'student-image' : 'teacher-image' as const;
    const actualHeight = this.getActualImageHeight(imageCat);
    const imageHeightPx = actualHeight ?? imageWidthPx;

    // Elérhető terület a margókon belül
    const availW = docWidth - marginPx * 2;
    const availH = docHeight - marginPx * 2;

    if (availW <= 0 || availH <= 0) return null;

    // Oszlopok és sorok számítása
    const cellWidth = imageWidthPx + gapHPx;
    const cellHeight = imageHeightPx + gapVPx;

    const cols = Math.max(1, Math.floor((availW + gapHPx) / cellWidth));
    const rows = Math.max(1, Math.floor((availH + gapVPx) / cellHeight));

    // Grid teljes szélessége (gap nélkül a végén)
    const gridTotalW = cols * imageWidthPx + (cols - 1) * gapHPx;

    // Origin X a gridAlign alapján
    let originX: number;
    switch (gridAlign) {
      case 'left':
        originX = marginPx;
        break;
      case 'right':
        originX = docWidth - marginPx - gridTotalW;
        break;
      case 'center':
      default:
        originX = marginPx + (availW - gridTotalW) / 2;
        break;
    }

    const originY = marginPx;

    return {
      originX: Math.round(originX),
      originY: Math.round(originY),
      cellWidth: Math.round(cellWidth),
      cellHeight: Math.round(cellHeight),
      imageWidth: Math.round(imageWidthPx),
      imageHeight: Math.round(imageHeightPx),
      cols,
      rows,
    };
  }
}
