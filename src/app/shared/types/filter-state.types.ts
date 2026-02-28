/**
 * Filter Persistence Types
 *
 * Közös típusok a lista szűrők perzisztenciájához.
 * Schema verziókezelés biztosítja, hogy fejlesztés közben ne ragadjon be régi adat.
 */

/**
 * Aktuális schema verzió.
 * NÖVELD, ha a FilterState struktúrája változik!
 */
export const FILTER_SCHEMA_VERSION = 1;

/**
 * Támogatott rendezési irányok
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter context típusok - meghatározza a storage kulcsot
 */
export interface PartnerFilterContext {
  type: 'partner';
  page: 'projects' | 'contacts' | 'schools' | 'clients' | 'teachers' | 'students' | 'finalizations' | 'bookings' | 'activity-log' | 'workflows';
}

export interface MarketerFilterContext {
  type: 'marketer';
  page: 'projects' | 'schools';
}

export interface SuperAdminFilterContext {
  type: 'super-admin';
  page: 'subscribers' | 'partners' | 'bugs';
}

export interface BugReportFilterContext {
  type: 'bugs';
  page: 'partner' | 'marketer' | 'designer';
}

export type FilterContext = PartnerFilterContext | MarketerFilterContext | SuperAdminFilterContext | BugReportFilterContext;

/**
 * Perzisztált filter state struktúra
 */
export interface PersistedFilterState {
  /** Schema verzió - ha nem egyezik FILTER_SCHEMA_VERSION-nel, törlődik */
  version: number;

  /** Keresési kifejezés */
  search: string;

  /** Egyedi szűrők (pl. status, aware, draft, city) */
  filters: Record<string, string>;

  /** Rendezési mező */
  sortBy: string;

  /** Rendezési irány */
  sortDir: SortDirection;

  /** Aktuális oldal (1-től indexelt) */
  page: number;
}

/**
 * Filter konfiguráció a useFilterState-hez
 */
export interface FilterStateConfig<TFilters extends Record<string, string> = Record<string, string>> {
  /** Filter context (partner/marketer + page) */
  context: FilterContext;

  /** Default szűrő értékek */
  defaultFilters: TFilters;

  /** Default rendezési mező */
  defaultSortBy: string;

  /** Default rendezési irány (default: 'desc') */
  defaultSortDir?: SortDirection;

  /** Keresés debounce idő ms-ben (default: 300) */
  searchDebounceMs?: number;

  /** Validációs szabályok */
  validation?: {
    /** Érvényes sortBy értékek */
    sortByOptions?: string[];

    /** Érvényes szűrő értékek kulcsonként */
    filterOptions?: Partial<Record<keyof TFilters, string[]>>;
  };

  /** Callback amikor az állapot változik */
  onStateChange?: () => void;
}

/**
 * URL query param kulcsok
 */
export const FILTER_URL_PARAMS = {
  SEARCH: 'search',
  SORT: 'sort',
  DIR: 'dir',
  PAGE: 'page',
} as const;

/**
 * Storage kulcs generálás a context alapján
 *
 * @example
 * getStorageKey({ type: 'partner', page: 'projects' }) // 'filters:partner:projects'
 */
export function getStorageKey(context: FilterContext): string {
  return `filters:${context.type}:${context.page}`;
}
