import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Quote, QuoteEmail, QuoteTemplate, EmailSnippet } from '../models/quote.models';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PartnerQuoteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/quotes`;

  /** Árajánlatok listázása */
  getQuotes(params?: { search?: string; status?: string; page?: number }): Observable<PaginatedResponse<Quote>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());

    return this.http.get<PaginatedResponse<Quote>>(this.baseUrl, { params: httpParams });
  }

  /** Árajánlat részletei */
  getQuote(id: number): Observable<ApiResponse<Quote>> {
    return this.http.get<ApiResponse<Quote>>(`${this.baseUrl}/${id}`);
  }

  /** Létrehozás */
  createQuote(data: Partial<Quote>): Observable<ApiResponse<Quote>> {
    return this.http.post<ApiResponse<Quote>>(this.baseUrl, data);
  }

  /** Frissítés */
  updateQuote(id: number, data: Partial<Quote>): Observable<ApiResponse<Quote>> {
    return this.http.put<ApiResponse<Quote>>(`${this.baseUrl}/${id}`, data);
  }

  /** Törlés */
  deleteQuote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Duplikálás */
  duplicateQuote(id: number): Observable<ApiResponse<Quote>> {
    return this.http.post<ApiResponse<Quote>>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  /** Státusz frissítés */
  updateStatus(id: number, status: string): Observable<ApiResponse<Quote>> {
    return this.http.patch<ApiResponse<Quote>>(`${this.baseUrl}/${id}/status`, { status });
  }

  /** PDF letöltés (blob) */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /** Email küldés */
  sendEmail(id: number, data: { to_email: string; subject: string; body: string }): Observable<ApiResponse<QuoteEmail>> {
    return this.http.post<ApiResponse<QuoteEmail>>(`${this.baseUrl}/${id}/send-email`, data);
  }

  /** Email előzmények */
  getEmailHistory(id: number): Observable<ApiResponse<QuoteEmail[]>> {
    return this.http.get<ApiResponse<QuoteEmail[]>>(`${this.baseUrl}/${id}/emails`);
  }

  /** Sablonok listázása */
  getTemplates(): Observable<ApiResponse<QuoteTemplate[]>> {
    return this.http.get<ApiResponse<QuoteTemplate[]>>(`${environment.apiUrl}/partner/quote-templates`);
  }

  /** Létrehozás sablonból */
  createFromTemplate(templateId: number): Observable<ApiResponse<Quote>> {
    return this.http.post<ApiResponse<Quote>>(`${this.baseUrl}/from-template/${templateId}`, {});
  }

  /** Email snippet-ek */
  getEmailSnippets(): Observable<ApiResponse<EmailSnippet[]>> {
    return this.http.get<ApiResponse<EmailSnippet[]>>(`${environment.apiUrl}/partner/quote-email-snippets`);
  }
}
