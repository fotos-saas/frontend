import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OrderSyncData, UpdateRosterPayload } from '../models/order-sync.models';

export interface RemoteProject {
  remote_id: number;
  name: string;
  school: string | null;
  city: string | null;
  class_name: string | null;
  class_year: string | null;
  contact_name: string | null;
  contact_email: string | null;
  has_order: boolean;
  created_at: string | null;
  synced: boolean;
  local_project_id: number | null;
}

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
   * Távoli projektek listázása szinkronizálási állapottal.
   */
  listRemoteProjects(): Observable<{
    success: boolean;
    data: {
      projects: RemoteProject[];
      total: number;
      synced_count: number;
      pending_count: number;
    };
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        projects: RemoteProject[];
        total: number;
        synced_count: number;
        pending_count: number;
      };
    }>(`${environment.apiUrl}/partner/order-sync/remote-projects`);
  }

  /**
   * Egyetlen projekt szinkronizálása a régi rendszerből.
   */
  syncSingle(remoteId: number): Observable<{
    success: boolean;
    message: string;
    data: { project_id: number; already_existed: boolean; linked?: boolean };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: { project_id: number; already_existed: boolean; linked?: boolean };
    }>(`${environment.apiUrl}/partner/order-sync/sync-single/${remoteId}`, {});
  }

  /**
   * Szinkronizálandó projektek számának ellenőrzése.
   */
  checkSync(): Observable<{ success: boolean; data: { pending_count: number } }> {
    return this.http.get<{ success: boolean; data: { pending_count: number } }>(
      `${environment.apiUrl}/partner/order-sync/check`
    );
  }

  /**
   * Partner projektek szinkronizálása a régi API-ból.
   */
  triggerSync(): Observable<{ success: boolean; message: string; data: { created: number; moved: number; skipped_duplicates: number; processed: number; failed: number; errors: string[] } }> {
    return this.http.post<{ success: boolean; message: string; data: { created: number; moved: number; skipped_duplicates: number; processed: number; failed: number; errors: string[] } }>(
      `${environment.apiUrl}/partner/order-sync/trigger`,
      {}
    );
  }
}
