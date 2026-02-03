import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TabloStorageService, type StoredSession } from './tablo-storage.service';
import { TokenService, type TokenType } from './token.service';
import { GuestService } from './guest.service';
import { FilterPersistenceService } from './filter-persistence.service';
import { safeJsonParse } from '../../shared/utils/safe-json-parse';
import { SentryService } from './sentry.service';
import type {
  ContactPerson,
  TabloProject,
  AuthUser,
  LoginResponse,
  ValidateSessionResponse,
  RegisterData,
  RegisterResponse,
  ChangePasswordData,
  ResetPasswordData,
  QrCodeValidationResponse,
  QrRegistrationData,
  ActiveSession,
  TwoFactorSetupResponse
} from '../models/auth.models';

/**
 * Marketer login response - email/jelszó bejelentkezéshez
 */
export interface MarketerLoginResponse {
  user: AuthUser;
  token: string;
}

// Re-export type-ok kompatibilitás miatt
export type { TokenType } from './token.service';
export type {
  ContactPerson,
  MissingPerson,
  MissingStats,
  TabloStatus,
  TabloProject,
  AuthUser,
  LoginResponse,
  ValidateSessionResponse,
  RegisterData,
  RegisterResponse,
  ChangePasswordData,
  ResetPasswordData,
  QrCodeValidationResponse,
  QrRegistrationData,
  ActiveSession,
  TwoFactorSetupResponse
} from '../models/auth.models';

/**
 * Auth Service - Tablo projekt autentikáció kezelése
 *
 * Felelősségek:
 * - 6-jegyű kóddal bejelentkezés
 * - Projekt adatok kezelése
 * - Session validálás
 * - Kijelentkezés
 *
 * A token kezelést a TokenService végzi.
 * A localStorage kulcsok projekt-specifikusak: `tablo:{projectId}:*`
 * Ez lehetővé teszi több projekt párhuzamos használatát különböző tab-okban.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Aktuális projekt (reaktív) */
  private projectSubject: BehaviorSubject<TabloProject | null>;
  public project$: Observable<TabloProject | null>;

  /** Bejelentkezve van-e */
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  /** Véglegesíthet-e (csak kódos belépés esetén true) - átirányítás TokenService-re */
  public canFinalize$: Observable<boolean>;

  /** Token típus - átirányítás TokenService-re */
  public tokenType$: Observable<TokenType>;

  /**
   * Computed signal: true ha vendég felhasználó (share token)
   */
  public readonly isGuest = computed<boolean>(() => {
    const tokenType = this.tokenService.getTokenType();
    return tokenType === 'share';
  });

  /**
   * Computed signal: true ha teljes jogú (code vagy preview token)
   * Admin előnézet (preview) ugyanúgy teljes hozzáférést kap, mint a code token.
   */
  public readonly hasFullAccess = computed<boolean>(() => {
    const tokenType = this.tokenService.getTokenType();
    return tokenType === 'code' || tokenType === 'preview';
  });

  /**
   * Computed signal: true ha preview módban van
   */
  public readonly isPreview = computed<boolean>(() => {
    const tokenType = this.tokenService.getTokenType();
    return tokenType === 'preview';
  });

  /**
   * Computed signal: true ha marketer felhasználó
   */
  public readonly isMarketer = computed<boolean>(() => {
    const user = this.currentUserSubject?.getValue();
    return user?.roles?.includes('marketer') ?? false;
  });

  /**
   * Signal: true ha a jelszó be van állítva
   * QR regisztráció után false, jelszó beállítás után true
   * Default true, mert a legtöbb esetben már be van állítva
   */
  public readonly passwordSet = signal<boolean>(true);

  /** Aktuális felhasználó (marketer login esetén) */
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private guestService = inject(GuestService);
  private filterPersistence = inject(FilterPersistenceService);
  private sentryService = inject(SentryService);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: TabloStorageService,
    private tokenService: TokenService
  ) {
    // Migration és inicializálás
    const initialState = this.initializeFromStorage();

    this.projectSubject = new BehaviorSubject<TabloProject | null>(initialState.project);
    this.project$ = this.projectSubject.asObservable();

    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(initialState.isAuthenticated);
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    // TokenService observable-ök
    this.canFinalize$ = this.tokenService.canFinalize$;
    this.tokenType$ = this.tokenService.tokenType$;
  }

  /**
   * Inicializálás localStorage-ból (migration + aktív session betöltése)
   */
  private initializeFromStorage(): {
    project: TabloProject | null;
    isAuthenticated: boolean;
  } {
    // Először próbáljunk migrálni régi kulcsokról
    const migratedSession = this.storage.migrateFromLegacy();

    // Aktív session meghatározása
    const activeSession = migratedSession ?? this.storage.getActiveSession();

    if (!activeSession) {
      return {
        project: null,
        isAuthenticated: false
      };
    }

    const { projectId, sessionType } = activeSession;

    // Session-specifikus adatok betöltése
    const project = this.storage.getProject(projectId, sessionType);

    // Share session speciális kezelés: guest_session elegendő az autentikációhoz
    if (sessionType === 'share') {
      const guestSessionKey = `tablo:${projectId}:share:guest_session`;
      const hasGuestSession = !!localStorage.getItem(guestSessionKey);

      if (hasGuestSession) {
        return {
          project: project ?? null,
          isAuthenticated: true
        };
      }
    }

    // Normál flow code/preview tokenekhez - token ellenőrzés a TokenService-en keresztül
    if (!project || !this.tokenService.hasToken()) {
      return {
        project: null,
        isAuthenticated: false
      };
    }

    return {
      project,
      isAuthenticated: true
    };
  }

  /**
   * Tárolt session visszaállítása (session chooser-ből)
   * Újra inicializálja az auth állapotot a localStorage-ból.
   * @returns true ha sikerült, false ha nincs érvényes session
   */
  restoreSession(projectId: number, sessionType: TokenType): boolean {
    // Aktív session beállítása
    this.storage.setActiveSession(projectId, sessionType);
    this.storage.updateSessionLastUsed(projectId, sessionType);

    // TokenService újra inicializálása
    this.tokenService.reinitialize();

    // Projekt betöltése
    const project = this.storage.getProject(projectId, sessionType);

    if (!project) {
      return false;
    }

    // Share session speciális kezelés
    if (sessionType === 'share') {
      const hasGuestSession = !!this.storage.getGuestSession(projectId, sessionType);
      if (!hasGuestSession) {
        return false;
      }
      // GuestService inicializálása
      this.guestService.initializeFromStorage();
    } else {
      // Code/preview token ellenőrzés
      if (!this.tokenService.hasToken()) {
        return false;
      }
    }

    // Állapot frissítése
    this.projectSubject.next(project);
    this.isAuthenticatedSubject.next(true);

    return true;
  }

  /**
   * Bejelentkezés 6-jegyű kóddal
   * Támogatja mind a tablo diák, mind a partner ügyfél kódokat
   */
  login(code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login-access-code`, { code })
      .pipe(
        tap(response => {
          // Csak tablo login esetén tároljuk a session-t (client login másképp működik)
          if (response.loginType !== 'client' && response.project) {
            this.storeAuthData(response, 'code');
          } else if (response.loginType === 'client') {
            // Client login: csak a tokent tároljuk egyszerűen
            this.storeClientAuthData(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Partner client auth adat tárolása
   * Egyszerűsített tárolás - nem projekt alapú
   */
  private storeClientAuthData(response: LoginResponse): void {
    if (!response.token || !response.client) return;

    localStorage.setItem('client_token', response.token);
    localStorage.setItem('client_info', JSON.stringify(response.client));
    if (response.albums) {
      localStorage.setItem('client_albums', JSON.stringify(response.albums));
    }
  }

  /**
   * Bejelentkezés megosztási tokennel
   * @param token - Share token (64 karakteres)
   * @param restoreToken - Opcionális restore token (magic link-ből)
   */
  loginWithShareToken(token: string, restoreToken?: string | null): Observable<LoginResponse> {
    const body: { token: string; restore?: string } = { token };
    if (restoreToken) {
      body.restore = restoreToken;
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login-tablo-share`, body)
      .pipe(
        tap(response => {
          this.storeAuthData(response, 'share');

          // Ha van restored session, azt is tároljuk
          if (response.restoredSession) {
            this.guestService.setRestoredSession(response.restoredSession);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Bejelentkezés admin előnézeti tokennel (egyszer használatos)
   */
  loginWithPreviewToken(token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login-tablo-preview`, { token })
      .pipe(
        tap(response => {
          this.storeAuthData(response, 'preview');
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Auth adatok tárolása login után (session-izolt)
   * Kulcs struktúra: tablo:{projectId}:{sessionType}:*
   * FIGYELEM: Csak tablo login esetén hívandó (ahol biztos van project)
   */
  private storeAuthData(
    response: LoginResponse,
    defaultTokenType: TokenType
  ): void {
    // Type guard - csak tablo login esetén hívódik, ahol project kötelező
    const project = response.project!;
    const projectId = project.id;
    const sessionType = response.tokenType ?? defaultTokenType;
    const canFinalize = response.canFinalize ?? (sessionType === 'code');

    // Token tárolása TokenService-en keresztül
    this.tokenService.setToken(projectId, sessionType, response.token);
    this.tokenService.updateTokenMetadata(projectId, sessionType, canFinalize);

    // Projekt adatok tárolása
    this.storage.setProject(projectId, sessionType, project);

    // Guest session tárolása ha van (kódos belépés esetén a poke rendszerhez)
    if (response.guestSession) {
      this.guestService.storeGuestSessionFromLogin(
        projectId,
        sessionType,
        response.guestSession.sessionToken,
        response.guestSession.guestName
      );
    }

    // Session registry frissítése
    this.addToSessionRegistry(project, sessionType, response.guestSession?.guestName);

    // Password set flag frissítése (QR regisztrációnál lehet false)
    if (response.user?.passwordSet !== undefined) {
      this.passwordSet.set(response.user.passwordSet);
    }

    // Sentry user context beállítása
    this.updateSentryUserContext(response.user, project.partnerId ?? undefined);

    // BehaviorSubject-ek frissítése
    this.projectSubject.next(project);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Session hozzáadása a registry-hez
   */
  private addToSessionRegistry(
    project: TabloProject,
    sessionType: TokenType,
    userName?: string
  ): void {
    // Felhasználónév meghatározása
    let displayName = userName;
    if (!displayName) {
      if (sessionType === 'code' && project.contacts?.[0]) {
        displayName = project.contacts[0].name;
      } else if (sessionType === 'preview') {
        displayName = 'Admin előnézet';
      }
    }

    const session: StoredSession = {
      projectId: project.id,
      sessionType,
      projectName: project.name,
      userName: displayName,
      lastUsed: new Date().toISOString(),
    };

    this.storage.addSession(session);
  }

  /**
   * Kijelentkezés
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tablo-frontend/logout`, {})
      .pipe(
        tap(() => {
          this.clearAuth();
        }),
        catchError(error => {
          // Akkor is töröljük a lokális adatokat, ha a szerver hiba van
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  /**
   * Session validálás a szerveren
   */
  validateSession(): Observable<ValidateSessionResponse> {
    return this.http.get<ValidateSessionResponse>(`${environment.apiUrl}/tablo-frontend/validate-session`)
      .pipe(
        tap(response => {
          if (response.valid && response.project) {
            const activeSession = this.storage.getActiveSession();
            if (!activeSession) return;

            const { projectId, sessionType } = activeSession;

            // Projekt adatok tárolása
            this.storage.setProject(projectId, sessionType, response.project);
            this.projectSubject.next(response.project);

            // canFinalize frissítése TokenService-en keresztül
            if (response.canFinalize !== undefined) {
              this.tokenService.setCanFinalize(projectId, sessionType, response.canFinalize);
            }

            // Password set flag frissítése
            if (response.user?.passwordSet !== undefined) {
              this.passwordSet.set(response.user.passwordSet);
            }
          }
        }),
        catchError(error => {
          // 401 esetén töröljük az auth adatokat
          if (error.status === 401) {
            this.clearAuth();
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Fotózás időpontjának frissítése
   */
  updatePhotoDate(photoDate: string): Observable<{ success: boolean; photoDate: string }> {
    return this.http.post<{ success: boolean; photoDate: string }>(
      `${environment.apiUrl}/tablo-frontend/update-schedule`,
      { photo_date: photoDate }
    ).pipe(
      tap(response => {
        // Frissítjük a lokális projekt adatokat
        const project = this.getProject();
        const activeSession = this.storage.getActiveSession();
        if (project && response.success && activeSession) {
          project.photoDate = response.photoDate;
          this.storage.setProject(project.id, activeSession.sessionType, project);
          this.projectSubject.next(project);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Kapcsolattartó frissítése
   */
  updateContact(contact: Omit<ContactPerson, 'id'>): Observable<{ success: boolean; data: ContactPerson }> {
    return this.http.put<{ success: boolean; data: ContactPerson }>(
      `${environment.apiUrl}/tablo-frontend/contact`,
      contact
    ).pipe(
      tap(response => {
        // Frissítjük a lokális projekt adatokat
        const project = this.getProject();
        const activeSession = this.storage.getActiveSession();
        if (project && response.success && response.data && activeSession) {
          project.contacts = [response.data];
          this.storage.setProject(project.id, activeSession.sessionType, project);
          this.projectSubject.next(project);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Van-e érvényes token (átirányítás TokenService-re)
   */
  hasToken(): boolean {
    return this.tokenService.hasToken();
  }

  /**
   * Token lekérése (átirányítás TokenService-re)
   */
  getToken(): string | null {
    return this.tokenService.getToken();
  }

  /**
   * Aktuális projekt lekérése
   */
  getProject(): TabloProject | null {
    return this.projectSubject.getValue();
  }

  /**
   * Aktuális projekt lekérése (alias a getStoredProject-hez kompatibilitás miatt)
   */
  getStoredProject(): TabloProject | null {
    return this.getProject();
  }

  /**
   * Auth adatok törlése és átirányítás login oldalra
   */
  clearAuth(): void {
    // Aktív session lekérése a registry frissítéshez
    const activeSession = this.storage.getActiveSession();

    // Token törlése TokenService-en keresztül
    this.tokenService.clearToken();

    // Session adatok törlése
    this.storage.clearCurrentSessionAuth();

    // Session eltávolítása a registry-ből
    if (activeSession) {
      this.storage.removeSession(activeSession.projectId, activeSession.sessionType);
    }

    // Szűrők törlése - nehogy összekeveredjenek a felhasználók adatai!
    this.filterPersistence.clearAllFilters();

    // Sentry user context törlése
    this.clearSentryUserContext();

    // Állapot visszaállítása
    this.projectSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Auth állapot törlése átirányítás és session törlés NÉLKÜL
   * "Új belépés" esetén használjuk, hogy a login oldal elérhető legyen,
   * de a tárolt session-ök megmaradjanak.
   */
  clearAuthState(): void {
    // Csak a memória állapotot töröljük, a localStorage-t NEM
    this.projectSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Véglegesíthet-e szinkron lekérése (átirányítás TokenService-re)
   */
  canFinalize(): boolean {
    return this.tokenService.canFinalize();
  }

  /**
   * Token típus szinkron lekérése (átirányítás TokenService-re)
   */
  getTokenType(): TokenType {
    return this.tokenService.getTokenType();
  }

  /**
   * Osztálylétszám frissítése a projektben
   */
  updateProjectClassSize(classSize: number): void {
    const project = this.getProject();
    const activeSession = this.storage.getActiveSession();
    if (project && activeSession) {
      project.expectedClassSize = classSize;
      this.storage.setProject(project.id, activeSession.sessionType, project);
      this.projectSubject.next({ ...project });
    }
  }

  /**
   * HTTP hiba kezelés (egyszerűsített)
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const messages: Record<number, string> = {
      401: 'Érvénytelen belépési kód',
      403: 'Nincs jogosultságod ehhez a muvelethez',
      423: 'A fiók ideiglenesen zárolva van',
      429: 'Túl sok próbálkozás. Kérlek várj néhány percet.',
      500: 'Szerverhiba. Kérlek próbáld újra később.'
    };

    const errorMessage = error.error instanceof ErrorEvent
      ? 'Hálózati hiba. Ellenőrizd az internetkapcsolatot.'
      : (error.error?.message || messages[error.status] || 'Hiba történt a bejelentkezés során');

    return throwError(() => new Error(errorMessage));
  }

  // ==========================================
  // NEW AUTH SYSTEM METHODS
  // ==========================================

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
            this.storeAuthData(response as LoginResponse, 'code');
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

    // Állapot frissítése
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Marketer kijelentkezés
   */
  logoutMarketer(): void {
    localStorage.removeItem('marketer_token');
    localStorage.removeItem('marketer_user');
    this.filterPersistence.clearAllFilters(); // Szűrők törlése, nehogy összekeveredjenek!
    this.clearSentryUserContext();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Partner kijelentkezés (ugyanaz mint marketer, de külön metódus a tisztaság miatt)
   */
  logoutPartner(): void {
    localStorage.removeItem('marketer_token');
    localStorage.removeItem('marketer_user');
    this.filterPersistence.clearAllFilters(); // Szűrők törlése, nehogy összekeveredjenek!
    this.clearSentryUserContext();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Super admin kijelentkezés
   */
  logoutSuperAdmin(): void {
    localStorage.removeItem('marketer_token');
    localStorage.removeItem('marketer_user');
    this.filterPersistence.clearAllFilters();
    this.clearSentryUserContext();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Computed signal: true ha partner felhasználó
   */
  public readonly isPartner = computed<boolean>(() => {
    const user = this.currentUserSubject?.getValue();
    return user?.roles?.includes('partner') ?? false;
  });

  /**
   * Computed signal: true ha super admin felhasználó
   */
  public readonly isSuperAdmin = computed<boolean>(() => {
    const user = this.currentUserSubject?.getValue();
    return user?.roles?.includes('super_admin') ?? false;
  });

  /**
   * Marketer token lekérése
   */
  getMarketerToken(): string | null {
    return localStorage.getItem('marketer_token');
  }

  /**
   * Marketer felhasználó lekérése
   */
  getCurrentUser(): AuthUser | null {
    if (this.currentUserSubject.getValue()) {
      return this.currentUserSubject.getValue();
    }
    // Próbáljuk localStorage-ból
    const stored = localStorage.getItem('marketer_user');
    if (stored) {
      const user = safeJsonParse<AuthUser | null>(stored, null);
      if (user) {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        return user;
      }
    }
    return null;
  }

  /**
   * Marketer/Partner/Admin session inicializálása (page reload esetén)
   */
  initializeMarketerSession(): boolean {
    const token = this.getMarketerToken();
    const user = this.getCurrentUser();
    if (token && user && (
      user.roles?.includes('marketer') ||
      user.roles?.includes('partner') ||
      user.roles?.includes('super_admin')
    )) {
      this.isAuthenticatedSubject.next(true);
      return true;
    }
    return false;
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
          this.storeAuthData(response, 'code');
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Aktív session-ök lekérése
   */
  getActiveSessions(): Observable<{ sessions: ActiveSession[] }> {
    return this.http.get<{ sessions: ActiveSession[] }>(`${environment.apiUrl}/auth/sessions`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Session visszavonás
   */
  revokeSession(tokenId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/auth/sessions/${tokenId}`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Összes session visszavonása (kivéve jelenlegi)
   */
  revokeAllSessions(): Observable<{ message: string; revoked_count: number }> {
    return this.http.delete<{ message: string; revoked_count: number }>(`${environment.apiUrl}/auth/sessions`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA engedélyezés (elokészítés - még nem implementált)
   */
  enable2FA(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${environment.apiUrl}/auth/2fa/enable`, {})
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA megerosítés (elokészítés - még nem implementált)
   */
  confirm2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/confirm`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA letiltás (elokészítés - még nem implementált)
   */
  disable2FA(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/2fa/disable`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * 2FA verifikáció (elokészítés - még nem implementált)
   */
  verify2FA(code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/2fa/verify`, { code })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // ==========================================
  // PASSWORD SET (QR regisztráció után)
  // ==========================================

  /**
   * Jelszó beállítása (QR regisztráció után kötelező)
   * Az endpoint a /api/auth/set-password
   */
  setPassword(password: string, password_confirmation: string): Observable<{ message: string; user: AuthUser }> {
    return this.http.post<{ message: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/set-password`,
      { password, password_confirmation }
    ).pipe(
      tap(() => {
        // Sikeres jelszó beállítás után frissítjük a signal-t
        this.passwordSet.set(true);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ==========================================
  // SENTRY USER CONTEXT
  // ==========================================

  /**
   * Sentry user context frissítése login/logout esetén
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
    } else {
      this.sentryService.setUser(null);
    }
  }

  /**
   * Sentry user context törlése (logout)
   */
  private clearSentryUserContext(): void {
    this.sentryService.setUser(null);
  }
}
