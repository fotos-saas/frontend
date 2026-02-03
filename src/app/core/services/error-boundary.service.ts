/**
 * Error Boundary Service
 *
 * Signal-alapú service a globális hiba UI állapot kezelésére.
 * 5xx hibáknál dialog megjelenítése felhasználóbarát üzenettel.
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorInfo {
  /** Sentry event ID (support-hoz) */
  eventId: string;
  /** HTTP státusz kód */
  statusCode: number;
  /** Hiba URL */
  url: string;
  /** Hiba időpontja */
  timestamp: Date;
  /** Eredeti hiba objektum */
  originalError?: HttpErrorResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorBoundaryService {
  /** Megjelenik-e a hiba dialógus */
  private readonly _showDialog = signal(false);

  /** Aktuális hiba információk */
  private readonly _errorInfo = signal<ErrorInfo | null>(null);

  /** Felhasználói feedback szöveg */
  private readonly _userFeedback = signal('');

  // Public readonly signals
  readonly showDialog = this._showDialog.asReadonly();
  readonly errorInfo = this._errorInfo.asReadonly();
  readonly userFeedback = this._userFeedback.asReadonly();

  /** Computed: van-e aktív hiba */
  readonly hasError = computed(() => this._errorInfo() !== null);

  /** Computed: event ID rövidítve (UI-hoz) */
  readonly shortEventId = computed(() => {
    const info = this._errorInfo();
    if (!info?.eventId) return null;
    // Első 8 karakter (pl. "abc12345")
    return info.eventId.slice(0, 8);
  });

  /**
   * Hiba jelentése - megnyitja a dialógust
   */
  reportError(error: HttpErrorResponse, eventId: string): void {
    this._errorInfo.set({
      eventId,
      statusCode: error.status,
      url: error.url ?? 'unknown',
      timestamp: new Date(),
      originalError: error
    });
    this._showDialog.set(true);
  }

  /**
   * Dialógus bezárása
   */
  dismiss(): void {
    this._showDialog.set(false);
    // Kis késleltetés után töröljük az error info-t (animáció miatt)
    setTimeout(() => {
      this._errorInfo.set(null);
      this._userFeedback.set('');
    }, 300);
  }

  /**
   * Felhasználói feedback beállítása
   */
  setFeedback(feedback: string): void {
    this._userFeedback.set(feedback);
  }

  /**
   * Retry - bezárja a dialógust és újratölti az oldalt
   */
  retry(): void {
    this.dismiss();
    window.location.reload();
  }

  /**
   * Navigálás a főoldalra
   */
  goHome(): void {
    this.dismiss();
    window.location.href = '/';
  }
}
