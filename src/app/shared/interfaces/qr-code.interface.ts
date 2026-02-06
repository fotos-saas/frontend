import { Observable } from 'rxjs';
import { QrCodeTypeKey } from '../constants/qr-code-types';

/**
 * Regisztrált session rövid adatai
 */
export interface QrRegisteredSession {
  id: number;
  guestName: string;
  guestEmail: string | null;
  createdAt: string;
}

/**
 * QR kód adatok interface
 */
export interface QrCode {
  id: number;
  code: string;
  type: QrCodeTypeKey;
  typeLabel: string;
  isPinned: boolean;
  usageCount: number;
  maxUsages: number | null;
  expiresAt: string | null;
  isValid: boolean;
  registrationUrl: string;
  registeredSessions: QrRegisteredSession[];
}

/**
 * QR kódok lekérdezés válasz
 */
export interface QrCodesResponse {
  qrCodes: QrCode[];
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
  getProjectQrCodes(projectId: number): Observable<QrCodesResponse>;
  generateQrCode(projectId: number, options: {
    type: QrCodeTypeKey;
    expires_at?: string;
    max_usages?: number | null;
  }): Observable<QrCodeGenerateResponse>;
  deactivateQrCode(projectId: number, codeId: number): Observable<QrCodeActionResponse>;
  pinQrCode(projectId: number, codeId: number): Observable<QrCodeActionResponse>;
}
