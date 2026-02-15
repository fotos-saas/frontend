import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { MyPartnersResponse, SwitchPartnerResponse } from '../../models/auth.models';

/**
 * Partner Switch Service
 *
 * Multi-partner csapattagok partner-váltásának kezelése.
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerSwitchService {
  private readonly http = inject(HttpClient);

  /**
   * User aktív partnereinek lekérdezése
   */
  getMyPartners(): Observable<MyPartnersResponse> {
    return this.http.get<{ data: MyPartnersResponse }>(`${environment.apiUrl}/auth/my-partners`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * Partner váltás (token rotáció + tablo_partner_id frissítés)
   */
  switchPartner(partnerId: number): Observable<SwitchPartnerResponse> {
    return this.http.post<{ data: SwitchPartnerResponse }>(
      `${environment.apiUrl}/auth/switch-partner`,
      { partner_id: partnerId }
    ).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'Hiba történt a partner váltás során.';
    return throwError(() => new Error(message));
  }
}
