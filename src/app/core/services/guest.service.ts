import { Injectable, computed, signal, OnDestroy, inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, Subject, timer } from 'rxjs';
import { catchError, tap, map, takeUntil, switchMap, retry, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TabloStorageService } from './tablo-storage.service';
import { TokenType } from './token.service';
import { AuthService } from './auth.service';
import {
  PersonSearchResult,
  RegisterWithIdentificationRequest,
  RegisterWithIdentificationResponse,
  VerificationStatus,
  VerificationStatusResponse,
  ExtendedGuestSession,
  PendingSessionsResponse,
  ResolveConflictResponse
} from '../models/guest.models';

/**
 * Guest session interface
 */
export interface GuestSession {
  id?: number;
  sessionToken: string;
  guestName: string;
  guestEmail: string | null;
}

/**
 * Guest regisztráció request
 */
export interface GuestRegisterRequest {
  guest_name: string;
  guest_email?: string;
  device_identifier?: string;
}

/**
 * Guest regisztráció response
 */
export interface GuestRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Guest validálás response
 */
export interface GuestValidateResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  data?: {
    id: number;
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Guest update request
 */
export interface GuestUpdateRequest {
  session_token: string;
  guest_name: string;
  guest_email?: string;
}

/**
 * Guest update response
 */
export interface GuestUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    session_token: string;
    guest_name: string;
    guest_email: string | null;
  };
}

/**
 * Session status response (polling)
 */
export interface SessionStatusResponse {
  valid: boolean;
  reason?: 'banned' | 'deleted';
  message?: string;
}

/**
 * Session invalidated event
 */
export interface SessionInvalidatedEvent {
  reason: 'banned' | 'deleted' | 'rejected';
  message: string;
}

/**
 * Guest Service
 *
 * Vendég session kezelés:
 * - Név bekérés és regisztráció
 * - Cross-device session link
 * - Session validálás
 * - LocalStorage tárolás
 *
 * A session token-t az X-Guest-Session headerben küldjük minden API hívásban.
 */
@Injectable({
  providedIn: 'root'
})
export class GuestService implements OnDestroy {

  /** Session polling intervallum (30 másodperc) */
  private readonly SESSION_CHECK_INTERVAL_MS = 30000;

  /** Aktuális vendég session (signal) */
  private readonly _guestSession = signal<GuestSession | null>(null);
  public readonly guestSessionSignal = this._guestSession.asReadonly();
  public readonly guestSession$: Observable<GuestSession | null> = toObservable(this._guestSession);

  /** Van-e aktív vendég session (computed signal) */
  public readonly hasGuestSession = computed<boolean>(() => this._guestSession() !== null);

  /** Vendég neve (computed) */
  public readonly guestName = computed<string | null>(() => {
    const session = this._guestSession();
    return session?.guestName ?? null;
  });

  /** Aktuális projekt ID (computed from storage) */
  public readonly currentProjectId = computed<number | null>(() => {
    const session = this.storage.getActiveSession();
    return session?.projectId ?? null;
  });

  /** Polling leállítására használt Subject */
  private readonly sessionCheckStop$ = new Subject<void>();

  /** Session invalidálás esemény (ban/törlés) */
  public readonly sessionInvalidated$ = new Subject<SessionInvalidatedEvent>();

  /** Polling fut-e */
  private isPolling = false;

  /** Verification polling fut-e */
  private isVerificationPolling = false;

  /** Verification polling leállítására használt Subject */
  private readonly verificationCheckStop$ = new Subject<void>();

  /** Bővített session adatok (onboarding után) */
  public readonly verificationStatus = signal<VerificationStatus>('verified');
  public readonly isPending = signal<boolean>(false);
  public readonly personId = signal<number | null>(null);
  public readonly personName = signal<string | null>(null);

  /** @deprecated Use personId instead */
  public readonly missingPersonId = this.personId;
  /** @deprecated Use personName instead */
  public readonly missingPersonName = this.personName;

  private readonly injector = inject(Injector);
  private _authService?: AuthService;

  constructor(
    private http: HttpClient,
    private storage: TabloStorageService
  ) {
    // Inicializálás: tárolt session betöltése
    this.loadStoredSession();
  }

  /**
   * AuthService lusta betöltése (cirkuláris függőség elkerülése)
   */
  private get authService(): AuthService {
    if (!this._authService) {
      this._authService = this.injector.get(AuthService);
    }
    return this._authService;
  }

  /**
   * Memory leak prevention - cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopSessionPolling();
    this.stopVerificationPolling();
    this.sessionCheckStop$.complete();
    this.verificationCheckStop$.complete();
    this.sessionInvalidated$.complete();
  }

  /**
   * Publikus újrainicializálás (session váltáshoz)
   */
  initializeFromStorage(): void {
    this.loadStoredSession();
  }

  /**
   * Tárolt session betöltése localStorage-ból
   *
   * FONTOS: A storage.getActiveSession() már kezeli a localStorage fallback-et,
   * így oldal frissítés után is visszatöltődik a guest session.
   */
  private loadStoredSession(): void {
    const activeSession = this.storage.getActiveSession();
    if (!activeSession) {
      return;
    }

    const { projectId, sessionType } = activeSession;
    const sessionToken = this.getStoredSessionToken(projectId, sessionType);
    const guestName = this.getStoredGuestName(projectId, sessionType);

    if (sessionToken && guestName) {
      const session: GuestSession = {
        sessionToken,
        guestName,
        guestEmail: null // Email-t nem tároljuk localStorage-ban
      };
      this._guestSession.set(session);
    }
  }

  /**
   * Session token lekérése storage-ból
   */
  private getStoredSessionToken(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getGuestSession(projectId, sessionType);
  }

  /**
   * Guest name lekérése storage-ból
   */
  private getStoredGuestName(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getGuestName(projectId, sessionType);
  }

  /**
   * Session token mentése storage-ba
   */
  private storeSessionToken(projectId: number, sessionType: TokenType, token: string): void {
    this.storage.setGuestSession(projectId, sessionType, token);
  }

  /**
   * Guest name mentése storage-ba
   */
  private storeGuestName(projectId: number, sessionType: TokenType, name: string): void {
    this.storage.setGuestName(projectId, sessionType, name);
  }

  /**
   * Guest ID mentése storage-ba (értesítési csatornához)
   */
  private storeGuestId(projectId: number, sessionType: TokenType, id: number): void {
    this.storage.setGuestId(projectId, sessionType, id);
  }

  /**
   * Guest ID lekérése storage-ból
   */
  getGuestId(): number | null {
    const activeSession = this.storage.getActiveSession();
    if (!activeSession) return null;

    return this.storage.getGuestId(activeSession.projectId, activeSession.sessionType);
  }

  /**
   * Van-e regisztrált vendég session az aktuális projekthez
   */
  hasRegisteredSession(): boolean {
    return this.hasGuestSession();
  }

  /**
   * Vendég regisztráció (név bekérés után)
   */
  register(guestName: string, guestEmail?: string): Observable<GuestSession> {
    const request: GuestRegisterRequest = {
      guest_name: guestName,
      guest_email: guestEmail,
      device_identifier: this.getDeviceIdentifier()
    };

    return this.http.post<GuestRegisterResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/register`,
      request
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

        // Mentés localStorage-ba
        const activeSession = this.storage.getActiveSession();
        if (activeSession) {
          this.storeSessionToken(activeSession.projectId, activeSession.sessionType, response.data.session_token);
          this.storeGuestName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
          // Guest ID tárolása értesítésekhez
          this.storeGuestId(activeSession.projectId, activeSession.sessionType, response.data.id);
        }

        // State frissítés
        this._guestSession.set(session);

        return session;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Vendég adatainak frissítése (név és/vagy email)
   */
  updateGuestInfo(guestName: string, guestEmail?: string): Observable<GuestSession> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return throwError(() => new Error('Nincs aktív session'));
    }

    const request: GuestUpdateRequest = {
      session_token: currentSession.sessionToken,
      guest_name: guestName,
      guest_email: guestEmail
    };

    return this.http.put<GuestUpdateResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/update`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Frissítés sikertelen');
        }

        const updatedSession: GuestSession = {
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email
        };

        // Mentés localStorage-ba
        const activeSession = this.storage.getActiveSession();
        if (activeSession) {
          this.storeGuestName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
        }

        // State frissítés
        this._guestSession.set(updatedSession);

        return updatedSession;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Meglévő session validálása (pl. oldal újratöltés után)
   */
  validateSession(): Observable<boolean> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return of(false);
    }

    return this.http.post<GuestValidateResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/validate`,
      { session_token: currentSession.sessionToken }
    ).pipe(
      map(response => {
        if (!response.valid) {
          // Session érvénytelen, töröljük
          this.clearSession();
          return false;
        }

        // Guest ID mentése (értesítési csatornához)
        if (response.data?.id) {
          const activeSession = this.storage.getActiveSession();
          if (activeSession) {
            this.storeGuestId(activeSession.projectId, activeSession.sessionType, response.data.id);
          }
        }

        return true;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * Cross-device link küldése emailben
   */
  sendDeviceLink(email: string): Observable<{ success: boolean; message: string }> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return throwError(() => new Error('Nincs aktív session'));
    }

    return this.http.post<{ success: boolean; message: string; link?: string }>(
      `${environment.apiUrl}/tablo-frontend/guest/send-link`,
      {
        session_token: currentSession.sessionToken,
        email
      }
    ).pipe(
      map(response => ({
        success: response.success,
        message: response.message
      })),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Heartbeat - aktivitás jelzése
   */
  sendHeartbeat(): Observable<void> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return of(undefined);
    }

    return this.http.post<{ success: boolean }>(
      `${environment.apiUrl}/tablo-frontend/guest/heartbeat`,
      { session_token: currentSession.sessionToken }
    ).pipe(
      map(() => undefined),
      catchError(() => of(undefined)) // Heartbeat hiba nem kritikus
    );
  }

  /**
   * Session törlése (logout)
   */
  clearSession(): void {
    const activeSession = this.storage.getActiveSession();
    if (activeSession) {
      const { projectId, sessionType } = activeSession;
      this.storage.clearGuestData(projectId, sessionType);
    }

    this._guestSession.set(null);
  }

  /**
   * Session status polling indítása
   *
   * 30 másodpercenként ellenőrzi, hogy a session még érvényes-e.
   * Ha ban vagy törlés történt, kijelentkezteti a vendéget.
   */
  startSessionPolling(): void {
    if (this.isPolling) {
      return; // Már fut
    }

    const currentSession = this._guestSession();
    if (!currentSession) {
      return; // Nincs session
    }

    this.isPolling = true;

    timer(0, this.SESSION_CHECK_INTERVAL_MS).pipe(
      takeUntil(this.sessionCheckStop$),
      switchMap(() => this.checkSessionStatus())
    ).subscribe({
      next: (response) => {
        if (!response.valid && response.reason && response.message) {
          this.handleInvalidSession(response.reason, response.message);
        }
      },
      error: () => {
        // Hálózati hiba esetén csendben folytatjuk
        // Nem logout-olunk, mert lehet csak átmeneti hiba
      }
    });
  }

  /**
   * Session status polling leállítása
   */
  stopSessionPolling(): void {
    if (!this.isPolling) {
      return;
    }

    this.sessionCheckStop$.next();
    this.isPolling = false;
  }

  /**
   * Session status ellenőrzése (egyszer)
   */
  checkSessionStatus(): Observable<SessionStatusResponse> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return of({ valid: false, reason: 'deleted' as const, message: 'Nincs aktív session' });
    }

    return this.http.get<SessionStatusResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/session-status`,
      { params: { session_token: currentSession.sessionToken } }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401/403 hibát valid response-ként kezeljük
        if (error.status === 401 || error.status === 403) {
          return of(error.error as SessionStatusResponse);
        }
        // Egyéb hiba (pl. hálózati) - ne logout-oljunk
        return throwError(() => error);
      })
    );
  }

  /**
   * Érvénytelen session kezelése (ban/törlés/elutasítás)
   */
  private handleInvalidSession(reason: 'banned' | 'deleted' | 'rejected', message: string): void {
    // Polling leállítása
    this.stopSessionPolling();

    // Session törlése
    this.clearSession();

    // Esemény kibocsátása (MainLayout figyeli)
    this.sessionInvalidated$.next({ reason, message });
  }

  /**
   * X-Guest-Session header készítése API hívásokhoz
   */
  getGuestSessionHeader(): HttpHeaders {
    const session = this._guestSession();
    if (!session) {
      // Próbáld meg újra betölteni localStorage-ból
      this.loadStoredSession();
      const retrySession = this._guestSession();
      if (retrySession) {
        return new HttpHeaders().set('X-Guest-Session', retrySession.sessionToken);
      }
      return new HttpHeaders();
    }
    return new HttpHeaders().set('X-Guest-Session', session.sessionToken);
  }

  /**
   * Session token közvetlen lekérése (ha szükséges)
   */
  getSessionToken(): string | null {
    return this._guestSession()?.sessionToken ?? null;
  }

  /**
   * Guest session tárolása kódos belépés után
   * (A backend automatikusan létrehoz guest session-t a kapcsolattartó számára)
   */
  storeGuestSessionFromLogin(
    projectId: number,
    sessionType: TokenType,
    sessionToken: string,
    guestName: string
  ): void {
    // Token és név mentése storage-ba
    this.storeSessionToken(projectId, sessionType, sessionToken);
    this.storeGuestName(projectId, sessionType, guestName);

    // Memory state frissítése
    const session: GuestSession = {
      sessionToken,
      guestName,
      guestEmail: null
    };
    this._guestSession.set(session);
  }

  /**
   * Egyszerű device fingerprint generálás
   */
  private getDeviceIdentifier(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('device-id', 2, 2);
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ];

    // Simple hash
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Hiba kezelés
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Hiba történt. Próbáld újra!';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Nincs internetkapcsolat.';
    } else if (error.status === 429) {
      message = 'Túl sok kérés. Várj egy kicsit!';
    }

    return throwError(() => new Error(message));
  }

  // ==========================================
  // ONBOARDING - IDENTIFICATION
  // ==========================================

  /**
   * Tablón szereplő személyek keresése (autocomplete)
   */
  searchPersons(query: string): Observable<PersonSearchResult[]> {
    if (query.length < 2) {
      return of([]);
    }

    return this.http.get<{ success: boolean; data: PersonSearchResult[] }>(
      `${environment.apiUrl}/tablo-frontend/guest/persons/search`,
      { params: { q: query, limit: '10' } }
    ).pipe(
      map(response => response.success ? response.data : []),
      catchError(() => of([]))
    );
  }

  /**
   * @deprecated Use searchPersons instead
   */
  searchMissingPersons(query: string): Observable<PersonSearchResult[]> {
    return this.searchPersons(query);
  }

  /**
   * Regisztráció személyazonosítással (onboarding flow)
   */
  registerWithIdentification(
    nickname: string,
    missingPersonId?: number,
    email?: string
  ): Observable<ExtendedGuestSession> {
    const request: RegisterWithIdentificationRequest = {
      nickname,
      missing_person_id: missingPersonId,
      email,
      device_identifier: this.getDeviceIdentifier()
    };

    return this.http.post<RegisterWithIdentificationResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/register-with-identification`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Regisztráció sikertelen');
        }

        const extendedSession: ExtendedGuestSession = {
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email,
          verificationStatus: response.data.verification_status,
          isPending: response.data.is_pending,
          missingPersonId: response.data.missing_person_id,
          missingPersonName: response.data.missing_person_name
        };

        // Mentés localStorage-ba
        const activeSession = this.storage.getActiveSession();
        if (activeSession) {
          this.storeSessionToken(activeSession.projectId, activeSession.sessionType, response.data.session_token);
          this.storeGuestName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
          // Guest ID tárolása értesítésekhez
          this.storeGuestId(activeSession.projectId, activeSession.sessionType, response.data.id);
          // Verification status tárolása
          this.storeVerificationStatus(activeSession.projectId, activeSession.sessionType, response.data.verification_status);
          // Session registry frissítése a userName-mel
          this.storage.updateSessionUserName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
        }

        // State frissítés
        const session: GuestSession = {
          id: response.data.id,
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email
        };
        this._guestSession.set(session);
        this.verificationStatus.set(response.data.verification_status);
        this.isPending.set(response.data.is_pending);
        this.personId.set(response.data.missing_person_id);
        this.personName.set(response.data.missing_person_name);

        return extendedSession;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Verification status tárolása storage-ba
   */
  private storeVerificationStatus(projectId: number, sessionType: TokenType, status: VerificationStatus): void {
    this.storage.setVerificationStatus(projectId, sessionType, status);
  }

  /**
   * Verification status lekérése storage-ból
   */
  private getStoredVerificationStatus(projectId: number, sessionType: TokenType): VerificationStatus | null {
    const stored = this.storage.getVerificationStatus(projectId, sessionType);
    if (stored && ['verified', 'pending', 'rejected'].includes(stored)) {
      return stored as VerificationStatus;
    }
    return null;
  }

  /**
   * Verification status polling indítása (pending session-höz)
   * 5 másodpercenként ellenőrzi a státuszt
   */
  startVerificationPolling(): void {
    if (this.isVerificationPolling) {
      return;
    }

    const currentSession = this._guestSession();
    if (!currentSession) {
      return;
    }

    this.isVerificationPolling = true;

    timer(0, 5000).pipe(
      takeUntil(this.verificationCheckStop$),
      switchMap(() => this.checkVerificationStatus())
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          this.verificationStatus.set(data.verification_status);
          this.isPending.set(data.is_pending);

          // Frissítsük localStorage-ban is
          const activeSession = this.storage.getActiveSession();
          if (activeSession) {
            this.storeVerificationStatus(activeSession.projectId, activeSession.sessionType, data.verification_status);
          }

          // Ha verified lett, állítsuk le a pollingot
          if (data.is_verified) {
            this.stopVerificationPolling();
          }

          // Ha rejected lett, kezeljük
          if (data.is_rejected) {
            this.stopVerificationPolling();
            this.handleInvalidSession('rejected', 'A kérésed elutasításra került. Kérlek válassz más nevet.');
          }

          // Ha banned lett (közben)
          if (data.is_banned) {
            this.stopVerificationPolling();
            this.handleInvalidSession('banned', 'Hozzáférés megtagadva. Kérlek vedd fel a kapcsolatot a szervezőkkel.');
          }
        }
      },
      error: () => {
        // Hálózati hiba esetén csendben folytatjuk
      }
    });
  }

  /**
   * Verification polling leállítása
   */
  stopVerificationPolling(): void {
    if (!this.isVerificationPolling) {
      return;
    }

    this.verificationCheckStop$.next();
    this.isVerificationPolling = false;
  }

  /**
   * Verification status ellenőrzése (egyszer)
   */
  checkVerificationStatus(): Observable<VerificationStatusResponse> {
    const currentSession = this._guestSession();
    if (!currentSession) {
      return of({ success: false });
    }

    return this.http.get<VerificationStatusResponse>(
      `${environment.apiUrl}/tablo-frontend/guest/verification-status`,
      { params: { session_token: currentSession.sessionToken } }
    ).pipe(
      catchError(() => of({ success: false }))
    );
  }

  /**
   * Ellenőrzi, hogy a session pending-e
   */
  isSessionPending(): boolean {
    return this.isPending();
  }

  /**
   * Ellenőrzi, hogy van-e személy azonosítás (tablón szereplő)
   */
  hasPersonIdentification(): boolean {
    return this.personId() !== null;
  }

  // ==========================================
  // ADMIN - PENDING SESSIONS
  // ==========================================

  /**
   * Pending session-ök listája (admin)
   */
  getPendingSessions(): Observable<PendingSessionsResponse> {
    return this.http.get<PendingSessionsResponse>(
      `${environment.apiUrl}/tablo-frontend/admin/pending-sessions`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Ütközés feloldása (admin)
   */
  resolveConflict(sessionId: number, approve: boolean): Observable<ResolveConflictResponse> {
    return this.http.post<ResolveConflictResponse>(
      `${environment.apiUrl}/tablo-frontend/admin/guests/${sessionId}/resolve-conflict`,
      { approve }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // ==========================================
  // SESSION RESTORE (MAGIC LINK)
  // ==========================================

  /**
   * Restore link kérése emailben (korábban regisztrált session helyreállítása)
   */
  requestRestoreLink(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/tablo-frontend/guest/request-restore-link`,
      { email }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Restored session tárolása belépés után
   * (A backend visszaadja a restored session adatokat a loginTabloShare response-ban)
   */
  setRestoredSession(restoredSession: {
    sessionToken: string;
    guestName: string;
    guestEmail: string | null;
  }): void {
    const activeSession = this.storage.getActiveSession();
    if (activeSession) {
      // Token és név mentése storage-ba
      this.storeSessionToken(activeSession.projectId, activeSession.sessionType, restoredSession.sessionToken);
      this.storeGuestName(activeSession.projectId, activeSession.sessionType, restoredSession.guestName);
    }

    // Memory state frissítése
    const session: GuestSession = {
      sessionToken: restoredSession.sessionToken,
      guestName: restoredSession.guestName,
      guestEmail: restoredSession.guestEmail
    };
    this._guestSession.set(session);
  }
}
