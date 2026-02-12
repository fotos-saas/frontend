import { Injectable, inject } from '@angular/core';
import type { TabloProject, TokenType } from './auth.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { TabloStorageSessionService, type StoredSession } from './tablo-storage-session.service';
import { TabloStorageUiService } from './tablo-storage-ui.service';

// Re-export StoredSession for backward compatibility
export type { StoredSession };

/**
 * Tablo Storage Service (Facade)
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
  private readonly crud = inject(TabloStorageCrudService);
  private readonly session = inject(TabloStorageSessionService);
  private readonly ui = inject(TabloStorageUiService);

  constructor() {
    this.migrateOldKeys();
  }

  // === ACTIVE SESSION ===

  getActiveSession(): { projectId: number; sessionType: TokenType } | null {
    return this.session.getActiveSession();
  }

  setActiveSession(projectId: number, sessionType: TokenType): void {
    this.session.setActiveSession(projectId, sessionType);
  }

  clearActiveSession(): void {
    this.session.clearActiveSession();
  }

  // === AUTH TOKEN ===

  getAuthToken(projectId: number, sessionType: TokenType): string | null {
    return this.session.getAuthToken(projectId, sessionType);
  }

  setAuthToken(projectId: number, sessionType: TokenType, token: string): void {
    this.session.setAuthToken(projectId, sessionType, token);
  }

  // === PROJECT DATA ===

  getProject(projectId: number, sessionType: TokenType): TabloProject | null {
    return this.session.getProject(projectId, sessionType);
  }

  setProject(projectId: number, sessionType: TokenType, project: TabloProject): void {
    this.session.setProject(projectId, sessionType, project);
  }

  // === CAN FINALIZE ===

  getCanFinalize(projectId: number, sessionType: TokenType): boolean {
    return this.session.getCanFinalize(projectId, sessionType);
  }

  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.session.setCanFinalize(projectId, sessionType, canFinalize);
  }

  // === UI STATE ===

  getCurrentStep(projectId: number): number {
    return this.ui.getCurrentStep(projectId);
  }

  setCurrentStep(projectId: number, step: number): void {
    this.ui.setCurrentStep(projectId, step);
  }

  // === REMINDER STATE ===

  getScheduleReminderDismissedUntil(projectId: number): string | null {
    return this.ui.getScheduleReminderDismissedUntil(projectId);
  }

  setScheduleReminderDismissedUntil(projectId: number, date: string): void {
    this.ui.setScheduleReminderDismissedUntil(projectId, date);
  }

  getScheduleReminderLastShown(projectId: number): string | null {
    return this.ui.getScheduleReminderLastShown(projectId);
  }

  setScheduleReminderLastShown(projectId: number, date: string): void {
    this.ui.setScheduleReminderLastShown(projectId, date);
  }

  clearScheduleReminder(projectId: number): void {
    this.ui.clearScheduleReminder(projectId);
  }

  getFinalizationReminderDismissedUntil(projectId: number): string | null {
    return this.ui.getFinalizationReminderDismissedUntil(projectId);
  }

  setFinalizationReminderDismissedUntil(projectId: number, date: string): void {
    this.ui.setFinalizationReminderDismissedUntil(projectId, date);
  }

  getFinalizationReminderLastShown(projectId: number): string | null {
    return this.ui.getFinalizationReminderLastShown(projectId);
  }

  setFinalizationReminderLastShown(projectId: number, date: string): void {
    this.ui.setFinalizationReminderLastShown(projectId, date);
  }

  clearFinalizationReminder(projectId: number): void {
    this.ui.clearFinalizationReminder(projectId);
  }

  getReminderValue(projectId: number, suffix: string): string | null {
    return this.ui.getReminderValue(projectId, suffix);
  }

  setReminderValue(projectId: number, suffix: string, value: string): void {
    this.ui.setReminderValue(projectId, suffix, value);
  }

  removeReminderValue(projectId: number, suffix: string): void {
    this.ui.removeReminderValue(projectId, suffix);
  }

  // === SESSION CLEANUP ===

  clearSessionAuth(projectId: number, sessionType: TokenType): void {
    this.session.clearSessionAuth(projectId, sessionType);
  }

  clearCurrentSessionAuth(): void {
    this.session.clearCurrentSessionAuth();
  }

  clearAllProjectData(projectId: number): void {
    this.session.clearAllProjectData(projectId);
    this.ui.setCurrentStep(projectId, 0);
    this.ui.clearAllReminders(projectId);
  }

  // === SESSION REGISTRY ===

  getStoredSessions(): StoredSession[] {
    return this.session.getStoredSessions();
  }

  addSession(session: StoredSession): void {
    this.session.addSession(session);
  }

  removeSession(projectId: number, sessionType: TokenType): void {
    this.session.removeSession(projectId, sessionType);
  }

  updateSessionLastUsed(projectId: number, sessionType: TokenType): void {
    this.session.updateSessionLastUsed(projectId, sessionType);
  }

  updateSessionUserName(projectId: number, sessionType: TokenType, userName: string): void {
    this.session.updateSessionUserName(projectId, sessionType, userName);
  }

  findSession(projectId: number, sessionType: TokenType): StoredSession | null {
    return this.session.findSession(projectId, sessionType);
  }

  // === GUEST SESSION DATA ===

  getGuestSession(projectId: number, sessionType: TokenType): string | null {
    return this.session.getGuestSession(projectId, sessionType);
  }

  setGuestSession(projectId: number, sessionType: TokenType, token: string): void {
    this.session.setGuestSession(projectId, sessionType, token);
  }

  clearGuestSession(projectId: number, sessionType: TokenType): void {
    this.session.clearGuestSession(projectId, sessionType);
  }

  getGuestName(projectId: number, sessionType: TokenType): string | null {
    return this.session.getGuestName(projectId, sessionType);
  }

  setGuestName(projectId: number, sessionType: TokenType, name: string): void {
    this.session.setGuestName(projectId, sessionType, name);
  }

  getGuestId(projectId: number, sessionType: TokenType): number | null {
    return this.session.getGuestId(projectId, sessionType);
  }

  setGuestId(projectId: number, sessionType: TokenType, id: number): void {
    this.session.setGuestId(projectId, sessionType, id);
  }

  getVerificationStatus(projectId: number, sessionType: TokenType): string | null {
    return this.session.getVerificationStatus(projectId, sessionType);
  }

  setVerificationStatus(projectId: number, sessionType: TokenType, status: string): void {
    this.session.setVerificationStatus(projectId, sessionType, status);
  }

  clearGuestData(projectId: number, sessionType: TokenType): void {
    this.session.clearGuestData(projectId, sessionType);
  }

  // === STEP INFO DIALOG STATE ===

  isStepInfoShown(projectId: number, stepName: string): boolean {
    return this.ui.isStepInfoShown(projectId, stepName);
  }

  setStepInfoShown(projectId: number, stepName: string): void {
    this.ui.setStepInfoShown(projectId, stepName);
  }

  resetStepInfoShown(projectId: number, stepName: string): void {
    this.ui.resetStepInfoShown(projectId, stepName);
  }

  resetAllStepInfoShown(projectId: number): void {
    this.ui.resetAllStepInfoShown(projectId);
  }

  // === GLOBAL SETTINGS ===

  getGlobalSetting<T>(key: string): T | null {
    return this.ui.getGlobalSetting<T>(key);
  }

  setGlobalSetting<T>(key: string, value: T): void {
    this.ui.setGlobalSetting<T>(key, value);
  }

  removeGlobalSetting(key: string): void {
    this.ui.removeGlobalSetting(key);
  }

  // === MIGRATION ===

  migrateFromLegacy(): { projectId: number; sessionType: TokenType } | null {
    return this.session.migrateFromLegacy();
  }

  private migrateOldKeys(): void {
    // Delegálás a UI service-hez - migration ott fut
  }
}
