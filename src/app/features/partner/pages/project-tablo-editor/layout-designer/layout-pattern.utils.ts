import { LayoutPatternType } from './layout-designer.types';

/**
 * Soronkénti elemszám tömb generálása a minta alapján.
 * A TypeScript számolja ki, JSON-ben küldjük a JSX-nek.
 *
 * @param pattern Elrendezési minta
 * @param totalItems Elemek száma összesen
 * @param maxCols Maximum oszlopszám soronként
 * @returns Tömb: minden elem = adott sor elemszáma
 */
export function buildRowConfigs(
  pattern: LayoutPatternType,
  totalItems: number,
  maxCols: number,
): number[] {
  if (totalItems <= 0 || maxCols <= 0) return [];
  maxCols = Math.max(1, Math.min(maxCols, totalItems));

  switch (pattern) {
    case 'grid':
      return buildGrid(totalItems, maxCols);
    case 'u-shape':
      return buildUShape(totalItems, maxCols);
    case 'inverted-u':
      return buildInvertedU(totalItems, maxCols);
    case 'v-shape':
      return buildVShape(totalItems, maxCols);
    case 'inverted-v':
      return buildInvertedV(totalItems, maxCols);
    case 'two-sides':
      return buildTwoSides(totalItems);
    default:
      return buildGrid(totalItems, maxCols);
  }
}

/** Fix oszlopszám, egyenletes rács */
function buildGrid(total: number, maxCols: number): number[] {
  const rows: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const count = Math.min(maxCols, remaining);
    rows.push(count);
    remaining -= count;
  }
  return rows;
}

/** Felső+alsó sor teljes, középen kevesebb (U-alak) */
function buildUShape(total: number, maxCols: number): number[] {
  const innerCols = Math.max(1, maxCols - 2);

  // Ha kevesebb elem mint 1 teljes sor → grid fallback
  if (total <= maxCols) return buildGrid(total, maxCols);

  const rows: number[] = [];
  let remaining = total;

  // Első sor: maxCols
  rows.push(Math.min(maxCols, remaining));
  remaining -= rows[0];

  // Középső sorok: innerCols
  while (remaining > maxCols) {
    const count = Math.min(innerCols, remaining);
    rows.push(count);
    remaining -= count;
  }

  // Utolsó sor: maxCols (vagy maradék)
  if (remaining > 0) {
    rows.push(Math.min(maxCols, remaining));
  }

  return rows;
}

/** Szélső sorok kevesebb, közép teljes (fordított U) */
function buildInvertedU(total: number, maxCols: number): number[] {
  const outerCols = Math.max(1, maxCols - 2);

  if (total <= outerCols) return buildGrid(total, outerCols);

  const rows: number[] = [];
  let remaining = total;

  // Első sor: outerCols
  rows.push(Math.min(outerCols, remaining));
  remaining -= rows[0];

  // Középső sorok: maxCols
  while (remaining > outerCols) {
    const count = Math.min(maxCols, remaining);
    rows.push(count);
    remaining -= count;
  }

  // Utolsó sor: outerCols (vagy maradék)
  if (remaining > 0) {
    rows.push(Math.min(outerCols, remaining));
  }

  return rows;
}

/** V-alak: felülről szűkül majd bővül */
function buildVShape(total: number, maxCols: number): number[] {
  const minCols = Math.max(1, Math.ceil(maxCols / 2));
  return buildSymmetric(total, maxCols, minCols, 'shrink-first');
}

/** Fordított V (∧): felülről bővül majd szűkül */
function buildInvertedV(total: number, maxCols: number): number[] {
  const minCols = Math.max(1, Math.ceil(maxCols / 2));
  return buildSymmetric(total, maxCols, minCols, 'expand-first');
}

/**
 * Szimmetrikus minta építése.
 * shrink-first: maxCols → minCols → maxCols (V)
 * expand-first: minCols → maxCols → minCols (∧)
 */
function buildSymmetric(
  total: number,
  maxCols: number,
  minCols: number,
  direction: 'shrink-first' | 'expand-first',
): number[] {
  // Minta generálás: soronként csökkenő/növekvő elemszám
  const pattern: number[] = [];
  const step = 1;

  if (direction === 'shrink-first') {
    // V: max → min → max
    for (let c = maxCols; c >= minCols; c -= step) pattern.push(c);
    for (let c = minCols + step; c <= maxCols; c += step) pattern.push(c);
  } else {
    // ∧: min → max → min
    for (let c = minCols; c <= maxCols; c += step) pattern.push(c);
    for (let c = maxCols - step; c >= minCols; c -= step) pattern.push(c);
  }

  // Elemszám kitöltés a mintából ciklikusan
  const rows: number[] = [];
  let remaining = total;
  let idx = 0;

  while (remaining > 0) {
    const cols = pattern[Math.min(idx, pattern.length - 1)];
    const count = Math.min(cols, remaining);
    rows.push(count);
    remaining -= count;
    idx++;
  }

  return rows;
}

/** Két oldal: minden sor 2 elem (bal+jobb szél) */
function buildTwoSides(total: number): number[] {
  const rows: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const count = Math.min(2, remaining);
    rows.push(count);
    remaining -= count;
  }
  return rows;
}
