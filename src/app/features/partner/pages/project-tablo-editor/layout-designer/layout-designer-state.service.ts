import { Injectable, signal, computed } from '@angular/core';
import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { DesignerLayer, DesignerDocument, ScaleInfo, LayerCategory } from './layout-designer.types';

/** Toolbar magassága px-ben */
const TOOLBAR_HEIGHT = 56;
/** Belső padding a canvas körül */
const CANVAS_PADDING = 40;

/**
 * Layout Designer állapotkezelő service (komponens-szintű).
 * Signal-based state management a vizuális szerkesztőhöz.
 */
@Injectable()
export class LayoutDesignerStateService {

  /** Dokumentum adatok */
  readonly document = signal<DesignerDocument | null>(null);

  /** Az összes layer */
  readonly layers = signal<DesignerLayer[]>([]);

  /** Kijelölt layer ID-k */
  readonly selectedLayerIds = signal<Set<number>>(new Set());

  /** Viewport méret (a konténer mérete) */
  readonly containerWidth = signal(0);
  readonly containerHeight = signal(0);

  /** Méretarány és pozíció a canvashoz */
  readonly scaleInfo = computed<ScaleInfo>(() => {
    const doc = this.document();
    const cw = this.containerWidth();
    const ch = this.containerHeight();

    if (!doc || cw === 0 || ch === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0 };
    }

    const availW = cw - CANVAS_PADDING * 2;
    const availH = ch - TOOLBAR_HEIGHT - CANVAS_PADDING * 2;
    const scale = Math.min(availW / doc.widthPx, availH / doc.heightPx);
    const displayWidth = doc.widthPx * scale;
    const displayHeight = doc.heightPx * scale;
    const offsetX = (cw - displayWidth) / 2;
    const offsetY = TOOLBAR_HEIGHT + (ch - TOOLBAR_HEIGHT - displayHeight) / 2;

    return { scale, offsetX, offsetY, displayWidth, displayHeight };
  });

  /** Kijelölt layerek */
  readonly selectedLayers = computed(() => {
    const ids = this.selectedLayerIds();
    return this.layers().filter(l => ids.has(l.layerId));
  });

  /** Van-e kijelölés */
  readonly hasSelection = computed(() => this.selectedLayerIds().size > 0);

  /** Kijelölés darabszáma */
  readonly selectionCount = computed(() => this.selectedLayerIds().size);

  /** Van-e módosított layer */
  readonly hasChanges = computed(() => {
    return this.layers().some(l => l.editedX !== null || l.editedY !== null);
  });

  /** Dokumentum méret cm-ben (DPI alapján) */
  readonly documentSizeCm = computed(() => {
    const doc = this.document();
    if (!doc) return null;
    const widthCm = +(doc.widthPx / doc.dpi * 2.54).toFixed(1);
    const heightCm = +(doc.heightPx / doc.dpi * 2.54).toFixed(1);
    return { widthCm, heightCm };
  });

  /**
   * Snapshot betöltése: SnapshotLayer[] → DesignerLayer[] konverzió.
   * Kategorizálja a layereket és párosítja a személyeket.
   */
  loadSnapshot(data: { document: DesignerDocument; layers: SnapshotLayer[] }, persons: TabloPersonItem[]): void {
    this.document.set(data.document);

    const designerLayers: DesignerLayer[] = data.layers.map(layer => {
      const category = this.categorizeLayer(layer);
      const personMatch = this.matchPerson(layer, category, persons);

      return {
        ...layer,
        category,
        personMatch: personMatch ?? undefined,
        editedX: null,
        editedY: null,
      };
    });

    // Layerek méretének normalizálása kategórián belül.
    // A boundsNoEffects eltérő méretet adhat (üres SO, eltérő szöveghossz),
    // ezért kategórián belül medián értékre egységesítünk.
    this.normalizeLayerSizes(designerLayers);

    this.layers.set(designerLayers);
    this.selectedLayerIds.set(new Set());
  }

  /** Kijelölés toggle (klikk/Cmd+klikk) */
  toggleSelection(layerId: number, additive: boolean): void {
    const current = new Set(this.selectedLayerIds());

    if (additive) {
      if (current.has(layerId)) {
        current.delete(layerId);
      } else {
        current.add(layerId);
      }
    } else {
      if (current.has(layerId) && current.size === 1) {
        current.clear();
      } else {
        current.clear();
        current.add(layerId);
      }
    }

    this.selectedLayerIds.set(current);
  }

  /** Kijelölés törlése */
  clearSelection(): void {
    this.selectedLayerIds.set(new Set());
  }

  /** Kijelölt elemek mozgatása (PSD koordinátákban) */
  moveSelectedLayers(deltaXPsd: number, deltaYPsd: number): void {
    const ids = this.selectedLayerIds();
    if (ids.size === 0) return;

    this.layers.update(layers => layers.map(l => {
      if (!ids.has(l.layerId)) return l;

      const currentX = l.editedX ?? l.x;
      const currentY = l.editedY ?? l.y;

      return {
        ...l,
        editedX: currentX + deltaXPsd,
        editedY: currentY + deltaYPsd,
      };
    }));
  }

  /** Layerek frissítése (igazítás utáni állapot) */
  updateLayers(updatedLayers: DesignerLayer[]): void {
    this.layers.set(updatedLayers);
  }

  /** Módosított SnapshotLayer[] exportálása (mentéshez) */
  exportChanges(): SnapshotLayer[] {
    return this.layers().map(l => ({
      layerId: l.layerId,
      layerName: l.layerName,
      groupPath: l.groupPath,
      x: l.editedX ?? l.x,
      y: l.editedY ?? l.y,
      width: l.width,
      height: l.height,
      kind: l.kind,
      ...(l.text != null ? { text: l.text } : {}),
      ...(l.justification != null ? { justification: l.justification } : {}),
    }));
  }

  /**
   * Layer méretek normalizálása kategórián belül.
   * A boundsNoEffects eltérő méretet adhat (üres SO, eltérő szöveghossz),
   * ezért kategórián belül medián értékre egységesítünk.
   */
  private normalizeLayerSizes(layers: DesignerLayer[]): void {
    // Image layerek: szélesség normalizálás
    for (const cat of ['student-image', 'teacher-image'] as const) {
      const group = layers.filter(l => l.category === cat);
      if (group.length < 2) continue;

      const widths = group.map(l => l.width).sort((a, b) => a - b);
      const medianW = widths[Math.floor(widths.length / 2)];

      for (const layer of group) {
        if (layer.width !== medianW) {
          const diff = layer.width - medianW;
          layer.x = Math.round(layer.x + diff / 2);
          layer.width = medianW;
        }
      }
    }

    // Text layerek: magasság normalizálás (a font méret ebből számolódik)
    for (const cat of ['student-name', 'teacher-name'] as const) {
      const group = layers.filter(l => l.category === cat);
      if (group.length < 2) continue;

      const heights = group.map(l => l.height).sort((a, b) => a - b);
      const medianH = heights[Math.floor(heights.length / 2)];

      for (const layer of group) {
        if (layer.height !== medianH) {
          // Y pozíció korrekció: alsó élhez igazítás megtartása
          const diff = layer.height - medianH;
          layer.y = Math.round(layer.y + diff);
          layer.height = medianH;
        }
      }
    }
  }

  /** Layer kategorizálása a groupPath alapján */
  private categorizeLayer(layer: SnapshotLayer): LayerCategory {
    const path = layer.groupPath;

    if (path.length >= 2) {
      const topGroup = path[0];
      const subGroup = path[1];

      if (topGroup === 'Images') {
        if (subGroup === 'Students') return 'student-image';
        if (subGroup === 'Teachers') return 'teacher-image';
      }
      if (topGroup === 'Names') {
        if (subGroup === 'Students') return 'student-name';
        if (subGroup === 'Teachers') return 'teacher-name';
      }
    }

    return 'fixed';
  }

  /**
   * Személy párosítása layer név alapján.
   * A layerName formátum: "slug---personId" (pl. "kiss-janos---42").
   * Először a person ID-vel próbálunk, ha nincs --- szeparátor, akkor név egyezés.
   */
  private matchPerson(layer: SnapshotLayer, category: LayerCategory, persons: TabloPersonItem[]): { id: number; name: string; photoThumbUrl: string | null } | null {
    if (category === 'fixed') return null;

    // 1. Person ID kinyerése a layerName-ből (slug---personId formátum)
    const triDashIdx = layer.layerName.lastIndexOf('---');
    if (triDashIdx !== -1) {
      const personId = parseInt(layer.layerName.substring(triDashIdx + 3), 10);
      if (!isNaN(personId)) {
        const match = persons.find(p => p.id === personId);
        if (match) {
          return { id: match.id, name: match.name, photoThumbUrl: match.photoThumbUrl };
        }
      }
    }

    // 2. Fallback: pontos név egyezés
    const nameMatch = persons.find(p => p.name === layer.layerName);
    if (nameMatch) {
      return { id: nameMatch.id, name: nameMatch.name, photoThumbUrl: nameMatch.photoThumbUrl };
    }

    return null;
  }
}
