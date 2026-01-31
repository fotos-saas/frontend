/**
 * Selection Helper Functions
 *
 * Centralizált toggle és selectAll logika.
 * Kiváltja a duplikált implementációkat:
 * - tablo-workflow.service.ts (togglePhotoSelection, selectAll, deselectAll)
 * - photo-selection.state.ts (togglePhoto, selectAll, deselectAll)
 * - selection-grid.component.ts (onPhotoClick, onSelectAll, onDeselectAll)
 */

export interface ToggleResult {
  selection: number[];
  wasSelected: boolean;
  wasBlocked: boolean; // true ha max elérve és nem volt kiválasztva
}

/**
 * Fotó toggle a kiválasztásban
 *
 * @param currentSelection Jelenlegi kiválasztott ID-k
 * @param photoId Toggle-ölandó fotó ID
 * @param allowMultiple Több fotó kiválasztható-e
 * @param max Maximum kiválasztható (null = korlátlan)
 * @returns ToggleResult object
 */
export function togglePhotoInSelection(
  currentSelection: number[],
  photoId: number,
  allowMultiple: boolean,
  max: number | null
): ToggleResult {
  const isSelected = currentSelection.includes(photoId);

  if (isSelected) {
    // Deselect
    return {
      selection: currentSelection.filter(id => id !== photoId),
      wasSelected: true,
      wasBlocked: false,
    };
  }

  // Select
  if (!allowMultiple) {
    // Single select - cseréljük
    return {
      selection: [photoId],
      wasSelected: false,
      wasBlocked: false,
    };
  }

  // Multi select
  const isMaxReached = max !== null && currentSelection.length >= max;

  if (isMaxReached) {
    // Maximum elérve - nem adjuk hozzá
    return {
      selection: currentSelection,
      wasSelected: false,
      wasBlocked: true,
    };
  }

  // Hozzáadjuk
  return {
    selection: [...currentSelection, photoId],
    wasSelected: false,
    wasBlocked: false,
  };
}

/**
 * Összes fotó kiválasztása
 *
 * @param allPhotoIds Összes fotó ID
 * @param max Maximum kiválasztható (null = korlátlan)
 * @returns Kiválasztott ID-k tömbje
 */
export function selectAllPhotos(
  allPhotoIds: number[],
  max: number | null
): number[] {
  if (max !== null && allPhotoIds.length > max) {
    return allPhotoIds.slice(0, max);
  }
  return [...allPhotoIds];
}

/**
 * Összes kiválasztás törlése
 *
 * @returns Üres tömb
 */
export function deselectAllPhotos(): number[] {
  return [];
}

/**
 * Fotó kiválasztva-e (O(n) - használd Set-et ha gyakran hívod!)
 *
 * @param selection Kiválasztott ID-k
 * @param photoId Ellenőrizendő fotó ID
 * @returns true ha kiválasztva
 */
export function isPhotoSelected(selection: number[], photoId: number): boolean {
  return selection.includes(photoId);
}

/**
 * Fotó kiválasztva-e Set-ből (O(1))
 *
 * @param selectionSet Kiválasztott ID-k Set-je
 * @param photoId Ellenőrizendő fotó ID
 * @returns true ha kiválasztva
 */
export function isPhotoSelectedFromSet(selectionSet: Set<number>, photoId: number): boolean {
  return selectionSet.has(photoId);
}

/**
 * Selection tömb -> Set konverzió
 *
 * @param selection Kiválasztott ID-k
 * @returns Set<number>
 */
export function createSelectionSet(selection: number[]): Set<number> {
  return new Set(selection);
}

/**
 * US-007: Range selection - kiválaszt minden fotót két index között
 *
 * @param allPhotoIds Összes fotó ID sorrendben
 * @param currentSelection Jelenlegi kiválasztott ID-k
 * @param startId Kezdő fotó ID
 * @param endId Vég fotó ID
 * @param max Maximum kiválasztható (null = korlátlan)
 * @returns Új selection tömb
 */
export function selectRangePhotos(
  allPhotoIds: number[],
  currentSelection: number[],
  startId: number,
  endId: number,
  max: number | null
): number[] {
  const startIndex = allPhotoIds.indexOf(startId);
  const endIndex = allPhotoIds.indexOf(endId);

  if (startIndex === -1 || endIndex === -1) {
    return currentSelection;
  }

  // Min/max index (bármelyik irányba működjön)
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  // Range-ben lévő fotó ID-k
  const rangeIds = allPhotoIds.slice(minIndex, maxIndex + 1);

  // Új selection: jelenlegi + range (deduplikálva)
  const selectionSet = new Set([...currentSelection, ...rangeIds]);
  let newSelection = Array.from(selectionSet);

  // Max limit
  if (max !== null && newSelection.length > max) {
    const existingSet = new Set(currentSelection);
    const newItems = rangeIds.filter(id => !existingSet.has(id));
    const availableSlots = max - currentSelection.length;

    if (availableSlots > 0) {
      newSelection = [...currentSelection, ...newItems.slice(0, availableSlots)];
    } else {
      newSelection = currentSelection;
    }
  }

  return newSelection;
}
