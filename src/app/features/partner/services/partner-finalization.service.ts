import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import { FinalizationListItem, PaginatedResponse, PrintReadyFile } from '../models/partner.models';

export type PrintFileType = 'small_tablo' | 'flat';

@Injectable({
  providedIn: 'root',
})
export class PartnerFinalizationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/finalizations`;

  getFinalizations(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'created_at' | 'finalized_at' | 'school_name' | 'class_year';
    sort_dir?: 'asc' | 'desc';
    school_id?: number;
    graduation_year?: number;
  }): Observable<PaginatedResponse<FinalizationListItem>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      sort_by: params?.sort_by,
      sort_dir: params?.sort_dir,
      school_id: params?.school_id,
      graduation_year: params?.graduation_year,
    });

    return this.http.get<PaginatedResponse<FinalizationListItem>>(this.baseUrl, { params: httpParams });
  }

  uploadPrintReady(projectId: number, file: File, type: PrintFileType, tabloSize?: string): Observable<{
    success: boolean;
    message: string;
    data: PrintReadyFile;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (tabloSize) {
      formData.append('tablo_size', tabloSize);
    }
    return this.http.post<{
      success: boolean;
      message: string;
      data: PrintReadyFile;
    }>(`${this.baseUrl}/${projectId}/upload`, formData);
  }

  downloadPrintReady(projectId: number, type: PrintFileType): Observable<Blob> {
    const httpParams = buildHttpParams({ type });
    return this.http.get(`${this.baseUrl}/${projectId}/download`, {
      responseType: 'blob',
      params: httpParams,
    });
  }

  deletePrintReady(projectId: number, type: PrintFileType): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${projectId}/print-file`,
      { body: { type } }
    );
  }

  updateTabloSize(projectId: number, tabloSize: string | null): Observable<{
    success: boolean;
    message: string;
    data: { tabloSize: string | null };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { tabloSize: string | null };
    }>(`${this.baseUrl}/${projectId}/tablo-size`, { tablo_size: tabloSize });
  }

  getInPrintCount(graduationYear?: number): Observable<{ count: number }> {
    const httpParams = buildHttpParams({ graduation_year: graduationYear });
    return this.http.get<{ count: number }>(`${this.baseUrl}/in-print-count`, { params: httpParams });
  }

  markAsDone(projectId: number): Observable<{
    success: boolean;
    message: string;
    data: { status: string };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: { status: string };
    }>(`${this.baseUrl}/${projectId}/mark-done`, {});
  }
}
