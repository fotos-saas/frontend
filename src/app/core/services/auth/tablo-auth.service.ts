import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TabloStorageService, type StoredSession } from '../tablo-storage.service';
import { TokenService, type TokenType } from '../token.service';
import { GuestService } from '../guest.service';
import { SentryService } from '../sentry.service';
import type {
  TabloProject,
  AuthUser,
  LoginResponse,
} from '../../models/auth.models';

/**
 * Tablo-specifikus autentikáció kezelése
 *
 * Felelősségek:
 * - 6-jegyű kóddal bejelentkezés
 * - Share token bejelentkezés
 * - Preview token bejelentkezés
 * - Auth adatok tárolása (session-izolt)
 */
@Injectable({
  providedIn: 'root'
})
export class TabloAuthService {
  private http = inject(HttpClient);
  private storage = inject(TabloStorageService);
  private tokenService = inject(TokenService);
  private guestService = inject(GuestService);
  private sentryService = inject(SentryService);

  /**
   * Callback-ek a fő AuthService-ből - ezek frissítik a BehaviorSubject-eket
   */
  private onAuthSuccess?: (project: TabloProject, passwordSet?: boolean) => void;
  private onPasswordSetChange?: (value: boolean) => void;

  /**
   * Callback regisztráció a fő AuthService-ből
   */
  registerCallbacks(callbacks: {
    onAuthSuccess: (project: TabloProject, passwordSet?: boolean) => void;
    onPasswordSetChange: (value: boolean) => void;
  }): void {
    this.onAuthSuccess = callbacks.onAuthSuccess;
    this.onPasswordSetChange = callbacks.onPasswordSetChange;
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
   * Partner client auth adat tárolása
   * Egyszerűsített tárolás - nem projekt alapú
   *
   * SECURITY: sessionStorage használata localStorage helyett
   * - Tab-izolált: más tabok nem férnek hozzá
   * - XSS támadás esetén csak az aktuális tab érintett
   * - Tab bezáráskor automatikusan törlődik
   */
  private storeClientAuthData(response: LoginResponse): void {
    if (!response.token || !response.client) return;

    // SECURITY: sessionStorage XSS mitigation
    sessionStorage.setItem('client_token', response.token);
    sessionStorage.setItem('client_info', JSON.stringify(response.client));
    if (response.albums) {
      sessionStorage.setItem('client_albums', JSON.stringify(response.albums));
    }
    if (response.branding) {
      sessionStorage.setItem('client_branding', JSON.stringify(response.branding));
    }
  }

  /**
   * Auth adatok tárolása login után (session-izolt)
   * Kulcs struktúra: tablo:{projectId}:{sessionType}:*
   * FIGYELEM: Csak tablo login esetén hívandó (ahol biztos van project)
   */
  storeAuthData(
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
      this.onPasswordSetChange?.(response.user.passwordSet);
    }

    // Sentry user context beállítása
    this.updateSentryUserContext(response.user, project.partnerId ?? undefined);

    // Callback a fő AuthService-nek
    this.onAuthSuccess?.(project, response.user?.passwordSet);
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
   * Sentry user context frissítése
   */
  private updateSentryUserContext(user: AuthUser | null | undefined, partnerId?: number): void {
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
}
