import { Injectable, inject } from '@angular/core';
import type { TabloProject, TokenType } from './auth.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { safeJsonParse } from '../../shared/utils/safe-json-parse';

/**
 * Tárolt session interface (session registry-hez)
 */
export interface StoredSession {
  projectId: number;
  sessionType: TokenType;
  projectName: string;
  userName?: string;
  lastUsed: string; // ISO date
  avatar?: string;
}

/**
 * Tablo Storage Session Service
 *
 * Session kezelés:
 * - Active session management (tab-specifikus)
 * - Auth token tárolás
 * - Project data tárolás
 * - Guest session data
 * - Session registry
 */
@Injectable({
  providedIn: 'root'
})
export class TabloStorageSessionService {
  private readonly crud = inject(TabloStorageCrudService);
  private readonly PREFIX = 'tablo:';
  private readonly ACTIVE_SESSION_KEY = 'tablo:active_session';
  private readonly SESSIONS_KEY = 'tablo:sessions';

  // === KEY GENERATORS ===

  /**
   * Session-specifikus auth kulcs
   * Format: tablo:{projectId}:{sessionType}:{suffix}
   */
  private sessionKey(projectId: number, sessionType: TokenType, suffix: string): string {
    return `${this.PREFIX}${projectId}:${sessionType}:${suffix}`;
  }

  // === ACTIVE SESSION (TAB-SPECIFIC via sessionStorage) ===

  /**
   * Aktív session lekérése (projectId + sessionType)
   *
   * Prioritás:
   * 1. sessionStorage - tab-specifikus (ha van érvényes auth/guest token hozzá)
   * 2. localStorage - fallback (F5 után, vagy ha sessionStorage session-höz nincs token)
   */
  getActiveSession(): { projectId: number; sessionType: TokenType } | null {
    try {
      // Először sessionStorage-ból próbáljuk (tab-specifikus)
      const sessionStored = sessionStorage.getItem(this.ACTIVE_SESSION_KEY);

      if (sessionStored) {
        const [projectIdStr, sessionType] = sessionStored.split(':');
        const projectId = parseInt(projectIdStr, 10);

        if (!isNaN(projectId) && sessionType) {
          // Ellenőrizzük, hogy van-e érvényes session ehhez
          if (this.hasValidSession(projectId, sessionType as TokenType)) {
            return { projectId, sessionType: sessionType as TokenType };
          }
        }
      }

      // Fallback: localStorage (F5 után, vagy ha sessionStorage session invalid)
      const localStored = localStorage.getItem(this.ACTIVE_SESSION_KEY);
      if (!localStored) return null;

      const [projectIdStr, sessionType] = localStored.split(':');
      const projectId = parseInt(projectIdStr, 10);

      if (isNaN(projectId) || !sessionType) return null;

      return { projectId, sessionType: sessionType as TokenType };
    } catch {
      // Safari Private mode fallback
      return null;
    }
  }

  /**
   * Ellenőrzi, hogy van-e érvényes session a megadott projekthez és típushoz
   * - code/preview: auth token szükséges
   * - share: auth token VAGY guest_session szükséges
   */
  private hasValidSession(projectId: number, sessionType: TokenType): boolean {
    // Auth token ellenőrzése (code, preview, és share esetén is működhet)
    const tokenKey = this.sessionKey(projectId, sessionType, 'token');
    if (this.crud.getItem(tokenKey)) {
      return true;
    }

    // Share session esetén guest_session is érvényes
    if (sessionType === 'share') {
      const guestSessionKey = this.sessionKey(projectId, sessionType, 'guest_session');
      if (this.crud.getItem(guestSessionKey)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Aktív session beállítása
   * FONTOS: Mindkét helyre mentjük!
   * - sessionStorage: tab-specifikus működéshez
   * - localStorage: oldal frissítés utáni visszatöltéshez (guest session)
   */
  setActiveSession(projectId: number, sessionType: TokenType): void {
    const value = `${projectId}:${sessionType}`;
    try {
      sessionStorage.setItem(this.ACTIVE_SESSION_KEY, value);
      localStorage.setItem(this.ACTIVE_SESSION_KEY, value);
    } catch {
      // Safari Private mode - silent fail, getActiveSession visszaad null-t
    }
  }

  /**
   * Aktív session törlése
   */
  clearActiveSession(): void {
    try {
      sessionStorage.removeItem(this.ACTIVE_SESSION_KEY);
    } catch {
      // Safari Private mode - silent fail
    }
  }

  // === AUTH TOKEN (SESSION-ISOLATED) ===

  getAuthToken(projectId: number, sessionType: TokenType): string | null {
    return this.crud.getItem(this.sessionKey(projectId, sessionType, 'token'));
  }

  setAuthToken(projectId: number, sessionType: TokenType, token: string): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'token'), token);
    this.setActiveSession(projectId, sessionType);
  }

  // === PROJECT DATA (SESSION-ISOLATED) ===

  getProject(projectId: number, sessionType: TokenType): TabloProject | null {
    const stored = this.crud.getItem(this.sessionKey(projectId, sessionType, 'project'));
    if (stored) {
      const project = safeJsonParse<TabloProject | null>(stored, null);
      if (!project) {
        // Hibás JSON - töröljük
        this.crud.removeItem(this.sessionKey(projectId, sessionType, 'project'));
      }
      return project;
    }
    return null;
  }

  setProject(projectId: number, sessionType: TokenType, project: TabloProject): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'project'), JSON.stringify(project));
  }

  // === CAN FINALIZE (SESSION-ISOLATED) ===

  getCanFinalize(projectId: number, sessionType: TokenType): boolean {
    return this.crud.getItem(this.sessionKey(projectId, sessionType, 'can_finalize')) === 'true';
  }

  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'can_finalize'), String(canFinalize));
  }

  // === GUEST SESSION DATA (SESSION-ISOLATED) ===

  getGuestSession(projectId: number, sessionType: TokenType): string | null {
    return this.crud.getItem(this.sessionKey(projectId, sessionType, 'guest_session'));
  }

  setGuestSession(projectId: number, sessionType: TokenType, token: string): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'guest_session'), token);
  }

  clearGuestSession(projectId: number, sessionType: TokenType): void {
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'guest_session'));
  }

  getGuestName(projectId: number, sessionType: TokenType): string | null {
    return this.crud.getItem(this.sessionKey(projectId, sessionType, 'guest_name'));
  }

  setGuestName(projectId: number, sessionType: TokenType, name: string): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'guest_name'), name);
  }

  getGuestId(projectId: number, sessionType: TokenType): number | null {
    const id = this.crud.getItem(this.sessionKey(projectId, sessionType, 'guest_id'));
    return id ? parseInt(id, 10) : null;
  }

  setGuestId(projectId: number, sessionType: TokenType, id: number): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'guest_id'), id.toString());
  }

  getVerificationStatus(projectId: number, sessionType: TokenType): string | null {
    return this.crud.getItem(this.sessionKey(projectId, sessionType, 'verification_status'));
  }

  setVerificationStatus(projectId: number, sessionType: TokenType, status: string): void {
    this.crud.setItem(this.sessionKey(projectId, sessionType, 'verification_status'), status);
  }

  clearGuestData(projectId: number, sessionType: TokenType): void {
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'guest_session'));
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'guest_name'));
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'guest_id'));
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'verification_status'));
  }

  // === SESSION AUTH CLEANUP ===

  clearSessionAuth(projectId: number, sessionType: TokenType): void {
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'token'));
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'project'));
    this.crud.removeItem(this.sessionKey(projectId, sessionType, 'can_finalize'));
  }

  clearCurrentSessionAuth(): void {
    const session = this.getActiveSession();
    if (session) {
      this.clearSessionAuth(session.projectId, session.sessionType);
      this.clearActiveSession();
    }
  }

  clearAllProjectData(projectId: number): void {
    const sessionTypes: TokenType[] = ['code', 'share', 'preview'];
    for (const sessionType of sessionTypes) {
      this.clearSessionAuth(projectId, sessionType);
    }
  }

  // === SESSION REGISTRY ===

  getStoredSessions(): StoredSession[] {
    const stored = this.crud.getItem(this.SESSIONS_KEY);
    if (!stored) return [];

    const sessions = safeJsonParse<StoredSession[]>(stored, []);
    // Rendezés utolsó használat szerint (legújabb elöl)
    return sessions.sort((a, b) =>
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  addSession(session: StoredSession): void {
    const sessions = this.getStoredSessions();

    // Létező session keresése (projectId + sessionType alapján)
    const existingIndex = sessions.findIndex(
      s => s.projectId === session.projectId && s.sessionType === session.sessionType
    );

    if (existingIndex >= 0) {
      // Frissítjük a meglévőt
      sessions[existingIndex] = {
        ...sessions[existingIndex],
        ...session,
        lastUsed: new Date().toISOString()
      };
    } else {
      // Új session hozzáadása
      sessions.push({
        ...session,
        lastUsed: new Date().toISOString()
      });
    }

    this.crud.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  removeSession(projectId: number, sessionType: TokenType): void {
    const sessions = this.getStoredSessions();
    const filtered = sessions.filter(
      s => !(s.projectId === projectId && s.sessionType === sessionType)
    );
    this.crud.setItem(this.SESSIONS_KEY, JSON.stringify(filtered));
  }

  updateSessionLastUsed(projectId: number, sessionType: TokenType): void {
    const sessions = this.getStoredSessions();
    const session = sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    );

    if (session) {
      session.lastUsed = new Date().toISOString();
      this.crud.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  updateSessionUserName(projectId: number, sessionType: TokenType, userName: string): void {
    const sessions = this.getStoredSessions();
    const session = sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    );

    if (session) {
      session.userName = userName;
      session.lastUsed = new Date().toISOString();
      this.crud.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  findSession(projectId: number, sessionType: TokenType): StoredSession | null {
    const sessions = this.getStoredSessions();
    return sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    ) ?? null;
  }

  // === MIGRATION ===

  migrateFromLegacy(): { projectId: number; sessionType: TokenType } | null {
    // Régi kulcsok
    const legacyToken = localStorage.getItem('tablo_auth_token');
    const legacyProject = localStorage.getItem('tablo_project');

    if (!legacyToken || !legacyProject) {
      return null;
    }

    const project = safeJsonParse<TabloProject | null>(legacyProject, null);
    if (!project) {
      // Hibás JSON formátum - törlés és kilépés
      localStorage.removeItem('tablo_auth_token');
      localStorage.removeItem('tablo_project');
      localStorage.removeItem('tablo_token_type');
      localStorage.removeItem('tablo_can_finalize');
      return null;
    }

    try {
      const projectId = project.id;

      if (!projectId) {
        return null;
      }

      // Token típus meghatározása (default: code)
      const tokenType = (localStorage.getItem('tablo_token_type') as TokenType) ?? 'code';

      // Migrálás új session-izolt kulcsokba
      this.setAuthToken(projectId, tokenType, legacyToken);
      this.setProject(projectId, tokenType, project);

      const canFinalize = localStorage.getItem('tablo_can_finalize');
      if (canFinalize) {
        this.setCanFinalize(projectId, tokenType, canFinalize === 'true');
      }

      // Régi kulcsok törlése
      localStorage.removeItem('tablo_auth_token');
      localStorage.removeItem('tablo_project');
      localStorage.removeItem('tablo_token_type');
      localStorage.removeItem('tablo_can_finalize');

      return { projectId, sessionType: tokenType };
    } catch (e) {
      return null;
    }
  }
}
