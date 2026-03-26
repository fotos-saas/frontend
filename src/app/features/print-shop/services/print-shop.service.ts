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
  PrintShopConnection,
  PrintShopConnectionRequests,
  PrintShopDashboardData,
  PaginatedResponse,
} from '../models/print-shop.models';
import { PrintShopMessage, DeadlineResponsePayload } from '@core/models/print-order.models';

@Injectable({ providedIn: 'root' })
export class PrintShopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/print-shop`;

  getStats(): Observable<PrintShopStats> {
    return this.http.get<{ data: PrintShopStats }>(`${this.baseUrl}/stats`).pipe(
      map(res => res.data)
    );
  }

  getDashboardData(): Observable<PrintShopDashboardData> {
    return this.http.get<{ data: PrintShopDashboardData }>(`${this.baseUrl}/dashboard-data`).pipe(
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
    if (params.class_year) httpParams = httpParams.set('class_year', params.class_year);
    if (params.project_id) httpParams = httpParams.set('project_id', params.project_id);

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

  revertToPrint(projectId: number): Observable<{ status: string }> {
    return this.http.post<{ data: { status: string } }>(`${this.baseUrl}/projects/${projectId}/revert-to-print`, {}).pipe(
      map(res => res.data)
    );
  }

  // === Connection endpoints ===

  getConnections(): Observable<PrintShopConnection[]> {
    return this.http.get<PaginatedResponse<PrintShopConnection>>(`${this.baseUrl}/connections`).pipe(
      map(res => res.data)
    );
  }

  getConnectionRequests(): Observable<PrintShopConnectionRequests> {
    return this.http.get<{ data: PrintShopConnectionRequests }>(`${this.baseUrl}/connection-requests`).pipe(
      map(res => res.data)
    );
  }

  approveConnection(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/connections/${id}/approve`, {});
  }

  rejectConnection(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/connections/${id}/reject`, {});
  }

  removeConnection(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/connections/${id}`);
  }

  batchDownload(projectIds: number[]): Observable<{ blob: Blob; fileName: string }> {
    return this.http.post(`${this.baseUrl}/projects/batch-download`, { project_ids: projectIds }, {
      responseType: 'blob',
      observe: 'response',
    }).pipe(
      map(response => {
        if (!response.body) {
          throw new Error('A letöltött fájl üres');
        }
        const disposition = response.headers.get('Content-Disposition');
        const fileName = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? 'nyomdakesz.zip';
        return { blob: response.body, fileName };
      })
    );
  }

  getMessages(projectId: number): Observable<PrintShopMessage[]> {
    return this.http.get<{ data: PrintShopMessage[] }>(
      `${this.baseUrl}/projects/${projectId}/messages`
    ).pipe(map(res => res.data));
  }

  sendMessage(projectId: number, message: string): Observable<PrintShopMessage> {
    return this.http.post<{ data: PrintShopMessage }>(
      `${this.baseUrl}/projects/${projectId}/messages`, { message }
    ).pipe(map(res => res.data));
  }

  respondToDeadline(projectId: number, payload: DeadlineResponsePayload): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/projects/${projectId}/respond-deadline`, payload
    );
  }

  reportError(projectId: number, message: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/report-error`, { message });
  }

  resolveError(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/resolve-error`, {});
  }

  downloadFile(projectId: number, type: string = 'small_tablo'): Observable<{ blob: Blob; fileName: string }> {
    return this.http.get(`${this.baseUrl}/projects/${projectId}/download`, {
      params: { type },
      responseType: 'blob',
      observe: 'response',
    }).pipe(
      map(response => {
        if (!response.body) {
          throw new Error('A letöltött fájl üres');
        }
        const disposition = response.headers.get('Content-Disposition');
        const fileName = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? `download-${projectId}`;
        return { blob: response.body, fileName };
      })
    );
  }
}
