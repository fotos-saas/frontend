import { Observable } from 'rxjs';

/**
 * QR kód adatok interface
 */
export interface QrCode {
  id: number;
  code: string;
  usageCount: number;
  maxUsages: number | null;
  expiresAt: string | null;
  isValid: boolean;
  registrationUrl: string;
}

/**
 * QR kód lekérdezés válasz
 */
export interface QrCodeResponse {
  hasQrCode: boolean;
  qrCode?: QrCode;
  message?: string;
}

/**
 * QR kód generálás válasz
 */
export interface QrCodeGenerateResponse {
  success: boolean;
  qrCode: QrCode;
  message?: string;
}

/**
 * QR kód műveletek eredmény
 */
export interface QrCodeActionResponse {
  success: boolean;
  message: string;
}

/**
 * QR Code Service Interface - közös interface Partner és Marketer service-ekhez
 */
export interface IQrCodeService {
  getProjectQrCode(projectId: number): Observable<QrCodeResponse>;
  generateQrCode(projectId: number, options?: {
    expires_at?: string;
    max_usages?: number | null;
  }): Observable<QrCodeGenerateResponse>;
  deactivateQrCode(projectId: number): Observable<QrCodeActionResponse>;
}
