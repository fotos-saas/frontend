import { Injectable, inject, signal, computed } from '@angular/core';
import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { DesignerLayer, DesignerDocument, ScaleInfo, LayerCategory } from './layout-designer.types';
import {
  expandWithCoupledLayers, categorizeLayer, matchPerson,
  normalizeLayerSizes, alignTextToImageLayers,
} from './layout-designer.utils';
import { LayoutDesignerHistoryService } from './layout-designer-history.service';
import { LayoutDesignerSelectionService } from './layout-designer-selection.service';

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
  private readonly selection = inject(LayoutDesignerSelectionService);

  /** Dokumentum adatok */
  readonly document = signal<DesignerDocument | null>(null);

  /** Forrás címke: snapshot név vagy "Friss PSD beolvasás" */
  readonly sourceLabel = signal<string>('');

  /** Forrás dátum (ISO string) */
  readonly sourceDate = signal<string | null>(null);

  /** Az összes (látható) layer */
  readonly layers = signal<DesignerLayer[]>([]);

  /** Rejtett layerek (nem jelennek meg, de mentéskor visszakerülnek) */
  private hiddenLayers: SnapshotLayer[] = [];

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

  // --- Kijelölés delegálás (LayoutDesignerSelectionService) ---

  /** Kijelölt layer ID-k */
  readonly selectedLayerIds = this.selection.selectedLayerIds;

  /** Kijelölt layerek */
  readonly selectedLayers = this.selection.selectedLayers;

  /** Van-e kijelölés */
  readonly hasSelection = this.selection.hasSelection;

  /** Kijelölés darabszáma */
  readonly selectionCount = this.selection.selectionCount;

  /** Kijelölt layerek bounding box-a screen px-ben */
  readonly selectionScreenBounds = this.selection.selectionScreenBounds;

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

  constructor() {
    // Selection service-nek átadjuk a layers és scaleInfo signal referenciákat
    this.selection.configure(this.layers, this.scaleInfo);
  }

  /**
   * Snapshot betöltése: SnapshotLayer[] -> DesignerLayer[] konverzió.
   * Kategorizálja a layereket és párosítja a személyeket.
   */
  loadSnapshot(data: { document: DesignerDocument; layers: SnapshotLayer[] }, persons: TabloPersonItem[]): void {
    this.document.set(data.document);

    // Rejtett és 0 méretű layerek kiszűrése — nem jelennek meg a vizuális szerkesztőben
    this.hiddenLayers = data.layers.filter(l => l.visible === false || l.width <= 0 || l.height <= 0);
    const visibleLayers = data.layers.filter(l => l.visible !== false && l.width > 0 && l.height > 0);

    const designerLayers: DesignerLayer[] = visibleLayers.map(layer => {
      const category = categorizeLayer(layer);
      const personMatch = matchPerson(layer, category, persons);

      return {
        ...layer,
        category,
        personMatch: personMatch ?? undefined,
        editedX: null,
        editedY: null,
      };
    });

    // Image layerek szélességének normalizálása kategórián belül.
    normalizeLayerSizes(designerLayers);

    // Text layerek pozícionálása a párosított kép layer alapján.
    alignTextToImageLayers(designerLayers);

    this.layers.set(designerLayers);
    this.selection.clearSelection();

    this.history.clear();
    this.history.pushState(designerLayers);
  }

  // --- Kijelölés metódusok delegálása ---

  /** Kijelölés toggle (klikk/Cmd+klikk) */
  toggleSelection(layerId: number, additive: boolean): void {
    this.selection.toggleSelection(layerId, additive);
  }

  /** Kijelölés törlése */
  clearSelection(): void {
    this.selection.clearSelection();
  }

  /** Layerek kijelölése (marquee) */
  selectLayers(ids: Set<number>): void {
    this.selection.selectLayers(ids);
  }

  /** Összes nem-fixed layer kijelölése (Cmd+A) */
  selectAll(): void {
    this.selection.selectAll();
  }

  /** Meglévő kijelöléshez hozzáadás (Cmd+marquee) */
  addToSelection(ids: Set<number>): void {
    this.selection.addToSelection(ids);
  }

  /** Kijelölt elemek mozgatása (PSD koordinátákban) — csak image/fixed layerek, nevek automatikusan követik */
  moveSelectedLayers(deltaXPsd: number, deltaYPsd: number): void {
    const ids = this.selectedLayerIds();
    if (ids.size === 0) return;

    // Coupled párok bővítése (kép -> név, név -> kép) — a kijelölésben legyen benne
    const expandedIds = expandWithCoupledLayers(ids, this.layers());

    const updatedLayers = this.layers().map(l => {
      if (!expandedIds.has(l.layerId)) return l;

      // Name + position layereket kihagyjuk — az updateLayers/realignNamesToImages kezeli
      if (l.category === 'student-name' || l.category === 'teacher-name'
        || l.category === 'student-position' || l.category === 'teacher-position') return l;

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
   * Klónozza a name layereket (új objektum referencia) -> OnPush change detection működik.
   */
  realignNamesToImages(layers: DesignerLayer[]): DesignerLayer[] {
    const GAP = 8;
    const POS_GAP = 4; // gap a név és a pozíció (beosztás) között

    // 1. Név layerek igazítása a kép alá
    const afterNames = layers.map(l => {
      if (l.category !== 'student-name' && l.category !== 'teacher-name') return l;
      if (!l.personMatch) return l;

      const imageCat = l.category === 'student-name' ? 'student-image' : 'teacher-image';
      const imageLayer = layers.find(
        img => img.category === imageCat && img.personMatch?.id === l.personMatch!.id,
      );
      if (!imageLayer) return l;

      const imgX = imageLayer.editedX ?? imageLayer.x;
      const imgY = imageLayer.editedY ?? imageLayer.y;
      return { ...l, editedX: imgX, editedY: imgY + imageLayer.height + GAP };
    });

    // 2. Position layerek igazítása a NÉV alá
    return afterNames.map(l => {
      if (l.category !== 'student-position' && l.category !== 'teacher-position') return l;
      if (!l.personMatch) return l;

      const nameCat = l.category === 'student-position' ? 'student-name' : 'teacher-name';
      const nameLayer = afterNames.find(
        n => n.category === nameCat && n.personMatch?.id === l.personMatch!.id,
      );

      if (nameLayer) {
        const nameX = nameLayer.editedX ?? nameLayer.x;
        const nameY = nameLayer.editedY ?? nameLayer.y;
        return { ...l, editedX: nameX, editedY: nameY + nameLayer.height + POS_GAP };
      }

      // Fallback: ha nincs név layer, a kép alá
      const imageCat = l.category === 'student-position' ? 'student-image' : 'teacher-image';
      const imageLayer = afterNames.find(
        img => img.category === imageCat && img.personMatch?.id === l.personMatch!.id,
      );
      if (!imageLayer) return l;

      const imgX = imageLayer.editedX ?? imageLayer.x;
      const imgY = imageLayer.editedY ?? imageLayer.y;
      return { ...l, editedX: imgX, editedY: imgY + imageLayer.height + GAP };
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

  /** Módosított SnapshotLayer[] exportálása (mentéshez) — rejtett layerek is benne vannak */
  exportChanges(): SnapshotLayer[] {
    const visibleExport: SnapshotLayer[] = this.layers().map(l => ({
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
      ...(l.linked ? { linked: true } : {}),
      visible: true,
    }));

    // Rejtett layerek visszaadása változatlanul
    return [...visibleExport, ...this.hiddenLayers];
  }
}
