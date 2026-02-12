import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { VoteCrudService } from './vote-crud.service';
import { VoteActionsService } from './vote-actions.service';
import { VOTING_API } from '../../features/voting/voting.constants';
import {
  Poll,
  PollOption,
  PollMedia,
  PollResults,
  VoteResponse,
  CreatePollRequest,
  ApiPollResponse,
  ApiResultsResponse
} from '../models/voting.models';
import {
  mapPollFromApi,
  mapResultsFromApi
} from '../helpers/vote-mappers';

// Re-export models for backwards compatibility
export {
  Poll,
  PollOption,
  PollMedia,
  PollResults,
  VoteResponse,
  CreatePollRequest
} from '../models/voting.models';

// Re-export Participant interfaces from vote-participants.service
export type {
  Participant,
  ParticipantStatistics,
  ParticipantsResponse
} from './vote-participants.service';

/**
 * Voting Service (Facade)
 *
 * Szavazás kezelés:
 * - State management (signals)
 * - Szavazások listázása
 * - Delegálás sub-service-ekre (VoteCrudService, VoteActionsService)
 *
 * Signal-based state management.
 */
@Injectable({
  providedIn: 'root'
})
export class VotingService {
  /** Aktív szavazások (Signal) */
  private readonly _polls = signal<Poll[]>([]);

  /** Publikus polls Signal (readonly) */
  readonly polls = this._polls.asReadonly();

  /** Observable compatibility layer for legacy code */
  readonly polls$ = toObservable(this._polls);

  /** Betöltés folyamatban */
  readonly isLoading = signal<boolean>(false);

  /** Kiválasztott szavazás */
  readonly selectedPoll = signal<Poll | null>(null);

  /** Aktív szavazások száma (computed) */
  readonly activePollsCount = computed(() =>
    this._polls().filter(p => p.isOpen).length
  );

  /** Van-e aktív szavazás (computed) */
  readonly hasActivePolls = computed(() =>
    this._polls().some(p => p.isOpen)
  );

  constructor(
    private http: HttpClient,
    private guestService: GuestService,
    private crudService: VoteCrudService,
    private actionsService: VoteActionsService
  ) {}

  /**
   * HTTP headers guest session-nel
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const sessionToken = this.guestService.getSessionToken();
    if (sessionToken) {
      headers = headers.set('X-Guest-Session', sessionToken);
    }
    return headers;
  }

  /**
   * Szavazások listázása
   */
  loadPolls(activeOnly = false): Observable<Poll[]> {
    this.isLoading.set(true);
    const params = activeOnly ? '?active_only=true' : '';

    return this.http.get<{ success: boolean; data: ApiPollResponse[] }>(
      `${environment.apiUrl}${VOTING_API.POLLS}${params}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Hiba a szavazások betöltésekor');
        }
        return response.data.map(mapPollFromApi);
      }),
      tap(polls => {
        this._polls.set(polls);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Egy szavazás részleteinek lekérése
   */
  getPoll(id: number): Observable<Poll> {
    return this.http.get<{ success: boolean; data: ApiPollResponse }>(
      `${environment.apiUrl}${VOTING_API.poll(id)}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Szavazás nem található');
        }
        const poll = mapPollFromApi(response.data);
        this.selectedPoll.set(poll);
        return poll;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // === DELEGÁLÁS: VoteActionsService ===

  /**
   * Szavazás eredményeinek lekérése
   */
  getResults(pollId: number): Observable<PollResults> {
    return this.actionsService.getResults(pollId);
  }

  /**
   * Szavazat leadása
   */
  vote(pollId: number, optionId: number): Observable<VoteResponse> {
    return this.actionsService.vote(pollId, optionId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalPollVotes(pollId, response.data.myVotes);
        }
      })
    );
  }

  /**
   * Szavazat visszavonása
   */
  removeVote(pollId: number, optionId?: number): Observable<{ success: boolean; message: string; data?: { my_votes: number[] } }> {
    return this.actionsService.removeVote(pollId, optionId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalPollVotes(pollId, response.data.my_votes);
        }
      })
    );
  }

  /**
   * Szavazás lezárása (csak kapcsolattartó)
   */
  closePoll(pollId: number): Observable<void> {
    return this.actionsService.closePoll(pollId).pipe(
      tap(() => {
        this._polls.update(polls =>
          polls.map(poll =>
            poll.id === pollId ? { ...poll, isActive: false, isOpen: false } : poll
          )
        );
      })
    );
  }

  /**
   * Szavazás újranyitása (csak kapcsolattartó)
   */
  reopenPoll(pollId: number, closeAt?: string): Observable<void> {
    return this.actionsService.reopenPoll(pollId, closeAt).pipe(
      tap(() => {
        this._polls.update(polls =>
          polls.map(poll =>
            poll.id === pollId ? { ...poll, isActive: true, isOpen: true, closeAt: closeAt ?? null } : poll
          )
        );
      })
    );
  }

  /**
   * Osztálylétszám beállítása (csak kapcsolattartó)
   */
  setClassSize(classSize: number): Observable<{ expected_class_size: number }> {
    return this.actionsService.setClassSize(classSize);
  }

  // === DELEGÁLÁS: VoteCrudService ===

  /**
   * Új szavazás létrehozása (csak kapcsolattartó)
   */
  createPoll(request: CreatePollRequest, coverImage?: File, mediaFiles?: File[]): Observable<Poll> {
    return this.crudService.createPoll(request, coverImage, mediaFiles).pipe(
      tap(() => {
        this.loadPolls().subscribe();
      })
    );
  }

  /**
   * Szavazás módosítása (csak kapcsolattartó)
   */
  updatePoll(id: number, data: Partial<CreatePollRequest>, mediaFiles?: File[], deleteMediaIds?: number[]): Observable<void> {
    return this.crudService.updatePoll(id, data, mediaFiles, deleteMediaIds).pipe(
      tap(() => {
        this.loadPolls().subscribe();
      })
    );
  }

  /**
   * Szavazás törlése (csak kapcsolattartó)
   */
  deletePoll(id: number): Observable<void> {
    return this.crudService.deletePoll(id).pipe(
      tap(() => {
        this._polls.update(polls => polls.filter(p => p.id !== id));
      })
    );
  }

  // === STATE MANAGEMENT ===

  /**
   * Lokális poll state frissítése szavazat után
   */
  private updateLocalPollVotes(pollId: number, myVotes: number[]): void {
    this._polls.update(polls =>
      polls.map(poll =>
        poll.id === pollId ? { ...poll, myVotes } : poll
      )
    );

    const selected = this.selectedPoll();
    if (selected?.id === pollId) {
      this.selectedPoll.set({ ...selected, myVotes });
    }
  }

  /**
   * Hiba kezelés
   */
  private handleError(error: { error?: { message?: string; requires_class_size?: boolean }; status?: number }): Observable<never> {
    let message = 'Hiba történt. Próbáld újra!';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Nincs internetkapcsolat.';
    } else if (error.status === 422 && error.error?.requires_class_size) {
      message = 'Először állítsd be az osztálylétszámot!';
    }

    return throwError(() => new Error(message));
  }
}
