import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { HttpError } from '../../shared/types/http-error.types';
import type {
  DiscussionPost,
  CreatePostRequest,
  PostMedia,
  ReactionsSummary,
} from './forum.service';

/**
 * API típusok (belső)
 */
interface ApiPost {
  id: number;
  author_name: string;
  is_author_contact: boolean;
  content: string;
  mentions: string[];
  is_edited: boolean;
  edited_at?: string;
  likes_count: number;
  is_liked: boolean;
  user_reaction: string | null;
  reactions: ReactionsSummary;
  can_edit: boolean;
  can_delete: boolean;
  parent_id?: number;
  replies: ApiPost[];
  media: ApiMedia[];
  created_at: string;
}

interface ApiMedia {
  id: number;
  url: string;
  file_name?: string;
  fileName?: string;
  is_image?: boolean;
  isImage?: boolean;
}

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
      return this.http.post<{ data: ApiPost }>(
        `${this.apiUrl}/discussions/${discussionId}/posts`, formData, { headers }
      ).pipe(
        map(response => this.mapPost(response.data)),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    return this.http.post<{ data: ApiPost }>(
      `${this.apiUrl}/discussions/${discussionId}/posts`,
      { content: request.content, parent_id: request.parentId },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapPost(response.data)),
      catchError(error => throwError(() => this.handleError(error)))
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
      return this.http.post<{ success: boolean; data: { media: ApiMedia[] }; message: string }>(
        `${this.apiUrl}/posts/${postId}`, formData,
        { headers, params: { '_method': 'PUT' } }
      ).pipe(
        map(response => ({
          media: (response.data?.media || []).map(m => ({
            id: m.id, url: m.url,
            fileName: m.file_name || m.fileName || 'file',
            isImage: m.is_image || m.isImage || false
          }))
        })),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    return this.http.put<{ success: boolean; data: { media: ApiMedia[] }; message: string }>(
      `${this.apiUrl}/posts/${postId}`, { content }, { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        media: (response.data?.media || []).map(m => ({
          id: m.id, url: m.url,
          fileName: m.file_name || m.fileName || 'file',
          isImage: m.is_image || m.isImage || false
        }))
      })),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Hozzászólás törlése
   */
  deletePost(postId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/posts/${postId}`, { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(() => this.handleError(error))));
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
      `${this.apiUrl}/posts/${postId}/like`, { reaction }, { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted, userReaction: response.data.user_reaction,
        reactions: response.data.reactions, likesCount: response.data.likes_count
      })),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  // === PRIVATE ===

  private mapPost(post: ApiPost): DiscussionPost {
    return {
      id: post.id, discussionId: 0, parentId: post.parent_id,
      authorType: post.is_author_contact ? 'contact' : 'guest',
      authorName: post.author_name || 'Ismeretlen',
      content: post.content, mentions: post.mentions || [],
      isEdited: post.is_edited, editedAt: post.edited_at,
      likesCount: post.likes_count, hasLiked: post.is_liked,
      userReaction: post.user_reaction || null, reactions: post.reactions || {},
      canEdit: post.can_edit, canDelete: post.can_delete,
      createdAt: post.created_at,
      replies: (post.replies || []).map(r => this.mapPost(r)),
      media: (post.media || []).map(m => ({
        id: m.id, url: m.url,
        fileName: m.file_name || m.fileName || 'file',
        isImage: m.is_image || m.isImage || false
      }))
    };
  }

  private getHeaders(): HttpHeaders {
    return this.guestService.getGuestSessionHeader();
  }

  private handleError(error: HttpError): Error {
    let message = 'Ismeretlen hiba történt';
    if (error.error?.message) message = error.error.message;
    else if (error.status === 401) message = 'Nincs jogosultságod ehhez a művelethez';
    else if (error.status === 403) message = 'A hozzáférés megtagadva';
    else if (error.status === 404) message = 'A beszélgetés nem található';
    else if (error.status === 422) message = 'Érvénytelen adatok';
    else if (error.status === 429) message = 'Túl sok kérés, kérlek várj egy kicsit';
    return new Error(message);
  }
}
