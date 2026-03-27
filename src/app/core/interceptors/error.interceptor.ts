import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';
import { SentryService } from '../services/sentry.service';
import { ErrorBoundaryService } from '../services/error-boundary.service';
import { TokenService } from '../services/token.service';
import { TabloStorageService } from '../services/tablo-storage.service';

/**
 * Error Interceptor - Központosított HTTP hibakezelés
 *
 * MEGJEGYZÉS: A 401 hibákat az AuthInterceptor kezeli (kijelentkeztetés)
 * FONTOS: NEM inject-álhat AuthService-t vagy SessionService-t (circular dependency NG0200)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const logger = inject(LoggerService);
  const sentryService = inject(SentryService);
  const errorBoundary = inject(ErrorBoundaryService);
  const tokenService = inject(TokenService);
  const storage = inject(TabloStorageService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 hibákat az AuthInterceptor kezeli - itt nem kell
      if (error.status === 401) {
        return throwError(() => error);
      }

      // Árva partner fiók: nincs Partner rekord → kijelentkeztetés
      if (error.status === 403 && error.error?.code === 'no_partner') {
        sessionStorage.removeItem('marketer_token');
        sessionStorage.removeItem('marketer_user');
        tokenService.clearToken();
        storage.clearActiveSession();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Hibakezelés státusz kód alapján
      handleError(error, req.url, toastService, logger, sentryService, errorBoundary);

      return throwError(() => error);
    })
  );
};

/**
 * HTTP hibák kezelése és megfelelő Toast üzenetek megjelenítése
 */
function handleError(
  error: HttpErrorResponse,
  url: string,
  toastService: ToastService,
  logger: LoggerService,
  sentryService: SentryService,
  errorBoundary: ErrorBoundaryService
): void {
  let title = 'Hiba';
  let message = 'Ismeretlen hiba történt.';
  let showDialog = false;

  switch (error.status) {
    case 0:
      title = 'Kapcsolódási hiba';
      message = 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot.';
      break;

    case 400:
      title = 'Érvénytelen kérés';
      message = extractErrorMessage(error) || 'A kérés hibás formátumú.';
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
      title = 'Validációs hiba';
      message = extractValidationErrors(error) || 'Ellenőrizd a megadott adatokat.';
      break;

    case 429:
      title = 'Túl sok kérés';
      message = 'Kérlek várj egy kicsit, majd próbáld újra.';
      break;

    case 500:
      title = 'Szerverhiba';
      message = 'Belső szerverhiba történt. Kérlek próbáld újra később.';
      showDialog = true;
      break;

    case 502:
      title = 'Szerver nem elérhető';
      message = 'A szerver ideiglenesen nem elérhető.';
      showDialog = true;
      break;

    case 503:
      title = 'Karbantartás';
      message = 'A szerver karbantartás alatt. Kérlek próbáld újra később.';
      showDialog = true;
      break;

    case 504:
      title = 'Időtúllépés';
      message = 'A szerver nem válaszolt időben. Kérlek próbáld újra.';
      showDialog = true;
      break;

    default:
      if (error.status >= 500) {
        title = 'Szerverhiba';
        message = 'Váratlan hiba történt. Kérlek próbáld újra később.';
        showDialog = true;
      }
      break;
  }

  // 5xx hibáknál Sentry-nek küldjük és dialógust jelenítünk meg
  if (showDialog) {
    const eventId = sentryService.captureException(error, {
      url,
      status: error.status,
      statusText: error.statusText,
      errorBody: error.error
    });

    if (eventId) {
      errorBoundary.reportError(error, eventId);
    }
  }

  // Toast megjelenítése (hosszabb időtartam súlyosabb hibáknál)
  const duration = error.status >= 500 || error.status === 0 ? 5000 : 4000;
  toastService.error(title, message, duration);

  // Hiba naplózása
  logger.error(`HTTP Error ${error.status}`, {
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
function extractErrorMessage(error: HttpErrorResponse): string | null {
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
 */
function extractValidationErrors(error: HttpErrorResponse): string | null {
  const errors = error.error?.errors;
  if (!errors || typeof errors !== 'object') {
    return error.error?.message || null;
  }

  const firstField = Object.keys(errors)[0];
  if (firstField && Array.isArray(errors[firstField])) {
    return errors[firstField][0];
  }

  return null;
}
