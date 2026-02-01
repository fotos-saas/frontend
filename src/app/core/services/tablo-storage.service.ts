import { Injectable, inject } from '@angular/core';
import type { TabloProject, TokenType } from './auth.service';
import { LoggerService } from './logger.service';
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
 * Tablo Storage Service
 *
 * Projekt ÉS session-típus izolált localStorage abstrakció.
 * Kulcs struktúra: `tablo:{projectId}:{sessionType}:*`
 *
 * Ez lehetővé teszi, hogy ugyanazon projekt vendég (share) és
 * admin előnézet (preview) session-je párhuzamosan fusson különböző tabokban.
 *
 * Session típusok:
 * - code: Normál bejelentkezés (teljes hozzáférés)
 * - share: Vendég link (korlátozott hozzáférés)
 * - preview: Admin előnézet (teljes hozzáférés + badge)
 *
 * Safari Private mode esetén automatikus memory fallback.
 *
 * @example
 * // Auth token tárolása projekt #123 share session-höz
 * storage.setAuthToken(123, 'share', 'jwt-token');
 *
 * // Token lekérése
 * const token = storage.getAuthToken(123, 'share');
 */
@Injectable({
  providedIn: 'root'
})
export class TabloStorageService {
  private readonly logger = inject(LoggerService);
  private readonly PREFIX = 'tablo:';
  private readonly ACTIVE_SESSION_KEY = 'tablo:active_session';
  private readonly SESSIONS_KEY = 'tablo:sessions';
  private readonly GLOBAL_PREFIX = 'tablo:global:';

  // Safari Private mode fallback
  private memoryFallback = new Map<string, string>();
  private useMemoryFallback = false;

  constructor() {
    this.detectPrivateMode();
    this.migrateOldKeys();
  }

  // === SAFARI PRIVATE MODE DETECTION ===

  /**
   * Safari Private mode detektálása.
   * Private mode-ban a localStorage.setItem() QuotaExceededError-t dob.
   */
  private detectPrivateMode(): void {
    try {
      const testKey = '__safari_private_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      this.useMemoryFallback = true;
      this.logger.warn('localStorage nem elérhető, memory fallback aktív');
    }
  }

  // === KEY GENERATORS ===

  /**
   * Session-specifikus auth kulcs
   * Format: tablo:{projectId}:{sessionType}:{suffix}
   */
  private sessionKey(projectId: number, sessionType: TokenType, suffix: string): string {
    return `${this.PREFIX}${projectId}:${sessionType}:${suffix}`;
  }

  private uiKey(projectId: number, suffix: string): string {
    return `${this.PREFIX}${projectId}:ui:${suffix}`;
  }

  private reminderKey(projectId: number, suffix: string): string {
    return `${this.PREFIX}${projectId}:reminder:${suffix}`;
  }

  // === GENERIC METHODS (Safari-safe) ===

  /**
   * localStorage setItem wrapper - Safari Private mode támogatással.
   * MINDIG próbálja a localStorage-t használni, csak hiba esetén fallback-el.
   */
  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      // Ha sikerült, tárolunk memory-ba is (backup)
      this.memoryFallback.set(key, value);
    } catch {
      // QuotaExceededError - memory fallback
      this.logger.warn(`[TabloStorage] localStorage.setItem failed for ${key}, using memory fallback`);
      this.useMemoryFallback = true;
      this.memoryFallback.set(key, value);
    }
  }

  /**
   * localStorage getItem wrapper - Safari Private mode támogatással.
   * Először localStorage-ból próbál, majd memory fallback.
   */
  private getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      // Ha localStorage-ban nincs, nézzük a memory fallback-et
      return this.memoryFallback.get(key) ?? null;
    } catch {
      // localStorage nem elérhető - memory fallback
      return this.memoryFallback.get(key) ?? null;
    }
  }

  /**
   * localStorage removeItem wrapper - Safari Private mode támogatással.
   */
  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
    // Mindig töröljük a memory fallback-ből is
    this.memoryFallback.delete(key);
  }

  // === ACTIVE SESSION (TAB-SPECIFIC via sessionStorage) ===

  /**
   * Aktív session lekérése (projectId + sessionType)
   *
   * Prioritás:
   * 1. sessionStorage - tab-specifikus (ha van érvényes auth/guest token hozzá)
   * 2. localStorage - fallback (F5 után, vagy ha sessionStorage session-höz nincs token)
   *
   * Ez biztosítja, hogy:
   * - Az auth és guest session visszatöltődik frissítés után is
   * - Ha a tab más projektet használ mint amit sessionStorage mutat, localStorage nyer
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
    if (this.getItem(tokenKey)) {
      return true;
    }

    // Share session esetén guest_session is érvényes
    if (sessionType === 'share') {
      const guestSessionKey = this.sessionKey(projectId, sessionType, 'guest_session');
      if (this.getItem(guestSessionKey)) {
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
    return this.getItem(this.sessionKey(projectId, sessionType, 'token'));
  }

  setAuthToken(projectId: number, sessionType: TokenType, token: string): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'token'), token);
    this.setActiveSession(projectId, sessionType);
  }

  // === PROJECT DATA (SESSION-ISOLATED) ===

  getProject(projectId: number, sessionType: TokenType): TabloProject | null {
    const stored = this.getItem(this.sessionKey(projectId, sessionType, 'project'));
    if (stored) {
      const project = safeJsonParse<TabloProject | null>(stored, null);
      if (!project) {
        // Hibás JSON - töröljük
        this.removeItem(this.sessionKey(projectId, sessionType, 'project'));
      }
      return project;
    }
    return null;
  }

  setProject(projectId: number, sessionType: TokenType, project: TabloProject): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'project'), JSON.stringify(project));
  }

  // === CAN FINALIZE (SESSION-ISOLATED) ===

  getCanFinalize(projectId: number, sessionType: TokenType): boolean {
    return this.getItem(this.sessionKey(projectId, sessionType, 'can_finalize')) === 'true';
  }

  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'can_finalize'), String(canFinalize));
  }

  // === UI STATE ===

  /**
   * Order finalization aktuális lépés lekérése
   */
  getCurrentStep(projectId: number): number {
    const step = this.getItem(this.uiKey(projectId, 'current_step'));
    const parsed = parseInt(step ?? '0', 10);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(3, parsed));
  }

  /**
   * Order finalization aktuális lépés mentése
   */
  setCurrentStep(projectId: number, step: number): void {
    this.setItem(this.uiKey(projectId, 'current_step'), String(step));
  }

  // === DEPRECATED - Backward compatibility ===

  /**
   * @deprecated Használd helyette: getActiveSession()
   * Aktív projekt ID lekérése.
   */
  getActiveProjectId(): number | null {
    const session = this.getActiveSession();
    return session?.projectId ?? null;
  }

  /**
   * @deprecated Használd helyette: setActiveSession()
   * Aktív projekt beállítása - backward compatibility
   */
  setActiveProjectId(projectId: number): void {
    // Ha nincs aktív session, code-ként mentjük (legacy)
    const session = this.getActiveSession();
    if (!session || session.projectId !== projectId) {
      this.setActiveSession(projectId, 'code');
    }
  }

  /**
   * @deprecated Használd helyette: clearActiveSession()
   * Aktív projekt törlése
   */
  clearActiveProjectId(): void {
    this.clearActiveSession();
  }

  // === REMINDER STATE (PROJEKTIZOLT) ===

  /**
   * Schedule reminder halasztás dátuma
   */
  getScheduleReminderDismissedUntil(projectId: number): string | null {
    return this.getItem(this.reminderKey(projectId, 'schedule_dismissed_until'));
  }

  setScheduleReminderDismissedUntil(projectId: number, date: string): void {
    this.setItem(this.reminderKey(projectId, 'schedule_dismissed_until'), date);
  }

  /**
   * Schedule reminder utolsó megjelenítés
   */
  getScheduleReminderLastShown(projectId: number): string | null {
    return this.getItem(this.reminderKey(projectId, 'schedule_last_shown'));
  }

  setScheduleReminderLastShown(projectId: number, date: string): void {
    this.setItem(this.reminderKey(projectId, 'schedule_last_shown'), date);
  }

  /**
   * Schedule reminder összes adat törlése
   */
  clearScheduleReminder(projectId: number): void {
    this.removeItem(this.reminderKey(projectId, 'schedule_dismissed_until'));
    this.removeItem(this.reminderKey(projectId, 'schedule_last_shown'));
  }

  /**
   * Finalization reminder halasztás dátuma
   */
  getFinalizationReminderDismissedUntil(projectId: number): string | null {
    return this.getItem(this.reminderKey(projectId, 'finalization_dismissed_until'));
  }

  setFinalizationReminderDismissedUntil(projectId: number, date: string): void {
    this.setItem(this.reminderKey(projectId, 'finalization_dismissed_until'), date);
  }

  /**
   * Finalization reminder utolsó megjelenítés
   */
  getFinalizationReminderLastShown(projectId: number): string | null {
    return this.getItem(this.reminderKey(projectId, 'finalization_last_shown'));
  }

  setFinalizationReminderLastShown(projectId: number, date: string): void {
    this.setItem(this.reminderKey(projectId, 'finalization_last_shown'), date);
  }

  /**
   * Finalization reminder összes adat törlése
   */
  clearFinalizationReminder(projectId: number): void {
    this.removeItem(this.reminderKey(projectId, 'finalization_dismissed_until'));
    this.removeItem(this.reminderKey(projectId, 'finalization_last_shown'));
  }

  // === GENERIC REMINDER METHODS ===

  /**
   * Generikus reminder érték lekérése
   * Kulcs: tablo:{projectId}:reminder:{suffix}
   */
  getReminderValue(projectId: number, suffix: string): string | null {
    return this.getItem(this.reminderKey(projectId, suffix));
  }

  /**
   * Generikus reminder érték beállítása
   * Kulcs: tablo:{projectId}:reminder:{suffix}
   */
  setReminderValue(projectId: number, suffix: string, value: string): void {
    this.setItem(this.reminderKey(projectId, suffix), value);
  }

  /**
   * Generikus reminder érték törlése
   */
  removeReminderValue(projectId: number, suffix: string): void {
    this.removeItem(this.reminderKey(projectId, suffix));
  }

  // === SESSION AUTH CLEANUP ===

  /**
   * Session összes auth adatának törlése
   */
  clearSessionAuth(projectId: number, sessionType: TokenType): void {
    this.removeItem(this.sessionKey(projectId, sessionType, 'token'));
    this.removeItem(this.sessionKey(projectId, sessionType, 'project'));
    this.removeItem(this.sessionKey(projectId, sessionType, 'can_finalize'));
  }

  /**
   * Aktív session auth adatainak törlése
   */
  clearCurrentSessionAuth(): void {
    const session = this.getActiveSession();
    if (session) {
      this.clearSessionAuth(session.projectId, session.sessionType);
      this.clearActiveSession();
    }
  }

  /**
   * Projekt összes adatának törlése (minden session + ui + reminder)
   */
  clearAllProjectData(projectId: number): void {
    // Töröljük az összes session típust
    const sessionTypes: TokenType[] = ['code', 'share', 'preview'];
    for (const sessionType of sessionTypes) {
      this.clearSessionAuth(projectId, sessionType);
    }
    this.removeItem(this.uiKey(projectId, 'current_step'));
    this.clearScheduleReminder(projectId);
    this.clearFinalizationReminder(projectId);
  }

  // === MIGRATION ===

  /**
   * Régi (nem projektizolt) kulcsokról migráció.
   * Visszaadja a migrált session-t, vagy null-t ha nem volt mit migrálni.
   */
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

      // Step migráció (ha van)
      const legacyStep = localStorage.getItem('kv:order-finalization:currentStep');
      if (legacyStep) {
        const step = parseInt(legacyStep, 10);
        if (!isNaN(step)) {
          this.setCurrentStep(projectId, step);
        }
        localStorage.removeItem('kv:order-finalization:currentStep');
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

  // === SESSION REGISTRY ===

  /**
   * Összes tárolt session lekérése
   */
  getStoredSessions(): StoredSession[] {
    const stored = this.getItem(this.SESSIONS_KEY);
    if (!stored) return [];

    const sessions = safeJsonParse<StoredSession[]>(stored, []);
    // Rendezés utolsó használat szerint (legújabb elöl)
    return sessions.sort((a, b) =>
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  /**
   * Session hozzáadása a registry-hez
   */
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

    this.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  /**
   * Session eltávolítása a registry-ből
   */
  removeSession(projectId: number, sessionType: TokenType): void {
    const sessions = this.getStoredSessions();
    const filtered = sessions.filter(
      s => !(s.projectId === projectId && s.sessionType === sessionType)
    );
    this.setItem(this.SESSIONS_KEY, JSON.stringify(filtered));
  }

  /**
   * Session lastUsed frissítése
   */
  updateSessionLastUsed(projectId: number, sessionType: TokenType): void {
    const sessions = this.getStoredSessions();
    const session = sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    );

    if (session) {
      session.lastUsed = new Date().toISOString();
      this.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Session userName frissítése (vendég regisztráció után)
   */
  updateSessionUserName(projectId: number, sessionType: TokenType, userName: string): void {
    const sessions = this.getStoredSessions();
    const session = sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    );

    if (session) {
      session.userName = userName;
      session.lastUsed = new Date().toISOString();
      this.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Session keresése a registry-ben
   */
  findSession(projectId: number, sessionType: TokenType): StoredSession | null {
    const sessions = this.getStoredSessions();
    return sessions.find(
      s => s.projectId === projectId && s.sessionType === sessionType
    ) ?? null;
  }

  // === GUEST SESSION DATA (SESSION-ISOLATED) ===

  /**
   * Guest session token lekérése
   */
  getGuestSession(projectId: number, sessionType: TokenType): string | null {
    return this.getItem(this.sessionKey(projectId, sessionType, 'guest_session'));
  }

  /**
   * Guest session token mentése
   */
  setGuestSession(projectId: number, sessionType: TokenType, token: string): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'guest_session'), token);
  }

  /**
   * Guest session token törlése
   */
  clearGuestSession(projectId: number, sessionType: TokenType): void {
    this.removeItem(this.sessionKey(projectId, sessionType, 'guest_session'));
  }

  /**
   * Guest név lekérése
   */
  getGuestName(projectId: number, sessionType: TokenType): string | null {
    return this.getItem(this.sessionKey(projectId, sessionType, 'guest_name'));
  }

  /**
   * Guest név mentése
   */
  setGuestName(projectId: number, sessionType: TokenType, name: string): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'guest_name'), name);
  }

  /**
   * Guest ID lekérése
   */
  getGuestId(projectId: number, sessionType: TokenType): number | null {
    const id = this.getItem(this.sessionKey(projectId, sessionType, 'guest_id'));
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Guest ID mentése
   */
  setGuestId(projectId: number, sessionType: TokenType, id: number): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'guest_id'), id.toString());
  }

  /**
   * Verification status lekérése
   */
  getVerificationStatus(projectId: number, sessionType: TokenType): string | null {
    return this.getItem(this.sessionKey(projectId, sessionType, 'verification_status'));
  }

  /**
   * Verification status mentése
   */
  setVerificationStatus(projectId: number, sessionType: TokenType, status: string): void {
    this.setItem(this.sessionKey(projectId, sessionType, 'verification_status'), status);
  }

  /**
   * Guest session összes adata törlése
   */
  clearGuestData(projectId: number, sessionType: TokenType): void {
    this.removeItem(this.sessionKey(projectId, sessionType, 'guest_session'));
    this.removeItem(this.sessionKey(projectId, sessionType, 'guest_name'));
    this.removeItem(this.sessionKey(projectId, sessionType, 'guest_id'));
    this.removeItem(this.sessionKey(projectId, sessionType, 'verification_status'));
  }

  // === STEP INFO DIALOG STATE (PROJECT-SPECIFIC) ===

  /**
   * Step info dialog megjelent-e már
   */
  isStepInfoShown(projectId: number, stepName: string): boolean {
    return this.getItem(this.uiKey(projectId, `step_info_shown:${stepName}`)) === 'true';
  }

  /**
   * Step info dialog megjelentként jelölése
   */
  setStepInfoShown(projectId: number, stepName: string): void {
    this.setItem(this.uiKey(projectId, `step_info_shown:${stepName}`), 'true');
  }

  /**
   * Step info dialog visszaállítása (újra megjelenik)
   */
  resetStepInfoShown(projectId: number, stepName: string): void {
    this.removeItem(this.uiKey(projectId, `step_info_shown:${stepName}`));
  }

  /**
   * Összes step info dialog visszaállítása
   */
  resetAllStepInfoShown(projectId: number): void {
    const steps = ['claiming', 'retouch', 'tablo', 'completed'];
    for (const step of steps) {
      this.resetStepInfoShown(projectId, step);
    }
  }

  // === GLOBAL SETTINGS (NOT SESSION-SPECIFIC) ===

  /**
   * Globális beállítás lekérése
   */
  getGlobalSetting<T>(key: string): T | null {
    const stored = this.getItem(`${this.GLOBAL_PREFIX}${key}`);
    if (!stored) return null;

    // Próbáljuk JSON-ként, ha nem sikerül, string-ként adjuk vissza
    const parsed = safeJsonParse<T | null>(stored, null);
    if (parsed !== null) {
      return parsed;
    }
    // Ha nem JSON, akkor string-ként adjuk vissza
    return stored as unknown as T;
  }

  /**
   * Globális beállítás mentése
   */
  setGlobalSetting<T>(key: string, value: T): void {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    this.setItem(`${this.GLOBAL_PREFIX}${key}`, toStore);
  }

  /**
   * Globális beállítás törlése
   */
  removeGlobalSetting(key: string): void {
    this.removeItem(`${this.GLOBAL_PREFIX}${key}`);
  }

  // === OLD KEY MIGRATION ===

  /**
   * Régi kulcsok migrálása az új struktúrára
   * Egyszer fut a service inicializálásakor
   */
  private migrateOldKeys(): void {
    try {
      // 1. Sidebar settings migráció
      const oldSidebar = localStorage.getItem('sidebar_expanded_sections');
      if (oldSidebar) {
        this.setItem(`${this.GLOBAL_PREFIX}sidebar_expanded_sections`, oldSidebar);
        localStorage.removeItem('sidebar_expanded_sections');
      }

      // 2. Step info dialog kulcsok migrálása (globálisról projekt-specifikusra)
      // Ezeket NEM migráljuk, mert projekt-specifikusnak kell lenniük
      // A régi kulcsokat töröljük
      const oldStepInfoKeys = [
        'tablo_step_info_shown_claiming',
        'tablo_step_info_shown_retouch',
        'tablo_step_info_shown_tablo',
        'tablo_step_info_shown_completed'
      ];
      for (const key of oldStepInfoKeys) {
        localStorage.removeItem(key);
      }

      // 3. Régi kv: prefix-es reminder kulcsok
      // Ezeket a BaseReminderService fogja migrálni projekt-specifikusan

    } catch (error) {
      this.logger.warn('[TabloStorage] Migration error:', error);
    }
  }
}
