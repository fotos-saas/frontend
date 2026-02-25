import { TabloSize, TabloSizeThreshold } from '../../features/partner/models/partner.models';

/**
 * Automatikus tablomeret valasztas a diakletszam es a kuszobertek alapjan.
 *
 * Ha van threshold beallitva:
 *   - personsCount < threshold → below meret
 *   - personsCount >= threshold → above meret
 * Ha nincs threshold → az elso meretet valasztja.
 */
export function selectTabloSize(
  personsCount: number,
  sizes: TabloSize[],
  threshold: TabloSizeThreshold | null,
): TabloSize | null {
  if (sizes.length === 0) return null;

  if (threshold) {
    const targetValue = personsCount < threshold.threshold
      ? threshold.below
      : threshold.above;
    return sizes.find(s => s.value === targetValue) ?? sizes[0];
  }

  return sizes[0];
}
