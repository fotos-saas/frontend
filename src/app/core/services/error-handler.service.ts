import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { LoggerService } from './logger.service';

/**
 * Structured error interface
 */
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Error Handler Service
 *
 * Központi hibakezelő service HTTP hibákhoz.
 * Magyar nyelvű hibaüzenetek, strukturált hiba objektumok.
 *
 * @example
 * // Service-ben
 * catchError(error => this.errorHandler.handleHttpError(error, 'Poszt betöltése'))
 *
 * // Komponensben
 * .subscribe({
 *   error: (err: AppError) => this.errorMessage.set(err.message)
 * })
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly logger = inject(LoggerService);

  /**
   * HTTP hiba kezelése
   *
   * @param error - HttpErrorResponse
   * @param context - Műveleti kontextus (pl. "Poszt betöltése")
   * @returns Observable<never> - throwError az AppError-ral
   */
  handleHttpError(error: HttpErrorResponse, context?: string): Observable<never> {
    const appError = this.mapHttpError(error);

    // Logolás (csak dev környezetben jelenik meg)
    this.logger.error(`[${context || 'HTTP Error'}]`, {
      status: error.status,
      message: appError.message,
      url: error.url
    });

    return throwError(() => appError);
  }

  /**
   * HttpErrorResponse -> AppError mapping
   */
  mapHttpError(error: HttpErrorResponse): AppError {
    // Ha a backend küldött strukturált hibaüzenetet
    if (error.error?.message) {
      return {
        message: error.error.message,
        code: error.error.code,
        status: error.status,
        details: error.error.errors
      };
    }

    // Alapértelmezett hibaüzenetek státusz alapján
    return {
      message: this.getDefaultMessage(error.status),
      status: error.status
    };
  }

  /**
   * Alapértelmezett magyar hibaüzenetek HTTP státusz alapján
   */
  private getDefaultMessage(status: number): string {
    switch (status) {
      case 0:
        return 'Nincs internetkapcsolat vagy a szerver nem elérhető';
      case 400:
        return 'Érvénytelen kérés';
      case 401:
        return 'Nincs jogosultságod ehhez a művelethez';
      case 403:
        return 'A hozzáférés megtagadva';
      case 404:
        return 'A keresett elem nem található';
      case 409:
        return 'Ütközés a meglévő adatokkal';
      case 413:
        return 'A feltöltött fájl túl nagy';
      case 422:
        return 'Érvénytelen adatok';
      case 429:
        return 'Túl sok kérés, kérlek várj egy kicsit';
      case 500:
        return 'Szerverhiba történt';
      case 502:
        return 'A szerver átmenetileg nem elérhető';
      case 503:
        return 'A szolgáltatás átmenetileg nem elérhető';
      case 504:
        return 'A kérés időtúllépés miatt megszakadt';
      default:
        return 'Ismeretlen hiba történt';
    }
  }

  /**
   * Validation error üzenetek kinyerése (Laravel)
   *
   * @param error - HttpErrorResponse
   * @returns Validation üzenetek tömbje
   */
  getValidationErrors(error: HttpErrorResponse): string[] {
    const errors: string[] = [];

    if (error.error?.errors && typeof error.error.errors === 'object') {
      for (const field of Object.keys(error.error.errors)) {
        const fieldErrors = error.error.errors[field];
        if (Array.isArray(fieldErrors)) {
          errors.push(...fieldErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Error message getter egyszerű használatra
   */
  getMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return this.mapHttpError(error).message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'Ismeretlen hiba történt';
  }
}
