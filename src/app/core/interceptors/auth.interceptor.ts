import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TabloStorageService } from '../services/tablo-storage.service';
import { LoggerService } from '../services/logger.service';
import { GuestService } from '../services/guest.service';

/**
 * Helper function to read cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null
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
 * Auth Interceptor - Bearer token és CSRF védelem
 *
 * Felelősségek:
 * - Authorization header hozzáadása
 * - CSRF token (X-XSRF-TOKEN) hozzáadása
 * - withCredentials engedélyezése (Laravel Sanctum)
 * - 401 hibák kezelése (automatikus kijelentkezés)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storage = inject(TabloStorageService);
  const logger = inject(LoggerService);
  const guestService = inject(GuestService);
  const router = inject(Router);

  // Marketer token ellenőrzése először
  const marketerToken = authService.getMarketerToken();
  const token = marketerToken || authService.getToken();
  const csrfToken = getCookie('XSRF-TOKEN');

  // Headers összegyűjtése
  const headers: { [key: string]: string } = {};

  // Bearer token hozzáadása
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // CSRF token hozzáadása (Laravel Sanctum)
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  // Guest session token hozzáadása (ha van)
  const guestSessionToken = guestService.getSessionToken();
  if (guestSessionToken) {
    headers['X-Guest-Session'] = guestSessionToken;
  }

  // Request klónozás a headerekkel és withCredentials-szel
  const clonedReq = req.clone({
    setHeaders: headers,
    withCredentials: true // Laravel Sanctum cookie kezeléshez
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized - token érvénytelen, kijelentkeztetés
      if (error.status === 401) {
        // Csak ha nem login kérés volt
        if (!req.url.includes('/auth/login')) {
          // Share session esetén NE logout-oljunk, mert guest session-nel autentikál
          const activeSession = storage.getActiveSession();
          logger.warn('[AuthInterceptor] 401 hiba:', {
            url: req.url,
            sessionType: activeSession?.sessionType,
            hasToken: !!token,
            errorMessage: error.error?.message
          });

          // Overlay ablakban NE logout-oljon (nincs router navigate, overlay kezeli magának)
          const isOverlay = router.url.startsWith('/overlay');
          if (isOverlay) {
            logger.info('[AuthInterceptor] 401 ignorálva (overlay mód)');
          } else if (marketerToken) {
            // Partner/marketer/admin session — marketer token törlés + login redirect
            logger.warn('[AuthInterceptor] Partner/admin logout 401 miatt', { url: req.url });
            authService.logoutMarketer();
          } else if (activeSession?.sessionType === 'share' ||
                     req.url.includes('/newsfeed') ||
                     req.url.includes('/gamification')) {
            logger.info('[AuthInterceptor] 401 ignorálva (share session, newsfeed vagy gamification)');
          } else {
            // Tablo session logout
            logger.warn('[AuthInterceptor] Automatikus logout 401 miatt');
            authService.clearAuth();
          }
        }
      }

      return throwError(() => error);
    })
  );
};
