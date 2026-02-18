import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import type { ReactionsSummary } from './newsfeed.service';

/**
 * Newsfeed Post Reactions Service
 *
 * Poszt reakciók (like/emoji) és pin/unpin kezelés.
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedPostReactionsService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /**
   * Reakció toggle
   */
  toggleReaction(postId: number, reaction: string = '\u2764\uFE0F'): Observable<{
    hasReacted: boolean; userReaction: string | null; reactions: ReactionsSummary; likesCount: number;
  }> {
    return this.http.post<{
      success: boolean; data: { liked: boolean; has_reacted: boolean; user_reaction: string | null; reactions: ReactionsSummary; likes_count: number; };
    }>(
      `${this.apiUrl}/newsfeed/${postId}/like`, { reaction }, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted, userReaction: response.data.user_reaction,
        reactions: response.data.reactions, likesCount: response.data.likes_count
      })),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Poszt kitűzése
   */
  pinPost(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}/pin`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Poszt levétele
   */
  unpinPost(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}/unpin`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

}
