import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
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
 * Voting Service
 *
 * Szavazás kezelés:
 * - Szavazások listázása
 * - Szavazat leadás/visszavonás
 * - Eredmények lekérése
 * - Szavazás CRUD (kapcsolattartónak)
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
    private guestService: GuestService
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

  /**
   * Szavazás eredményeinek lekérése
   */
  getResults(pollId: number): Observable<PollResults> {
    return this.http.get<{ success: boolean; data: ApiResultsResponse }>(
      `${environment.apiUrl}${VOTING_API.results(pollId)}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Eredmények nem elérhetőek');
        }
        return mapResultsFromApi(response.data);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazat leadása
   */
  vote(pollId: number, optionId: number): Observable<VoteResponse> {
    return this.http.post<{ success: boolean; message: string; data?: {
      vote_id: number;
      my_votes: number[];
      can_vote_more: boolean;
    }}>(
      `${environment.apiUrl}${VOTING_API.vote(pollId)}`,
      { option_id: optionId },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        success: response.success,
        message: response.message,
        data: response.data ? {
          voteId: response.data.vote_id,
          myVotes: response.data.my_votes,
          canVoteMore: response.data.can_vote_more
        } : undefined
      })),
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalPollVotes(pollId, response.data.myVotes);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazat visszavonása
   */
  removeVote(pollId: number, optionId?: number): Observable<{ success: boolean; message: string }> {
    const body = optionId ? { option_id: optionId } : {};

    return this.http.request<{ success: boolean; message: string; data?: { my_votes: number[] } }>(
      'DELETE',
      `${environment.apiUrl}${VOTING_API.vote(pollId)}`,
      { body, headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalPollVotes(pollId, response.data.my_votes);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // === KAPCSOLATTARTÓ FUNKCIÓK ===

  /**
   * Új szavazás létrehozása (csak kapcsolattartó)
   * FormData-t használ ha van kép
   */
  createPoll(request: CreatePollRequest, coverImage?: File, mediaFiles?: File[]): Observable<Poll> {
    const formData = new FormData();

    // Alap mezők
    formData.append('title', request.title);
    formData.append('type', request.type);

    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.is_multiple_choice !== undefined) {
      formData.append('is_multiple_choice', request.is_multiple_choice ? '1' : '0');
    }
    if (request.max_votes_per_guest !== undefined) {
      formData.append('max_votes_per_guest', request.max_votes_per_guest.toString());
    }
    if (request.show_results_before_vote !== undefined) {
      formData.append('show_results_before_vote', request.show_results_before_vote ? '1' : '0');
    }
    if (request.close_at) {
      formData.append('close_at', request.close_at);
    }

    // Opciók
    if (request.options) {
      request.options.forEach((option, index) => {
        formData.append(`options[${index}][label]`, option.label);
        if (option.description) {
          formData.append(`options[${index}][description]`, option.description);
        }
      });
    }

    // Borítókép (legacy support)
    if (coverImage) {
      formData.append('cover_image', coverImage, coverImage.name);
    }

    // Média fájlok (max 5, 10MB/kép)
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file, file.name);
      });
    }

    return this.http.post<{ success: boolean; message: string; data: ApiPollResponse }>(
      `${environment.apiUrl}${VOTING_API.POLLS}`,
      formData
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return mapPollFromApi(response.data);
      }),
      tap(() => {
        this.loadPolls().subscribe();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás módosítása (csak kapcsolattartó)
   */
  updatePoll(id: number, data: Partial<CreatePollRequest>, mediaFiles?: File[], deleteMediaIds?: number[]): Observable<void> {
    const formData = new FormData();

    // Alap mezők
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description || '');
    }
    if (data.is_multiple_choice !== undefined) {
      formData.append('is_multiple_choice', data.is_multiple_choice ? '1' : '0');
    }
    if (data.max_votes_per_guest !== undefined) {
      formData.append('max_votes_per_guest', data.max_votes_per_guest.toString());
    }
    if (data.show_results_before_vote !== undefined) {
      formData.append('show_results_before_vote', data.show_results_before_vote ? '1' : '0');
    }
    if (data.close_at !== undefined) {
      formData.append('close_at', data.close_at || '');
    }

    // Média fájlok törlése
    if (deleteMediaIds && deleteMediaIds.length > 0) {
      deleteMediaIds.forEach((mediaId, index) => {
        formData.append(`delete_media_ids[${index}]`, mediaId.toString());
      });
    }

    // Új média fájlok
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file, file.name);
      });
    }

    // Laravel PUT method spoofing
    formData.append('_method', 'PUT');

    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.poll(id)}`,
      formData
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      tap(() => {
        this.loadPolls().subscribe();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás törlése (csak kapcsolattartó)
   */
  deletePoll(id: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.poll(id)}`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      tap(() => {
        this._polls.update(polls => polls.filter(p => p.id !== id));
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Osztálylétszám beállítása (csak kapcsolattartó)
   */
  setClassSize(classSize: number): Observable<{ expected_class_size: number }> {
    return this.http.put<{ success: boolean; message: string; data: { expected_class_size: number } }>(
      `${environment.apiUrl}${VOTING_API.CLASS_SIZE}`,
      { expected_class_size: classSize }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return response.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás lezárása (csak kapcsolattartó)
   */
  closePoll(pollId: number): Observable<void> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.close(pollId)}`,
      {}
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      tap(() => {
        this._polls.update(polls =>
          polls.map(poll =>
            poll.id === pollId ? { ...poll, isActive: false, isOpen: false } : poll
          )
        );
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás újranyitása (csak kapcsolattartó)
   */
  reopenPoll(pollId: number, closeAt?: string): Observable<void> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.reopen(pollId)}`,
      { close_at: closeAt }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      tap(() => {
        this._polls.update(polls =>
          polls.map(poll =>
            poll.id === pollId ? { ...poll, isActive: true, isOpen: true, closeAt: closeAt ?? null } : poll
          )
        );
      }),
      catchError(this.handleError.bind(this))
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
