/**
 * TrackBy Utilities
 *
 * Újrafelhasználható trackBy függvények Angular ngFor direktívákhoz.
 * Ezek segítik a DOM újrahasználatot és javítják a lista renderelés teljesítményét.
 *
 * Használat:
 *   @for (item of items; track trackById($index, item)) { ... }
 *   @for (item of items; track trackByKey($index, item)) { ... }
 */

/**
 * Track by ID
 * Numerikus id mezővel rendelkező objektumokhoz.
 */
export function trackById<T extends { id: number }>(index: number, item: T): number {
  return item.id;
}

/**
 * Track by String ID
 * String id mezővel rendelkező objektumokhoz.
 */
export function trackByStringId<T extends { id: string }>(index: number, item: T): string {
  return item.id;
}

/**
 * Track by Key
 * String key mezővel rendelkező objektumokhoz (pl. preset-ek).
 */
export function trackByKey<T extends { key: string }>(index: number, item: T): string {
  return item.key;
}

/**
 * Track by Index
 * Amikor nincs egyedi azonosító, az index alapján követjük.
 * Kevésbé hatékony, de használható egyszerű listáknál.
 */
export function trackByIndex(index: number): number {
  return index;
}

/**
 * Track by Slug
 * String slug mezővel rendelkező objektumokhoz.
 */
export function trackBySlug<T extends { slug: string }>(index: number, item: T): string {
  return item.slug;
}

/**
 * Track by Name
 * String name mezővel rendelkező objektumokhoz.
 */
export function trackByName<T extends { name: string }>(index: number, item: T): string {
  return item.name;
}

/**
 * Track by File Name
 * Fájl objektumokhoz, name mező alapján.
 */
export function trackByFileName(index: number, file: File): string {
  return file.name;
}

/**
 * Track by Media ID
 * Media objektumokhoz numerikus id mezővel.
 */
export function trackByMediaId<T extends { id: number }>(index: number, media: T): number {
  return media.id;
}

/**
 * Track by Deadline
 * Deadline string mezővel rendelkező objektumokhoz (voting-okhoz).
 */
export function trackByDeadline<T extends { deadline: string }>(index: number, item: T): string {
  return item.deadline;
}

/**
 * Track by UUID
 * UUID mezővel rendelkező objektumokhoz.
 */
export function trackByUuid<T extends { uuid: string }>(index: number, item: T): string {
  return item.uuid;
}

/**
 * Track by Value
 * Primitív értékekhez (string, number).
 */
export function trackByValue<T extends string | number>(index: number, value: T): T {
  return value;
}

/**
 * Create custom trackBy
 * Factory függvény egyedi trackBy készítéséhez.
 *
 * Használat:
 *   const trackByCustomField = createTrackBy<MyType, string>(item => item.customField);
 */
export function createTrackBy<T, K>(
  keySelector: (item: T) => K
): (index: number, item: T) => K {
  return (index: number, item: T) => keySelector(item);
}
