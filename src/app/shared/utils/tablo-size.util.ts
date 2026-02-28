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

/**
 * Projekt meretanak megallapitasa — SINGLE SOURCE OF TRUTH.
 *
 * Prioritas:
 * 1. project.tabloSize (manuálisan mentett méret)
 * 2. selectTabloSize(personsCount) (automatikus szamitas)
 */
export function resolveProjectTabloSize(
  project: { tabloSize?: string | null; personsCount: number },
  sizes: TabloSize[],
  threshold: TabloSizeThreshold | null,
): TabloSize | null {
  if (project.tabloSize) {
    const found = sizes.find(s => s.value === project.tabloSize);
    if (found) return found;
  }
  return selectTabloSize(project.personsCount, sizes, threshold);
}
