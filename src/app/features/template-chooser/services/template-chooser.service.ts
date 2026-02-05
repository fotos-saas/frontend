import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HttpError } from '../../../shared/types/http-error.types';

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
  private readonly _categories = signal<TemplateCategory[]>([]);
  readonly categories = this._categories.asReadonly();
  readonly categories$: Observable<TemplateCategory[]> = toObservable(this._categories);

  /** Betöltött template-ek */
  private readonly _templates = signal<Template[]>([]);
  readonly templates = this._templates.asReadonly();
  readonly templates$: Observable<Template[]> = toObservable(this._templates);

  /** Kiválasztott template-ek */
  private readonly _selections = signal<SelectedTemplate[]>([]);
  readonly selections = this._selections.asReadonly();
  readonly selections$: Observable<SelectedTemplate[]> = toObservable(this._selections);

  /** Maximum kiválasztható */
  private readonly _maxSelections = signal<number>(3);
  readonly maxSelectionsSignal = this._maxSelections.asReadonly();
  readonly maxSelections$: Observable<number> = toObservable(this._maxSelections);

  /** Betöltés állapot */
  private readonly _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();
  readonly loading$: Observable<boolean> = toObservable(this._loading);

  /** Has more flag (pagination) */
  private readonly _hasMore = signal<boolean>(false);
  readonly hasMore = this._hasMore.asReadonly();
  readonly hasMore$: Observable<boolean> = toObservable(this._hasMore);

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
      tap(categories => this._categories.set(categories)),
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
    this._templates.set([]);

    return this.fetchTemplates(1, category, search).pipe(
      tap(response => {
        this._templates.set(response.data);
        this._hasMore.set(response.meta.hasMore);
      }),
      map(response => response.data)
    );
  }

  /**
   * Több template betöltése (load more)
   */
  loadMoreTemplates(): Observable<Template[]> {
    if (!this._hasMore() || this._loading()) {
      return new Observable(observer => {
        observer.next(this._templates());
        observer.complete();
      });
    }

    this.currentPage++;

    return this.fetchTemplates(this.currentPage, this.currentCategory, this.currentSearch).pipe(
      tap(response => {
        const current = this._templates();
        this._templates.set([...current, ...response.data]);
        this._hasMore.set(response.meta.hasMore);
      }),
      map(response => this._templates())
    );
  }

  /**
   * Template-ek lekérése API-ból
   */
  private fetchTemplates(page: number, category?: string | null, search?: string | null): Observable<TemplateListResponse> {
    this._loading.set(true);

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
      tap(() => this._loading.set(false)),
      catchError(error => {
        this._loading.set(false);
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
        this._selections.set(response.data.selections);
        this._maxSelections.set(response.data.maxSelections);
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
          const current = this._selections();
          this._selections.set(current.filter(t => t.id !== templateId));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Ellenőrzi, hogy egy template ki van-e választva
   */
  isSelected(templateId: number): boolean {
    return this._selections().some(t => t.id === templateId);
  }

  /**
   * Ellenőrzi, hogy választható-e még template
   */
  canSelectMore(): boolean {
    return this._selections().length < this._maxSelections();
  }

  /**
   * Getter a kiválasztott template-ek számához
   */
  get selectedCount(): number {
    return this._selections().length;
  }

  /**
   * Getter a maximum kiválaszthatóhoz
   */
  get maxSelections(): number {
    return this._maxSelections();
  }

  /**
   * HTTP hiba kezelés
   */
  private handleError(error: HttpError): Observable<never> {
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
