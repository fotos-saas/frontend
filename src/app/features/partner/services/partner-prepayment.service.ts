import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Prepayment,
  PrepaymentConfig,
  PrepaymentStats,
  PrepaymentSummary,
} from '../models/prepayment.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  summary?: PrepaymentSummary;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerPrepaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/prepayment`;

  // --- Config CRUD ---

  getConfigs(): Observable<ApiResponse<PrepaymentConfig[]>> {
    return this.http.get<ApiResponse<PrepaymentConfig[]>>(`${this.baseUrl}/configs`);
  }

  getConfig(id: number): Observable<ApiResponse<PrepaymentConfig>> {
    return this.http.get<ApiResponse<PrepaymentConfig>>(`${this.baseUrl}/configs/${id}`);
  }

  createConfig(data: Partial<PrepaymentConfig>): Observable<ApiResponse<PrepaymentConfig>> {
    return this.http.post<ApiResponse<PrepaymentConfig>>(`${this.baseUrl}/configs`, data);
  }

  updateConfig(id: number, data: Partial<PrepaymentConfig>): Observable<ApiResponse<PrepaymentConfig>> {
    return this.http.put<ApiResponse<PrepaymentConfig>>(`${this.baseUrl}/configs/${id}`, data);
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/configs/${id}`);
  }

  getEffectiveConfig(projectId: number): Observable<ApiResponse<PrepaymentConfig | null>> {
    return this.http.get<ApiResponse<PrepaymentConfig | null>>(`${this.baseUrl}/projects/${projectId}/effective-config`);
  }

  // --- Prepayments ---

  getPrepayments(params?: Record<string, string>): Observable<PaginatedResponse<Prepayment>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<PaginatedResponse<Prepayment>>(this.baseUrl, { params: httpParams });
  }

  getPrepayment(id: number): Observable<ApiResponse<Prepayment>> {
    return this.http.get<ApiResponse<Prepayment>>(`${this.baseUrl}/${id}`);
  }

  createPrepayments(data: {
    project_id: number;
    person_ids: number[];
    mode?: string;
    package_key?: string;
    amount_huf?: number;
    deadline?: string;
    send_payment_link?: boolean;
    notes?: string;
  }): Observable<ApiResponse<Prepayment[]>> {
    return this.http.post<ApiResponse<Prepayment[]>>(this.baseUrl, data);
  }

  bulkCreate(data: {
    project_id: number;
    entries: { person_id: number; guest_session_id?: number }[];
    mode?: string;
    package_key?: string;
    send_payment_links?: boolean;
    payment_deadline_days?: number;
    amount_huf?: number;
    notes?: string;
  }): Observable<ApiResponse<{ created: number; notifications_sent: number }>> {
    return this.http.post<ApiResponse<{ created: number; notifications_sent: number }>>(`${this.baseUrl}/bulk-create`, data);
  }

  markPaid(id: number, data: { payment_method: string; notes?: string }): Observable<ApiResponse<Prepayment>> {
    return this.http.patch<ApiResponse<Prepayment>>(`${this.baseUrl}/${id}/mark-paid`, data);
  }

  cancelPrepayment(id: number): Observable<ApiResponse<Prepayment>> {
    return this.http.patch<ApiResponse<Prepayment>>(`${this.baseUrl}/${id}/cancel`, {});
  }

  refund(id: number, reason: string): Observable<ApiResponse<Prepayment>> {
    return this.http.post<ApiResponse<Prepayment>>(`${this.baseUrl}/${id}/refund`, { reason });
  }

  forfeit(id: number, reason: string): Observable<ApiResponse<Prepayment>> {
    return this.http.post<ApiResponse<Prepayment>>(`${this.baseUrl}/${id}/forfeit`, { reason });
  }

  resendNotification(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/${id}/resend`, {});
  }

  getStats(params?: Record<string, string>): Observable<ApiResponse<PrepaymentStats>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<ApiResponse<PrepaymentStats>>(`${this.baseUrl}/stats`, { params: httpParams });
  }
}
