import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { safeJsonParse } from '../../../shared/utils/safe-json-parse';
import type { ClientInfo, ClientBranding, ClientProfile, RegisterResponse, LoginResponse, ClientAlbum } from './client.service';

/**
 * Client Auth Service
 *
 * Kliens authentikáció műveletek:
 * - Login (email/password)
 * - Register (email/password)
 * - Password change
 * - Notification preferences
 * - Logout
 */
@Injectable({
  providedIn: 'root'
})
export class ClientAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/client`;

  /** Current client info (reactive) */
  private readonly _clientInfo = signal<ClientInfo | null>(null);
  readonly clientInfo = this._clientInfo.asReadonly();

  /** Can register computed (has album that allows registration) */
  private readonly _canRegister = signal(false);
  readonly canRegister = this._canRegister.asReadonly();

  /** Partner branding (ha aktív) */
  private readonly _branding = signal<ClientBranding | null>(null);
  readonly branding = this._branding.asReadonly();

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize from sessionStorage
   */
  private initializeFromStorage(): void {
    const stored = sessionStorage.getItem('client_info');
    if (stored) {
      const info = safeJsonParse<ClientInfo | null>(stored, null);
      if (info) {
        this._clientInfo.set(info);
      }
    }
    const storedBranding = sessionStorage.getItem('client_branding');
    if (storedBranding) {
      const branding = safeJsonParse<ClientBranding | null>(storedBranding, null);
      if (branding) {
        this._branding.set(branding);
      }
    }
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return sessionStorage.getItem('client_token');
  }

  /**
   * Get HTTP headers with auth token
   */
  getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
  }

  /**
   * Get client info
   */
  getClientInfo(): ClientInfo | null {
    return this._clientInfo();
  }

  /**
   * Update client info signal (used by other services)
   */
  updateClientInfo(info: Partial<ClientInfo>): void {
    const current = this._clientInfo();
    if (current) {
      this._clientInfo.set({ ...current, ...info });
      sessionStorage.setItem('client_info', JSON.stringify(this._clientInfo()));
    }
  }

  /**
   * Update branding signal (used by other services)
   */
  updateBranding(branding: ClientBranding): void {
    this._branding.set(branding);
    sessionStorage.setItem('client_branding', JSON.stringify(branding));
  }

  /**
   * Update can register flag (used by other services)
   */
  updateCanRegister(canRegister: boolean): void {
    this._canRegister.set(canRegister);
  }

  /**
   * Logout and clear storage
   */
  logout(): void {
    sessionStorage.removeItem('client_token');
    sessionStorage.removeItem('client_info');
    sessionStorage.removeItem('client_albums');
    sessionStorage.removeItem('client_branding');
    this._clientInfo.set(null);
    this._branding.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get client profile (includes canRegister flag)
   */
  getProfile(): Observable<{ success: boolean; data: ClientProfile }> {
    return this.http.get<{ success: boolean; data: ClientProfile }>(
      `${this.baseUrl}/profile`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this._canRegister.set(response.data.canRegister);
        // Update client info with registration status
        const current = this._clientInfo();
        if (current) {
          this._clientInfo.set({
            ...current,
            isRegistered: response.data.isRegistered,
            wantsNotifications: response.data.wantsNotifications,
          });
        }
        // Update branding from profile
        if (response.data.branding) {
          this._branding.set(response.data.branding);
          sessionStorage.setItem('client_branding', JSON.stringify(response.data.branding));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Register with email and password
   * FONTOS: Ez után a kód alapú belépés MEGSZŰNIK!
   */
  register(email: string, password: string, passwordConfirmation: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.baseUrl}/register`,
      {
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Update token and client info
        sessionStorage.setItem('client_token', response.token);
        this._clientInfo.set({
          ...this._clientInfo()!,
          email: response.client.email,
          isRegistered: true,
        });
        sessionStorage.setItem('client_info', JSON.stringify(this._clientInfo()));
        this._canRegister.set(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Login with email and password (for registered clients)
   */
  loginWithPassword(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      { email, password }
    ).pipe(
      tap(response => {
        // Save token and client info
        sessionStorage.setItem('client_token', response.token);
        sessionStorage.setItem('client_info', JSON.stringify({
          id: response.client.id,
          name: response.client.name,
          email: response.client.email,
          phone: response.client.phone,
          isRegistered: response.user.isRegistered,
          wantsNotifications: response.client.wantsNotifications,
        }));
        this._clientInfo.set({
          id: response.client.id,
          name: response.client.name,
          email: response.client.email,
          phone: response.client.phone,
          isRegistered: response.user.isRegistered,
          wantsNotifications: response.client.wantsNotifications,
        });
        // Store albums in localStorage for quick access
        sessionStorage.setItem('client_albums', JSON.stringify(response.albums));
        // Store branding
        if (response.branding) {
          this._branding.set(response.branding);
          sessionStorage.setItem('client_branding', JSON.stringify(response.branding));
        }
      }),
      catchError(err => {
        const message = err.error?.message ?? 'Hiba történt. Kérlek próbáld újra.';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Update notification preferences
   */
  updateNotifications(wantsNotifications: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string; data: { wantsNotifications: boolean } }>(
      `${this.baseUrl}/notifications`,
      { wants_notifications: wantsNotifications },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        const current = this._clientInfo();
        if (current) {
          this._clientInfo.set({
            ...current,
            wantsNotifications: response.data.wantsNotifications,
          });
          sessionStorage.setItem('client_info', JSON.stringify(this._clientInfo()));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string, confirmation: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/change-password`,
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmation,
      },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: { status: number; error?: { message?: string; errors?: Record<string, string[]> } }): Observable<never> {
    // 401 - unauthorized, redirect to login
    if (error.status === 401) {
      this.logout();
      return throwError(() => new Error('A munkamenet lejárt. Kérlek jelentkezz be újra.'));
    }

    const message = error.error?.message ?? 'Hiba történt. Kérlek próbáld újra.';
    return throwError(() => new Error(message));
  }
}
