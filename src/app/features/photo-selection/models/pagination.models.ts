/**
 * Pagination típusok és konfigurációk - US-008
 *
 * Pagination fallback implementálás nagy képlistákhoz.
 * Virtual scroll-lal kombinálva VAGY önállóan használható.
 */

/**
 * Pagination konfiguráció
 */
export interface PaginationConfig {
  /** Page méret (default: 100) */
  pageSize: number;

  /** Virtual scroll használata (feature flag) */
  useVirtualScroll: boolean;

  /** Kezdeti betöltendő oldalak száma */
  initialPages: number;
}

/**
 * Pagination állapot
 */
export interface PaginationState {
  /** Betöltött oldalak száma */
  loadedPages: number;

  /** Összes elem száma */
  totalCount: number;

  /** Betöltés folyamatban */
  isLoadingMore: boolean;
}

/**
 * Default pagination konfiguráció
 *
 * Virtual scroll KIKAPCSOLVA alapértelmezettként:
 * - 100 kép alatt felesleges és rontja a UX-et (üres hely, bonyolultabb scroll)
 * - CSS Grid pagination mód jobb kevés képnél
 * - Ha 100+ kép van, a state-ben dinamikusan bekapcsolható
 */
export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  pageSize: 100,
  useVirtualScroll: false, // Kikapcsolva - CSS Grid jobb kevés képnél
  initialPages: 1,
};

/**
 * Helper: Kiszámolja a betöltött elemek számát
 */
export function getLoadedCount(state: PaginationState, config: PaginationConfig): number {
  return Math.min(state.loadedPages * config.pageSize, state.totalCount);
}

/**
 * Helper: Van-e még betöltetlen elem
 */
export function hasMoreItems(state: PaginationState, config: PaginationConfig): boolean {
  return getLoadedCount(state, config) < state.totalCount;
}

/**
 * Helper: Következő oldal betöltésének offset-je
 */
export function getNextPageOffset(state: PaginationState, config: PaginationConfig): number {
  return state.loadedPages * config.pageSize;
}

/**
 * Helper: Elemek szeletelése a betöltött oldalak alapján
 */
export function sliceItemsForPagination<T>(
  items: T[],
  state: PaginationState,
  config: PaginationConfig
): T[] {
  const loadedCount = getLoadedCount(state, config);
  return items.slice(0, loadedCount);
}
