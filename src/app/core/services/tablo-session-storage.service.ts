import { Injectable, inject } from '@angular/core';
import type { TabloProject, TokenType } from './auth.service';
import { TabloStorageService, StoredSession } from './tablo-storage.service';
import { safeJsonParse } from '../../shared/utils/safe-json-parse';

/**
 * Tablo Session Storage Service
 *
 * Session kezelés (active session, auth token, project data, guest session, session registry).
 * A TabloStorageService low-level storage metódusaira épít.
 */
@Injectable({
  providedIn: 'root'
})
export class TabloSessionStorageService {
  private readonly storage = inject(TabloStorageService);

  // === ACTIVE SESSION (TAB-SPECIFIC via sessionStorage) ===

  /**
   * Aktív session lekérése (projectId + sessionType)
   */
  getActiveSession(): { projectId: number; sessionType: TokenType } | null {
    return this.storage.getActiveSession();
  }

  /**
   * Aktív session beállítása
   */
  setActiveSession(projectId: number, sessionType: TokenType): void {
    this.storage.setActiveSession(projectId, sessionType);
  }

  /**
   * Aktív session törlése
   */
  clearActiveSession(): void {
    this.storage.clearActiveSession();
  }

  // === AUTH TOKEN (SESSION-ISOLATED) ===

  getAuthToken(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getAuthToken(projectId, sessionType);
  }

  setAuthToken(projectId: number, sessionType: TokenType, token: string): void {
    this.storage.setAuthToken(projectId, sessionType, token);
  }

  // === PROJECT DATA (SESSION-ISOLATED) ===

  getProject(projectId: number, sessionType: TokenType): TabloProject | null {
    return this.storage.getProject(projectId, sessionType);
  }

  setProject(projectId: number, sessionType: TokenType, project: TabloProject): void {
    this.storage.setProject(projectId, sessionType, project);
  }

  // === CAN FINALIZE (SESSION-ISOLATED) ===

  getCanFinalize(projectId: number, sessionType: TokenType): boolean {
    return this.storage.getCanFinalize(projectId, sessionType);
  }

  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.storage.setCanFinalize(projectId, sessionType, canFinalize);
  }

  // === SESSION AUTH CLEANUP ===

  clearSessionAuth(projectId: number, sessionType: TokenType): void {
    this.storage.clearSessionAuth(projectId, sessionType);
  }

  clearCurrentSessionAuth(): void {
    this.storage.clearCurrentSessionAuth();
  }

  // === SESSION REGISTRY ===

  getStoredSessions(): StoredSession[] {
    return this.storage.getStoredSessions();
  }

  addSession(session: StoredSession): void {
    this.storage.addSession(session);
  }

  removeSession(projectId: number, sessionType: TokenType): void {
    this.storage.removeSession(projectId, sessionType);
  }

  updateSessionLastUsed(projectId: number, sessionType: TokenType): void {
    this.storage.updateSessionLastUsed(projectId, sessionType);
  }

  updateSessionUserName(projectId: number, sessionType: TokenType, userName: string): void {
    this.storage.updateSessionUserName(projectId, sessionType, userName);
  }

  findSession(projectId: number, sessionType: TokenType): StoredSession | null {
    return this.storage.findSession(projectId, sessionType);
  }

  // === GUEST SESSION DATA (SESSION-ISOLATED) ===

  getGuestSession(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getGuestSession(projectId, sessionType);
  }

  setGuestSession(projectId: number, sessionType: TokenType, token: string): void {
    this.storage.setGuestSession(projectId, sessionType, token);
  }

  clearGuestSession(projectId: number, sessionType: TokenType): void {
    this.storage.clearGuestSession(projectId, sessionType);
  }

  getGuestName(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getGuestName(projectId, sessionType);
  }

  setGuestName(projectId: number, sessionType: TokenType, name: string): void {
    this.storage.setGuestName(projectId, sessionType, name);
  }

  getGuestId(projectId: number, sessionType: TokenType): number | null {
    return this.storage.getGuestId(projectId, sessionType);
  }

  setGuestId(projectId: number, sessionType: TokenType, id: number): void {
    this.storage.setGuestId(projectId, sessionType, id);
  }

  getVerificationStatus(projectId: number, sessionType: TokenType): string | null {
    return this.storage.getVerificationStatus(projectId, sessionType);
  }

  setVerificationStatus(projectId: number, sessionType: TokenType, status: string): void {
    this.storage.setVerificationStatus(projectId, sessionType, status);
  }

  clearGuestData(projectId: number, sessionType: TokenType): void {
    this.storage.clearGuestData(projectId, sessionType);
  }

  // === MIGRATION ===

  migrateFromLegacy(): { projectId: number; sessionType: TokenType } | null {
    return this.storage.migrateFromLegacy();
  }
}
