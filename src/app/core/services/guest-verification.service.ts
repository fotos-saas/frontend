import { Injectable, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, timer } from 'rxjs';
import { catchError, map, takeUntil, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TabloStorageService } from './tablo-storage.service';
import { TokenType } from './token.service';
import { GuestSessionService } from './guest-session.service';
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
import { GuestSession } from './guest.models';

/**
 * Guest Verification Service
 *
 * Onboarding, személyazonosítás, verifikáció:
 * - Személy keresés (autocomplete)
 * - Regisztráció személyazonosítással
 * - Verification status polling
 * - Admin pending sessions kezelés
 */
@Injectable({
  providedIn: 'root'
})
export class GuestVerificationService implements OnDestroy {

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

  constructor(
    private http: HttpClient,
    private storage: TabloStorageService,
    private sessionService: GuestSessionService
  ) {}

  ngOnDestroy(): void {
    this.stopVerificationPolling();
    this.verificationCheckStop$.complete();
  }

  // ==========================================
  // PERSON SEARCH (Autocomplete)
  // ==========================================

  /** Tablón szereplő személyek keresése */
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

  /** @deprecated Use searchPersons instead */
  searchMissingPersons(query: string): Observable<PersonSearchResult[]> {
    return this.searchPersons(query);
  }

  // ==========================================
  // REGISTER WITH IDENTIFICATION
  // ==========================================

  /** Regisztráció személyazonosítással (onboarding flow) */
  registerWithIdentification(
    nickname: string,
    missingPersonId?: number,
    email?: string
  ): Observable<ExtendedGuestSession> {
    const request: RegisterWithIdentificationRequest = {
      nickname,
      missing_person_id: missingPersonId,
      email,
      device_identifier: this.sessionService.getDeviceIdentifier()
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
          this.sessionService.storeSessionToken(activeSession.projectId, activeSession.sessionType, response.data.session_token);
          this.sessionService.storeGuestName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
          this.sessionService.storeGuestId(activeSession.projectId, activeSession.sessionType, response.data.id);
          this.storeVerificationStatus(activeSession.projectId, activeSession.sessionType, response.data.verification_status);
          this.storage.updateSessionUserName(activeSession.projectId, activeSession.sessionType, response.data.guest_name);
        }

        // State frissítés
        const session: GuestSession = {
          id: response.data.id,
          sessionToken: response.data.session_token,
          guestName: response.data.guest_name,
          guestEmail: response.data.guest_email
        };
        this.sessionService.setGuestSession(session);
        this.verificationStatus.set(response.data.verification_status);
        this.isPending.set(response.data.is_pending);
        this.personId.set(response.data.missing_person_id);
        this.personName.set(response.data.missing_person_name);

        return extendedSession;
      }),
      catchError(this.sessionService.handleError.bind(this.sessionService))
    );
  }

  // ==========================================
  // VERIFICATION STATUS STORAGE
  // ==========================================

  /** Verification status tárolása storage-ba */
  storeVerificationStatus(projectId: number, sessionType: TokenType, status: VerificationStatus): void {
    this.storage.setVerificationStatus(projectId, sessionType, status);
  }

  /** Verification status lekérése storage-ból */
  getStoredVerificationStatus(projectId: number, sessionType: TokenType): VerificationStatus | null {
    const stored = this.storage.getVerificationStatus(projectId, sessionType);
    if (stored && ['verified', 'pending', 'rejected'].includes(stored)) {
      return stored as VerificationStatus;
    }
    return null;
  }

  // ==========================================
  // VERIFICATION POLLING
  // ==========================================

  /** Verification status polling indítása (pending session-höz) */
  startVerificationPolling(): void {
    if (this.isVerificationPolling) return;

    const currentSession = this.sessionService.getCurrentSession();
    if (!currentSession) return;

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

          const activeSession = this.storage.getActiveSession();
          if (activeSession) {
            this.storeVerificationStatus(activeSession.projectId, activeSession.sessionType, data.verification_status);
          }

          if (data.is_verified) {
            this.stopVerificationPolling();
          }

          if (data.is_rejected) {
            this.stopVerificationPolling();
            this.sessionService.handleInvalidSession('rejected', 'A kérésed elutasításra került. Kérlek válassz más nevet.');
          }

          if (data.is_banned) {
            this.stopVerificationPolling();
            this.sessionService.handleInvalidSession('banned', 'Hozzáférés megtagadva. Kérlek vedd fel a kapcsolatot a szervezőkkel.');
          }
        }
      },
      error: () => { /* Hálózati hiba - csendben folytatjuk */ }
    });
  }

  /** Verification polling leállítása */
  stopVerificationPolling(): void {
    if (!this.isVerificationPolling) return;
    this.verificationCheckStop$.next();
    this.isVerificationPolling = false;
  }

  /** Verification status ellenőrzése (egyszer) */
  checkVerificationStatus(): Observable<VerificationStatusResponse> {
    const currentSession = this.sessionService.getCurrentSession();
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

  /** Ellenőrzi, hogy a session pending-e */
  isSessionPending(): boolean {
    return this.isPending();
  }

  /** Ellenőrzi, hogy van-e személy azonosítás (tablón szereplő) */
  hasPersonIdentification(): boolean {
    return this.personId() !== null;
  }

  // ==========================================
  // ADMIN - PENDING SESSIONS
  // ==========================================

  /** Pending session-ök listája (admin) */
  getPendingSessions(): Observable<PendingSessionsResponse> {
    return this.http.get<PendingSessionsResponse>(
      `${environment.apiUrl}/tablo-frontend/admin/pending-sessions`
    ).pipe(
      catchError(this.sessionService.handleError.bind(this.sessionService))
    );
  }

  /** Ütközés feloldása (admin) */
  resolveConflict(sessionId: number, approve: boolean): Observable<ResolveConflictResponse> {
    return this.http.post<ResolveConflictResponse>(
      `${environment.apiUrl}/tablo-frontend/admin/guests/${sessionId}/resolve-conflict`,
      { approve }
    ).pipe(
      catchError(this.sessionService.handleError.bind(this.sessionService))
    );
  }
}
