import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { VOTING_API } from '../../features/voting/voting.constants';
import {
  PollResults,
  VoteResponse,
  ApiResultsResponse
} from '../models/voting.models';
import { mapResultsFromApi } from '../helpers/vote-mappers';

/**
 * Vote Actions Service
 *
 * Szavazás műveletek:
 * - Szavazat leadás/visszavonás
 * - Eredmények lekérése
 * - Szavazás lezárás/újranyitás
 * - Osztálylétszám beállítás
 */
@Injectable({
  providedIn: 'root'
})
export class VoteActionsService {
  constructor(
    private http: HttpClient,
    private guestService: GuestService
  ) {}

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
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazat visszavonása
   */
  removeVote(pollId: number, optionId?: number): Observable<{ success: boolean; message: string; data?: { my_votes: number[] } }> {
    const body = optionId ? { option_id: optionId } : {};

    return this.http.request<{ success: boolean; message: string; data?: { my_votes: number[] } }>(
      'DELETE',
      `${environment.apiUrl}${VOTING_API.vote(pollId)}`,
      { body, headers: this.getHeaders() }
    ).pipe(
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

  // === PRIVATE ===

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const sessionToken = this.guestService.getSessionToken();
    if (sessionToken) {
      headers = headers.set('X-Guest-Session', sessionToken);
    }
    return headers;
  }

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
