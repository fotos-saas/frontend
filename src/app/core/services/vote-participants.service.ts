import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleVotingError } from '../../shared/utils/http-error.util';
import { VOTING_API } from '../../features/voting/voting.constants';

/** Participant (résztvevő) interface */
export interface Participant {
  id: number;
  guestName: string;
  guestEmail: string | null;
  isBanned: boolean;
  isExtra: boolean;
  lastActivityAt: string | null;
  createdAt: string;
  votesCount: number;
}

/** Participant statistics interface */
export interface ParticipantStatistics {
  total: number;
  active: number;
  banned: number;
  extraCount: number;
  regularCount: number;
  active24h: number;
  expectedClassSize: number | null;
  participationRate: number | null;
}

/** Participants API response */
export interface ParticipantsResponse {
  success: boolean;
  data: Participant[];
  statistics: ParticipantStatistics;
  currentGuestId: number | null;
}

/**
 * Vote Participants Service
 *
 * Szavazás résztvevők kezelése:
 * - Résztvevők listázása
 * - Extra jelölés kezelése
 * - Statisztikák
 */
@Injectable({
  providedIn: 'root'
})
export class VoteParticipantsService {
  constructor(
    private http: HttpClient,
    private guestService: GuestService
  ) {}

  /**
   * Résztvevők listázása (mindenki láthatja)
   */
  getParticipants(): Observable<ParticipantsResponse> {
    return this.http.get<{
      success: boolean;
      data: Array<{
        id: number;
        guest_name: string;
        guest_email: string | null;
        is_banned: boolean;
        is_extra: boolean;
        last_activity_at: string | null;
        created_at: string;
        votes_count: number;
      }>;
      statistics: {
        total: number;
        active: number;
        banned: number;
        extra_count: number;
        regular_count: number;
        active_24h: number;
        expected_class_size: number | null;
        participation_rate: number | null;
      };
      current_guest_id: number | null;
    }>(
      `${environment.apiUrl}${VOTING_API.PARTICIPANTS}`,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Hiba a résztvevők betöltésekor');
        }
        return {
          success: true,
          data: response.data.map(p => ({
            id: p.id,
            guestName: p.guest_name,
            guestEmail: p.guest_email,
            isBanned: p.is_banned,
            isExtra: p.is_extra,
            lastActivityAt: p.last_activity_at,
            createdAt: p.created_at,
            votesCount: p.votes_count
          })),
          statistics: {
            total: response.statistics.total,
            active: response.statistics.active,
            banned: response.statistics.banned,
            extraCount: response.statistics.extra_count,
            regularCount: response.statistics.regular_count,
            active24h: response.statistics.active_24h,
            expectedClassSize: response.statistics.expected_class_size,
            participationRate: response.statistics.participation_rate
          },
          currentGuestId: response.current_guest_id ?? null
        };
      }),
      catchError(error => throwError(() => handleVotingError(error)))
    );
  }

  /**
   * Extra jelölés toggle (csak kapcsolattartó)
   */
  toggleExtra(guestId: number): Observable<{ isExtra: boolean }> {
    return this.http.put<{ success: boolean; message: string; is_extra: boolean }>(
      `${environment.apiUrl}${VOTING_API.toggleExtra(guestId)}`,
      {}
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return { isExtra: response.is_extra };
      }),
      catchError(error => throwError(() => handleVotingError(error)))
    );
  }

}
