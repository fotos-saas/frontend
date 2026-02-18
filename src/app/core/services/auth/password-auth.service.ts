import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { handleAuthError } from '../../../shared/utils/http-error.util';
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

/** Status kód => hibaüzenet mapping */
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  401: 'Érvénytelen email vagy jelszó',
  403: 'Nincs jogosultságod ehhez a muvelethez',
  422: 'Érvénytelen adatok',
  423: 'A fiók ideiglenesen zárolva van',
  429: 'Túl sok próbálkozás. Kérlek várj néhány percet.',
  500: 'Szerverhiba. Kérlek próbáld újra később.',
};

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
          // Partner, csapattagok és admin role-ok
          const partnerRoles = ['super_admin', 'marketer', 'partner', 'designer', 'printer', 'assistant'];
          const hasPartnerAccess = partnerRoles.some(role => response.user.roles?.includes(role));

          if (hasPartnerAccess) {
            this.storeMarketerAuth(response as MarketerLoginResponse);
          } else if ('project' in response && response.project) {
            // Tablo-guest login (ha van project a válaszban)
            this.tabloAuth.storeAuthData(response as LoginResponse, 'code');
          }
        }),
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * Marketer auth adatok tárolása
   *
   * SECURITY: sessionStorage használata localStorage helyett
   * - Tab-izolált: más tabok nem férnek hozzá
   * - XSS támadás esetén csak az aktuális tab érintett
   * - Tab bezáráskor automatikusan törlődik
   *
   * Megjegyzés: A felhasználónak újra be kell jelentkeznie új tab nyitáskor,
   * de ez biztonságosabb mint a localStorage használata.
   */
  private storeMarketerAuth(response: MarketerLoginResponse): void {
    // SECURITY: sessionStorage XSS mitigation
    sessionStorage.setItem('marketer_token', response.token);
    sessionStorage.setItem('marketer_user', JSON.stringify(response.user));

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
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * Jelszó emlékezteto kérés
   */
  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * Jelszó visszaállítás tokennel
   */
  resetPassword(data: ResetPasswordData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, data)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * Jelszó változtatás (bejelentkezett user)
   */
  changePassword(data: ChangePasswordData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, data)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
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
      catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
    );
  }

  /**
   * Email verifikáció
   */
  verifyEmail(id: number, hash: string): Observable<{ message: string; already_verified?: boolean }> {
    return this.http.get<{ message: string; already_verified?: boolean }>(
      `${environment.apiUrl}/auth/verify-email/${id}/${hash}`
    ).pipe(
      catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
    );
  }

  /**
   * Verifikációs email újraküldés
   */
  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/resend-verification`, { email })
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * QR kód validálás
   */
  validateQrCode(code: string): Observable<QrCodeValidationResponse> {
    return this.http.get<QrCodeValidationResponse>(`${environment.apiUrl}/auth/qr-code/${code}/validate`)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
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
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
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
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * 2FA megerosítés
   */
  confirm2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/confirm`, { code })
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * 2FA letiltás
   */
  disable2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/disable`, { code })
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
      );
  }

  /**
   * 2FA verifikáció
   */
  verify2FA(code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/2fa/verify`, { code })
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, AUTH_ERROR_MESSAGES)))
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

}
