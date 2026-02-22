import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OrderSyncData, UpdateRosterPayload } from '../models/order-sync.models';

/**
 * Megrendelés szinkronizálás API service.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerOrderSyncService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/projects`;

  /**
   * Szinkronizálási állapot lekérése.
   */
  getOrderSyncStatus(projectId: number): Observable<{ success: boolean; data: OrderSyncData }> {
    return this.http.get<{ success: boolean; data: OrderSyncData }>(
      `${this.baseUrl}/${projectId}/order-sync`
    );
  }

  /**
   * AI névsor újrafuttatás.
   */
  reparseNames(projectId: number): Observable<{ success: boolean; data: OrderSyncData; message: string }> {
    return this.http.post<{ success: boolean; data: OrderSyncData; message: string }>(
      `${this.baseUrl}/${projectId}/order-sync/reparse`,
      {}
    );
  }

  /**
   * Manuális névsor szerkesztés mentése.
   */
  updateRoster(projectId: number, data: UpdateRosterPayload): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/${projectId}/order-sync/roster`,
      data
    );
  }

  /**
   * Partner projektek szinkronizálása a régi API-ból.
   */
  triggerSync(): Observable<{ success: boolean; message: string; data: { created: number; processed: number; failed: number; errors: string[] } }> {
    return this.http.post<{ success: boolean; message: string; data: { created: number; processed: number; failed: number; errors: string[] } }>(
      `${environment.apiUrl}/partner/order-sync/trigger`,
      {}
    );
  }
}
