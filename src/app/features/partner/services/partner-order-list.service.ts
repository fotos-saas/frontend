import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { buildHttpParams } from '@shared/utils/http-params.util';
import { getAlbumStatusLabel } from '../../../shared/constants';
import type {
  PartnerClient,
  PartnerClientDetails,
  PartnerOrderAlbumListItem,
  PartnerOrderAlbumSummary,
  PaginatedResponse,
  CreateClientRequest,
  UpdateClientRequest,
  CreateAlbumRequest,
  AlbumStatus,
  OrderAlbumType,
} from './partner-orders.service';

/**
 * Partner Order List Service
 *
 * Ügyfelek és albumok listázása, CRUD, kód kezelés.
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerOrderListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/orders`;

  // ============================================
  // CLIENTS
  // ============================================

  getClients(params?: {
    page?: number; per_page?: number; search?: string;
  }): Observable<PaginatedResponse<PartnerClient>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
    });
    return this.http.get<PaginatedResponse<PartnerClient>>(`${this.baseUrl}/clients`, { params: httpParams });
  }

  getClient(id: number): Observable<PartnerClientDetails> {
    return this.http.get<PartnerClientDetails>(`${this.baseUrl}/clients/${id}`);
  }

  createClient(data: CreateClientRequest): Observable<{ success: boolean; message: string; data: PartnerClient }> {
    return this.http.post<{ success: boolean; message: string; data: PartnerClient }>(`${this.baseUrl}/clients`, data);
  }

  updateClient(id: number, data: UpdateClientRequest): Observable<{ success: boolean; message: string; data: PartnerClient }> {
    return this.http.put<{ success: boolean; message: string; data: PartnerClient }>(`${this.baseUrl}/clients/${id}`, data);
  }

  deleteClient(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/clients/${id}`);
  }

  generateCode(clientId: number, expiresAt?: string): Observable<{
    success: boolean; message: string;
    data: { accessCode: string; accessCodeEnabled: boolean; accessCodeExpiresAt: string | null };
  }> {
    return this.http.post<{
      success: boolean; message: string;
      data: { accessCode: string; accessCodeEnabled: boolean; accessCodeExpiresAt: string | null };
    }>(`${this.baseUrl}/clients/${clientId}/generate-code`, { expires_at: expiresAt });
  }

  extendCode(clientId: number, expiresAt: string): Observable<{
    success: boolean; message: string; data: { accessCodeExpiresAt: string | null };
  }> {
    return this.http.post<{
      success: boolean; message: string; data: { accessCodeExpiresAt: string | null };
    }>(`${this.baseUrl}/clients/${clientId}/extend-code`, { expires_at: expiresAt });
  }

  disableCode(clientId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/clients/${clientId}/disable-code`, {});
  }

  // ============================================
  // ALBUMS LIST
  // ============================================

  getAlbums(params?: {
    page?: number; per_page?: number; search?: string;
    client_id?: number; type?: OrderAlbumType; status?: AlbumStatus;
  }): Observable<PaginatedResponse<PartnerOrderAlbumListItem>> {
    const httpParams = buildHttpParams({
      page: params?.page,
      per_page: params?.per_page,
      search: params?.search,
      client_id: params?.client_id,
      type: params?.type,
      status: params?.status,
    });
    return this.http.get<PaginatedResponse<PartnerOrderAlbumListItem>>(`${this.baseUrl}/albums`, { params: httpParams });
  }

  createAlbum(data: CreateAlbumRequest): Observable<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }> {
    return this.http.post<{ success: boolean; message: string; data: PartnerOrderAlbumSummary }>(`${this.baseUrl}/albums`, data);
  }

  // ============================================
  // HELPERS
  // ============================================

  getStatusLabel(status: AlbumStatus): string {
    return getAlbumStatusLabel(status);
  }

  getStatusColor(status: AlbumStatus): string {
    const colors: Record<AlbumStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      claiming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      retouch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      tablo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getTypeLabel(type: OrderAlbumType): string {
    return type === 'selection' ? 'Képválasztás' : 'Tablókép';
  }
}
