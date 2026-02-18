import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  ReactionsSummary,
} from './newsfeed.service';

/**
 * API válasz típus (snake_case) - belső használatra
 */
export interface ApiNewsfeedPost {
  id: number;
  post_type: 'announcement' | 'event';
  title: string;
  content: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  author_type: 'contact' | 'guest';
  author_name: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  user_reaction: string | null;
  reactions: ReactionsSummary;
  can_edit: boolean;
  can_delete: boolean;
  media: { id: number; url: string; file_name: string; is_image: boolean }[];
  created_at: string;
  updated_at: string;
}

/**
 * Newsfeed Post CRUD Service
 *
 * Poszt létrehozás, módosítás, törlés, média törlés.
 * Nyers ApiNewsfeedPost-ot ad vissza, a mapping a facade-ban történik.
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedPostCrudService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /**
   * Új poszt létrehozása
   * @returns Nyers API válasz (mapping a facade-ban)
   */
  createPost(request: CreatePostRequest, mediaFiles?: File[]): Observable<ApiNewsfeedPost> {
    if (mediaFiles && mediaFiles.length > 0) {
      const formData = new FormData();
      formData.append('post_type', request.postType);
      formData.append('title', request.title);
      if (request.content) formData.append('content', request.content);
      if (request.eventDate) formData.append('event_date', request.eventDate);
      if (request.eventTime) formData.append('event_time', request.eventTime);
      if (request.eventLocation) formData.append('event_location', request.eventLocation);
      mediaFiles.forEach(file => formData.append('media[]', file, file.name));

      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
        `${this.apiUrl}/newsfeed`, formData, { headers }
      ).pipe(
        map(response => response.data),
        catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
      );
    }

    return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed`,
      {
        post_type: request.postType, title: request.title, content: request.content,
        event_date: request.eventDate, event_time: request.eventTime, event_location: request.eventLocation
      },
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Poszt frissítése
   * @returns Nyers API válasz (mapping a facade-ban)
   */
  updatePost(id: number, request: UpdatePostRequest, mediaFiles?: File[]): Observable<ApiNewsfeedPost> {
    if (mediaFiles && mediaFiles.length > 0) {
      const formData = new FormData();
      if (request.title) formData.append('title', request.title);
      if (request.content !== undefined) formData.append('content', request.content || '');
      if (request.eventDate) formData.append('event_date', request.eventDate);
      if (request.eventTime) formData.append('event_time', request.eventTime);
      if (request.eventLocation) formData.append('event_location', request.eventLocation);
      mediaFiles.forEach(file => formData.append('media[]', file, file.name));

      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
        `${this.apiUrl}/newsfeed/${id}`, formData, { headers }
      ).pipe(
        map(response => response.data),
        catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
      );
    }

    return this.http.put<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed/${id}`,
      {
        title: request.title, content: request.content,
        event_date: request.eventDate, event_time: request.eventTime, event_location: request.eventLocation
      },
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Média törlése egy posztról
   */
  deleteMedia(mediaId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/media/${mediaId}`,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' }))));
  }

  /**
   * Poszt törlése
   */
  deletePost(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}`,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

}
