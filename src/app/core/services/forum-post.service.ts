import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import type {
  DiscussionPost,
  CreatePostRequest,
  PostMedia,
  ReactionsSummary,
} from './forum.service';
import { type ApiForumPost, type ApiForumMedia, mapApiPostToDiscussionPost, mapApiMediaToPostMedia } from '../models/forum-api.types';

/**
 * Forum Post Service
 *
 * Hozzászólások CRUD, reakciók, like toggle.
 */
@Injectable({
  providedIn: 'root'
})
export class ForumPostService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /**
   * Hozzászólás írása (opcionális média fájlokkal)
   */
  createPost(discussionId: number, request: CreatePostRequest): Observable<DiscussionPost> {
    if (request.media && request.media.length > 0) {
      const formData = new FormData();
      formData.append('content', request.content);
      if (request.parentId) formData.append('parent_id', request.parentId.toString());
      request.media.forEach(file => formData.append('media[]', file, file.name));

      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ data: ApiForumPost }>(
        `${this.apiUrl}/discussions/${discussionId}/posts`, formData, { headers }
      ).pipe(
        map(response => mapApiPostToDiscussionPost(response.data)),
        catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
      );
    }

    return this.http.post<{ data: ApiForumPost }>(
      `${this.apiUrl}/discussions/${discussionId}/posts`,
      { content: request.content, parent_id: request.parentId },
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => mapApiPostToDiscussionPost(response.data)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Hozzászólás szerkesztése (15 perc limit)
   */
  updatePost(
    postId: number, content: string,
    newMedia?: File[], deleteMediaIds?: number[]
  ): Observable<{ media: PostMedia[] }> {
    if ((newMedia && newMedia.length > 0) || (deleteMediaIds && deleteMediaIds.length > 0)) {
      const formData = new FormData();
      formData.append('content', content);
      if (newMedia && newMedia.length > 0) {
        newMedia.forEach(file => formData.append('media[]', file, file.name));
      }
      if (deleteMediaIds && deleteMediaIds.length > 0) {
        deleteMediaIds.forEach((id, index) => formData.append(`delete_media[${index}]`, id.toString()));
      }

      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ success: boolean; data: { media: ApiForumMedia[] }; message: string }>(
        `${this.apiUrl}/posts/${postId}`, formData,
        { headers, params: { '_method': 'PUT' } }
      ).pipe(
        map(response => ({
          media: (response.data?.media || []).map(m => mapApiMediaToPostMedia(m))
        })),
        catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
      );
    }

    return this.http.put<{ success: boolean; data: { media: ApiForumMedia[] }; message: string }>(
      `${this.apiUrl}/posts/${postId}`, { content }, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => ({
        media: (response.data?.media || []).map(m => mapApiMediaToPostMedia(m))
      })),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Hozzászólás törlése
   */
  deletePost(postId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/posts/${postId}`, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' }))));
  }

  /**
   * Reakció toggle
   */
  toggleReaction(postId: number, reaction: string = '\u2764\uFE0F'): Observable<{
    hasReacted: boolean; userReaction: string | null; reactions: ReactionsSummary; likesCount: number;
  }> {
    return this.http.post<{
      success: boolean; data: { has_reacted: boolean; user_reaction: string | null; reactions: ReactionsSummary; likes_count: number; };
    }>(
      `${this.apiUrl}/posts/${postId}/like`, { reaction }, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted, userReaction: response.data.user_reaction,
        reactions: response.data.reactions, likesCount: response.data.likes_count
      })),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

}
