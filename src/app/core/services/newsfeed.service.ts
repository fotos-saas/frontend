import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, forkJoin, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { LoggerService } from './logger.service';

/**
 * Newsfeed Post típus
 */
export type PostType = 'announcement' | 'event';
export type AuthorType = 'contact' | 'guest';

/**
 * Newsfeed Media interfész
 */
export interface NewsfeedMedia {
  id: number;
  url: string;
  fileName: string;
  isImage: boolean;
}

/**
 * Newsfeed Comment interfész
 */
export interface NewsfeedComment {
  id: number;
  parentId: number | null;
  authorType: AuthorType;
  authorName: string;
  content: string;
  isEdited: boolean;
  canDelete: boolean;
  createdAt: string;
  /** Reakciók összesítése { emoji: count } */
  reactions?: ReactionsSummary;
  /** User jelenlegi reakciója (ha van) */
  userReaction?: string | null;
  /** Válaszok (nested comments) */
  replies?: NewsfeedComment[];
  /** Új komment jelzés (animációhoz) */
  isNew?: boolean;
}

/**
 * Reakciók összesítés
 */
export interface ReactionsSummary {
  [emoji: string]: number;
}

/**
 * Newsfeed Post interfész
 */
export interface NewsfeedPost {
  id: number;
  postType: PostType;
  title: string;
  content: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  authorType: AuthorType;
  authorName: string;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  /** User jelenlegi reakciója (ha van) */
  userReaction: string | null;
  /** Reakciók összesítése { emoji: count } */
  reactions: ReactionsSummary;
  canEdit: boolean;
  canDelete: boolean;
  media: NewsfeedMedia[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Newsfeed Post részletekkel (kommentekkel)
 */
export interface NewsfeedPostDetail extends NewsfeedPost {
  comments: NewsfeedComment[];
}

/**
 * Poszt létrehozás request
 */
export interface CreatePostRequest {
  postType: PostType;
  title: string;
  content?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}

/**
 * Poszt frissítés request
 */
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}

/**
 * Newsfeed szűrő
 */
export interface NewsfeedFilters {
  type?: PostType | null;
  search?: string;
  perPage?: number;
}

/**
 * API válasz típusok (snake_case)
 */
interface ApiNewsfeedMedia {
  id: number;
  url: string;
  file_name: string;
  is_image: boolean;
}

interface ApiNewsfeedComment {
  id: number;
  parent_id: number | null;
  author_type: AuthorType;
  author_name: string;
  content: string;
  is_edited: boolean;
  can_delete: boolean;
  created_at: string;
  reactions?: ReactionsSummary;
  user_reaction?: string | null;
  replies?: ApiNewsfeedComment[];
}

interface ApiNewsfeedPost {
  id: number;
  post_type: PostType;
  title: string;
  content: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  author_type: AuthorType;
  author_name: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  user_reaction: string | null;
  reactions: ReactionsSummary;
  can_edit: boolean;
  can_delete: boolean;
  media: ApiNewsfeedMedia[];
  created_at: string;
  updated_at: string;
  comments?: ApiNewsfeedComment[];
}

interface ApiPaginatedResponse<T> {
  current_page: number;
  data: T[];
  total: number;
  last_page: number;
  per_page: number;
}

/**
 * Newsfeed Service
 *
 * A hírfolyam rendszer service-e.
 * Kezeli a bejelentések és események listázását,
 * létrehozását, kommentelését, like-olását.
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly logger = inject(LoggerService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Betöltés állapot */
  readonly isLoading = signal<boolean>(false);

  /** Posztok cache */
  private postsCache$ = new BehaviorSubject<NewsfeedPost[]>([]);

  /** Aktuális szűrők */
  private currentFilters: NewsfeedFilters = {};

  /**
   * Posztok betöltése (opcionális szűréssel)
   */
  loadPosts(filters?: NewsfeedFilters): Observable<NewsfeedPost[]> {
    this.isLoading.set(true);
    this.currentFilters = filters || {};

    const params: Record<string, string> = {};
    if (filters?.type) {
      params['type'] = filters.type;
    }
    if (filters?.search) {
      params['search'] = filters.search;
    }
    if (filters?.perPage) {
      params['per_page'] = filters.perPage.toString();
    }

    return this.http.get<{ success: boolean; data: ApiPaginatedResponse<ApiNewsfeedPost> }>(
      `${this.apiUrl}/newsfeed`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => response.data.data.map(post => this.mapPost(post))),
      tap(posts => {
        this.postsCache$.next(posts);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Közelgő események lekérése
   */
  getUpcomingEvents(limit = 5): Observable<NewsfeedPost[]> {
    return this.http.get<{ success: boolean; data: ApiNewsfeedPost[] }>(
      `${this.apiUrl}/newsfeed/events/upcoming`,
      { headers: this.getHeaders(), params: { limit: limit.toString() } }
    ).pipe(
      map(response => response.data.map(post => this.mapPost(post))),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Egyetlen poszt részleteinek lekérése
   */
  getPost(id: number): Observable<NewsfeedPostDetail> {
    return this.http.get<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapPostDetail(response.data)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Új poszt létrehozása
   */
  createPost(request: CreatePostRequest, mediaFiles?: File[]): Observable<NewsfeedPost> {
    // FormData használata média fájlokhoz
    if (mediaFiles && mediaFiles.length > 0) {
      const formData = new FormData();
      formData.append('post_type', request.postType);
      formData.append('title', request.title);
      if (request.content) formData.append('content', request.content);
      if (request.eventDate) formData.append('event_date', request.eventDate);
      if (request.eventTime) formData.append('event_time', request.eventTime);
      if (request.eventLocation) formData.append('event_location', request.eventLocation);

      mediaFiles.forEach(file => {
        formData.append('media[]', file, file.name);
      });

      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
        `${this.apiUrl}/newsfeed`,
        formData,
        { headers }
      ).pipe(
        map(response => this.mapPost(response.data)),
        tap(post => this.addPostToCache(post)),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    // JSON request média nélkül
    return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed`,
      {
        post_type: request.postType,
        title: request.title,
        content: request.content,
        event_date: request.eventDate,
        event_time: request.eventTime,
        event_location: request.eventLocation
      },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapPost(response.data)),
      tap(post => this.addPostToCache(post)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Poszt frissítése (opcionális új média fájlokkal)
   */
  updatePost(id: number, request: UpdatePostRequest, mediaFiles?: File[]): Observable<NewsfeedPost> {
    // FormData használata ha van média
    if (mediaFiles && mediaFiles.length > 0) {
      const formData = new FormData();
      if (request.title) formData.append('title', request.title);
      if (request.content !== undefined) formData.append('content', request.content || '');
      if (request.eventDate) formData.append('event_date', request.eventDate);
      if (request.eventTime) formData.append('event_time', request.eventTime);
      if (request.eventLocation) formData.append('event_location', request.eventLocation);

      mediaFiles.forEach(file => {
        formData.append('media[]', file, file.name);
      });

      const headers = this.guestService.getGuestSessionHeader();
      // POST használata multipart/form-data-hoz
      return this.http.post<{ success: boolean; data: ApiNewsfeedPost }>(
        `${this.apiUrl}/newsfeed/${id}`,
        formData,
        { headers }
      ).pipe(
        map(response => this.mapPost(response.data)),
        tap(post => this.updatePostInCache(post)),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    // JSON request média nélkül
    return this.http.put<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed/${id}`,
      {
        title: request.title,
        content: request.content,
        event_date: request.eventDate,
        event_time: request.eventTime,
        event_location: request.eventLocation
      },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapPost(response.data)),
      tap(post => this.updatePostInCache(post)),
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
    ).pipe(
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Poszt törlése
   */
  deletePost(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.removePostFromCache(id)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Reakció toggle (emoji reakció hozzáadása/módosítása/eltávolítása)
   */
  toggleReaction(postId: number, reaction: string = '❤️'): Observable<{
    hasReacted: boolean;
    userReaction: string | null;
    reactions: ReactionsSummary;
    likesCount: number;
  }> {
    const headers = this.getHeaders();

    return this.http.post<{
      success: boolean;
      data: {
        liked: boolean;
        has_reacted: boolean;
        user_reaction: string | null;
        reactions: ReactionsSummary;
        likes_count: number;
      };
    }>(
      `${this.apiUrl}/newsfeed/${postId}/like`,
      { reaction },
      { headers }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted,
        userReaction: response.data.user_reaction,
        reactions: response.data.reactions,
        likesCount: response.data.likes_count
      })),
      tap(result => {
        this.updateReactionInCache(postId, result.hasReacted, result.userReaction, result.reactions, result.likesCount);
      }),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Like toggle (legacy - ❤️ reakció)
   * @deprecated Use toggleReaction() instead
   */
  toggleLike(postId: number): Observable<{ liked: boolean; likesCount: number }> {
    return this.toggleReaction(postId, '❤️').pipe(
      map(result => ({
        liked: result.hasReacted,
        likesCount: result.likesCount
      })),
      tap(result => {
        this.updateLikeInCache(postId, result.liked, result.likesCount);
      })
    );
  }

  /**
   * Poszt kitűzése (admin)
   */
  pinPost(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}/pin`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.updatePinInCache(id, true)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Poszt levétele (admin)
   */
  unpinPost(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/newsfeed/${id}/unpin`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.updatePinInCache(id, false)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Komment reakció toggle
   */
  toggleCommentReaction(commentId: number, reaction: string = '❤️'): Observable<{
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
      { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        hasReacted: response.data.has_reacted,
        userReaction: response.data.user_reaction,
        reactions: response.data.reactions,
        likesCount: response.data.likes_count
      })),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Kommentek lekérése
   */
  getComments(postId: number, perPage = 20): Observable<NewsfeedComment[]> {
    return this.http.get<{ success: boolean; data: ApiPaginatedResponse<ApiNewsfeedComment> }>(
      `${this.apiUrl}/newsfeed/${postId}/comments`,
      { headers: this.getHeaders(), params: { per_page: perPage.toString() } }
    ).pipe(
      map(response => response.data.data.map(c => this.mapComment(c))),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Komment létrehozása
   */
  createComment(postId: number, content: string, parentId?: number): Observable<NewsfeedComment> {
    const body: { content: string; parent_id?: number } = { content };
    if (parentId) {
      body.parent_id = parentId;
    }

    return this.http.post<{ success: boolean; data: ApiNewsfeedComment }>(
      `${this.apiUrl}/newsfeed/${postId}/comments`,
      body,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapComment(response.data)),
      tap(() => this.incrementCommentsInCache(postId)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Komment törlése
   */
  deleteComment(commentId: number, postId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/newsfeed-comments/${commentId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.decrementCommentsInCache(postId)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Cache-elt posztok lekérése
   */
  get posts$(): Observable<NewsfeedPost[]> {
    return this.postsCache$.asObservable();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * API post mappelése frontend formátumra
   */
  private mapPost(post: ApiNewsfeedPost): NewsfeedPost {
    return {
      id: post.id,
      postType: post.post_type,
      title: post.title,
      content: post.content,
      eventDate: post.event_date,
      eventTime: post.event_time,
      eventLocation: post.event_location,
      authorType: post.author_type,
      authorName: post.author_name || 'Ismeretlen',
      isPinned: post.is_pinned,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      hasLiked: post.has_liked,
      userReaction: post.user_reaction || null,
      reactions: post.reactions || {},
      canEdit: post.can_edit,
      canDelete: post.can_delete,
      media: (post.media || []).map(m => ({
        id: m.id,
        url: m.url,
        fileName: m.file_name,
        isImage: m.is_image
      })),
      createdAt: post.created_at,
      updatedAt: post.updated_at
    };
  }

  /**
   * API post mappelése részletekkel
   */
  private mapPostDetail(post: ApiNewsfeedPost): NewsfeedPostDetail {
    return {
      ...this.mapPost(post),
      comments: (post.comments || []).map(c => this.mapComment(c))
    };
  }

  /**
   * API comment mappelése frontend formátumra
   */
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

  /**
   * HTTP headers összeállítása
   */
  private getHeaders(): HttpHeaders {
    return this.guestService.getGuestSessionHeader();
  }

  /**
   * Poszt hozzáadása a cache-hez
   */
  private addPostToCache(post: NewsfeedPost): void {
    const current = this.postsCache$.getValue();
    // Kitűzött posztok elé, vagy a többi elé
    if (post.isPinned) {
      this.postsCache$.next([post, ...current]);
    } else {
      const pinnedPosts = current.filter(p => p.isPinned);
      const normalPosts = current.filter(p => !p.isPinned);
      this.postsCache$.next([...pinnedPosts, post, ...normalPosts]);
    }
  }

  /**
   * Poszt frissítése a cache-ben
   */
  private updatePostInCache(post: NewsfeedPost): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === post.id);
    if (index !== -1) {
      current[index] = post;
      this.postsCache$.next([...current]);
    }
  }

  /**
   * Poszt törlése a cache-ből
   */
  private removePostFromCache(id: number): void {
    const current = this.postsCache$.getValue();
    this.postsCache$.next(current.filter(p => p.id !== id));
  }

  /**
   * Like frissítése a cache-ben (legacy)
   */
  private updateLikeInCache(postId: number, liked: boolean, likesCount: number): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], hasLiked: liked, likesCount };
      this.postsCache$.next([...current]);
    }
  }

  /**
   * Reakció frissítése a cache-ben
   */
  private updateReactionInCache(
    postId: number,
    hasReacted: boolean,
    userReaction: string | null,
    reactions: ReactionsSummary,
    likesCount: number
  ): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = {
        ...current[index],
        hasLiked: hasReacted,
        userReaction,
        reactions,
        likesCount
      };
      this.postsCache$.next([...current]);
    }
  }

  /**
   * Pin frissítése a cache-ben
   */
  private updatePinInCache(postId: number, isPinned: boolean): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], isPinned };
      // Újra rendezés: kitűzöttek elöl
      const sorted = [...current].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      this.postsCache$.next(sorted);
    }
  }

  /**
   * Kommentek számának növelése a cache-ben
   */
  private incrementCommentsInCache(postId: number): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], commentsCount: current[index].commentsCount + 1 };
      this.postsCache$.next([...current]);
    }
  }

  /**
   * Kommentek számának csökkentése a cache-ben
   */
  private decrementCommentsInCache(postId: number): void {
    const current = this.postsCache$.getValue();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], commentsCount: Math.max(0, current[index].commentsCount - 1) };
      this.postsCache$.next([...current]);
    }
  }

  /**
   * Hiba kezelése
   */
  private handleError(error: any): Error {
    let message = 'Ismeretlen hiba történt';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'Nincs jogosultságod ehhez a művelethez';
    } else if (error.status === 403) {
      message = 'A hozzáférés megtagadva';
    } else if (error.status === 404) {
      message = 'A bejegyzés nem található';
    } else if (error.status === 422) {
      message = 'Érvénytelen adatok';
    } else if (error.status === 429) {
      message = 'Túl sok kérés, kérlek várj egy kicsit';
    }

    return new Error(message);
  }
}
