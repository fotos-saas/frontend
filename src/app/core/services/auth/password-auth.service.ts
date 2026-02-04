import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SentryService } from '../sentry.service';
import { TabloAuthService } from './tablo-auth.service';
import type {
  AuthUser,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  ChangePasswordData,
  ResetPasswordData,
  QrCodeValidationResponse,
  QrRegistrationData,
  TwoFactorSetupResponse
} from '../../models/auth.models';

/**
 * Marketer login response - email/jelszó bejelentkezéshez
 */
export interface MarketerLoginResponse {
  user: AuthUser;
  token: string;
}

/**
 * Email/jelszó alapú autentikáció kezelése
 *
 * Felelősségek:
 * - Email/jelszó bejelentkezés
 * - Regisztráció
 * - Jelszó visszaállítás
 * - Email verifikáció
 * - QR kódos regisztráció
 * - 2FA kezelés
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordAuthService {
  private http = inject(HttpClient);
  private sentryService = inject(SentryService);
  private tabloAuth = inject(TabloAuthService);

  /**
   * Callback-ek a fő AuthService-ből
   */
  private onMarketerAuthSuccess?: (user: AuthUser) => void;
  private onPasswordSetChange?: (value: boolean) => void;

  /**
   * Callback regisztráció a fő AuthService-ből
   */
  registerCallbacks(callbacks: {
    onMarketerAuthSuccess: (user: AuthUser) => void;
    onPasswordSetChange: (value: boolean) => void;
  }): void {
    this.onMarketerAuthSuccess = callbacks.onMarketerAuthSuccess;
    this.onPasswordSetChange = callbacks.onPasswordSetChange;
  }

  /**
   * Email/jelszó bejelentkezés (új auth rendszer)
   * Marketer, Partner és tablo-guest felhasználók kezelése
   */
  loginWithPassword(email: string, password: string): Observable<MarketerLoginResponse | LoginResponse> {
    return this.http.post<MarketerLoginResponse | LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          // Super admin, Marketer vagy Partner felhasználó esetén speciális kezelés
          if (response.user.roles?.includes('super_admin') ||
              response.user.roles?.includes('marketer') ||
              response.user.roles?.includes('partner')) {
            this.storeMarketerAuth(response as MarketerLoginResponse);
          } else if ('project' in response && response.project) {
            // Tablo-guest login (ha van project a válaszban)
            this.tabloAuth.storeAuthData(response as LoginResponse, 'code');
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Marketer auth adatok tárolása
   */
  private storeMarketerAuth(response: MarketerLoginResponse): void {
    // Token tárolása localStorage-ba
    localStorage.setItem('marketer_token', response.token);
    localStorage.setItem('marketer_user', JSON.stringify(response.user));

    // Sentry user context beállítása
    this.updateSentryUserContext(response.user, response.user.partner_id ?? undefined);

    // Callback a fő AuthService-nek
    this.onMarketerAuthSuccess?.(response.user);
  }

  /**
   * Regisztráció
   */
  register(data: RegisterData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Jelszó emlékezteto kérés
   */
  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Jelszó visszaállítás tokennel
   */
  resetPassword(data: ResetPasswordData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, data)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Jelszó változtatás (bejelentkezett user)
   */
  changePassword(data: ChangePasswordData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, data)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Jelszó beállítása (QR regisztráció után kötelező)
   */
  setPassword(password: string, password_confirmation: string): Observable<{ message: string; user: AuthUser }> {
    return this.http.post<{ message: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/set-password`,
      { password, password_confirmation }
    ).pipe(
      tap(() => {
        // Sikeres jelszó beállítás után frissítjük a signal-t
        this.onPasswordSetChange?.(true);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Email verifikáció
   */
  verifyEmail(id: number, hash: string): Observable<{ message: string; already_verified?: boolean }> {
    return this.http.get<{ message: string; already_verified?: boolean }>(
      `${environment.apiUrl}/auth/verify-email/${id}/${hash}`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Verifikációs email újraküldés
   */
  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/resend-verification`, { email })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * QR kód validálás
   */
  validateQrCode(code: string): Observable<QrCodeValidationResponse> {
    return this.http.get<QrCodeValidationResponse>(`${environment.apiUrl}/auth/qr-code/${code}/validate`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * QR kódos regisztráció
   */
  registerFromQr(data: QrRegistrationData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register-qr`, data)
      .pipe(
        tap(response => {
          this.tabloAuth.storeAuthData(response, 'code');
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ==========================================
  // 2FA METHODS (előkészítés - még nem implementált)
  // ==========================================

  /**
   * 2FA engedélyezés
   */
  enable2FA(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${environment.apiUrl}/auth/2fa/enable`, {})
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA megerosítés
   */
  confirm2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/confirm`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA letiltás
   */
  disable2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/disable`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA verifikáció
   */
  verify2FA(code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/2fa/verify`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Sentry user context frissítése
   */
  private updateSentryUserContext(user: AuthUser | null, partnerId?: number): void {
    if (user) {
      this.sentryService.setUser({
        id: String(user.id),
        email: user.email ?? undefined,
        username: user.name,
        role: user.roles?.[0],
        partnerId: partnerId ? String(partnerId) : undefined
      });
    }
  }

  /**
   * HTTP hiba kezelés
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const messages: Record<number, string> = {
      401: 'Érvénytelen email vagy jelszó',
      403: 'Nincs jogosultságod ehhez a muvelethez',
      422: 'Érvénytelen adatok',
      423: 'A fiók ideiglenesen zárolva van',
      429: 'Túl sok próbálkozás. Kérlek várj néhány percet.',
      500: 'Szerverhiba. Kérlek próbáld újra később.'
    };

    const errorMessage = error.error instanceof ErrorEvent
      ? 'Hálózati hiba. Ellenőrizd az internetkapcsolatot.'
      : (error.error?.message || messages[error.status] || 'Hiba történt');

    return throwError(() => new Error(errorMessage));
  }
}
