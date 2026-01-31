import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import {
  FilterContext,
  PersistedFilterState,
  SortDirection,
  FILTER_SCHEMA_VERSION,
  FILTER_URL_PARAMS,
  getStorageKey,
} from '../../shared/types/filter-state.types';
import { LoggerService } from './logger.service';
import { safeJsonParse } from '../../shared/utils/safe-json-parse';

/**
 * Filter Persistence Service
 *
 * Központosított szűrő perzisztencia URL sync + localStorage fallback-kel.
 * Támogatja a schema verziókezelést és a Safari Private mode-ot.
 */
@Injectable({
  providedIn: 'root'
})
export class FilterPersistenceService {
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  // Memory fallback Safari Private mode-hoz
  private memoryFallback = new Map<string, string>();

  /**
   * Filter state betöltése URL params-ból vagy localStorage-ból
   *
   * Prioritás:
   * 1. URL query params (ha van bármelyik filter-related param)
   * 2. localStorage (schema verzió ellenőrzéssel)
   * 3. null (default értékek kellenek)
   */
  loadState(
    context: FilterContext,
    route: ActivatedRoute
  ): Partial<PersistedFilterState> | null {
    // 1. Próbáljuk az URL-ből
    const urlState = this.loadFromUrl(route);
    if (urlState) {
      return urlState;
    }

    // 2. Próbáljuk localStorage-ból
    return this.loadFromStorage(context);
  }

  /**
   * Filter state mentése URL-be és localStorage-ba
   */
  saveState(
    context: FilterContext,
    state: PersistedFilterState,
    route: ActivatedRoute,
    defaults: { sortBy: string; sortDir: SortDirection }
  ): void {
    // URL frissítés
    this.saveToUrl(state, route, defaults);

    // localStorage mentés
    this.saveToStorage(context, state);
  }

  /**
   * Filter state törlése (reset to defaults)
   */
  clearState(context: FilterContext, route: ActivatedRoute): void {
    // URL params törlése
    this.router.navigate([], {
      relativeTo: route,
      queryParams: {
        [FILTER_URL_PARAMS.SEARCH]: null,
        [FILTER_URL_PARAMS.SORT]: null,
        [FILTER_URL_PARAMS.DIR]: null,
        [FILTER_URL_PARAMS.PAGE]: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    // localStorage törlése
    const key = getStorageKey(context);
    this.removeItem(key);
  }

  // === URL PERSISTENCE ===

  private loadFromUrl(route: ActivatedRoute): Partial<PersistedFilterState> | null {
    const params = route.snapshot.queryParams;

    // Ellenőrizzük, hogy van-e bármelyik filter-related param
    const hasFilterParams = Object.values(FILTER_URL_PARAMS).some(
      paramKey => params[paramKey] !== undefined && params[paramKey] !== ''
    );

    // Egyedi filter params ellenőrzése (pl. status, aware, draft, city)
    const filterKeys = Object.keys(params).filter(
      key => !Object.values(FILTER_URL_PARAMS).includes(key as typeof FILTER_URL_PARAMS[keyof typeof FILTER_URL_PARAMS])
    );
    const hasCustomFilters = filterKeys.length > 0;

    if (!hasFilterParams && !hasCustomFilters) {
      return null;
    }

    const result: Partial<PersistedFilterState> = {};

    if (params[FILTER_URL_PARAMS.SEARCH]) {
      result.search = params[FILTER_URL_PARAMS.SEARCH];
    }

    if (params[FILTER_URL_PARAMS.SORT]) {
      result.sortBy = params[FILTER_URL_PARAMS.SORT];
    }

    if (params[FILTER_URL_PARAMS.DIR]) {
      const dir = params[FILTER_URL_PARAMS.DIR];
      if (dir === 'asc' || dir === 'desc') {
        result.sortDir = dir;
      }
    }

    if (params[FILTER_URL_PARAMS.PAGE]) {
      const page = parseInt(params[FILTER_URL_PARAMS.PAGE], 10);
      if (!isNaN(page) && page > 0) {
        result.page = page;
      }
    }

    // Egyedi filterek
    if (hasCustomFilters) {
      result.filters = {};
      for (const key of filterKeys) {
        const value = params[key];
        if (value !== undefined && value !== '') {
          result.filters[key] = value;
        }
      }
    }

    return result;
  }

  private saveToUrl(
    state: PersistedFilterState,
    route: ActivatedRoute,
    defaults: { sortBy: string; sortDir: SortDirection }
  ): void {
    const queryParams: Params = {
      // Csak nem-default értékeket mentünk
      [FILTER_URL_PARAMS.SEARCH]: state.search || null,
      [FILTER_URL_PARAMS.SORT]: state.sortBy !== defaults.sortBy ? state.sortBy : null,
      [FILTER_URL_PARAMS.DIR]: state.sortDir !== defaults.sortDir ? state.sortDir : null,
      [FILTER_URL_PARAMS.PAGE]: state.page > 1 ? state.page : null,
    };

    // Egyedi filterek
    for (const [key, value] of Object.entries(state.filters)) {
      queryParams[key] = value || null;
    }

    this.router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // === LOCALSTORAGE PERSISTENCE ===

  private loadFromStorage(context: FilterContext): Partial<PersistedFilterState> | null {
    const key = getStorageKey(context);
    const stored = this.getItem(key);

    if (!stored) {
      return null;
    }

    const parsed = safeJsonParse<PersistedFilterState | null>(stored, null);

    if (!parsed) {
      // Hibás JSON - töröljük
      this.removeItem(key);
      return null;
    }

    // Schema verzió ellenőrzés
    if (parsed.version !== FILTER_SCHEMA_VERSION) {
      this.logger.debug(
        `[FilterPersistence] Schema version mismatch for ${key}: ` +
        `expected ${FILTER_SCHEMA_VERSION}, got ${parsed.version}. Clearing.`
      );
      this.removeItem(key);
      return null;
    }

    return parsed;
  }

  private saveToStorage(context: FilterContext, state: PersistedFilterState): void {
    const key = getStorageKey(context);
    const toStore: PersistedFilterState = {
      ...state,
      version: FILTER_SCHEMA_VERSION,
    };
    this.setItem(key, JSON.stringify(toStore));
  }

  // === LOCALSTORAGE WRAPPERS (Safari Private mode safe) ===

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      this.memoryFallback.set(key, value);
    } catch {
      // QuotaExceededError - memory fallback
      this.memoryFallback.set(key, value);
    }
  }

  private getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      return this.memoryFallback.get(key) ?? null;
    } catch {
      return this.memoryFallback.get(key) ?? null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Összes filter state törlése (kijelentkezéskor!)
   *
   * Törli az összes `filters:` prefix-ű localStorage kulcsot,
   * hogy ne keveredjenek össze a különböző felhasználók szűrői.
   */
  clearAllFilters(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('filters:')) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
        this.logger.debug(`[FilterPersistence] Cleared filter: ${key}`);
      }

      // Memory fallback törlése is
      for (const key of this.memoryFallback.keys()) {
        if (key.startsWith('filters:')) {
          this.memoryFallback.delete(key);
        }
      }
    } catch {
      // Silent fail
    }
  }
}
