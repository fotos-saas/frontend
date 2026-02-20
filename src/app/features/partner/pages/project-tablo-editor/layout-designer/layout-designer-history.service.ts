import { Injectable, signal, computed } from '@angular/core';
import { DesignerLayer } from './layout-designer.types';

/** Maximum tárolt snapshot szám */
const MAX_SNAPSHOTS = 50;

/**
 * Layout Designer History Service — Undo/Redo kezelés.
 * Snapshot-based: a teljes DesignerLayer[] tömb másolatát tárolja minden művelet után.
 * Komponens-szintű injectable (providers tömbbe kell).
 */
@Injectable()
export class LayoutDesignerHistoryService {

  private snapshots: DesignerLayer[][] = [];
  private readonly _currentIndex = signal(-1);

  /** Van-e visszavonható lépés */
  readonly canUndo = computed(() => this._currentIndex() > 0);

  /** Van-e újra végrehajtható lépés */
  readonly canRedo = computed(() => this._currentIndex() < this.snapshots.length - 1);

  /**
   * Új állapot mentése a history-ba.
   * A currentIndex utáni elemeket levágja (redo ág törlés).
   */
  pushState(layers: DesignerLayer[]): void {
    const idx = this._currentIndex();

    // Redo ág levágása
    this.snapshots = this.snapshots.slice(0, idx + 1);

    // Deep clone (flat objektumok, spread elég)
    this.snapshots.push(layers.map(l => ({ ...l })));

    // Limit ellenőrzés
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.shift();
    } else {
      this._currentIndex.set(this.snapshots.length - 1);
      return;
    }

    this._currentIndex.set(this.snapshots.length - 1);
  }

  /** Visszavonás — visszaadja az előző állapot klónját, vagy null */
  undo(): DesignerLayer[] | null {
    if (!this.canUndo()) return null;

    this._currentIndex.update(i => i - 1);
    return this.cloneCurrent();
  }

  /** Újra végrehajtás — visszaadja a következő állapot klónját, vagy null */
  redo(): DesignerLayer[] | null {
    if (!this.canRedo()) return null;

    this._currentIndex.update(i => i + 1);
    return this.cloneCurrent();
  }

  /** History törlése (pl. új snapshot betöltésekor) */
  clear(): void {
    this.snapshots = [];
    this._currentIndex.set(-1);
  }

  private cloneCurrent(): DesignerLayer[] {
    return this.snapshots[this._currentIndex()].map(l => ({ ...l }));
  }
}
