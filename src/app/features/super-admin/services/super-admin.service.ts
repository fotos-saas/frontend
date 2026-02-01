import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardStats, PaginatedResponse, DashboardProjectItem } from '../../../shared/components/dashboard';

/**
 * Super Admin API Service
 * API hívások a super admin felülethez.
 */
@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/super-admin`;

  /**
   * Dashboard statisztikák lekérése
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Partnerek listázása (paginált)
   */
  getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Observable<PaginatedResponse<DashboardProjectItem>> {
    let httpParams = new HttpParams();

    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params?.sort_dir) httpParams = httpParams.set('sort_dir', params.sort_dir);

    return this.http.get<PaginatedResponse<DashboardProjectItem>>(`${this.baseUrl}/partners`, { params: httpParams });
  }
}
