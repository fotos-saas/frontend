import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { FilterPersistenceService } from '../../core/services/filter-persistence.service';
import { useFilterState, type FilterStateApi } from './use-filter-state';
import type { FilterStateConfig } from '../types/filter-state.types';

type TestFilters = { status: string; city: string };

describe('useFilterState', () => {
  let mockPersistenceService: {
    saveState: ReturnType<typeof vi.fn>;
    loadState: ReturnType<typeof vi.fn>;
    clearState: ReturnType<typeof vi.fn>;
  };

  let mockRoute: Partial<ActivatedRoute>;

  const defaultConfig: FilterStateConfig<TestFilters> = {
    context: { type: 'partner', page: 'projects' },
    defaultFilters: { status: '', city: '' },
    defaultSortBy: 'created_at',
    defaultSortDir: 'desc',
    validation: {
      sortByOptions: ['created_at', 'school_name', 'status'],
      filterOptions: {
        status: ['active', 'completed', 'draft'],
        city: ['Budapest', 'Debrecen'],
      },
    },
  };

  function createFilterState(
    configOverrides: Partial<FilterStateConfig<TestFilters>> = {},
  ): FilterStateApi<TestFilters> {
    let api!: FilterStateApi<TestFilters>;

    TestBed.runInInjectionContext(() => {
      api = useFilterState<TestFilters>({ ...defaultConfig, ...configOverrides });
    });

    return api;
  }

  beforeEach(() => {
    mockPersistenceService = {
      saveState: vi.fn(),
      loadState: vi.fn().mockReturnValue(null),
      clearState: vi.fn(),
    };

    mockRoute = {};

    TestBed.configureTestingModule({
      providers: [
        { provide: FilterPersistenceService, useValue: mockPersistenceService },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    });
  });

  // ==========================================================================
  // Alap létrehozás
  // ==========================================================================
  describe('initial state', () => {
    it('should create with default values', () => {
      const api = createFilterState();

      expect(api.search()).toBe('');
      expect(api.filters()).toEqual({ status: '', city: '' });
      expect(api.sortBy()).toBe('created_at');
      expect(api.sortDir()).toBe('desc');
      expect(api.page()).toBe(1);
      expect(api.loading()).toBe(true);
    });

    it('should load persisted state on creation', () => {
      mockPersistenceService.loadState.mockReturnValue({
        version: 1,
        search: 'teszt',
        sortBy: 'school_name',
        sortDir: 'asc',
        page: 3,
        filters: { status: 'active', city: 'Budapest' },
      });

      const api = createFilterState();

      expect(api.search()).toBe('teszt');
      expect(api.sortBy()).toBe('school_name');
      expect(api.sortDir()).toBe('asc');
      expect(api.page()).toBe(3);
      expect(api.filters().status).toBe('active');
      expect(api.filters().city).toBe('Budapest');
    });

    it('should ignore invalid sortBy from persisted state', () => {
      mockPersistenceService.loadState.mockReturnValue({
        version: 1,
        search: '',
        sortBy: 'invalid_column',
        sortDir: 'asc',
        page: 1,
        filters: {},
      });

      const api = createFilterState();
      expect(api.sortBy()).toBe('created_at'); // maradt default
    });

    it('should ignore invalid filter values from persisted state', () => {
      mockPersistenceService.loadState.mockReturnValue({
        version: 1,
        search: '',
        sortBy: 'created_at',
        sortDir: 'desc',
        page: 1,
        filters: { status: 'invalid_status', city: 'Budapest' },
      });

      const api = createFilterState();
      expect(api.filters().status).toBe(''); // default, mert invalid
      expect(api.filters().city).toBe('Budapest'); // valid, megtartva
    });

    it('should ignore page <= 0 from persisted state', () => {
      mockPersistenceService.loadState.mockReturnValue({
        version: 1,
        search: '',
        sortBy: 'created_at',
        sortDir: 'desc',
        page: 0,
        filters: {},
      });

      const api = createFilterState();
      expect(api.page()).toBe(1);
    });
  });

  // ==========================================================================
  // setSearch
  // ==========================================================================
  describe('setSearch', () => {
    it('should update search signal', () => {
      const api = createFilterState();

      api.setSearch('keresés');
      expect(api.search()).toBe('keresés');
    });
  });

  // ==========================================================================
  // clearSearch
  // ==========================================================================
  describe('clearSearch', () => {
    it('should clear search and reset page to 1', () => {
      const api = createFilterState();

      api.setSearch('teszt');
      api.setPage(5);
      api.clearSearch();

      expect(api.search()).toBe('');
      expect(api.page()).toBe(1);
    });

    it('should call onStateChange', () => {
      const onStateChange = vi.fn();
      const api = createFilterState({ onStateChange });

      api.clearSearch();
      expect(onStateChange).toHaveBeenCalled();
    });

    it('should persist state', () => {
      const api = createFilterState();
      api.clearSearch();

      expect(mockPersistenceService.saveState).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // setFilter
  // ==========================================================================
  describe('setFilter', () => {
    it('should set a single filter value', () => {
      const api = createFilterState();

      api.setFilter('status', 'active');
      expect(api.filters().status).toBe('active');
    });

    it('should reset page to 1', () => {
      const api = createFilterState();
      api.setPage(5);

      api.setFilter('status', 'active');
      expect(api.page()).toBe(1);
    });

    it('should reject invalid filter value', () => {
      const api = createFilterState();

      api.setFilter('status', 'invalid_value');
      expect(api.filters().status).toBe('');
    });

    it('should allow empty string (reset)', () => {
      const api = createFilterState();

      api.setFilter('status', 'active');
      api.setFilter('status', '');
      expect(api.filters().status).toBe('');
    });

    it('should call onStateChange', () => {
      const onStateChange = vi.fn();
      const api = createFilterState({ onStateChange });

      api.setFilter('status', 'active');
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // setFilters (batch)
  // ==========================================================================
  describe('setFilters', () => {
    it('should set multiple filters at once', () => {
      const api = createFilterState();

      api.setFilters({ status: 'active', city: 'Budapest' });
      expect(api.filters().status).toBe('active');
      expect(api.filters().city).toBe('Budapest');
    });

    it('should validate each filter value', () => {
      const api = createFilterState();

      api.setFilters({ status: 'invalid', city: 'Budapest' });
      expect(api.filters().status).toBe(''); // maradt default mert invalid
      expect(api.filters().city).toBe('Budapest');
    });

    it('should reset page to 1', () => {
      const api = createFilterState();
      api.setPage(5);

      api.setFilters({ status: 'active' });
      expect(api.page()).toBe(1);
    });
  });

  // ==========================================================================
  // setSortBy
  // ==========================================================================
  describe('setSortBy', () => {
    it('should set sort column', () => {
      const api = createFilterState();

      api.setSortBy('school_name');
      expect(api.sortBy()).toBe('school_name');
    });

    it('should toggle direction when clicking same column', () => {
      const api = createFilterState();
      // Default: created_at desc
      api.setSortBy('created_at');
      expect(api.sortDir()).toBe('asc');
    });

    it('should set default direction based on column name', () => {
      const api = createFilterState();

      api.setSortBy('school_name');
      expect(api.sortDir()).toBe('asc'); // school_name -> asc

      api.setSortBy('created_at');
      expect(api.sortDir()).toBe('desc'); // everything else -> desc
    });

    it('should reject invalid sortBy', () => {
      const api = createFilterState();

      api.setSortBy('invalid_column');
      expect(api.sortBy()).toBe('created_at');
    });

    it('should reset page to 1', () => {
      const api = createFilterState();
      api.setPage(5);

      api.setSortBy('school_name');
      expect(api.page()).toBe(1);
    });
  });

  // ==========================================================================
  // toggleSortDir
  // ==========================================================================
  describe('toggleSortDir', () => {
    it('should toggle from desc to asc', () => {
      const api = createFilterState();
      expect(api.sortDir()).toBe('desc');

      api.toggleSortDir();
      expect(api.sortDir()).toBe('asc');
    });

    it('should toggle from asc to desc', () => {
      const api = createFilterState({ defaultSortDir: 'asc' });

      api.toggleSortDir();
      expect(api.sortDir()).toBe('desc');
    });
  });

  // ==========================================================================
  // setSort
  // ==========================================================================
  describe('setSort', () => {
    it('should set both sortBy and sortDir', () => {
      const api = createFilterState();

      api.setSort('school_name', 'asc');
      expect(api.sortBy()).toBe('school_name');
      expect(api.sortDir()).toBe('asc');
    });

    it('should reject invalid sortBy', () => {
      const api = createFilterState();

      api.setSort('invalid', 'asc');
      expect(api.sortBy()).toBe('created_at');
    });

    it('should reset page to 1', () => {
      const api = createFilterState();
      api.setPage(3);

      api.setSort('status', 'asc');
      expect(api.page()).toBe(1);
    });
  });

  // ==========================================================================
  // setPage
  // ==========================================================================
  describe('setPage', () => {
    it('should set page', () => {
      const api = createFilterState();

      api.setPage(5);
      expect(api.page()).toBe(5);
    });

    it('should reject page < 1', () => {
      const api = createFilterState();

      api.setPage(0);
      expect(api.page()).toBe(1);

      api.setPage(-1);
      expect(api.page()).toBe(1);
    });

    it('should call onStateChange', () => {
      const onStateChange = vi.fn();
      const api = createFilterState({ onStateChange });

      api.setPage(2);
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // reset
  // ==========================================================================
  describe('reset', () => {
    it('should reset all values to defaults', () => {
      const api = createFilterState();

      api.setSearch('test');
      api.setFilter('status', 'active');
      api.setSortBy('school_name');
      api.setPage(5);

      api.reset();

      expect(api.search()).toBe('');
      expect(api.filters()).toEqual({ status: '', city: '' });
      expect(api.sortBy()).toBe('created_at');
      expect(api.sortDir()).toBe('desc');
      expect(api.page()).toBe(1);
    });

    it('should clear persisted state', () => {
      const api = createFilterState();
      api.reset();

      expect(mockPersistenceService.clearState).toHaveBeenCalled();
    });

    it('should call onStateChange', () => {
      const onStateChange = vi.fn();
      const api = createFilterState({ onStateChange });

      api.reset();
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // hasActiveFilters (computed)
  // ==========================================================================
  describe('hasActiveFilters', () => {
    it('should return false for default state', () => {
      const api = createFilterState();
      expect(api.hasActiveFilters()).toBe(false);
    });

    it('should return true when search is set', () => {
      const api = createFilterState();
      api.setSearch('test');
      expect(api.hasActiveFilters()).toBe(true);
    });

    it('should return true when filter is set', () => {
      const api = createFilterState();
      api.setFilter('status', 'active');
      expect(api.hasActiveFilters()).toBe(true);
    });

    it('should return true when sortBy differs from default', () => {
      const api = createFilterState();
      api.setSortBy('school_name');
      expect(api.hasActiveFilters()).toBe(true);
    });

    it('should return true when page > 1', () => {
      const api = createFilterState();
      api.setPage(2);
      expect(api.hasActiveFilters()).toBe(true);
    });

    it('should return true when sortDir differs from default', () => {
      const api = createFilterState();
      api.toggleSortDir();
      expect(api.hasActiveFilters()).toBe(true);
    });

    it('should return false after reset', () => {
      const api = createFilterState();
      api.setSearch('test');
      api.setFilter('status', 'active');
      api.reset();

      expect(api.hasActiveFilters()).toBe(false);
    });
  });

  // ==========================================================================
  // apiParams (computed)
  // ==========================================================================
  describe('apiParams', () => {
    it('should return base params for default state', () => {
      const api = createFilterState();
      const params = api.apiParams();

      expect(params.search).toBeUndefined();
      expect(params.sort_by).toBe('created_at');
      expect(params.sort_dir).toBe('desc');
      expect(params.page).toBe(1);
    });

    it('should include search when set', () => {
      const api = createFilterState();
      api.setSearch('teszt');

      expect(api.apiParams().search).toBe('teszt');
    });

    it('should include custom filters', () => {
      const api = createFilterState();
      api.setFilter('status', 'active');
      api.setFilter('city', 'Budapest');

      const params = api.apiParams();
      expect(params.status).toBe('active');
      expect(params.city).toBe('Budapest');
    });

    it('should not include empty filter values', () => {
      const api = createFilterState();
      const params = api.apiParams();

      expect(params.status).toBeUndefined();
      expect(params.city).toBeUndefined();
    });

    it('should convert boolean-like filter values', () => {
      // Nincs 'aware' a defaultConfig-ban, de a logika tesztelhető
      // Módosítsuk az api-t közvetlenül
      const api = createFilterState({
        defaultFilters: { status: '', city: '' },
        validation: {
          filterOptions: {
            status: ['true', 'false'],
            city: ['Budapest'],
          },
        },
      });

      api.setFilter('status', 'true');
      expect(api.apiParams().status).toBe(true);

      api.setFilter('status', 'false');
      expect(api.apiParams().status).toBe(false);
    });
  });

  // ==========================================================================
  // loading
  // ==========================================================================
  describe('loading', () => {
    it('should be writable', () => {
      const api = createFilterState();
      expect(api.loading()).toBe(true);

      api.loading.set(false);
      expect(api.loading()).toBe(false);
    });
  });
});
