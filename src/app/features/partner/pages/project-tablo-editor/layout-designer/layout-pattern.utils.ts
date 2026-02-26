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

/**
 * U-alak: teljes sorok felül, az utolsó sor rövidebb.
 * Pl. maxCols=14, total=38 → [14, 14, 10]
 */
function buildUShape(total: number, maxCols: number): number[] {
  if (total <= maxCols) return buildGrid(total, maxCols);

  const rows: number[] = [];
  let remaining = total;

  // Teljes sorok amíg lehet
  while (remaining > maxCols) {
    rows.push(maxCols);
    remaining -= maxCols;
  }

  // Utolsó sor: ami marad (rövidebb)
  if (remaining > 0) {
    rows.push(remaining);
  }

  return rows;
}

/**
 * Fordított U: az első sor rövidebb, utána teljes sorok.
 * Pl. maxCols=14, total=38 → [10, 14, 14]
 */
function buildInvertedU(total: number, maxCols: number): number[] {
  if (total <= maxCols) return buildGrid(total, maxCols);

  // Hány teljes sor fér el + maradék
  const fullRows = Math.floor(total / maxCols);
  const remainder = total - fullRows * maxCols;

  const rows: number[] = [];

  if (remainder > 0) {
    // Első sor: a maradék (rövidebb)
    rows.push(remainder);
  }

  // Teljes sorok
  for (let i = 0; i < fullRows; i++) {
    rows.push(maxCols);
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
