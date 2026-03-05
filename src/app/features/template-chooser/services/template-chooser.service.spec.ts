/**
 * TemplateChooserService Unit Tests
 *
 * Tesztek:
 * - Kategóriák betöltése
 * - Template-ek betöltése és pagination
 * - Template kiválasztás (switchMap memory leak fix tesztelése)
 * - Template eltávolítás
 * - Selection állapot kezelés
 * - Hibakezelés
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import {
  TemplateChooserService,
  TemplateCategory,
  Template,
  SelectedTemplate,
  TemplateListResponse,
  CategoryListResponse,
  SelectionsResponse,
  SelectActionResponse
} from './template-chooser.service';
import { environment } from '../../../../environments/environment';

describe('TemplateChooserService', () => {
  let service: TemplateChooserService;
  let httpMock: HttpTestingController;

  const API_BASE = `${environment.apiUrl}/tablo-frontend/templates`;

  // Mock adatok
  const mockCategories: TemplateCategory[] = [
    { id: 1, name: 'Modern', slug: 'modern', description: 'Modern stílusok', icon: '🎨', templateCount: 10 },
    { id: 2, name: 'Klasszikus', slug: 'classic', description: 'Klasszikus stílusok', icon: '📜', templateCount: 8 }
  ];

  const mockTemplates: Template[] = [
    {
      id: 1,
      name: 'Modern Tabló 1',
      slug: 'modern-1',
      description: 'Első modern sablon',
      imageUrl: 'https://example.com/img1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      previewUrl: 'https://example.com/preview1.jpg',
      isFeatured: true,
      tags: ['modern', 'színes'],
      categories: [{ id: 1, name: 'Modern', slug: 'modern' }]
    },
    {
      id: 2,
      name: 'Klasszikus Tabló',
      slug: 'classic-1',
      description: 'Klasszikus sablon',
      imageUrl: 'https://example.com/img2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      previewUrl: 'https://example.com/preview2.jpg',
      isFeatured: false,
      tags: ['klasszikus'],
      categories: [{ id: 2, name: 'Klasszikus', slug: 'classic' }]
    }
  ];

  const mockSelectedTemplates: SelectedTemplate[] = [
    {
      ...mockTemplates[0],
      priority: 1,
      selectedAt: '2026-01-01T10:00:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemplateChooserService]
    });

    service = TestBed.inject(TemplateChooserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===========================================
  // CATEGORY LOADING TESTS
  // ===========================================

  describe('loadCategories()', () => {
    it('should load categories successfully', async () => {
      const categoriesPromise = firstValueFrom(service.loadCategories());

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      expect(req.request.method).toBe('GET');

      const response: CategoryListResponse = {
        success: true,
        data: mockCategories
      };
      req.flush(response);

      const result = await categoriesPromise;
      expect(result).toEqual(mockCategories);
    });

    it('should update categories$ observable', async () => {
      const categoriesPromise = firstValueFrom(service.loadCategories());

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      req.flush({ success: true, data: mockCategories });

      await categoriesPromise;

      const categories = await firstValueFrom(service.categories$);
      expect(categories).toEqual(mockCategories);
    });

    it('should handle category load error', async () => {
      const categoriesPromise = firstValueFrom(service.loadCategories()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      // A service a backend message-t adja vissza ha van, egyébként 'Szerverhiba'
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      const error = await categoriesPromise;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Szerverhiba');
    });
  });

  // ===========================================
  // TEMPLATE LOADING TESTS
  // ===========================================

  describe('loadTemplates()', () => {
    it('should load templates successfully', async () => {
      const templatesPromise = firstValueFrom(service.loadTemplates());

      const req = httpMock.expectOne(request =>
        request.url === API_BASE &&
        request.params.get('page') === '1' &&
        request.params.get('per_page') === '12'
      );
      expect(req.request.method).toBe('GET');

      const response: TemplateListResponse = {
        success: true,
        data: mockTemplates,
        meta: {
          currentPage: 1,
          perPage: 12,
          totalCount: 2,
          hasMore: false
        }
      };
      req.flush(response);

      const result = await templatesPromise;
      expect(result).toEqual(mockTemplates);
    });

    it('should filter by category', async () => {
      const templatesPromise = firstValueFrom(service.loadTemplates('modern'));

      const req = httpMock.expectOne(request =>
        request.url === API_BASE &&
        request.params.get('category') === 'modern'
      );

      req.flush({
        success: true,
        data: [mockTemplates[0]],
        meta: { currentPage: 1, perPage: 12, totalCount: 1, hasMore: false }
      });

      const result = await templatesPromise;
      expect(result.length).toBe(1);
      expect(result[0].slug).toBe('modern-1');
    });

    it('should filter by search term', async () => {
      const templatesPromise = firstValueFrom(service.loadTemplates(undefined, 'klasszikus'));

      const req = httpMock.expectOne(request =>
        request.url === API_BASE &&
        request.params.get('search') === 'klasszikus'
      );

      req.flush({
        success: true,
        data: [mockTemplates[1]],
        meta: { currentPage: 1, perPage: 12, totalCount: 1, hasMore: false }
      });

      const result = await templatesPromise;
      expect(result.length).toBe(1);
    });

    it('should reset templates on new load', async () => {
      // Első betöltés
      const firstLoadPromise = firstValueFrom(service.loadTemplates());
      const firstReq = httpMock.expectOne(request => request.url === API_BASE);
      firstReq.flush({
        success: true,
        data: mockTemplates,
        meta: { currentPage: 1, perPage: 12, totalCount: 2, hasMore: false }
      });
      await firstLoadPromise;

      // Második betöltés (szűréssel)
      const secondLoadPromise = firstValueFrom(service.loadTemplates('modern'));
      const secondReq = httpMock.expectOne(request =>
        request.url === API_BASE && request.params.get('category') === 'modern'
      );
      secondReq.flush({
        success: true,
        data: [mockTemplates[0]],
        meta: { currentPage: 1, perPage: 12, totalCount: 1, hasMore: false }
      });

      const result = await secondLoadPromise;
      expect(result.length).toBe(1);
    });

    it('should update hasMore$ observable', async () => {
      const templatesPromise = firstValueFrom(service.loadTemplates());

      const req = httpMock.expectOne(request => request.url === API_BASE);
      req.flush({
        success: true,
        data: mockTemplates,
        meta: { currentPage: 1, perPage: 12, totalCount: 20, hasMore: true }
      });

      await templatesPromise;

      const hasMore = await firstValueFrom(service.hasMore$);
      expect(hasMore).toBe(true);
    });
  });

  // ===========================================
  // LOAD MORE TESTS
  // ===========================================

  describe('loadMoreTemplates()', () => {
    it('should load next page of templates', async () => {
      // Első oldal betöltése
      const firstLoadPromise = firstValueFrom(service.loadTemplates());
      const firstReq = httpMock.expectOne(request =>
        request.url === API_BASE && request.params.get('page') === '1'
      );
      firstReq.flush({
        success: true,
        data: mockTemplates,
        meta: { currentPage: 1, perPage: 12, totalCount: 14, hasMore: true }
      });
      await firstLoadPromise;

      // Második oldal betöltése
      const loadMorePromise = firstValueFrom(service.loadMoreTemplates());
      const secondReq = httpMock.expectOne(request =>
        request.url === API_BASE && request.params.get('page') === '2'
      );
      secondReq.flush({
        success: true,
        data: [{ ...mockTemplates[0], id: 3 }],
        meta: { currentPage: 2, perPage: 12, totalCount: 14, hasMore: false }
      });

      const result = await loadMorePromise;
      expect(result.length).toBe(3); // eredeti 2 + új 1
    });

    it('should not load more when hasMore is false', async () => {
      // Betöltés hasMore=false-val
      const firstLoadPromise = firstValueFrom(service.loadTemplates());
      const firstReq = httpMock.expectOne(request => request.url === API_BASE);
      firstReq.flush({
        success: true,
        data: mockTemplates,
        meta: { currentPage: 1, perPage: 12, totalCount: 2, hasMore: false }
      });
      await firstLoadPromise;

      // Load more nem csinál HTTP hívást
      const loadMorePromise = firstValueFrom(service.loadMoreTemplates());
      // Nem várunk HTTP kérést!
      const result = await loadMorePromise;
      expect(result).toEqual(mockTemplates);
    });
  });

  // ===========================================
  // SELECTION TESTS (Memory Leak Fix)
  // ===========================================

  describe('loadSelections()', () => {
    it('should load selections successfully', async () => {
      const selectionsPromise = firstValueFrom(service.loadSelections());

      const req = httpMock.expectOne(`${API_BASE}/selections/current`);
      expect(req.request.method).toBe('GET');

      const response: SelectionsResponse = {
        success: true,
        data: {
          selections: mockSelectedTemplates,
          maxSelections: 3,
          canSelectMore: true
        }
      };
      req.flush(response);

      const result = await selectionsPromise;
      expect(result).toEqual(mockSelectedTemplates);
    });

    it('should update maxSelections$', async () => {
      const selectionsPromise = firstValueFrom(service.loadSelections());

      const req = httpMock.expectOne(`${API_BASE}/selections/current`);
      req.flush({
        success: true,
        data: {
          selections: mockSelectedTemplates,
          maxSelections: 5,
          canSelectMore: true
        }
      });

      await selectionsPromise;

      const maxSelections = await firstValueFrom(service.maxSelections$);
      expect(maxSelections).toBe(5);
    });
  });

  describe('selectTemplate()', () => {
    it('should select template and reload selections (switchMap fix)', async () => {
      const selectPromise = firstValueFrom(service.selectTemplate(1));

      // Első hívás: POST select
      const selectReq = httpMock.expectOne(`${API_BASE}/1/select`);
      expect(selectReq.request.method).toBe('POST');

      const selectResponse: SelectActionResponse = {
        success: true,
        message: 'Template kiválasztva',
        data: { templateId: 1, priority: 1, canSelectMore: true }
      };
      selectReq.flush(selectResponse);

      // Második hívás: GET selections (switchMap miatt automatikusan)
      const selectionsReq = httpMock.expectOne(`${API_BASE}/selections/current`);
      selectionsReq.flush({
        success: true,
        data: {
          selections: mockSelectedTemplates,
          maxSelections: 3,
          canSelectMore: true
        }
      });

      const result = await selectPromise;
      expect(result.success).toBe(true);
      expect(result.message).toBe('Template kiválasztva');
    });

    it('should not reload selections on failed select', async () => {
      const selectPromise = firstValueFrom(service.selectTemplate(1));

      const selectReq = httpMock.expectOne(`${API_BASE}/1/select`);
      selectReq.flush({
        success: false,
        message: 'Maximum kiválasztás elérve'
      });

      // Nem várunk selections hívást, mert success=false

      const result = await selectPromise;
      expect(result.success).toBe(false);
    });

    it('should handle select error', async () => {
      const selectPromise = firstValueFrom(service.selectTemplate(1)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/1/select`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      const error = await selectPromise;
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('deselectTemplate()', () => {
    it('should deselect template successfully', async () => {
      // Előbb töltsünk be selections-t
      const loadPromise = firstValueFrom(service.loadSelections());
      const loadReq = httpMock.expectOne(`${API_BASE}/selections/current`);
      loadReq.flush({
        success: true,
        data: {
          selections: mockSelectedTemplates,
          maxSelections: 3,
          canSelectMore: true
        }
      });
      await loadPromise;

      // Most töröljük
      const deselectPromise = firstValueFrom(service.deselectTemplate(1));

      const req = httpMock.expectOne(`${API_BASE}/1/select`);
      expect(req.request.method).toBe('DELETE');

      req.flush({
        success: true,
        message: 'Template eltávolítva'
      });

      const result = await deselectPromise;
      expect(result.success).toBe(true);

      // Ellenőrizzük, hogy a lokális state frissült
      const selections = await firstValueFrom(service.selections$);
      expect(selections.find(t => t.id === 1)).toBeUndefined();
    });
  });

  // ===========================================
  // STATE QUERY TESTS
  // ===========================================

  describe('State Queries', () => {
    beforeEach(async () => {
      const loadPromise = firstValueFrom(service.loadSelections());
      const loadReq = httpMock.expectOne(`${API_BASE}/selections/current`);
      loadReq.flush({
        success: true,
        data: {
          selections: mockSelectedTemplates,
          maxSelections: 3,
          canSelectMore: true
        }
      });
      await loadPromise;
    });

    it('should report isSelected correctly', () => {
      expect(service.isSelected(1)).toBe(true);
      expect(service.isSelected(2)).toBe(false);
    });

    it('should report canSelectMore correctly', () => {
      expect(service.canSelectMore()).toBe(true);
    });

    it('should report selectedCount correctly', () => {
      expect(service.selectedCount).toBe(1);
    });

    it('should report maxSelections correctly', () => {
      expect(service.maxSelections).toBe(3);
    });
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized', async () => {
      const promise = firstValueFrom(service.loadCategories()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      const error = await promise;
      expect(error.message).toBe('Nincs érvényes session');
    });

    it('should handle 422 Validation Error', async () => {
      const promise = firstValueFrom(service.selectTemplate(999)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/999/select`);
      req.flush({ message: 'Template nem található' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await promise;
      expect(error.message).toBe('Template nem található');
    });

    it('should handle 500 Server Error', async () => {
      const promise = firstValueFrom(service.loadCategories()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      const error = await promise;
      expect(error.message).toContain('Szerverhiba');
    });

    it('should handle unknown errors', async () => {
      const promise = firstValueFrom(service.loadCategories()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/categories`);
      req.flush({}, { status: 418, statusText: 'I\'m a teapot' });

      const error = await promise;
      expect(error.message).toBe('Ismeretlen hiba történt');
    });
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================

  describe('Loading State', () => {
    it('should set loading state during template fetch', async () => {
      // loading signal-t kozvetlenul ellenorizzuk (toObservable async, signal szinkron)
      expect(service.loading()).toBe(false);

      const templatesPromise = firstValueFrom(service.loadTemplates());

      // Loading should be true during fetch (signal is synchronous)
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(request => request.url === API_BASE);
      req.flush({
        success: true,
        data: mockTemplates,
        meta: { currentPage: 1, perPage: 12, totalCount: 2, hasMore: false }
      });

      await templatesPromise;

      // Loading should be false after fetch
      expect(service.loading()).toBe(false);
    });
  });
});
