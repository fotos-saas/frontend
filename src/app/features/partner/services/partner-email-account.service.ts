import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { PartnerEmailAccount, EmailAccountTestResult } from '../models/partner.models';

@Injectable({ providedIn: 'root' })
export class PartnerEmailAccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/settings/email-account`;

  getEmailAccount(): Observable<PartnerEmailAccount | null> {
    return this.http.get<{ data: PartnerEmailAccount | null }>(this.baseUrl).pipe(
      map(res => res.data),
    );
  }

  saveEmailAccount(data: Record<string, unknown>): Observable<PartnerEmailAccount> {
    return this.http.put<{ data: PartnerEmailAccount }>(this.baseUrl, data).pipe(
      map(res => res.data),
    );
  }

  deleteEmailAccount(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }

  testEmailAccount(data: Record<string, unknown>): Observable<EmailAccountTestResult> {
    return this.http.post<{ data: EmailAccountTestResult }>(`${this.baseUrl}/test`, data).pipe(
      map(res => res.data),
    );
  }
}
