import { DesignerLayer } from './layout-designer.types';

/** Sorok Y-threshold: ezen belüli Y-u elemek egy sorba tartoznak */
const ROW_THRESHOLD_PX = 20;

/** Pozicio slot-ok kiolvasasa: Y->X sor-csoportositassal rendezve (LTR) */
export function getPositionSlots(images: DesignerLayer[]): Array<{ x: number; y: number }> {
  const sorted = [...images].sort((a, b) =>
    (a.editedY ?? a.y) - (b.editedY ?? b.y),
  );

  const rows: DesignerLayer[][] = [];
  let currentRow: DesignerLayer[] = [];
  let currentRowY = -Infinity;

  for (const layer of sorted) {
    const y = layer.editedY ?? layer.y;
    if (currentRow.length === 0 || Math.abs(y - currentRowY) <= ROW_THRESHOLD_PX) {
      currentRow.push(layer);
      if (currentRow.length === 1) currentRowY = y;
    } else {
      rows.push(currentRow);
      currentRow = [layer];
      currentRowY = y;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Sorokon belul X szerinti rendezes
  const slots: Array<{ x: number; y: number }> = [];
  for (const row of rows) {
    row.sort((a, b) => (a.editedX ?? a.x) - (b.editedX ?? b.x));
    for (const l of row) {
      slots.push({ x: l.editedX ?? l.x, y: l.editedY ?? l.y });
    }
  }

  return slots;
}

/** Soronkenti elemszamok kiolvasasa (sor-csoportositas Y alapjan) */
export function getRowSizes(images: DesignerLayer[]): number[] {
  const sorted = [...images].sort((a, b) =>
    (a.editedY ?? a.y) - (b.editedY ?? b.y),
  );

  const rowSizes: number[] = [];
  let currentCount = 0;
  let currentRowY = -Infinity;

  for (const layer of sorted) {
    const y = layer.editedY ?? layer.y;
    if (currentCount === 0 || Math.abs(y - currentRowY) <= ROW_THRESHOLD_PX) {
      currentCount++;
      if (currentCount === 1) currentRowY = y;
    } else {
      rowSizes.push(currentCount);
      currentCount = 1;
      currentRowY = y;
    }
  }
  if (currentCount > 0) rowSizes.push(currentCount);

  return rowSizes;
}

/**
 * Ket csoportot valtogatva fuz ossze.
 * Ha az egyik csoport kifogy, a maradekot egyenletesen szetszorja.
 */
function interleaveWithSpread(groupA: string[], groupB: string[], slotCount: number): string[] {
  const first = groupA.length >= groupB.length ? groupA : groupB;
  const second = groupA.length >= groupB.length ? groupB : groupA;

  if (second.length === 0) {
    return [...first];
  }

  if (first.length <= second.length + 1) {
    const row: string[] = [];
    let fIdx = 0;
    let sIdx = 0;
    for (let i = 0; i < slotCount; i++) {
      if (i % 2 === 0 && fIdx < first.length) {
        row.push(first[fIdx++]);
      } else if (sIdx < second.length) {
        row.push(second[sIdx++]);
      } else if (fIdx < first.length) {
        row.push(first[fIdx++]);
      }
    }
    return row;
  }

  const row: (string | null)[] = new Array(slotCount).fill(null);
  const spacing = slotCount / (second.length + 1);

  const secondPositions: number[] = [];
  for (let i = 0; i < second.length; i++) {
    const pos = Math.round(spacing * (i + 1)) - 1;
    const finalPos = Math.min(Math.max(pos, 0), slotCount - 1);
    secondPositions.push(finalPos);
  }

  const usedPositions = new Set<number>();
  for (let i = 0; i < secondPositions.length; i++) {
    let pos = secondPositions[i];
    while (usedPositions.has(pos) && pos < slotCount - 1) pos++;
    while (usedPositions.has(pos) && pos > 0) pos--;
    usedPositions.add(pos);
    row[pos] = second[i];
  }

  let fIdx = 0;
  for (let k = 0; k < slotCount; k++) {
    if (row[k] === null && fIdx < first.length) {
      row[k] = first[fIdx++];
    }
  }

  return row as string[];
}

/**
 * Valtogatasos nemek szerinti elosztas soronkent.
 * Elsodleges cel: fiu-lany-fiu-lany valtogatas.
 * Ha az egyik nembol elfogy, a maradekot egyenletesen szetszorja
 * a soron belul (ne csomban legyen a sor vegen).
 */
export function distributeAlternating(
  boys: DesignerLayer[],
  girls: DesignerLayer[],
  rowSizes: number[],
): string[] {
  const totalSlots = rowSizes.reduce((a, b) => a + b, 0);
  let bIdx = 0;
  let gIdx = 0;
  const result: string[] = [];

  for (const rowSize of rowSizes) {
    const remainingSlots = totalSlots - result.length;
    const remainingBoys = boys.length - bIdx;
    const remainingGirls = girls.length - gIdx;

    let boysInRow = Math.round((remainingBoys / Math.max(remainingSlots, 1)) * rowSize);
    boysInRow = Math.min(boysInRow, rowSize, remainingBoys);
    let girlsInRow = Math.min(rowSize - boysInRow, remainingGirls);
    if (boysInRow + girlsInRow < rowSize) {
      boysInRow = Math.min(rowSize - girlsInRow, remainingBoys);
    }

    const rowBoys: string[] = [];
    const rowGirls: string[] = [];
    for (let i = 0; i < boysInRow && bIdx < boys.length; i++) {
      rowBoys.push(boys[bIdx++].personMatch?.name ?? '');
    }
    for (let i = 0; i < girlsInRow && gIdx < girls.length; i++) {
      rowGirls.push(girls[gIdx++].personMatch?.name ?? '');
    }

    const rowResult = interleaveWithSpread(rowBoys, rowGirls, rowSize);
    result.push(...rowResult);
  }

  return result;
}
