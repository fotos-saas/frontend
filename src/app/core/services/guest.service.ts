import { Injectable, computed, inject, OnDestroy } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenType } from './token.service';
import { GuestSessionService } from './guest-session.service';
import { GuestVerificationService } from './guest-verification.service';
import {
  PersonSearchResult,
  ExtendedGuestSession,
  VerificationStatus,
  VerificationStatusResponse,
  PendingSessionsResponse,
  ResolveConflictResponse
} from '../models/guest.models';

// Re-export interfaces (backward kompatibilitás)
export type {
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
 * Guest Service (Facade)
 *
 * Backward kompatibilis facade a szétbontott service-ekhez:
 * - GuestSessionService: Session CRUD, storage, polling, heartbeat
 * - GuestVerificationService: Onboarding, verification, admin
 *
 * A meglévő importok változatlanul működnek:
 * `import { GuestService, GuestSession } from './guest.service';`
 */
@Injectable({
  providedIn: 'root'
})
export class GuestService implements OnDestroy {

  private readonly sessionService = inject(GuestSessionService);
  private readonly verificationService = inject(GuestVerificationService);

  // ==========================================
  // SESSION SIGNALS (delegálás)
  // ==========================================

  public readonly guestSessionSignal = this.sessionService.guestSessionSignal;
  public readonly guestSession$ = this.sessionService.guestSession$;
  public readonly hasGuestSession = this.sessionService.hasGuestSession;
  public readonly guestName = this.sessionService.guestName;
  public readonly currentProjectId = this.sessionService.currentProjectId;
  public readonly sessionInvalidated$ = this.sessionService.sessionInvalidated$;

  // ==========================================
  // VERIFICATION SIGNALS (delegálás)
  // ==========================================

  public readonly verificationStatus = this.verificationService.verificationStatus;
  public readonly isPending = this.verificationService.isPending;
  public readonly personId = this.verificationService.personId;
  public readonly personName = this.verificationService.personName;
  /** @deprecated Use personId instead */
  public readonly missingPersonId = this.verificationService.missingPersonId;
  /** @deprecated Use personName instead */
  public readonly missingPersonName = this.verificationService.missingPersonName;

  ngOnDestroy(): void {
    // Sub-service-ek saját destroy-juk van
  }

  // ==========================================
  // SESSION METÓDUSOK (delegálás)
  // ==========================================

  initializeFromStorage(): void {
    this.sessionService.initializeFromStorage();
  }

  register(guestName: string, guestEmail?: string): Observable<import('./guest.models').GuestSession> {
    return this.sessionService.register(guestName, guestEmail);
  }

  updateGuestInfo(guestName: string, guestEmail?: string): Observable<import('./guest.models').GuestSession> {
    return this.sessionService.updateGuestInfo(guestName, guestEmail);
  }

  validateSession(): Observable<boolean> {
    return this.sessionService.validateSession();
  }

  clearSession(): void {
    this.sessionService.clearSession();
  }

  storeGuestSessionFromLogin(
    projectId: number,
    sessionType: TokenType,
    sessionToken: string,
    guestName: string
  ): void {
    this.sessionService.storeGuestSessionFromLogin(projectId, sessionType, sessionToken, guestName);
  }

  setRestoredSession(restoredSession: {
    sessionToken: string;
    guestName: string;
    guestEmail: string | null;
  }): void {
    this.sessionService.setRestoredSession(restoredSession);
  }

  getGuestSessionHeader(): HttpHeaders {
    return this.sessionService.getGuestSessionHeader();
  }

  getSessionToken(): string | null {
    return this.sessionService.getSessionToken();
  }

  getGuestId(): number | null {
    return this.sessionService.getGuestId();
  }

  hasRegisteredSession(): boolean {
    return this.sessionService.hasRegisteredSession();
  }

  // ==========================================
  // SESSION POLLING (delegálás)
  // ==========================================

  startSessionPolling(): void {
    this.sessionService.startSessionPolling();
  }

  stopSessionPolling(): void {
    this.sessionService.stopSessionPolling();
  }

  checkSessionStatus(): Observable<import('./guest.models').SessionStatusResponse> {
    return this.sessionService.checkSessionStatus();
  }

  // ==========================================
  // HEARTBEAT (delegálás)
  // ==========================================

  sendHeartbeat(): Observable<void> {
    return this.sessionService.sendHeartbeat();
  }

  // ==========================================
  // DEVICE LINK / RESTORE (delegálás)
  // ==========================================

  sendDeviceLink(email: string): Observable<{ success: boolean; message: string }> {
    return this.sessionService.sendDeviceLink(email);
  }

  requestRestoreLink(email: string): Observable<{ success: boolean; message: string }> {
    return this.sessionService.requestRestoreLink(email);
  }

  // ==========================================
  // ONBOARDING / IDENTIFICATION (delegálás)
  // ==========================================

  searchPersons(query: string): Observable<PersonSearchResult[]> {
    return this.verificationService.searchPersons(query);
  }

  /** @deprecated Use searchPersons instead */
  searchMissingPersons(query: string): Observable<PersonSearchResult[]> {
    return this.verificationService.searchMissingPersons(query);
  }

  registerWithIdentification(
    nickname: string,
    missingPersonId?: number,
    email?: string
  ): Observable<ExtendedGuestSession> {
    return this.verificationService.registerWithIdentification(nickname, missingPersonId, email);
  }

  // ==========================================
  // VERIFICATION POLLING (delegálás)
  // ==========================================

  startVerificationPolling(): void {
    this.verificationService.startVerificationPolling();
  }

  stopVerificationPolling(): void {
    this.verificationService.stopVerificationPolling();
  }

  checkVerificationStatus(): Observable<VerificationStatusResponse> {
    return this.verificationService.checkVerificationStatus();
  }

  isSessionPending(): boolean {
    return this.verificationService.isSessionPending();
  }

  hasPersonIdentification(): boolean {
    return this.verificationService.hasPersonIdentification();
  }

  // ==========================================
  // ADMIN (delegálás)
  // ==========================================

  getPendingSessions(): Observable<PendingSessionsResponse> {
    return this.verificationService.getPendingSessions();
  }

  resolveConflict(sessionId: number, approve: boolean): Observable<ResolveConflictResponse> {
    return this.verificationService.resolveConflict(sessionId, approve);
  }
}
