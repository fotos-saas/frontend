import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Megrendelési adatok interface
 * Az api.tablostudio.hu-ból szinkronizált projekt adatok
 */
export interface OrderData {
  // Kontakt
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;

  // Iskola/osztály
  schoolName: string | null;
  className: string | null;
  classYear: string | null;

  // Létszám
  studentCount: number | null;
  teacherCount: number | null;

  // Design beállítások
  color: string | null;
  fontFamily: string | null;
  sortType: string | null;

  // Leírások
  description: string | null;
  studentDescription: string | null;
  teacherDescription: string | null;
  quote: string | null;

  // AI elemzés (ha van)
  aiSummary: string | null;
  tags: string[];

  // PDF
  pdfUrl: string | null;

  // Csatolmányok
  otherFiles: { filename: string; url: string }[];
  backgroundUrl: string | null;

  // Dátum
  orderDate: string | null;

  // Névsor szinkronizáció
  rosterSyncStatus: 'processing' | 'completed' | 'failed' | null;
  rosterSyncResult: { created: number; updated: number; deleted: number; warnings: string[] } | null;
}

/**
 * Order Data API válasz
 */
export interface OrderDataResponse {
  success: boolean;
  data: OrderData | null;
  message?: string;
}

/**
 * Order Data PDF API válasz
 */
export interface OrderDataPdfResponse {
  success: boolean;
  pdfUrl?: string;
  message?: string;
}

/**
 * Order Data Service - Megrendelési adatok lekérése
 */
@Injectable({
  providedIn: 'root'
})
export class OrderDataService {

  constructor(private http: HttpClient) {}

  /**
   * Megrendelési adatok lekérése
   */
  getOrderData(): Observable<OrderDataResponse> {
    return this.http.get<OrderDataResponse>(`${environment.apiUrl}/tablo-frontend/order-data`);
  }

  /**
   * Megrendelési adatlap PDF megtekintése
   * Ez az endpoint minden bejelentkezett felhasználó számára elérhető
   * (vendég és admin előnézet is)
   */
  viewOrderPdf(): Observable<OrderDataPdfResponse> {
    return this.http.post<OrderDataPdfResponse>(`${environment.apiUrl}/tablo-frontend/order-data/view-pdf`, {});
  }
}
