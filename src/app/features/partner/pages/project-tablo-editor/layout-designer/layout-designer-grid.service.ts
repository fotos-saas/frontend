import { Injectable, inject, signal, computed } from '@angular/core';
import { PhotoshopService } from '../../../services/photoshop.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { GroupGridConfig, GridCell, LayerCategory, DesignerLayer } from './layout-designer.types';
import { cmToPx } from './layout-designer.utils';

/** Grid megjelenítési mód */
export type GridMode = 'off' | 'auto' | 'student' | 'teacher';

/** Mód ciklus: off → auto → student → teacher → off */
const MODE_CYCLE: GridMode[] = ['off', 'auto', 'student', 'teacher'];

/** Mód megjelenítési nevek */
const MODE_LABELS: Record<GridMode, string> = {
  off: 'Rács ki',
  auto: 'Mind',
  student: 'Diák',
  teacher: 'Tanár',
};

/**
 * Grid konfig számítás és snap-to-grid logika.
 * Komponens-szintű injectable — a layout-designer providers-ben.
 */
@Injectable()
export class LayoutDesignerGridService {
  private readonly ps = inject(PhotoshopService);
  private readonly state = inject(LayoutDesignerStateService);

  /** Grid mód: off / auto (mindkettő) / student / teacher */
  readonly gridMode = signal<GridMode>('off');

  /** Grid engedélyezve-e (bármely mód ami nem 'off') */
  readonly gridEnabled = computed(() => this.gridMode() !== 'off');

  /** Aktuális mód címkéje */
  readonly gridModeLabel = computed(() => MODE_LABELS[this.gridMode()]);

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

  /** Diák grid látható-e az aktuális módban */
  readonly showStudentGrid = computed(() => {
    const mode = this.gridMode();
    return mode === 'auto' || mode === 'student';
  });

  /** Tanár grid látható-e az aktuális módban */
  readonly showTeacherGrid = computed(() => {
    const mode = this.gridMode();
    return mode === 'auto' || mode === 'teacher';
  });

  /** Grid mód váltás (ciklikus: off → auto → student → teacher → off) */
  cycleGridMode(): void {
    const current = this.gridMode();
    const idx = MODE_CYCLE.indexOf(current);
    const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    this.gridMode.set(next);
  }

  /** Grid toggle (backward compat) */
  toggleGrid(): void {
    this.cycleGridMode();
  }

  /**
   * Összes image layer gridbe igazítása.
   * Minden image → legközelebbi grid cella, name → image alá.
   * Egy cellát csak 1 image foglalhat (greedy: sor-fő sorrendben).
   */
  snapAllToGrid(): void {
    const layers = this.state.layers();

    // Image layerek kategóriánként
    const studentImages = layers.filter(l => l.category === 'student-image');
    const teacherImages = layers.filter(l => l.category === 'teacher-image');

    // Snap image-ek a grid-hez
    const updates = new Map<number, { x: number; y: number }>();

    this.snapGroupToGrid(studentImages, this.studentGrid(), updates);
    this.snapGroupToGrid(teacherImages, this.teacherGrid(), updates);

    if (updates.size === 0) return;

    // Csak image layerek frissítése — a name-eket az updateLayers automatikusan igazítja
    const updatedLayers = layers.map(l => {
      const imgUpdate = updates.get(l.layerId);
      if (imgUpdate) return { ...l, editedX: imgUpdate.x, editedY: imgUpdate.y };
      return l;
    });

    this.state.updateLayers(updatedLayers);
  }

  /** Csoport image-ek snap-elése a gridhez (greedy, foglalt cellák kihagyása) */
  private snapGroupToGrid(
    images: DesignerLayer[],
    grid: GroupGridConfig | null,
    updates: Map<number, { x: number; y: number }>,
  ): void {
    if (!grid || images.length === 0) return;

    const cells = this.generateCells(grid);
    const usedCells = new Set<string>();

    // Rendezés: sor → oszlop sorrend (bal-felülről jobb-alulra)
    const sorted = [...images].sort((a, b) => {
      const ay = a.editedY ?? a.y;
      const by = b.editedY ?? b.y;
      const dy = ay - by;
      if (Math.abs(dy) > grid.cellHeight / 2) return dy;
      return (a.editedX ?? a.x) - (b.editedX ?? b.x);
    });

    for (const img of sorted) {
      const imgX = img.editedX ?? img.x;
      const imgY = img.editedY ?? img.y;
      const cx = imgX + img.width / 2;
      const cy = imgY + img.height / 2;

      // Legközelebbi szabad cella
      let bestCell: GridCell | null = null;
      let bestDist = Infinity;

      for (const cell of cells) {
        const key = `${cell.col},${cell.row}`;
        if (usedCells.has(key)) continue;

        const cellCx = cell.x + grid.imageWidth / 2;
        const cellCy = cell.y + grid.imageHeight / 2;
        const dist = Math.hypot(cx - cellCx, cy - cellCy);

        if (dist < bestDist) {
          bestDist = dist;
          bestCell = cell;
        }
      }

      if (bestCell) {
        usedCells.add(`${bestCell.col},${bestCell.row}`);
        updates.set(img.layerId, { x: bestCell.x, y: bestCell.y });
      }
    }
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

    // Origin Y: tanárok felülre (marginPx), diákok alulra (alulról felfelé)
    let originY: number;
    if (type === 'teacher') {
      originY = marginPx;
    } else {
      // Diákok: alulról felfelé — grid alja a docHeight - marginPx vonalhoz igazodik
      const gridTotalH = rows * imageHeightPx + (rows - 1) * gapVPx;
      originY = docHeight - marginPx - gridTotalH;
    }

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
