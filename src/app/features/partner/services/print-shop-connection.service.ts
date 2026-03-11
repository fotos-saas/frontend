import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ─── Interfészek ───────────────────────────

/** Nyomda partner (kapcsolatban) */
export interface PrintShopInfo {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

/** Fotós–nyomda kapcsolat */
export interface PrintShopConnection {
  id: number;
  printShop: PrintShopInfo;
  status: 'active' | 'pending' | 'inactive';
  statusName: string;
  initiatedBy: 'photo_studio' | 'print_shop';
  createdAt: string;
}

/** Kereshető nyomda (korlátozott adatok) */
export interface AvailablePrintShop {
  id: number;
  name: string;
}

/** Paginated válasz az available-print-shops endpointra */
export interface AvailablePrintShopResponse {
  data: AvailablePrintShop[];
  current_page: number;
  last_page: number;
  total: number;
}

/** API válasz: connection létrehozás */
export interface ConnectionResponse {
  id: number;
  status: string;
}

/**
 * PrintShopConnectionService
 *
 * Fotós oldali nyomda-kapcsolat kezelés:
 * - Kapcsolatok listázása
 * - Kereshető nyomdák
 * - Kapcsolódási kérelem küldése
 * - Kapcsolat törlése/visszavonása
 */
@Injectable({
  providedIn: 'root'
})
export class PrintShopConnectionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner`;

  /**
   * Saját nyomda kapcsolatok listája (active + pending)
   */
  getConnections(): Observable<{ data: PrintShopConnection[]; message: string }> {
    return this.http.get<{ data: PrintShopConnection[]; message: string }>(
      `${this.baseUrl}/print-shop-connections`
    );
  }

  /**
   * Kereshető nyomdák (akihez még nincs kapcsolat)
   */
  searchAvailablePrintShops(search: string, page = 1): Observable<AvailablePrintShopResponse> {
    let params = new HttpParams().set('page', page);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<AvailablePrintShopResponse>(
      `${this.baseUrl}/available-print-shops`,
      { params }
    );
  }

  /**
   * Kapcsolódási kérelem küldése (ID alapján)
   */
  sendConnectionRequest(printShopId: number): Observable<{ data: ConnectionResponse; message: string }> {
    return this.http.post<{ data: ConnectionResponse; message: string }>(
      `${this.baseUrl}/print-shop-connections`,
      { print_shop_id: printShopId }
    );
  }

  /**
   * Kapcsolat törlése/visszavonása
   */
  removeConnection(connectionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/print-shop-connections/${connectionId}`
    );
  }
}
