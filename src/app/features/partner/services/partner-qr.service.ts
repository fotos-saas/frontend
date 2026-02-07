import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { QrCode } from '../../../shared/interfaces/qr-code.interface';

/**
 * QR kód kezelés service.
 * QR kód generálás, inaktiválás, rögzítés.
 */
@Injectable({
  providedIn: 'root',
})
export class PartnerQrService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner`;

  /**
   * Projekt QR kódok lekérése
   */
  getProjectQrCodes(projectId: number): Observable<{ qrCodes: QrCode[] }> {
    return this.http.get<{ qrCodes: QrCode[] }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`,
    );
  }

  /**
   * Új QR kód generálása projekthez
   */
  generateQrCode(projectId: number, options: {
    type: string;
    expires_at?: string;
    max_usages?: number | null;
  }): Observable<{ success: boolean; message: string; qrCode: QrCode }> {
    return this.http.post<{ success: boolean; message: string; qrCode: QrCode }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes`,
      options,
    );
  }

  /**
   * QR kód inaktiválása
   */
  deactivateQrCode(projectId: number, codeId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}`,
    );
  }

  /**
   * QR kód rögzítése (pin)
   */
  pinQrCode(projectId: number, codeId: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/projects/${projectId}/qr-codes/${codeId}/pin`,
      {},
    );
  }
}
