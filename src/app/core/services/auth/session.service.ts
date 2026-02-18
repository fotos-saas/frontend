import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { handleAuthError } from '../../../shared/utils/http-error.util';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TabloStorageService } from '../tablo-storage.service';
import { TokenService, type TokenType } from '../token.service';
import { GuestService } from '../guest.service';
import { FilterPersistenceService } from '../filter-persistence.service';
import { SentryService } from '../sentry.service';
import { safeJsonParse } from '../../../shared/utils/safe-json-parse';
import type {
  TabloProject,
  AuthUser,
  ValidateSessionResponse,
  ActiveSession
} from '../../models/auth.models';

/**
 * Session inicializálás eredménye
 */
export interface SessionInitResult {
  project: TabloProject | null;
  isAuthenticated: boolean;
}

/**
 * Session kezelés
 *
 * Felelősségek:
 * - Session inicializálás storage-ból
 * - Session visszaállítás
 * - Session validálás szerveren
 * - Kijelentkezés
 * - Aktív session-ök kezelése
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(TabloStorageService);
  private tokenService = inject(TokenService);
  private guestService = inject(GuestService);
  private filterPersistence = inject(FilterPersistenceService);
  private sentryService = inject(SentryService);

  /**
   * Callback-ek a fő AuthService-ből
   */
  private onSessionRestored?: (project: TabloProject) => void;
  private onSessionValidated?: (project: TabloProject, canFinalize?: boolean, passwordSet?: boolean) => void;
  private onAuthCleared?: () => void;
  private onMarketerLogout?: () => void;

  /**
   * Callback regisztráció a fő AuthService-ből
   */
  registerCallbacks(callbacks: {
    onSessionRestored: (project: TabloProject) => void;
    onSessionValidated: (project: TabloProject, canFinalize?: boolean, passwordSet?: boolean) => void;
    onAuthCleared: () => void;
    onMarketerLogout: () => void;
  }): void {
    this.onSessionRestored = callbacks.onSessionRestored;
    this.onSessionValidated = callbacks.onSessionValidated;
    this.onAuthCleared = callbacks.onAuthCleared;
    this.onMarketerLogout = callbacks.onMarketerLogout;
  }

  /**
   * Inicializálás localStorage-ból (migration + aktív session betöltése)
   */
  initializeFromStorage(): SessionInitResult {
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

    // Callback a fő AuthService-nek
    this.onSessionRestored?.(project);

    return true;
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

            // canFinalize frissítése TokenService-en keresztül
            if (response.canFinalize !== undefined) {
              this.tokenService.setCanFinalize(projectId, sessionType, response.canFinalize);
            }

            // Callback a fő AuthService-nek
            this.onSessionValidated?.(
              response.project,
              response.canFinalize,
              response.user?.passwordSet
            );
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
    this.sentryService.setUser(null);

    // Callback a fő AuthService-nek
    this.onAuthCleared?.();

    this.router.navigate(['/login']);
  }

  /**
   * Egységes admin kijelentkezés (marketer, partner, super_admin)
   */
  logoutAdmin(): void {
    sessionStorage.removeItem('marketer_token');
    sessionStorage.removeItem('marketer_user');
    this.filterPersistence.clearAllFilters();
    this.sentryService.setUser(null);

    // Callback a fő AuthService-nek
    this.onMarketerLogout?.();

    this.router.navigate(['/login']);
  }

  /**
   * Marketer token lekérése
   */
  getMarketerToken(): string | null {
    return sessionStorage.getItem('marketer_token');
  }

  /**
   * Marketer felhasználó lekérése localStorage-ból
   */
  getStoredMarketerUser(): AuthUser | null {
    const stored = sessionStorage.getItem('marketer_user');
    if (stored) {
      return safeJsonParse<AuthUser | null>(stored, null);
    }
    return null;
  }

  /**
   * Marketer/Partner/Admin/Csapattag session inicializálása (page reload esetén)
   */
  initializeMarketerSession(): { success: boolean; user: AuthUser | null } {
    const token = this.getMarketerToken();
    const user = this.getStoredMarketerUser();
    // Partner, csapattagok és admin role-ok
    const validRoles = ['marketer', 'partner', 'super_admin', 'designer', 'printer', 'assistant'];
    if (token && user && validRoles.some(role => user.roles?.includes(role))) {
      return { success: true, user };
    }
    return { success: false, user: null };
  }

  /**
   * Aktív session-ök lekérése
   */
  getActiveSessions(): Observable<{ sessions: ActiveSession[] }> {
    return this.http.get<{ sessions: ActiveSession[] }>(`${environment.apiUrl}/auth/sessions`)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, { 401: 'Nincs bejelentkezve', 403: 'Nincs jogosultságod ehhez a muvelethez', 500: 'Szerverhiba. Kérlek próbáld újra később.' })))
      );
  }

  /**
   * Session visszavonás
   */
  revokeSession(tokenId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/auth/sessions/${tokenId}`)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, { 401: 'Nincs bejelentkezve', 403: 'Nincs jogosultságod ehhez a muvelethez', 500: 'Szerverhiba. Kérlek próbáld újra később.' })))
      );
  }

  /**
   * Összes session visszavonása (kivéve jelenlegi)
   */
  revokeAllSessions(): Observable<{ message: string; revoked_count: number }> {
    return this.http.delete<{ message: string; revoked_count: number }>(`${environment.apiUrl}/auth/sessions`)
      .pipe(
        catchError(error => throwError(() => handleAuthError(error, { 401: 'Nincs bejelentkezve', 403: 'Nincs jogosultságod ehhez a muvelethez', 500: 'Szerverhiba. Kérlek próbáld újra később.' })))
      );
  }

}
