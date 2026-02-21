import { Injectable, inject, signal, computed } from '@angular/core';
import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { DesignerLayer, DesignerDocument, ScaleInfo, LayerCategory } from './layout-designer.types';
import { expandWithCoupledLayers } from './layout-designer.utils';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';

/** Toolbar magassága px-ben */
const TOOLBAR_HEIGHT = 56;
/** Sidebar szélessége px-ben */
const SIDEBAR_WIDTH = 220;
/** Belső padding a canvas körül */
const CANVAS_PADDING = 40;

/**
 * Layout Designer állapotkezelő service (komponens-szintű).
 * Signal-based state management a vizuális szerkesztőhöz.
 */
@Injectable()
export class LayoutDesignerStateService {

  private readonly history = inject(LayoutDesignerHistoryService);

  /** Dokumentum adatok */
  readonly document = signal<DesignerDocument | null>(null);

  /** Forrás címke: snapshot név vagy "Friss PSD beolvasás" */
  readonly sourceLabel = signal<string>('');

  /** Forrás dátum (ISO string) */
  readonly sourceDate = signal<string | null>(null);

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

    // cw/ch = overlay contentRect (padding-on belül, tehát electron padding-top már le van vonva)
    const availW = cw - SIDEBAR_WIDTH - CANVAS_PADDING * 2;
    const availH = ch - TOOLBAR_HEIGHT - CANVAS_PADDING * 2;
    const scale = Math.min(availW / doc.widthPx, availH / doc.heightPx);
    const displayWidth = doc.widthPx * scale;
    const displayHeight = doc.heightPx * scale;
    const offsetX = SIDEBAR_WIDTH + (cw - SIDEBAR_WIDTH - displayWidth) / 2;
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

    // Image layerek szélességének normalizálása kategórián belül.
    this.normalizeLayerSizes(designerLayers);

    // Text layerek pozícionálása a párosított kép layer alapján.
    this.alignTextToImageLayers(designerLayers);

    this.layers.set(designerLayers);
    this.selectedLayerIds.set(new Set());

    this.history.clear();
    this.history.pushState(designerLayers);
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

  /** Layerek kijelölése (marquee) */
  selectLayers(ids: Set<number>): void {
    this.selectedLayerIds.set(ids);
  }

  /** Meglévő kijelöléshez hozzáadás (Cmd+marquee) */
  addToSelection(ids: Set<number>): void {
    const current = new Set(this.selectedLayerIds());
    for (const id of ids) current.add(id);
    this.selectedLayerIds.set(current);
  }

  /** Kijelölt elemek mozgatása (PSD koordinátákban) — csak image/fixed layerek, nevek automatikusan követik */
  moveSelectedLayers(deltaXPsd: number, deltaYPsd: number): void {
    const ids = this.selectedLayerIds();
    if (ids.size === 0) return;

    // Coupled párok bővítése (kép → név, név → kép) — a kijelölésben legyen benne
    const expandedIds = expandWithCoupledLayers(ids, this.layers());

    const updatedLayers = this.layers().map(l => {
      if (!expandedIds.has(l.layerId)) return l;

      // Name layereket kihagyjuk — az updateLayers/realignNamesToImages kezeli
      if (l.category === 'student-name' || l.category === 'teacher-name') return l;

      const currentX = l.editedX ?? l.x;
      const currentY = l.editedY ?? l.y;

      return {
        ...l,
        editedX: currentX + deltaXPsd,
        editedY: currentY + deltaYPsd,
      };
    });

    this.updateLayers(updatedLayers);
  }

  /** Layerek frissítése (igazítás utáni állapot) — automatikus név igazítással */
  updateLayers(updatedLayers: DesignerLayer[]): void {
    const aligned = this.realignNamesToImages(updatedLayers);
    this.layers.set(aligned);
    this.history.pushState(aligned);
  }

  /**
   * Name layerek pozícióinak igazítása a párosított image alá.
   * MINDEN pozíció-módosítás után automatikusan fut az updateLayers()-en keresztül.
   * Klónozza a name layereket (új objektum referencia) → OnPush change detection működik.
   */
  realignNamesToImages(layers: DesignerLayer[]): DesignerLayer[] {
    const GAP = 8;
    const pairs: Array<[LayerCategory, LayerCategory]> = [
      ['student-image', 'student-name'],
      ['teacher-image', 'teacher-name'],
    ];

    return layers.map(l => {
      for (const [imageCat, textCat] of pairs) {
        if (l.category !== textCat || !l.personMatch) continue;

        // Párosított image keresése
        const imageLayer = layers.find(
          img => img.category === imageCat && img.personMatch?.id === l.personMatch!.id,
        );
        if (!imageLayer) continue;

        const imgX = imageLayer.editedX ?? imageLayer.x;
        const imgY = imageLayer.editedY ?? imageLayer.y;

        return { ...l, editedX: imgX, editedY: imgY + imageLayer.height + GAP };
      }
      return l;
    });
  }

  /** Van-e visszavonható lépés */
  readonly canUndo = computed(() => this.history.canUndo());

  /** Van-e újra végrehajtható lépés */
  readonly canRedo = computed(() => this.history.canRedo());

  /** Visszavonás */
  undo(): void {
    const snapshot = this.history.undo();
    if (snapshot) this.layers.set(snapshot);
  }

  /** Újra végrehajtás */
  redo(): void {
    const snapshot = this.history.redo();
    if (snapshot) this.layers.set(snapshot);
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

  }

  /**
   * Text layerek pozícionálása a párosított kép layer alapján.
   * Person ID-vel párosítjuk a kép és szöveg layereket, majd a szöveget
   * a kép közepéhez igazítjuk (X) és a kép alja alá helyezzük (Y).
   */
  private alignTextToImageLayers(layers: DesignerLayer[]): void {
    const pairs: Array<[LayerCategory, LayerCategory]> = [
      ['student-image', 'student-name'],
      ['teacher-image', 'teacher-name'],
    ];

    /** Kis gap a kép alja és a név teteje között (PSD px) */
    const GAP = 8;

    for (const [imageCat, textCat] of pairs) {
      const imageMap = new Map<number, DesignerLayer>();
      for (const l of layers) {
        if (l.category === imageCat && l.personMatch) {
          imageMap.set(l.personMatch.id, l);
        }
      }

      for (const textLayer of layers) {
        if (textLayer.category !== textCat || !textLayer.personMatch) continue;

        const imageLayer = imageMap.get(textLayer.personMatch.id);
        if (!imageLayer) continue;

        // X és width: kép pozíciójára és szélességére igazítás
        // A text-align: center a span-on a kép közepéhez centrázza a szöveget
        textLayer.x = imageLayer.x;
        textLayer.width = imageLayer.width;

        // Y: kép alja + gap
        textLayer.y = imageLayer.y + imageLayer.height + GAP;
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
