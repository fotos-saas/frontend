import { signal, computed } from '@angular/core';
import { WorkflowPhoto } from '../models/workflow.models';
import { DEFAULT_PAGINATION_CONFIG, PaginationConfig } from '../models/pagination.models';

/**
 * Pagination State
 *
 * Kezeli a fotók pagination/virtual scroll állapotát.
 * US-008 implementáció.
 */
export class PaginationState {
  /** Pagination konfiguráció */
  readonly config = signal<PaginationConfig>(DEFAULT_PAGINATION_CONFIG);

  /** Összes fotó száma (pagination-höz) */
  readonly totalCount = signal<number>(0);

  /** Minden fotó (pagination: csak a betöltöttek vannak a visiblePhotos-ban) */
  readonly allPhotos = signal<WorkflowPhoto[]>([]);

  /** Látható fotók (paginált vagy teljes lista) */
  readonly visiblePhotos = signal<WorkflowPhoto[]>([]);

  /** Több betöltése folyamatban */
  readonly isLoadingMore = signal<boolean>(false);

  // === COMPUTED VALUES ===

  /** Virtual scroll használata */
  readonly useVirtualScroll = computed(() => this.config().useVirtualScroll);

  /** Van-e még betöltetlen fotó */
  readonly hasMorePhotos = computed(() =>
    !this.useVirtualScroll() && this.visiblePhotos().length < this.totalCount()
  );

  /** Page size getter */
  readonly pageSize = computed(() => this.config().pageSize);

  // === METHODS ===

  /**
   * Pagination konfiguráció beállítása
   */
  setConfig(config: Partial<PaginationConfig>): void {
    this.config.update(current => ({
      ...current,
      ...config,
    }));
  }

  /**
   * Teljes fotólista beállítása
   * @param photos Az összes fotó
   * @param totalCount Összes fotó száma
   */
  setAllPhotos(photos: WorkflowPhoto[], totalCount: number): void {
    this.allPhotos.set(photos);
    this.totalCount.set(totalCount);

    // Virtual scroll esetén az összes látható
    if (this.useVirtualScroll()) {
      this.visiblePhotos.set(photos);
    } else {
      // Pagination esetén csak az első oldal
      const size = this.config().pageSize;
      this.visiblePhotos.set(photos.slice(0, size));
    }
  }

  /**
   * Több fotó betöltésének indítása
   */
  startLoadingMore(): void {
    this.isLoadingMore.set(true);
  }

  /**
   * Több fotó betöltése (pagination)
   * @param photos Az új betöltött fotók
   */
  loadMorePhotos(photos: WorkflowPhoto[]): void {
    this.visiblePhotos.update(current => [...current, ...photos]);
    this.isLoadingMore.set(false);
  }

  /**
   * Következő oldal fotóinak lekérése az allPhotos-ból
   * @returns A következő oldal fotói, vagy üres tömb ha nincs több
   */
  getNextPagePhotos(): WorkflowPhoto[] {
    if (this.useVirtualScroll()) return [];

    const currentCount = this.visiblePhotos().length;
    const all = this.allPhotos();
    const size = this.config().pageSize;

    if (currentCount >= all.length) return [];

    return all.slice(currentCount, currentCount + size);
  }

  /**
   * Reset
   */
  reset(): void {
    this.config.set(DEFAULT_PAGINATION_CONFIG);
    this.totalCount.set(0);
    this.allPhotos.set([]);
    this.visiblePhotos.set([]);
    this.isLoadingMore.set(false);
  }
}
