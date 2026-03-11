import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  PrintShopStats,
  PrintShopProject,
  PrintShopProjectDetail,
  PrintShopProjectListParams,
  PaginatedResponse,
} from '../models/print-shop.models';

@Injectable({ providedIn: 'root' })
export class PrintShopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/print-shop`;

  getStats(): Observable<PrintShopStats> {
    return this.http.get<{ data: PrintShopStats }>(`${this.baseUrl}/stats`).pipe(
      map(res => res.data)
    );
  }

  getProjects(params: PrintShopProjectListParams): Observable<PaginatedResponse<PrintShopProject>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.studio_id) httpParams = httpParams.set('studio_id', params.studio_id);

    return this.http.get<PaginatedResponse<PrintShopProject>>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  getProject(projectId: number): Observable<PrintShopProjectDetail> {
    return this.http.get<{ data: PrintShopProjectDetail }>(`${this.baseUrl}/projects/${projectId}`).pipe(
      map(res => res.data)
    );
  }

  markAsDone(projectId: number): Observable<{ status: string }> {
    return this.http.post<{ data: { status: string } }>(`${this.baseUrl}/projects/${projectId}/mark-done`, {}).pipe(
      map(res => res.data)
    );
  }

  getDownloadUrl(projectId: number, type: string = 'small_tablo'): string {
    return `${this.baseUrl}/projects/${projectId}/download?type=${type}`;
  }
}
