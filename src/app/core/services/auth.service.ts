import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TabloStorageService } from './tablo-storage.service';
import { TokenService, type TokenType } from './token.service';
import { TabloAuthService } from './auth/tablo-auth.service';
import { PasswordAuthService, type MarketerLoginResponse } from './auth/password-auth.service';
import { SessionService } from './auth/session.service';
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

// Re-export type-ok kompatibilitás miatt
export type { MarketerLoginResponse } from './auth/password-auth.service';
export type { TokenType } from './token.service';
export type {
  ContactPerson,
  TabloPerson,
  PersonStats,
  // Backward compatible aliases
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
 * Auth Service - Facade a moduláris auth szolgáltatásokhoz
 *
 * Ez a szolgáltatás visszafelé kompatibilis wrapper, ami delegál:
 * - TabloAuthService: 6-jegyű kód, share token, preview token
 * - PasswordAuthService: Email/jelszó, regisztráció, jelszó kezelés
 * - SessionService: Session kezelés, validálás, kijelentkezés
 *
 * A meglévő kód változtatás nélkül továbbra is az AuthService-t használhatja.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ==========================================
  // INJECTED SERVICES
  // ==========================================

  private http = inject(HttpClient);
  private storage = inject(TabloStorageService);
  private tokenService = inject(TokenService);
  private tabloAuth = inject(TabloAuthService);
  private passwordAuth = inject(PasswordAuthService);
  private sessionService = inject(SessionService);

  // ==========================================
  // STATE (Signals)
  // ==========================================

  /** Aktuális projekt (reaktív) */
  private readonly _project = signal<TabloProject | null>(null);
  readonly projectSignal = this._project.asReadonly();
  /** @deprecated Használj projectSignal-t helyette */
  readonly project$: Observable<TabloProject | null> = toObservable(this._project);

  /** Bejelentkezve van-e */
  private readonly _isAuthenticated = signal<boolean>(false);
  readonly isAuthenticatedSignal = this._isAuthenticated.asReadonly();
  /** @deprecated Használj isAuthenticatedSignal-t helyette */
  readonly isAuthenticated$: Observable<boolean> = toObservable(this._isAuthenticated);

  /** Véglegesíthet-e (csak kódos belépés esetén true) - átirányítás TokenService-re */
  readonly canFinalize$ = this.tokenService.canFinalize$;

  /** Token típus - átirányítás TokenService-re */
  readonly tokenType$ = this.tokenService.tokenType$;

  /** Aktuális felhasználó (marketer login esetén) */
  private readonly _currentUser = signal<AuthUser | null>(null);
  readonly currentUserSignal = this._currentUser.asReadonly();
  /** @deprecated Használj currentUserSignal-t helyette */
  readonly currentUser$: Observable<AuthUser | null> = toObservable(this._currentUser);

  /**
   * Signal: true ha a jelszó be van állítva
   * QR regisztráció után false, jelszó beállítás után true
   */
  public readonly passwordSet = signal<boolean>(true);

  // ==========================================
  // COMPUTED SIGNALS
  // ==========================================

  /**
   * Computed signal: true ha vendég felhasználó (share token)
   */
  public readonly isGuest = computed<boolean>(() => {
    const tokenType = this.tokenService.getTokenType();
    return tokenType === 'share';
  });

  /**
   * Computed signal: true ha teljes jogú (code vagy preview token)
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
    return this._currentUser()?.roles?.includes('marketer') ?? false;
  });

  /**
   * Computed signal: true ha partner felhasználó (tulajdonos)
   */
  public readonly isPartner = computed<boolean>(() => {
    return this._currentUser()?.roles?.includes('partner') ?? false;
  });

  /**
   * Computed signal: true ha partner csapattag (designer, marketer, printer, assistant)
   */
  public readonly isTeamMember = computed<boolean>(() => {
    const teamRoles = ['designer', 'marketer', 'printer', 'assistant'];
    return teamRoles.some(role => this._currentUser()?.roles?.includes(role)) ?? false;
  });

  /**
   * Computed signal: true ha partner VAGY csapattag (partner felülethez hozzáfér)
   */
  public readonly hasPartnerAccess = computed<boolean>(() => {
    return this.isPartner() || this.isTeamMember();
  });

  /**
   * Computed signal: true ha super admin felhasználó
   */
  public readonly isSuperAdmin = computed<boolean>(() => {
    return this._currentUser()?.roles?.includes('super_admin') ?? false;
  });

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {
    // Callback-ok regisztrálása a child service-ekhez
    this.registerChildCallbacks();

    // Inicializálás storage-ból
    const initialState = this.sessionService.initializeFromStorage();
    this._project.set(initialState.project);
    this._isAuthenticated.set(initialState.isAuthenticated);
  }

  /**
   * Child service-ek callback-jainak regisztrálása
   */
  private registerChildCallbacks(): void {
    // TabloAuthService callbacks
    this.tabloAuth.registerCallbacks({
      onAuthSuccess: (project: TabloProject, passwordSet?: boolean) => {
        this._project.set(project);
        this._isAuthenticated.set(true);
        if (passwordSet !== undefined) {
          this.passwordSet.set(passwordSet);
        }
      },
      onPasswordSetChange: (value: boolean) => {
        this.passwordSet.set(value);
      }
    });

    // PasswordAuthService callbacks
    this.passwordAuth.registerCallbacks({
      onMarketerAuthSuccess: (user: AuthUser) => {
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      },
      onPasswordSetChange: (value: boolean) => {
        this.passwordSet.set(value);
      }
    });

    // SessionService callbacks
    this.sessionService.registerCallbacks({
      onSessionRestored: (project: TabloProject) => {
        this._project.set(project);
        this._isAuthenticated.set(true);
      },
      onSessionValidated: (project: TabloProject, canFinalize?: boolean, passwordSet?: boolean) => {
        this._project.set(project);
        if (passwordSet !== undefined) {
          this.passwordSet.set(passwordSet);
        }
      },
      onAuthCleared: () => {
        this._project.set(null);
        this._isAuthenticated.set(false);
      },
      onMarketerLogout: () => {
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
      }
    });
  }

  // ==========================================
  // TABLO AUTH METHODS (delegálva TabloAuthService-nek)
  // ==========================================

  /**
   * Bejelentkezés 6-jegyű kóddal
   */
  login(code: string): Observable<LoginResponse> {
    return this.tabloAuth.login(code);
  }

  /**
   * Bejelentkezés megosztási tokennel
   */
  loginWithShareToken(token: string, restoreToken?: string | null): Observable<LoginResponse> {
    return this.tabloAuth.loginWithShareToken(token, restoreToken);
  }

  /**
   * Bejelentkezés admin előnézeti tokennel
   */
  loginWithPreviewToken(token: string): Observable<LoginResponse> {
    return this.tabloAuth.loginWithPreviewToken(token);
  }

  // ==========================================
  // PASSWORD AUTH METHODS (delegálva PasswordAuthService-nek)
  // ==========================================

  /**
   * Email/jelszó bejelentkezés
   */
  loginWithPassword(email: string, password: string): Observable<MarketerLoginResponse | LoginResponse> {
    return this.passwordAuth.loginWithPassword(email, password);
  }

  /**
   * Regisztráció
   */
  register(data: RegisterData): Observable<RegisterResponse> {
    return this.passwordAuth.register(data);
  }

  /**
   * Jelszó emlékezteto kérés
   */
  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.passwordAuth.requestPasswordReset(email);
  }

  /**
   * Jelszó visszaállítás tokennel
   */
  resetPassword(data: ResetPasswordData): Observable<{ message: string }> {
    return this.passwordAuth.resetPassword(data);
  }

  /**
   * Jelszó változtatás (bejelentkezett user)
   */
  changePassword(data: ChangePasswordData): Observable<{ message: string }> {
    return this.passwordAuth.changePassword(data);
  }

  /**
   * Jelszó beállítása (QR regisztráció után kötelező)
   */
  setPassword(password: string, password_confirmation: string): Observable<{ message: string; user: AuthUser }> {
    return this.passwordAuth.setPassword(password, password_confirmation);
  }

  /**
   * Email verifikáció
   */
  verifyEmail(id: number, hash: string): Observable<{ message: string; already_verified?: boolean }> {
    return this.passwordAuth.verifyEmail(id, hash);
  }

  /**
   * Verifikációs email újraküldés
   */
  resendVerification(email: string): Observable<{ message: string }> {
    return this.passwordAuth.resendVerification(email);
  }

  /**
   * QR kód validálás
   */
  validateQrCode(code: string): Observable<QrCodeValidationResponse> {
    return this.passwordAuth.validateQrCode(code);
  }

  /**
   * QR kódos regisztráció
   */
  registerFromQr(data: QrRegistrationData): Observable<LoginResponse> {
    return this.passwordAuth.registerFromQr(data);
  }

  // ==========================================
  // 2FA METHODS (delegálva PasswordAuthService-nek)
  // ==========================================

  enable2FA(): Observable<TwoFactorSetupResponse> {
    return this.passwordAuth.enable2FA();
  }

  confirm2FA(code: string): Observable<{ message: string }> {
    return this.passwordAuth.confirm2FA(code);
  }

  disable2FA(code: string): Observable<{ message: string }> {
    return this.passwordAuth.disable2FA(code);
  }

  verify2FA(code: string): Observable<LoginResponse> {
    return this.passwordAuth.verify2FA(code);
  }

  // ==========================================
  // SESSION METHODS (delegálva SessionService-nek)
  // ==========================================

  /**
   * Session visszaállítása
   */
  restoreSession(projectId: number, sessionType: TokenType): boolean {
    return this.sessionService.restoreSession(projectId, sessionType);
  }

  /**
   * Session validálás a szerveren
   */
  validateSession(): Observable<ValidateSessionResponse> {
    return this.sessionService.validateSession();
  }

  /**
   * Kijelentkezés
   */
  logout(): Observable<void> {
    return this.sessionService.logout();
  }

  /**
   * Auth adatok törlése
   */
  clearAuth(): void {
    this.sessionService.clearAuth();
  }

  /**
   * Auth állapot törlése átirányítás és session törlés NÉLKÜL
   */
  clearAuthState(): void {
    this._project.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Admin kijelentkezés (marketer, partner, super_admin)
   */
  logoutAdmin(): void {
    this.sessionService.logoutAdmin();
  }

  /**
   * Marketer kijelentkezés (alias)
   */
  logoutMarketer(): void {
    this.logoutAdmin();
  }

  /**
   * Partner kijelentkezés (alias)
   */
  logoutPartner(): void {
    this.logoutAdmin();
  }

  /**
   * Super admin kijelentkezés (alias)
   */
  logoutSuperAdmin(): void {
    this.logoutAdmin();
  }

  /**
   * Aktív session-ök lekérése
   */
  getActiveSessions(): Observable<{ sessions: ActiveSession[] }> {
    return this.sessionService.getActiveSessions();
  }

  /**
   * Session visszavonás
   */
  revokeSession(tokenId: number): Observable<{ message: string }> {
    return this.sessionService.revokeSession(tokenId);
  }

  /**
   * Összes session visszavonása
   */
  revokeAllSessions(): Observable<{ message: string; revoked_count: number }> {
    return this.sessionService.revokeAllSessions();
  }

  /**
   * Marketer token lekérése
   */
  getMarketerToken(): string | null {
    return this.sessionService.getMarketerToken();
  }

  /**
   * Marketer felhasználó lekérése
   */
  getCurrentUser(): AuthUser | null {
    const user = this._currentUser();
    if (user) {
      return user;
    }
    const stored = this.sessionService.getStoredMarketerUser();
    if (stored) {
      this._currentUser.set(stored);
      this._isAuthenticated.set(true);
      return stored;
    }
    return null;
  }

  /**
   * Marketer/Partner/Admin session inicializálása
   */
  initializeMarketerSession(): boolean {
    const result = this.sessionService.initializeMarketerSession();
    if (result.success && result.user) {
      this._currentUser.set(result.user);
      this._isAuthenticated.set(true);
      return true;
    }
    return false;
  }

  // ==========================================
  // TOKEN METHODS (delegálva TokenService-nek)
  // ==========================================

  hasToken(): boolean {
    return this.tokenService.hasToken();
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  canFinalize(): boolean {
    return this.tokenService.canFinalize();
  }

  getTokenType(): TokenType {
    return this.tokenService.getTokenType();
  }

  // ==========================================
  // PROJECT METHODS
  // ==========================================

  /**
   * Aktuális projekt lekérése
   */
  getProject(): TabloProject | null {
    return this._project();
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
      this._project.set({ ...project });
    }
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
        const project = this.getProject();
        const activeSession = this.storage.getActiveSession();
        if (project && response.success && activeSession) {
          project.photoDate = response.photoDate;
          this.storage.setProject(project.id, activeSession.sessionType, project);
          this._project.set(project);
        }
      })
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
        const project = this.getProject();
        const activeSession = this.storage.getActiveSession();
        if (project && response.success && response.data && activeSession) {
          project.contacts = [response.data];
          this.storage.setProject(project.id, activeSession.sessionType, project);
          this._project.set(project);
        }
      })
    );
  }

  // ==========================================
  // INVITE METHODS
  // ==========================================

  /**
   * Meghívó kód validálás
   */
  validateInviteCode(code: string): Observable<{
    valid: boolean;
    message?: string;
    invitation?: {
      email: string;
      role: string;
      roleName: string;
      partnerName: string;
      expiresAt: string;
    };
  }> {
    return this.http.post<{
      valid: boolean;
      message?: string;
      invitation?: {
        email: string;
        role: string;
        roleName: string;
        partnerName: string;
        expiresAt: string;
      };
    }>(`${environment.apiUrl}/invite/validate`, { code });
  }

  /**
   * Meghívó kóddal történő regisztráció
   */
  registerWithInvite(data: {
    code: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{
    message: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
    token?: string;
  }> {
    return this.http.post<{
      message: string;
      user: {
        id: number;
        name: string;
        email: string;
      };
      token?: string;
    }>(`${environment.apiUrl}/invite/register`, data);
  }
}
