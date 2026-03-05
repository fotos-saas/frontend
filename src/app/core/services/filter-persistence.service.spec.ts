import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FilterPersistenceService } from './filter-persistence.service';
import { LoggerService } from './logger.service';
import { FilterContext, FILTER_SCHEMA_VERSION } from '../../shared/types/filter-state.types';

/**
 * FilterPersistenceService unit tesztek
 *
 * URL sync + localStorage fallback, schema verziókezelés, Safari Private mode.
 */
describe('FilterPersistenceService', () => {
  let service: FilterPersistenceService;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let loggerMock: { debug: ReturnType<typeof vi.fn> };
  let routeMock: Partial<ActivatedRoute>;

  const testContext: FilterContext = { type: 'partner', page: 'projects' };

  beforeEach(() => {
    routerMock = { navigate: vi.fn() };
    loggerMock = { debug: vi.fn() };
    routeMock = {
      snapshot: {
        queryParams: {},
      } as ActivatedRoute['snapshot'],
    };

    // localStorage törlése
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FilterPersistenceService,
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(FilterPersistenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadState', () => {
    it('null-t ad vissza ha nincs URL param és nincs storage', () => {
      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result).toBeNull();
    });

    it('URL params-ból tölti be ha van search param', () => {
      routeMock.snapshot = {
        queryParams: { search: 'teszt', sort: 'name', dir: 'asc', page: '3' },
      } as unknown as ActivatedRoute['snapshot'];

      const result = service.loadState(testContext, routeMock as ActivatedRoute);

      expect(result).toEqual({
        search: 'teszt',
        sortBy: 'name',
        sortDir: 'asc',
        page: 3,
      });
    });

    it('érvénytelen page értéket figyelmen kívül hagyja', () => {
      routeMock.snapshot = {
        queryParams: { page: 'abc' },
      } as unknown as ActivatedRoute['snapshot'];

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      // Van custom filter (page is beleesik, de parse-olás után érvénytelen)
      // Valójában az 'abc' mint custom filter jön be
      expect(result).toBeTruthy();
      expect(result?.page).toBeUndefined();
    });

    it('negatív page értéket figyelmen kívül hagyja', () => {
      routeMock.snapshot = {
        queryParams: { search: 'x', page: '-1' },
      } as unknown as ActivatedRoute['snapshot'];

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result?.page).toBeUndefined();
    });

    it('csak érvényes sortDir értékeket fogad el', () => {
      routeMock.snapshot = {
        queryParams: { search: 'x', dir: 'invalid' },
      } as unknown as ActivatedRoute['snapshot'];

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result?.sortDir).toBeUndefined();
    });

    it('localStorage-ból tölti be ha nincs URL param', () => {
      const stored = {
        version: FILTER_SCHEMA_VERSION,
        search: 'tárolt keresés',
        sortBy: 'created_at',
        sortDir: 'desc',
        page: 2,
        filters: {},
      };
      localStorage.setItem('filters:partner:projects', JSON.stringify(stored));

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result).toEqual(stored);
    });

    it('törli a régi schema verziójú storage-t', () => {
      const oldStored = {
        version: FILTER_SCHEMA_VERSION - 1,
        search: 'régi',
        sortBy: 'name',
        sortDir: 'asc',
        page: 1,
        filters: {},
      };
      localStorage.setItem('filters:partner:projects', JSON.stringify(oldStored));

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result).toBeNull();
      expect(localStorage.getItem('filters:partner:projects')).toBeNull();
    });

    it('hibás JSON-t töröl és null-t ad vissza', () => {
      localStorage.setItem('filters:partner:projects', '{invalid json');

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result).toBeNull();
      expect(localStorage.getItem('filters:partner:projects')).toBeNull();
    });

    it('egyedi filtereket is betölti az URL-ből', () => {
      routeMock.snapshot = {
        queryParams: { search: 'x', status: 'active', city: 'Budapest' },
      } as unknown as ActivatedRoute['snapshot'];

      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result?.filters).toEqual({ status: 'active', city: 'Budapest' });
    });
  });

  describe('saveState', () => {
    it('URL-be és localStorage-ba is menti', () => {
      const state = {
        version: FILTER_SCHEMA_VERSION,
        search: 'keresés',
        sortBy: 'name',
        sortDir: 'asc' as const,
        page: 2,
        filters: { status: 'active' },
      };
      const defaults = { sortBy: 'created_at', sortDir: 'desc' as const };

      service.saveState(testContext, state, routeMock as ActivatedRoute, defaults);

      // URL frissítés
      expect(routerMock.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: expect.objectContaining({
            search: 'keresés',
            sort: 'name',
            dir: 'asc',
            page: 2,
            status: 'active',
          }),
          replaceUrl: true,
        })
      );

      // localStorage mentés
      const stored = JSON.parse(localStorage.getItem('filters:partner:projects')!);
      expect(stored.search).toBe('keresés');
      expect(stored.version).toBe(FILTER_SCHEMA_VERSION);
    });

    it('default értékeknél null-t küld URL-ben', () => {
      const state = {
        version: FILTER_SCHEMA_VERSION,
        search: '',
        sortBy: 'created_at',
        sortDir: 'desc' as const,
        page: 1,
        filters: {},
      };
      const defaults = { sortBy: 'created_at', sortDir: 'desc' as const };

      service.saveState(testContext, state, routeMock as ActivatedRoute, defaults);

      expect(routerMock.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: expect.objectContaining({
            search: null,
            sort: null,
            dir: null,
            page: null,
          }),
        })
      );
    });
  });

  describe('clearState', () => {
    it('törli az URL params-ot és a localStorage-t', () => {
      localStorage.setItem('filters:partner:projects', '{"search":"x"}');

      service.clearState(testContext, routeMock as ActivatedRoute);

      expect(routerMock.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { search: null, sort: null, dir: null, page: null },
        })
      );
      expect(localStorage.getItem('filters:partner:projects')).toBeNull();
    });
  });

  describe('clearAllFilters', () => {
    it('törli az összes filters: prefix-ű kulcsot', () => {
      localStorage.setItem('filters:partner:projects', '{}');
      localStorage.setItem('filters:partner:contacts', '{}');
      localStorage.setItem('other-key', 'value');

      service.clearAllFilters();

      expect(localStorage.getItem('filters:partner:projects')).toBeNull();
      expect(localStorage.getItem('filters:partner:contacts')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('value');
    });
  });

  describe('Safari Private mode (memory fallback)', () => {
    it('memory fallback-et használ ha localStorage dob hibát', () => {
      // Szimulálunk QuotaExceededError-t
      const originalSetItem = localStorage.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const state = {
        version: FILTER_SCHEMA_VERSION,
        search: 'fallback teszt',
        sortBy: 'name',
        sortDir: 'asc' as const,
        page: 1,
        filters: {},
      };

      // Mentés memory fallback-be
      service.saveState(testContext, state, routeMock as ActivatedRoute, {
        sortBy: 'name',
        sortDir: 'asc',
      });

      vi.restoreAllMocks();

      // getItem is mock-olni kell hogy null-t adjon
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      // Betöltés memory fallback-ből
      const result = service.loadState(testContext, routeMock as ActivatedRoute);
      expect(result).toBeTruthy();
      expect(result?.search).toBe('fallback teszt');

      vi.restoreAllMocks();
    });
  });
});
