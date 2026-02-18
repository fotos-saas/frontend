import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import { NewsfeedPostService } from './newsfeed-post.service';
import type { NewsfeedComment, ReactionsSummary } from './newsfeed.service';

/**
 * API comment (snake_case)
 */
interface ApiNewsfeedComment {
  id: number;
  parent_id: number | null;
  author_type: 'contact' | 'guest';
  author_name: string;
  content: string;
  is_edited: boolean;
  can_delete: boolean;
  created_at: string;
  reactions?: ReactionsSummary;
  user_reaction?: string | null;
  replies?: ApiNewsfeedComment[];
}

interface ApiPaginatedResponse<T> {
  current_page: number;
  data: T[];
  total: number;
  last_page: number;
  per_page: number;
}

/**
 * Newsfeed Comment Service
 *
 * Kommentek CRUD, komment reakciók.
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedCommentService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly postService = inject(NewsfeedPostService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /**
   * Komment reakció toggle
   */
  toggleCommentReaction(commentId: number, reaction: string = '\u2764\uFE0F'): Observable<{
    hasReacted: boolean;
    userReaction: string | null;
    reactions: ReactionsSummary;
    likesCount: number;
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        has_reacted: boolean;
        user_reaction: string | null;
        reactions: ReactionsSummary;
        likes_count: number;
      };
    }>(
      `${this.apiUrl}/newsfeed-comments/${commentId}/like`,
      { reaction },
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted,
        userReaction: response.data.user_reaction,
        reactions: response.data.reactions,
        likesCount: response.data.likes_count
      })),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Kommentek lekérése
   */
  getComments(postId: number, perPage = 20): Observable<NewsfeedComment[]> {
    return this.http.get<{ success: boolean; data: ApiPaginatedResponse<ApiNewsfeedComment> }>(
      `${this.apiUrl}/newsfeed/${postId}/comments`,
      { headers: this.guestService.getGuestSessionHeader(), params: { per_page: perPage.toString() } }
    ).pipe(
      map(response => response.data.data.map(c => this.mapComment(c))),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Komment létrehozása
   */
  createComment(postId: number, content: string, parentId?: number): Observable<NewsfeedComment> {
    const body: { content: string; parent_id?: number } = { content };
    if (parentId) body.parent_id = parentId;

    return this.http.post<{ success: boolean; data: ApiNewsfeedComment }>(
      `${this.apiUrl}/newsfeed/${postId}/comments`,
      body,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => this.mapComment(response.data)),
      tap(() => this.postService.incrementCommentsInCache(postId)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Komment törlése
   */
  deleteComment(commentId: number, postId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed-comments/${commentId}`,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      tap(() => this.postService.decrementCommentsInCache(postId)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  // === PRIVATE ===

  private mapComment(comment: ApiNewsfeedComment): NewsfeedComment {
    return {
      id: comment.id,
      parentId: comment.parent_id,
      authorType: comment.author_type,
      authorName: comment.author_name || 'Ismeretlen',
      content: comment.content,
      isEdited: comment.is_edited,
      canDelete: comment.can_delete,
      createdAt: comment.created_at,
      reactions: comment.reactions || {},
      userReaction: comment.user_reaction || null,
      replies: comment.replies?.map(r => this.mapComment(r)) || []
    };
  }

}
