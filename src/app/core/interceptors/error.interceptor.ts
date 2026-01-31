import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';

/**
 * Error Interceptor - Központosított HTTP hibakezelés
 *
 * Felelősségek:
 * - HTTP hibák megfelelő Toast üzenetekkel való megjelenítése
 * - Hibák naplózása
 * - Retry logika (opcionális - később bővíthető)
 *
 * Kezelt hibakódok:
 * - 400: Érvénytelen kérés
 * - 403: Hozzáférés megtagadva
 * - 404: Nem található
 * - 422: Validációs hiba
 * - 429: Túl sok kérés
 * - 500+: Szerverhiba
 * - 0: Hálózati hiba / Szerver elérhetetlen
 *
 * MEGJEGYZÉS: A 401 hibákat az AuthInterceptor kezeli (kijelentkeztetés)
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 hibákat az AuthInterceptor kezeli - itt nem kell
        if (error.status === 401) {
          return throwError(() => error);
        }

        // Hibakezelés státusz kód alapján
        this.handleError(error, request.url);

        return throwError(() => error);
      })
    );
  }

  /**
   * HTTP hibák kezelése és megfelelő Toast üzenetek megjelenítése
   */
  private handleError(error: HttpErrorResponse, url: string): void {
    let title = 'Hiba';
    let message = 'Ismeretlen hiba történt.';

    switch (error.status) {
      case 0:
        // Hálózati hiba - szerver nem elérhető
        title = 'Kapcsolódási hiba';
        message = 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot.';
        break;

      case 400:
        title = 'Érvénytelen kérés';
        message = this.extractErrorMessage(error) || 'A kérés hibás formátumú.';
        break;

      case 403:
        title = 'Hozzáférés megtagadva';
        message = 'Nincs jogosultságod ehhez a művelethez.';
        break;

      case 404:
        title = 'Nem található';
        message = 'A keresett erőforrás nem található.';
        break;

      case 422:
        // Validációs hiba - részletes üzenet a szerverről
        title = 'Validációs hiba';
        message = this.extractValidationErrors(error) || 'Ellenőrizd a megadott adatokat.';
        break;

      case 429:
        title = 'Túl sok kérés';
        message = 'Kérlek várj egy kicsit, majd próbáld újra.';
        break;

      case 500:
        title = 'Szerverhiba';
        message = 'Belső szerverhiba történt. Kérlek próbáld újra később.';
        break;

      case 502:
        title = 'Szerver nem elérhető';
        message = 'A szerver ideiglenesen nem elérhető.';
        break;

      case 503:
        title = 'Karbantartás';
        message = 'A szerver karbantartás alatt. Kérlek próbáld újra később.';
        break;

      case 504:
        title = 'Időtúllépés';
        message = 'A szerver nem válaszolt időben. Kérlek próbáld újra.';
        break;

      default:
        if (error.status >= 500) {
          title = 'Szerverhiba';
          message = 'Váratlan hiba történt. Kérlek próbáld újra később.';
        }
        break;
    }

    // Toast megjelenítése (hosszabb időtartam súlyosabb hibáknál)
    const duration = error.status >= 500 || error.status === 0 ? 5000 : 4000;
    this.toastService.error(title, message, duration);

    // Hiba naplózása
    this.logger.error(`HTTP Error ${error.status}`, {
      url,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });
  }

  /**
   * Hibaüzenet kinyerése a válaszból
   */
  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error?.message) {
      return error.error.message;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
    return null;
  }

  /**
   * Laravel validációs hibák kinyerése
   * Formátum: { errors: { field: ['error1', 'error2'] } }
   */
  private extractValidationErrors(error: HttpErrorResponse): string | null {
    const errors = error.error?.errors;
    if (!errors || typeof errors !== 'object') {
      return error.error?.message || null;
    }

    // Első mező első hibája
    const firstField = Object.keys(errors)[0];
    if (firstField && Array.isArray(errors[firstField])) {
      return errors[firstField][0];
    }

    return null;
  }
}
