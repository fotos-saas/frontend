import { Injectable, computed, signal, DestroyRef, inject } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, timer, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TabloStorageService } from './tablo-storage.service';
import { TokenType } from './token.service';
import {
  GuestSession,
  GuestRegisterRequest,
  GuestRegisterResponse,
  GuestValidateResponse,
  GuestUpdateRequest,
  GuestUpdateResponse,
  SessionStatusResponse,
  SessionInvalidatedEvent
} from './guest.models';

/**
 * Guest Session Service
 *
 * Vendég session kezelés: regisztráció, validálás, storage,
 * polling (ban/törlés figyelés), heartbeat, device fingerprint.
 */
@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly SESSION_CHECK_INTERVAL_MS = 30000;

  private readonly _guestSession = signal<GuestSession | null>(null);
  public readonly guestSessionSignal = this._guestSession.asReadonly();
  public readonly guestSession$: Observable<GuestSession | null> = toObservable(this._guestSession);
  public readonly hasGuestSession = computed<boolean>(() => this._guestSession() !== null);
  public readonly guestName = computed<string | null>(() => this._guestSession()?.guestName ?? null);
  public readonly currentProjectId = computed<number | null>(() => this.storage.getActiveSession()?.projectId ?? null);
  public readonly sessionInvalidated$ = new Subject<SessionInvalidatedEvent>();

  constructor(
    private http: HttpClient,
    private storage: TabloStorageService
  ) {
    this.loadStoredSession();
    this.destroyRef.onDestroy(() => {
      this.sessionInvalidated$.complete();
    });
  }

  initializeFromStorage(): void { this.loadStoredSession(); }

  loadStoredSession(): void {
    const activeSession = this.storage.getActiveSession();
    if (!activeSession) return;
    const { projectId, sessionType } = activeSession;
    const sessionToken = this.storage.getGuestSession(projectId, sessionType);
    const guestName = this.storage.getGuestName(projectId, sessionType);
    if (sessionToken && guestName) {
      this._guestSession.set({ sessionToken, guestName, guestEmail: null });
    }
  }

  storeSessionToken(pId: number, sType: TokenType, token: string): void { this.storage.setGuestSession(pId, sType, token); }
  storeGuestName(pId: number, sType: TokenType, name: string): void { this.storage.setGuestName(pId, sType, name); }
  storeGuestId(pId: number, sType: TokenType, id: number): void { this.storage.setGuestId(pId, sType, id); }

  getGuestId(): number | null {
    const s = this.storage.getActiveSession();
    return s ? this.storage.getGuestId(s.projectId, s.sessionType) : null;
  }

  hasRegisteredSession(): boolean { return this.hasGuestSession(); }

  register(guestName: string, guestEmail?: string): Observable<GuestSession> {
    const request: GuestRegisterRequest = {
      guest_name: guestName,
      guest_email: guestEmail,
      device_identifier: this.getDeviceIdentifier()
    };
    return this.http.post<GuestRegisterResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/register`, request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Regisztráció sikertelen');
        }
        const session: GuestSession = {
          id: response.data.id,
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email
        };
        const active = this.storage.getActiveSession();
        if (active) {
          this.storeSessionToken(active.projectId, active.sessionType, response.data.session_token);
          this.storeGuestName(active.projectId, active.sessionType, response.data.guest_name);
          this.storeGuestId(active.projectId, active.sessionType, response.data.id);
        }
        this._guestSession.set(session);
        return session;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateGuestInfo(guestName: string, guestEmail?: string): Observable<GuestSession> {
    const current = this._guestSession();
    if (!current) return throwError(() => new Error('Nincs aktív session'));
    const request: GuestUpdateRequest = {
      session_token: current.sessionToken,
      guest_name: guestName,
      guest_email: guestEmail
    };
    return this.http.put<GuestUpdateResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/update`, request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Frissítés sikertelen');
        }
        const updated: GuestSession = {
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email
        };
        const active = this.storage.getActiveSession();
        if (active) {
          this.storeGuestName(active.projectId, active.sessionType, response.data.guest_name);
        }
        this._guestSession.set(updated);
        return updated;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  validateSession(): Observable<boolean> {
    const current = this._guestSession();
    if (!current) return of(false);
    return this.http.post<GuestValidateResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/validate`,
      { session_token: current.sessionToken }
    ).pipe(
      map(response => {
        if (!response.valid) { this.clearSession(); return false; }
        if (response.data?.id) {
          const active = this.storage.getActiveSession();
          if (active) this.storeGuestId(active.projectId, active.sessionType, response.data.id);
        }
        return true;
      }),
      catchError(() => { this.clearSession(); return of(false); })
    );
  }

  clearSession(): void {
    const active = this.storage.getActiveSession();
    if (active) this.storage.clearGuestData(active.projectId, active.sessionType);
    this._guestSession.set(null);
  }

  storeGuestSessionFromLogin(projectId: number, sessionType: TokenType, sessionToken: string, guestName: string): void {
    this.storeSessionToken(projectId, sessionType, sessionToken);
    this.storeGuestName(projectId, sessionType, guestName);
    this._guestSession.set({ sessionToken, guestName, guestEmail: null });
  }

  setRestoredSession(restored: { sessionToken: string; guestName: string; guestEmail: string | null }): void {
    const active = this.storage.getActiveSession();
    if (active) {
      this.storeSessionToken(active.projectId, active.sessionType, restored.sessionToken);
      this.storeGuestName(active.projectId, active.sessionType, restored.guestName);
    }
    this._guestSession.set({
      sessionToken: restored.sessionToken,
      guestName: restored.guestName,
      guestEmail: restored.guestEmail
    });
  }

  setGuestSession(session: GuestSession | null): void { this._guestSession.set(session); }
  getCurrentSession(): GuestSession | null { return this._guestSession(); }

  getGuestSessionHeader(): HttpHeaders {
    const session = this._guestSession();
    if (!session) {
      this.loadStoredSession();
      const retry = this._guestSession();
      if (retry) return new HttpHeaders().set('X-Guest-Session', retry.sessionToken);
      return new HttpHeaders();
    }
    return new HttpHeaders().set('X-Guest-Session', session.sessionToken);
  }

  getSessionToken(): string | null { return this._guestSession()?.sessionToken ?? null; }

  startSessionPolling(): void {
    if (!this._guestSession()) return;
    timer(0, this.SESSION_CHECK_INTERVAL_MS).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.checkSessionStatus())
    ).subscribe({
      next: (r) => {
        if (!r.valid && r.reason && r.message) this.handleInvalidSession(r.reason, r.message);
      },
      error: () => { /* Hálózati hiba - csendben folytatjuk */ }
    });
  }

  checkSessionStatus(): Observable<SessionStatusResponse> {
    const current = this._guestSession();
    if (!current) return of({ valid: false, reason: 'deleted' as const, message: 'Nincs aktív session' });
    return this.http.get<SessionStatusResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/session-status`,
      { params: { session_token: current.sessionToken } }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) return of(error.error as SessionStatusResponse);
        return throwError(() => error);
      })
    );
  }

  stopSessionPolling(): void {
    // takeUntilDestroyed automatikusan kezeli - no-op a backward compat-hoz
  }

  handleInvalidSession(reason: 'banned' | 'deleted' | 'rejected', message: string): void {
    this.clearSession();
    this.sessionInvalidated$.next({ reason, message });
  }

  sendHeartbeat(): Observable<void> {
    const current = this._guestSession();
    if (!current) return of(undefined);
    return this.http.post<{ success: boolean }>(
      `${environment.apiUrl}/tablo-frontend/guest/heartbeat`,
      { session_token: current.sessionToken }
    ).pipe(map(() => undefined), catchError(() => of(undefined)));
  }

  sendDeviceLink(email: string): Observable<{ success: boolean; message: string }> {
    const current = this._guestSession();
    if (!current) return throwError(() => new Error('Nincs aktív session'));
    return this.http.post<{ success: boolean; message: string; link?: string }>(
      `${environment.apiUrl}/tablo-frontend/guest/send-link`,
      { session_token: current.sessionToken, email }
    ).pipe(
      map(r => ({ success: r.success, message: r.message })),
      catchError(this.handleError.bind(this))
    );
  }

  requestRestoreLink(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/tablo-frontend/guest/request-restore-link`, { email }
    ).pipe(catchError(this.handleError.bind(this)));
  }

  getDeviceIdentifier(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('device-id', 2, 2);
    }
    const components = [
      navigator.userAgent, navigator.language,
      screen.width, screen.height,
      new Date().getTimezoneOffset(), canvas.toDataURL()
    ];
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Hiba történt. Próbáld újra!';
    if (error.error?.message) message = error.error.message;
    else if (error.status === 0) message = 'Nincs internetkapcsolat.';
    else if (error.status === 429) message = 'Túl sok kérés. Várj egy kicsit!';
    return throwError(() => new Error(message));
  }
}
