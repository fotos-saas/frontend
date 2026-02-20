import { SnapshotLayer } from '@core/services/electron.types';

/** Layer kategória a vizuális szerkesztőben */
export type LayerCategory = 'student-image' | 'teacher-image' | 'student-name' | 'teacher-name' | 'fixed';

/** Személy párosítás (layer → projekt személy) */
export interface PersonMatch {
  id: number;
  name: string;
  photoThumbUrl: string | null;
}

/** Kiterjesztett layer adat a vizuális szerkesztőhöz */
export interface DesignerLayer extends SnapshotLayer {
  category: LayerCategory;
  personMatch?: PersonMatch;
  /** Szerkesztett X pozíció (PSD koordináta) — null ha nem módosult */
  editedX: number | null;
  /** Szerkesztett Y pozíció (PSD koordináta) — null ha nem módosult */
  editedY: number | null;
}

/** Méretarány és pozíció információ a canvas-hez */
export interface ScaleInfo {
  scale: number;
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
}

/** Dokumentum adat a snapshot-ból */
export interface DesignerDocument {
  name: string;
  widthPx: number;
  heightPx: number;
  dpi: number;
}

/** Grid csoport konfiguráció (diák vagy tanár grid) */
export interface GroupGridConfig {
  /** Grid bal felső sarok X (PSD px) */
  originX: number;
  /** Grid bal felső sarok Y (PSD px) */
  originY: number;
  /** Cella szélessége (PSD px) — kép + gap */
  cellWidth: number;
  /** Cella magassága (PSD px) — kép + gap */
  cellHeight: number;
  /** Kép szélessége (PSD px) */
  imageWidth: number;
  /** Kép magassága (PSD px) */
  imageHeight: number;
  /** Oszlopok száma */
  cols: number;
  /** Sorok száma */
  rows: number;
}

/** Drag állapot a natív drag rendszerhez */
export interface DragState {
  /** Eltolás PSD X koordinátában */
  deltaXPsd: number;
  /** Eltolás PSD Y koordinátában */
  deltaYPsd: number;
  /** A drag-et indító layer ID */
  originLayerId: number;
  /** Drag aktív-e */
  active: boolean;
}

/** Swap jelölt a drag-and-swap rendszerhez */
export interface SwapCandidate {
  /** Cél layer ID */
  targetLayerId: number;
  /** Átfedési százalék (0-1) */
  overlapPercent: number;
}

/** Grid cella pozíció */
export interface GridCell {
  col: number;
  row: number;
  /** Cella bal felső X (PSD px) */
  x: number;
  /** Cella bal felső Y (PSD px) */
  y: number;
}

/** Téglalap leírás overlap számításhoz */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
