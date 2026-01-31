import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Template kategória interface
 */
export interface TemplateCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  templateCount: number;
}

/**
 * Template minta interface
 */
export interface Template {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  isFeatured: boolean;
  tags: string[];
  categories: { id: number; name: string; slug: string }[];
}

/**
 * Kiválasztott template (extra mezőkkel)
 */
export interface SelectedTemplate extends Template {
  priority: number;
  selectedAt: string;
}

/**
 * Template lista API válasz
 */
export interface TemplateListResponse {
  success: boolean;
  data: Template[];
  meta: {
    currentPage: number;
    perPage: number;
    totalCount: number;
    hasMore: boolean;
  };
}

/**
 * Kategória lista API válasz
 */
export interface CategoryListResponse {
  success: boolean;
  data: TemplateCategory[];
}

/**
 * Selections API válasz
 */
export interface SelectionsResponse {
  success: boolean;
  data: {
    selections: SelectedTemplate[];
    maxSelections: number;
    canSelectMore: boolean;
  };
}

/**
 * Selection action API válasz
 */
export interface SelectActionResponse {
  success: boolean;
  message: string;
  data?: {
    templateId: number;
    priority?: number;
    canSelectMore: boolean;
  };
}

/**
 * Template Chooser Service
 *
 * Felelősségek:
 * - Template kategóriák lekérése
 * - Template lista betöltése (pagination, szűrés)
 * - Template kiválasztás/eltávolítás
 * - Kiválasztott template-ek kezelése
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateChooserService {
  private readonly API_BASE = `${environment.apiUrl}/tablo-frontend/templates`;

  /** Kategóriák (cache) */
  private categoriesSubject = new BehaviorSubject<TemplateCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  /** Betöltött template-ek */
  private templatesSubject = new BehaviorSubject<Template[]>([]);
  public templates$ = this.templatesSubject.asObservable();

  /** Kiválasztott template-ek */
  private selectionsSubject = new BehaviorSubject<SelectedTemplate[]>([]);
  public selections$ = this.selectionsSubject.asObservable();

  /** Maximum kiválasztható */
  private maxSelectionsSubject = new BehaviorSubject<number>(3);
  public maxSelections$ = this.maxSelectionsSubject.asObservable();

  /** Betöltés állapot */
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /** Has more flag (pagination) */
  private hasMoreSubject = new BehaviorSubject<boolean>(false);
  public hasMore$ = this.hasMoreSubject.asObservable();

  /** Current page */
  private currentPage = 1;
  private currentCategory: string | null = null;
  private currentSearch: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Kategóriák betöltése
   */
  loadCategories(): Observable<TemplateCategory[]> {
    return this.http.get<CategoryListResponse>(`${this.API_BASE}/categories`).pipe(
      map(response => response.data),
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Template-ek betöltése (első oldal, reset)
   */
  loadTemplates(category?: string, search?: string): Observable<Template[]> {
    this.currentPage = 1;
    this.currentCategory = category || null;
    this.currentSearch = search || null;
    this.templatesSubject.next([]);

    return this.fetchTemplates(1, category, search).pipe(
      tap(response => {
        this.templatesSubject.next(response.data);
        this.hasMoreSubject.next(response.meta.hasMore);
      }),
      map(response => response.data)
    );
  }

  /**
   * Több template betöltése (load more)
   */
  loadMoreTemplates(): Observable<Template[]> {
    if (!this.hasMoreSubject.getValue() || this.loadingSubject.getValue()) {
      return new Observable(observer => {
        observer.next(this.templatesSubject.getValue());
        observer.complete();
      });
    }

    this.currentPage++;

    return this.fetchTemplates(this.currentPage, this.currentCategory, this.currentSearch).pipe(
      tap(response => {
        const current = this.templatesSubject.getValue();
        this.templatesSubject.next([...current, ...response.data]);
        this.hasMoreSubject.next(response.meta.hasMore);
      }),
      map(response => this.templatesSubject.getValue())
    );
  }

  /**
   * Template-ek lekérése API-ból
   */
  private fetchTemplates(page: number, category?: string | null, search?: string | null): Observable<TemplateListResponse> {
    this.loadingSubject.next(true);

    let params: Record<string, string> = {
      page: page.toString(),
      per_page: '12'
    };

    if (category) {
      params['category'] = category;
    }

    if (search) {
      params['search'] = search;
    }

    return this.http.get<TemplateListResponse>(this.API_BASE, { params }).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Kiválasztott template-ek betöltése
   */
  loadSelections(): Observable<SelectedTemplate[]> {
    return this.http.get<SelectionsResponse>(`${this.API_BASE}/selections/current`).pipe(
      tap(response => {
        this.selectionsSubject.next(response.data.selections);
        this.maxSelectionsSubject.next(response.data.maxSelections);
      }),
      map(response => response.data.selections),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Template kiválasztása
   * switchMap használata a memory leak elkerülésére
   */
  selectTemplate(templateId: number): Observable<SelectActionResponse> {
    return this.http.post<SelectActionResponse>(`${this.API_BASE}/${templateId}/select`, {}).pipe(
      switchMap(response => {
        if (response.success) {
          // Reload selections - switchMap automatikusan kezeli a subscription-t
          return this.loadSelections().pipe(
            map(() => response)
          );
        }
        return [response];
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Template eltávolítása
   */
  deselectTemplate(templateId: number): Observable<SelectActionResponse> {
    return this.http.delete<SelectActionResponse>(`${this.API_BASE}/${templateId}/select`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state
          const current = this.selectionsSubject.getValue();
          this.selectionsSubject.next(current.filter(t => t.id !== templateId));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Ellenőrzi, hogy egy template ki van-e választva
   */
  isSelected(templateId: number): boolean {
    return this.selectionsSubject.getValue().some(t => t.id === templateId);
  }

  /**
   * Ellenőrzi, hogy választható-e még template
   */
  canSelectMore(): boolean {
    return this.selectionsSubject.getValue().length < this.maxSelectionsSubject.getValue();
  }

  /**
   * Getter a kiválasztott template-ek számához
   */
  get selectedCount(): number {
    return this.selectionsSubject.getValue().length;
  }

  /**
   * Getter a maximum kiválaszthatóhoz
   */
  get maxSelections(): number {
    return this.maxSelectionsSubject.getValue();
  }

  /**
   * HTTP hiba kezelés
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ismeretlen hiba történt';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Nincs érvényes session';
    } else if (error.status === 422) {
      errorMessage = error.error?.message || 'Érvénytelen művelet';
    } else if (error.status === 500) {
      errorMessage = 'Szerverhiba. Kérlek próbáld újra később.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
