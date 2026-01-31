import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly logger = inject(LoggerService);
  private readonly guestService = inject(GuestService);

  constructor(
    private authService: AuthService,
    private storage: TabloStorageService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Marketer token ellenőrzése először
    const marketerToken = this.authService.getMarketerToken();
    const token = marketerToken || this.authService.getToken();
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
    const guestSessionToken = this.guestService.getSessionToken();
    if (guestSessionToken) {
      headers['X-Guest-Session'] = guestSessionToken;
    }

    // Request klónozás a headerekkel és withCredentials-szel
    request = request.clone({
      setHeaders: headers,
      withCredentials: true // Laravel Sanctum cookie kezeléshez
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 Unauthorized - token érvénytelen, kijelentkeztetés
        if (error.status === 401) {
          // Csak ha nem login kérés volt
          if (!request.url.includes('/auth/login')) {
            // Share session esetén NE logout-oljunk, mert guest session-nel autentikál
            const activeSession = this.storage.getActiveSession();
            this.logger.warn('[AuthInterceptor] 401 hiba:', {
              url: request.url,
              sessionType: activeSession?.sessionType,
              hasToken: !!token,
              errorMessage: error.error?.message
            });

            // NE logout-oljon ha:
            // - share session (guest session-nel autentikál)
            // - newsfeed API hívás (guest session hiánya okozhatja)
            // - gamification API hívás (opcionális, service catchError-rel kezeli)
            // - marketer session (külön kezeljük)
            const isMarketerRequest = request.url.includes('/marketer');
            if (activeSession?.sessionType !== 'share' &&
                !request.url.includes('/newsfeed') &&
                !request.url.includes('/gamification') &&
                !isMarketerRequest) {
              this.logger.warn('[AuthInterceptor] Automatikus logout 401 miatt');
              this.authService.clearAuth();
            } else if (isMarketerRequest) {
              this.logger.warn('[AuthInterceptor] Marketer logout 401 miatt');
              this.authService.logoutMarketer();
            } else {
              this.logger.info('[AuthInterceptor] 401 ignorálva (share session, newsfeed vagy gamification)');
            }
          }
        }

        return throwError(() => error);
      })
    );
  }
}
