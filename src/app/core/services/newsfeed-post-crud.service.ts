import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { HttpError } from '../../shared/types/http-error.types';
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
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed`,
      {
        post_type: request.postType, title: request.title, content: request.content,
        event_date: request.eventDate, event_time: request.eventTime, event_location: request.eventLocation
      },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => this.handleError(error)))
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
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    return this.http.put<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed/${id}`,
      {
        title: request.title, content: request.content,
        event_date: request.eventDate, event_time: request.eventTime, event_location: request.eventLocation
      },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Média törlése egy posztról
   */
  deleteMedia(mediaId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/media/${mediaId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(() => this.handleError(error))));
  }

  /**
   * Poszt törlése
   */
  deletePost(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  // === PRIVATE ===

  private getHeaders(): HttpHeaders {
    return this.guestService.getGuestSessionHeader();
  }

  private handleError(error: HttpError): Error {
    let message = 'Ismeretlen hiba történt';
    if (error.error?.message) message = error.error.message;
    else if (error.status === 401) message = 'Nincs jogosultságod ehhez a művelethez';
    else if (error.status === 403) message = 'A hozzáférés megtagadva';
    else if (error.status === 404) message = 'A bejegyzés nem található';
    else if (error.status === 422) message = 'Érvénytelen adatok';
    else if (error.status === 429) message = 'Túl sok kérés, kérlek várj egy kicsit';
    return new Error(message);
  }
}
