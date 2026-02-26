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
 * U-alak: két szár (2 elem soronként a széleken) + teljes alsó sor.
 * Valódi U betű forma felülről nézve.
 * Pl. maxCols=14, total=25 → [2, 2, 2, 2, 2, 2, 2, 2, 9]
 * Pl. maxCols=14, total=30 → [2, 2, 2, 2, 2, 2, 14, 4] (ha sok elem van)
 */
function buildUShape(total: number, maxCols: number): number[] {
  if (total <= maxCols) return [total];
  if (maxCols < 3) return buildGrid(total, maxCols);

  // Az alsó sor teljes (maxCols), a többit szárakra osztjuk (2/sor)
  // Ha kell, több teljes sor is lehet alul
  const rows: number[] = [];
  let remaining = total;

  // Minimum 2 sor szár kell hogy U legyen
  const minStemRows = 2;
  const stemItems = minStemRows * 2; // 4 elem szárakra
  const bottomItems = remaining - stemItems;

  if (bottomItems <= maxCols && bottomItems > 0) {
    // Egyszerű eset: pár szár sor + 1 alsó sor
    for (let i = 0; i < minStemRows; i++) rows.push(2);
    rows.push(bottomItems);
  } else {
    // Sok elem: szárak felül, teljes sorok alul, maradék az utolsó sorban
    remaining = total;

    // Szár sorok felül (2 elem) — annyi amennyit kell
    // Úgy számolunk: alulra maxCols-os sorok kellenek, felülre 2-es szárak
    const fullBottomRows = Math.floor((remaining - minStemRows * 2) / maxCols);
    const afterFull = remaining - minStemRows * 2 - fullBottomRows * maxCols;

    // Szárak
    for (let i = 0; i < minStemRows; i++) rows.push(2);

    // Teljes sorok
    for (let i = 0; i < fullBottomRows; i++) rows.push(maxCols);

    // Maradék
    if (afterFull > 0) rows.push(afterFull);
  }

  return rows;
}

/**
 * Fordított U (∩): teljes felső sor + két szár (2 elem soronként a széleken).
 * Pl. maxCols=14, total=25 → [9, 2, 2, 2, 2, 2, 2, 2]
 */
function buildInvertedU(total: number, maxCols: number): number[] {
  if (total <= maxCols) return [total];
  if (maxCols < 3) return buildGrid(total, maxCols);

  const rows: number[] = [];
  let remaining = total;

  // Minimum 2 sor szár kell
  const minStemRows = 2;
  const stemItems = minStemRows * 2;
  const topItems = remaining - stemItems;

  if (topItems <= maxCols && topItems > 0) {
    // Egyszerű eset: 1 felső sor + pár szár sor
    rows.push(topItems);
    for (let i = 0; i < minStemRows; i++) rows.push(2);
  } else {
    // Sok elem: teljes sorok felül, szárak alul
    remaining = total;

    const fullTopRows = Math.floor((remaining - minStemRows * 2) / maxCols);
    const afterFull = remaining - fullTopRows * maxCols - minStemRows * 2;

    // Teljes sorok
    for (let i = 0; i < fullTopRows; i++) rows.push(maxCols);

    // Maradék ha van (plusz sor)
    if (afterFull > 0) rows.push(afterFull);

    // Szárak
    for (let i = 0; i < minStemRows; i++) rows.push(2);
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
