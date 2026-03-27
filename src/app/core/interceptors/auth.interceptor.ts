import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { TabloStorageService } from '../services/tablo-storage.service';
import { LoggerService } from '../services/logger.service';
import { GuestService } from '../services/guest.service';

/**
 * Helper function to read cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Interceptor-safe logout — NEM használ HttpClient-es service-eket.
 * Csak sessionStorage + TokenService + TabloStorageService (nincs HttpClient).
 */
function interceptorLogoutAdmin(tokenService: TokenService, storage: TabloStorageService, router: Router): void {
  sessionStorage.removeItem('marketer_token');
  sessionStorage.removeItem('marketer_user');
  tokenService.clearToken();
  storage.clearActiveSession();
  router.navigate(['/login']);
}

function interceptorClearAuth(tokenService: TokenService, storage: TabloStorageService, router: Router): void {
  tokenService.clearToken();
  storage.clearActiveSession();
  router.navigate(['/login']);
}

/**
 * Auth Interceptor - Bearer token és CSRF védelem
 *
 * FONTOS: NEM inject-álhat AuthService-t, SessionService-t, vagy bármi
 * HttpClient-függő service-t — circular dependency (NG0200).
 * Helyette: TokenService + sessionStorage közvetlen olvasás.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const storage = inject(TabloStorageService);
  const logger = inject(LoggerService);
  const guestService = inject(GuestService);
  const router = inject(Router);

  // Marketer token ellenőrzése először (sessionStorage-ból közvetlenül)
  const marketerToken = sessionStorage.getItem('marketer_token');
  const token = marketerToken || tokenService.getToken();
  const csrfToken = getCookie('XSRF-TOKEN');

  // Headers összegyűjtése
  const headers: { [key: string]: string } = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  const guestSessionToken = guestService.getSessionToken();
  if (guestSessionToken) {
    headers['X-Guest-Session'] = guestSessionToken;
  }

  const clonedReq = req.clone({
    setHeaders: headers,
    withCredentials: true
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (!req.url.includes('/auth/login')) {
          const activeSession = storage.getActiveSession();
          logger.warn('[AuthInterceptor] 401 hiba:', {
            url: req.url,
            sessionType: activeSession?.sessionType,
            hasToken: !!token,
            errorMessage: error.error?.message
          });

          const isOverlay = router.url.startsWith('/overlay');
          const currentMarketerToken = sessionStorage.getItem('marketer_token');
          if (isOverlay) {
            logger.info('[AuthInterceptor] 401 ignorálva (overlay mód)');
          } else if (!currentMarketerToken && marketerToken) {
            logger.info('[AuthInterceptor] 401 ignorálva (marketer session már törölve)');
          } else if (currentMarketerToken) {
            logger.warn('[AuthInterceptor] Partner/admin logout 401 miatt', { url: req.url });
            interceptorLogoutAdmin(tokenService, storage, router);
          } else if (activeSession?.sessionType === 'share' ||
                     req.url.includes('/newsfeed') ||
                     req.url.includes('/gamification')) {
            logger.info('[AuthInterceptor] 401 ignorálva (share session, newsfeed vagy gamification)');
          } else {
            logger.warn('[AuthInterceptor] Automatikus logout 401 miatt');
            interceptorClearAuth(tokenService, storage, router);
          }
        }
      }

      return throwError(() => error);
    })
  );
};
