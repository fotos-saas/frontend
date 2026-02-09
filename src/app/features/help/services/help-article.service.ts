import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HelpArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_plain: string | null;
  category: string;
  target_roles: string[];
  target_plans: string[];
  related_routes: string[];
  keywords: string[];
  feature_key: string | null;
  is_faq: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class HelpArticleService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getArticles(role?: string, plan?: string, category?: string): Observable<ApiResponse<HelpArticle[]>> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (plan) params = params.set('plan', plan);
    if (category) params = params.set('category', category);

    return this.http.get<ApiResponse<HelpArticle[]>>(`${this.apiUrl}/help/articles`, { params });
  }

  search(query: string, role?: string, plan?: string): Observable<ApiResponse<HelpArticle[]>> {
    let params = new HttpParams().set('q', query);
    if (role) params = params.set('role', role);
    if (plan) params = params.set('plan', plan);

    return this.http.get<ApiResponse<HelpArticle[]>>(`${this.apiUrl}/help/articles/search`, { params });
  }

  getForRoute(route: string, role?: string, plan?: string): Observable<ApiResponse<HelpArticle[]>> {
    let params = new HttpParams().set('route', route);
    if (role) params = params.set('role', role);
    if (plan) params = params.set('plan', plan);

    return this.http.get<ApiResponse<HelpArticle[]>>(`${this.apiUrl}/help/articles/for-route`, { params });
  }

  getFaq(role?: string, plan?: string): Observable<ApiResponse<HelpArticle[]>> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (plan) params = params.set('plan', plan);

    return this.http.get<ApiResponse<HelpArticle[]>>(`${this.apiUrl}/help/faq`, { params });
  }

  getArticle(slug: string): Observable<ApiResponse<HelpArticle>> {
    return this.http.get<ApiResponse<HelpArticle>>(`${this.apiUrl}/help/articles/${slug}`);
  }
}
