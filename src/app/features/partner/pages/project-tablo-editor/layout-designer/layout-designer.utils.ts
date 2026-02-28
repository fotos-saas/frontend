import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { DesignerDocument, DesignerLayer, LayerCategory, PersonMatch, Rect } from './layout-designer.types';
import { PhotoUploadPerson } from './components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';

/** cm → PSD pixel konverzió */
export function cmToPx(cm: number, dpi: number): number {
  return Math.round(cm / 2.54 * dpi);
}

/**
 * Két téglalap átfedési százaléka (0-1).
 * A kisebb terület arányában számol.
 */
export function overlapPercent(a: Rect, b: Rect): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const overlapArea = overlapX * overlapY;

  if (overlapArea === 0) return 0;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const minArea = Math.min(areaA, areaB);

  return minArea > 0 ? overlapArea / minArea : 0;
}

/** Coupled kategória pár map: image ↔ name/position */
const COUPLED_MAP: Partial<Record<LayerCategory, LayerCategory[]>> = {
  'student-image': ['student-name', 'student-position'],
  'student-name': ['student-image'],
  'student-position': ['student-image'],
  'teacher-image': ['teacher-name', 'teacher-position'],
  'teacher-name': ['teacher-image'],
  'teacher-position': ['teacher-image'],
};

/**
 * Kijelölés bővítése coupled image↔name párokkal.
 * Ha egy image ki van jelölve, a hozzá tartozó name is bekerül, és fordítva.
 * Person ID-vel párosít.
 */
export function expandWithCoupledLayers(layerIds: Set<number>, layers: DesignerLayer[]): Set<number> {
  const expanded = new Set(layerIds);

  for (const id of layerIds) {
    const layer = layers.find(l => l.layerId === id);
    if (!layer || !layer.personMatch) continue;

    const coupledCats = COUPLED_MAP[layer.category];
    if (!coupledCats) continue;

    for (const coupledCat of coupledCats) {
      const coupled = layers.find(
        l => l.category === coupledCat && l.personMatch?.id === layer.personMatch!.id,
      );
      if (coupled) {
        expanded.add(coupled.layerId);
      }
    }
  }

  return expanded;
}

/** Snapshot adat parse — közös logika a betöltéshez és váltáshoz */
export function parseSnapshotData(data: Record<string, unknown>): { document: DesignerDocument; layers: SnapshotLayer[] } | null {
  const document = data['document'] as DesignerDocument | undefined;
  if (!document) return null;
  return { document, layers: (data['layers'] as SnapshotLayer[] | undefined) ?? [] };
}

/** Kijelölt image layerekből egyedi személyek kinyerése */
export function extractImagePersons(selectedLayers: DesignerLayer[], allPersons: TabloPersonItem[]): PhotoUploadPerson[] {
  const result: PhotoUploadPerson[] = [];
  const seen = new Set<number>();
  for (const l of selectedLayers) {
    if ((l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch && !seen.has(l.personMatch.id)) {
      seen.add(l.personMatch.id);
      const full = allPersons.find(p => p.id === l.personMatch!.id);
      result.push({
        id: l.personMatch.id, name: l.personMatch.name,
        type: l.category === 'teacher-image' ? 'teacher' : 'student',
        archiveId: full?.archiveId ?? null,
      });
    }
  }
  return result;
}

// --- Layer building segédfüggvények (layout-designer-state.service.ts-ből kiemelve) ---

/** Layer kategorizálása a groupPath alapján */
export function categorizeLayer(layer: SnapshotLayer): LayerCategory {
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
    if (topGroup === 'Positions') {
      if (subGroup === 'Students') return 'student-position';
      if (subGroup === 'Teachers') return 'teacher-position';
    }
  }

  return 'fixed';
}

/**
 * Személy párosítása layer név alapján.
 * A layerName formátum: "slug---personId" (pl. "kiss-janos---42").
 * Először a person ID-vel próbálunk, ha nincs --- szeparátor, akkor név egyezés.
 */
export function matchPerson(layer: SnapshotLayer, category: LayerCategory, persons: TabloPersonItem[]): PersonMatch | null {
  if (category === 'fixed') return null;

  // 1. Person ID kinyerése a layerName-ből (slug---personId formátum)
  const triDashIdx = layer.layerName.lastIndexOf('---');
  if (triDashIdx !== -1) {
    const personId = parseInt(layer.layerName.substring(triDashIdx + 3), 10);
    if (!isNaN(personId)) {
      const match = persons.find(p => p.id === personId);
      if (match) {
        return { id: match.id, name: match.name, photoThumbUrl: match.photoThumbUrl, photoUrl: match.photoUrl };
      }
    }
  }

  // 2. Fallback: pontos név egyezés
  const nameMatch = persons.find(p => p.name === layer.layerName);
  if (nameMatch) {
    return { id: nameMatch.id, name: nameMatch.name, photoThumbUrl: nameMatch.photoThumbUrl, photoUrl: nameMatch.photoUrl };
  }

  return null;
}

/**
 * Image layerek szélességének normalizálása kategórián belül.
 * A boundsNoEffects eltérő méretet adhat (üres SO, eltérő szöveghossz),
 * ezért kategórián belül medián értékre egységesítünk.
 * FIGYELEM: helyben módosítja a tömb elemeit (mutáció)!
 */
export function normalizeLayerSizes(layers: DesignerLayer[]): void {
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
 * FIGYELEM: helyben módosítja a tömb elemeit (mutáció)!
 */
export function alignTextToImageLayers(layers: DesignerLayer[]): void {
  const GAP = 8;
  const POS_GAP = 4;

  // 1. Név layerek igazítása a kép alá
  const namePairs: Array<[LayerCategory, LayerCategory]> = [
    ['student-image', 'student-name'],
    ['teacher-image', 'teacher-name'],
  ];

  for (const [imageCat, textCat] of namePairs) {
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

      textLayer.x = imageLayer.x;
      textLayer.width = imageLayer.width;
      textLayer.y = imageLayer.y + imageLayer.height + GAP;
    }
  }

  // 2. Position layerek igazítása a NÉV alá
  const posPairs: Array<[LayerCategory, LayerCategory]> = [
    ['student-name', 'student-position'],
    ['teacher-name', 'teacher-position'],
  ];

  for (const [nameCat, posCat] of posPairs) {
    const nameMap = new Map<number, DesignerLayer>();
    for (const l of layers) {
      if (l.category === nameCat && l.personMatch) {
        nameMap.set(l.personMatch.id, l);
      }
    }

    for (const posLayer of layers) {
      if (posLayer.category !== posCat || !posLayer.personMatch) continue;

      const nameLayer = nameMap.get(posLayer.personMatch.id);
      if (!nameLayer) continue;

      posLayer.x = nameLayer.x;
      posLayer.width = nameLayer.width;
      posLayer.y = nameLayer.y + nameLayer.height + POS_GAP;
    }
  }
}
