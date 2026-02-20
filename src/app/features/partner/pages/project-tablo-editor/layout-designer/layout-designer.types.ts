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
