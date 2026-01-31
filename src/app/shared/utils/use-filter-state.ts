import { signal, computed, inject, DestroyRef, type WritableSignal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FilterPersistenceService } from '../../core/services/filter-persistence.service';
import {
  FilterStateConfig,
  PersistedFilterState,
  SortDirection,
  FILTER_SCHEMA_VERSION,
} from '../types/filter-state.types';
import { createDebounceController, DebounceController } from './debounce.util';

/**
 * Filter State API
 *
 * A useFilterState által visszaadott objektum.
 * Tartalmaz signals-t az állapothoz és metódusokat a módosításhoz.
 */
export interface FilterStateApi<TFilters extends Record<string, string>> {
  // === SIGNALS (readonly) ===

  /** Aktuális keresési kifejezés */
  readonly search: Signal<string>;

  /** Egyedi szűrők (status, aware, draft, city, stb.) */
  readonly filters: Signal<TFilters>;

  /** Rendezési mező */
  readonly sortBy: Signal<string>;

  /** Rendezési irány */
  readonly sortDir: Signal<SortDirection>;

  /** Aktuális oldal (1-től indexelt) */
  readonly page: Signal<number>;

  /** Loading állapot */
  readonly loading: WritableSignal<boolean>;

  // === SETTERS ===

  /** Keresés beállítása (debounced) */
  setSearch(value: string): void;

  /** Keresés azonnali törlése */
  clearSearch(): void;

  /** Egyedi szűrő beállítása */
  setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]): void;

  /** Összes szűrő beállítása egyszerre */
  setFilters(filters: Partial<TFilters>): void;

  /** Rendezés beállítása */
  setSortBy(value: string): void;

  /** Rendezési irány váltása */
  toggleSortDir(): void;

  /** Rendezés beállítása egyszerre (mező + irány) */
  setSort(sortBy: string, sortDir: SortDirection): void;

  /** Oldal beállítása */
  setPage(page: number): void;

  /** Reset to defaults */
  reset(): void;

  // === HELPERS ===

  /** Összes filter aktív-e (van-e nem-default érték) */
  readonly hasActiveFilters: Signal<boolean>;

  /** API híváshoz használható params objektum */
  readonly apiParams: Signal<Record<string, string | number | boolean | undefined>>;
}

/**
 * useFilterState - Signal-based filter state management
 *
 * Használat komponensben:
 *
 * ```typescript
 * readonly filterState = useFilterState({
 *   context: { type: 'partner', page: 'projects' },
 *   defaultFilters: { status: '', aware: '', draft: '' },
 *   defaultSortBy: 'created_at',
 *   validation: {
 *     sortByOptions: ['created_at', 'school_name', 'tablo_status'],
 *     filterOptions: {
 *       status: ['active', 'completed'],
 *       aware: ['true', 'false'],
 *     }
 *   },
 *   onStateChange: () => this.loadData(),
 * });
 *
 * // Template
 * <input [ngModel]="filterState.search()" (ngModelChange)="filterState.setSearch($event)" />
 * ```
 */
export function useFilterState<TFilters extends Record<string, string>>(
  config: FilterStateConfig<TFilters>
): FilterStateApi<TFilters> {
  const persistenceService = inject(FilterPersistenceService);
  const route = inject(ActivatedRoute);
  const destroyRef = inject(DestroyRef);

  const {
    context,
    defaultFilters,
    defaultSortBy,
    defaultSortDir = 'desc',
    searchDebounceMs = 300,
    validation,
    onStateChange,
  } = config;

  // === INTERNAL STATE ===

  const _search = signal('');
  const _filters = signal<TFilters>({ ...defaultFilters });
  const _sortBy = signal(defaultSortBy);
  const _sortDir = signal<SortDirection>(defaultSortDir);
  const _page = signal(1);
  const _loading = signal(true);

  // === DEBOUNCE ===

  const searchDebounce: DebounceController = createDebounceController(() => {
    _page.set(1);
    persist();
    onStateChange?.();
  }, searchDebounceMs);

  // Cleanup on destroy
  destroyRef.onDestroy(() => {
    searchDebounce.cancel();
  });

  // === VALIDATION ===

  function isValidSortBy(value: string): boolean {
    if (!validation?.sortByOptions) return true;
    return validation.sortByOptions.includes(value);
  }

  function isValidFilterValue<K extends keyof TFilters>(key: K, value: string): boolean {
    if (!validation?.filterOptions?.[key]) return true;
    if (value === '') return true; // Empty is always valid (reset)
    return validation.filterOptions[key]!.includes(value);
  }

  // === PERSISTENCE ===

  function persist(): void {
    const state: PersistedFilterState = {
      version: FILTER_SCHEMA_VERSION,
      search: _search(),
      filters: _filters(),
      sortBy: _sortBy(),
      sortDir: _sortDir(),
      page: _page(),
    };

    persistenceService.saveState(context, state, route, {
      sortBy: defaultSortBy,
      sortDir: defaultSortDir,
    });
  }

  function loadPersistedState(): void {
    const stored = persistenceService.loadState(context, route);

    if (!stored) return;

    if (stored.search !== undefined) {
      _search.set(stored.search);
    }

    if (stored.sortBy !== undefined && isValidSortBy(stored.sortBy)) {
      _sortBy.set(stored.sortBy);
    }

    if (stored.sortDir !== undefined) {
      _sortDir.set(stored.sortDir);
    }

    if (stored.page !== undefined && stored.page > 0) {
      _page.set(stored.page);
    }

    if (stored.filters) {
      const validFilters = { ...defaultFilters };
      for (const [key, value] of Object.entries(stored.filters)) {
        if (key in defaultFilters && isValidFilterValue(key as keyof TFilters, value)) {
          (validFilters as Record<string, string>)[key] = value;
        }
      }
      _filters.set(validFilters);
    }
  }

  // === COMPUTED ===

  const hasActiveFilters = computed(() => {
    if (_search()) return true;
    if (_page() > 1) return true;
    if (_sortBy() !== defaultSortBy) return true;
    if (_sortDir() !== defaultSortDir) return true;

    const currentFilters = _filters();
    for (const [key, value] of Object.entries(currentFilters)) {
      if (value !== '' && value !== defaultFilters[key as keyof TFilters]) {
        return true;
      }
    }

    return false;
  });

  const apiParams = computed(() => {
    const params: Record<string, string | number | boolean | undefined> = {
      search: _search() || undefined,
      sort_by: _sortBy(),
      sort_dir: _sortDir(),
      page: _page(),
    };

    // Add custom filters
    const currentFilters = _filters();
    for (const [key, value] of Object.entries(currentFilters)) {
      if (value !== '') {
        // Handle boolean-like filters
        if (value === 'true' || value === 'false') {
          params[key] = value === 'true';
        } else {
          params[key] = value;
        }
      }
    }

    return params;
  });

  // === API ===

  const api: FilterStateApi<TFilters> = {
    // Signals
    search: _search.asReadonly(),
    filters: _filters.asReadonly(),
    sortBy: _sortBy.asReadonly(),
    sortDir: _sortDir.asReadonly(),
    page: _page.asReadonly(),
    loading: _loading,

    // Setters
    setSearch(value: string) {
      _search.set(value);
      searchDebounce.trigger();
    },

    clearSearch() {
      _search.set('');
      searchDebounce.cancel();
      _page.set(1);
      persist();
      onStateChange?.();
    },

    setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
      if (!isValidFilterValue(key, value)) {
        return;
      }
      _filters.update(f => ({ ...f, [key]: value }));
      _page.set(1);
      persist();
      onStateChange?.();
    },

    setFilters(filters: Partial<TFilters>) {
      const validated: Partial<TFilters> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (isValidFilterValue(key as keyof TFilters, value as string)) {
          (validated as Record<string, string>)[key] = value as string;
        }
      }
      _filters.update(f => ({ ...f, ...validated }));
      _page.set(1);
      persist();
      onStateChange?.();
    },

    setSortBy(value: string) {
      if (!isValidSortBy(value)) return;

      if (_sortBy() === value) {
        // Toggle direction if same column
        _sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
      } else {
        _sortBy.set(value);
        // Default direction based on column type
        _sortDir.set(value === 'school_name' ? 'asc' : 'desc');
      }

      _page.set(1);
      persist();
      onStateChange?.();
    },

    toggleSortDir() {
      _sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
      persist();
      onStateChange?.();
    },

    setSort(sortBy: string, sortDir: SortDirection) {
      if (!isValidSortBy(sortBy)) return;
      _sortBy.set(sortBy);
      _sortDir.set(sortDir);
      _page.set(1);
      persist();
      onStateChange?.();
    },

    setPage(page: number) {
      if (page < 1) return;
      _page.set(page);
      persist();
      onStateChange?.();
    },

    reset() {
      searchDebounce.cancel();
      _search.set('');
      _filters.set({ ...defaultFilters });
      _sortBy.set(defaultSortBy);
      _sortDir.set(defaultSortDir);
      _page.set(1);
      persistenceService.clearState(context, route);
      onStateChange?.();
    },

    // Computed
    hasActiveFilters,
    apiParams,
  };

  // === INIT ===

  // Load persisted state on creation
  loadPersistedState();

  return api;
}
