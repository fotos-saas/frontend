import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InvoiceSettings } from '../models/invoice.models';

@Injectable({
  providedIn: 'root',
})
export class InvoiceSettingsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/invoice-settings`;

  getSettings(): Observable<InvoiceSettings> {
    return this.http.get<{ data: InvoiceSettings }>(this.baseUrl).pipe(
      map(res => res.data),
    );
  }

  updateSettings(settings: Partial<InvoiceSettings> & { invoice_api_key?: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(this.baseUrl, settings);
  }

  validateApiKey(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/validate`, {});
  }
}
