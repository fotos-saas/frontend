import { DesignerLayer, LayerCategory, Rect } from './layout-designer.types';

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

/** Coupled kategória pár map: image ↔ name */
const COUPLED_MAP: Partial<Record<LayerCategory, LayerCategory>> = {
  'student-image': 'student-name',
  'student-name': 'student-image',
  'teacher-image': 'teacher-name',
  'teacher-name': 'teacher-image',
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

    const coupledCat = COUPLED_MAP[layer.category];
    if (!coupledCat) continue;

    const coupled = layers.find(
      l => l.category === coupledCat && l.personMatch?.id === layer.personMatch!.id,
    );
    if (coupled) {
      expanded.add(coupled.layerId);
    }
  }

  return expanded;
}
