import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { LoggerService } from './logger.service';
import { NewsfeedPostCrudService } from './newsfeed-post-crud.service';
import { NewsfeedPostReactionsService } from './newsfeed-post-reactions.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import type { ApiNewsfeedPost as BaseApiNewsfeedPost } from './newsfeed-post-crud.service';
import type {
  NewsfeedPost,
  NewsfeedPostDetail,
  NewsfeedFilters,
  CreatePostRequest,
  UpdatePostRequest,
  ReactionsSummary,
} from './newsfeed.service';

/**
 * API válasz típusok (snake_case) - belső használatra
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

/** Kibővített API post típus kommentekkel (getPost részletekhez) */
interface ApiNewsfeedPost extends BaseApiNewsfeedPost {
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
 * Newsfeed Post Service (Facade)
 *
 * State management (signals, cache) + delegálás sub-service-ekre:
 * - NewsfeedPostCrudService: CRUD műveletek
 * - NewsfeedPostReactionsService: reakciók, pin/unpin
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedPostService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly logger = inject(LoggerService);
  private readonly crudService = inject(NewsfeedPostCrudService);
  private readonly reactionsService = inject(NewsfeedPostReactionsService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Betöltés állapot */
  readonly isLoading = signal<boolean>(false);

  /** Posztok cache */
  readonly postsCache = signal<NewsfeedPost[]>([]);

  /** Aktuális szűrők */
  private currentFilters: NewsfeedFilters = {};

  /**
   * Posztok betöltése (opcionális szűréssel)
   */
  loadPosts(filters?: NewsfeedFilters): Observable<NewsfeedPost[]> {
    this.isLoading.set(true);
    this.currentFilters = filters || {};

    const params: Record<string, string> = {};
    if (filters?.type) params['type'] = filters.type;
    if (filters?.search) params['search'] = filters.search;
    if (filters?.perPage) params['per_page'] = filters.perPage.toString();

    return this.http.get<{ success: boolean; data: ApiPaginatedResponse<ApiNewsfeedPost> }>(
      `${this.apiUrl}/newsfeed`,
      { headers: this.guestService.getGuestSessionHeader(), params }
    ).pipe(
      map(response => response.data.data.map(post => this.mapPost(post))),
      tap(posts => {
        this.postsCache.set(posts);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' }));
      })
    );
  }

  /**
   * Közelgő események lekérése
   */
  getUpcomingEvents(limit = 5): Observable<NewsfeedPost[]> {
    return this.http.get<{ success: boolean; data: ApiNewsfeedPost[] }>(
      `${this.apiUrl}/newsfeed/events/upcoming`,
      { headers: this.guestService.getGuestSessionHeader(), params: { limit: limit.toString() } }
    ).pipe(
      map(response => response.data.map(post => this.mapPost(post))),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  /**
   * Egyetlen poszt részleteinek lekérése
   */
  getPost(id: number): Observable<NewsfeedPostDetail> {
    return this.http.get<{ success: boolean; data: ApiNewsfeedPost }>(
      `${this.apiUrl}/newsfeed/${id}`,
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => this.mapPostDetail(response.data)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A bejegyzés nem található' })))
    );
  }

  // === DELEGÁLÁS: NewsfeedPostCrudService ===

  /**
   * Új poszt létrehozása
   */
  createPost(request: CreatePostRequest, mediaFiles?: File[]): Observable<NewsfeedPost> {
    return this.crudService.createPost(request, mediaFiles).pipe(
      map(apiPost => this.mapPost(apiPost)),
      tap(post => this.addPostToCache(post))
    );
  }

  /**
   * Poszt frissítése
   */
  updatePost(id: number, request: UpdatePostRequest, mediaFiles?: File[]): Observable<NewsfeedPost> {
    return this.crudService.updatePost(id, request, mediaFiles).pipe(
      map(apiPost => this.mapPost(apiPost)),
      tap(post => this.updatePostInCache(post))
    );
  }

  /**
   * Média törlése egy posztról
   */
  deleteMedia(mediaId: number): Observable<{ success: boolean }> {
    return this.crudService.deleteMedia(mediaId);
  }

  /**
   * Poszt törlése
   */
  deletePost(id: number): Observable<{ success: boolean }> {
    return this.crudService.deletePost(id).pipe(
      tap(() => this.removePostFromCache(id))
    );
  }

  // === DELEGÁLÁS: NewsfeedPostReactionsService ===

  /**
   * Reakció toggle
   */
  toggleReaction(postId: number, reaction: string = '\u2764\uFE0F'): Observable<{
    hasReacted: boolean; userReaction: string | null; reactions: ReactionsSummary; likesCount: number;
  }> {
    return this.reactionsService.toggleReaction(postId, reaction).pipe(
      tap(result => this.updateReactionInCache(postId, result.hasReacted, result.userReaction, result.reactions, result.likesCount))
    );
  }

  /**
   * Poszt kitűzése
   */
  pinPost(id: number): Observable<{ success: boolean }> {
    return this.reactionsService.pinPost(id).pipe(
      tap(() => this.updatePinInCache(id, true))
    );
  }

  /**
   * Poszt levétele
   */
  unpinPost(id: number): Observable<{ success: boolean }> {
    return this.reactionsService.unpinPost(id).pipe(
      tap(() => this.updatePinInCache(id, false))
    );
  }

  // === CACHE GETTERS ===

  /** Backward compat observable a postsCache signal-ból */
  readonly posts$ = toObservable(this.postsCache);

  // === CACHE UPDATE METHODS (comment service-nek is kell) ===

  incrementCommentsInCache(postId: number): void {
    const current = this.postsCache();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], commentsCount: current[index].commentsCount + 1 };
      this.postsCache.set([...current]);
    }
  }

  decrementCommentsInCache(postId: number): void {
    const current = this.postsCache();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], commentsCount: Math.max(0, current[index].commentsCount - 1) };
      this.postsCache.set([...current]);
    }
  }

  // === MAPPING ===

  mapPost(post: ApiNewsfeedPost): NewsfeedPost {
    return {
      id: post.id, postType: post.post_type, title: post.title, content: post.content,
      eventDate: post.event_date, eventTime: post.event_time, eventLocation: post.event_location,
      authorType: post.author_type, authorName: post.author_name || 'Ismeretlen',
      isPinned: post.is_pinned, likesCount: post.likes_count, commentsCount: post.comments_count,
      hasLiked: post.has_liked, userReaction: post.user_reaction || null, reactions: post.reactions || {},
      canEdit: post.can_edit, canDelete: post.can_delete,
      media: (post.media || []).map(m => ({ id: m.id, url: m.url, fileName: m.file_name, isImage: m.is_image })),
      createdAt: post.created_at, updatedAt: post.updated_at
    };
  }

  private mapPostDetail(post: ApiNewsfeedPost): NewsfeedPostDetail {
    return {
      ...this.mapPost(post),
      comments: (post.comments || []).map(c => this.mapComment(c))
    };
  }

  private mapComment(comment: ApiNewsfeedComment): import('./newsfeed.service').NewsfeedComment {
    return {
      id: comment.id, parentId: comment.parent_id, authorType: comment.author_type,
      authorName: comment.author_name || 'Ismeretlen', content: comment.content,
      isEdited: comment.is_edited, canDelete: comment.can_delete, createdAt: comment.created_at,
      reactions: comment.reactions || {}, userReaction: comment.user_reaction || null,
      replies: comment.replies?.map(r => this.mapComment(r)) || []
    };
  }

  // === PRIVATE CACHE METHODS ===

  private addPostToCache(post: NewsfeedPost): void {
    const current = this.postsCache();
    if (post.isPinned) {
      this.postsCache.set([post, ...current]);
    } else {
      const pinnedPosts = current.filter(p => p.isPinned);
      const normalPosts = current.filter(p => !p.isPinned);
      this.postsCache.set([...pinnedPosts, post, ...normalPosts]);
    }
  }

  private updatePostInCache(post: NewsfeedPost): void {
    const current = this.postsCache();
    const index = current.findIndex(p => p.id === post.id);
    if (index !== -1) {
      current[index] = post;
      this.postsCache.set([...current]);
    }
  }

  private removePostFromCache(id: number): void {
    const current = this.postsCache();
    this.postsCache.set(current.filter(p => p.id !== id));
  }

  private updateReactionInCache(
    postId: number, hasReacted: boolean, userReaction: string | null,
    reactions: ReactionsSummary, likesCount: number
  ): void {
    const current = this.postsCache();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], hasLiked: hasReacted, userReaction, reactions, likesCount };
      this.postsCache.set([...current]);
    }
  }

  private updatePinInCache(postId: number, isPinned: boolean): void {
    const current = this.postsCache();
    const index = current.findIndex(p => p.id === postId);
    if (index !== -1) {
      current[index] = { ...current[index], isPinned };
      const sorted = [...current].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      this.postsCache.set(sorted);
    }
  }

}
