import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import {
  Invoice,
  InvoiceStatistics,
  CreateInvoicePayload,
} from '../models/invoice.models';

/**
 * Invoice-specifikus paginated response (wrapper formátum)
 * NEM egyezik meg a központi PaginatedResponse típussal!
 */
interface InvoicePaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/invoices`;

  getInvoices(params: {
    page?: number;
    per_page?: number;
    status?: string;
    year?: number;
    search?: string;
  } = {}): Observable<InvoicePaginatedResponse<Invoice>> {
    const httpParams = buildHttpParams({
      page: params.page,
      per_page: params.per_page,
      status: params.status,
      year: params.year,
      search: params.search,
    });

    return this.http.get<InvoicePaginatedResponse<Invoice>>(this.baseUrl, { params: httpParams });
  }

  createInvoice(payload: CreateInvoicePayload): Observable<{ success: boolean; message: string; data: Invoice }> {
    return this.http.post<{ success: boolean; message: string; data: Invoice }>(this.baseUrl, payload);
  }

  syncInvoice(id: number): Observable<{ success: boolean; message: string; data: Invoice }> {
    return this.http.post<{ success: boolean; message: string; data: Invoice }>(`${this.baseUrl}/${id}/sync`, {});
  }

  cancelInvoice(id: number): Observable<{ success: boolean; message: string; data: Invoice }> {
    return this.http.post<{ success: boolean; message: string; data: Invoice }>(`${this.baseUrl}/${id}/cancel`, {});
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  getStatistics(year?: number): Observable<InvoiceStatistics> {
    const httpParams = buildHttpParams({ year });

    return this.http.get<{ success: boolean; data: InvoiceStatistics }>(`${this.baseUrl}/statistics`, { params: httpParams }).pipe(
      map(res => res.data),
    );
  }
}
