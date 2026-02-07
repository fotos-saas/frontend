import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { HttpError } from '../../shared/types/http-error.types';
import type {
  Discussion,
  DiscussionDetail,
  DiscussionFilters,
  CreateDiscussionRequest,
  DiscussionPost,
  ReactionsSummary,
} from './forum.service';

/**
 * API válasz típusok (snake_case)
 */
interface ApiDiscussion {
  id: number;
  title: string;
  slug: string;
  creator_name: string;
  is_creator_contact: boolean;
  template_id?: number;
  template_name?: string;
  is_pinned: boolean;
  is_locked: boolean;
  can_add_posts: boolean;
  posts_count: number;
  views_count: number;
  created_at: string;
}

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

interface ApiPaginatedPosts {
  current_page: number;
  data: ApiPost[];
  total: number;
}

interface ApiDiscussionListItem {
  id: number;
  title: string;
  slug: string;
  creator_name: string;
  is_creator_contact: boolean;
  template_id?: number;
  template_name?: string;
  is_pinned: boolean;
  is_locked: boolean;
  posts_count: number;
  views_count: number;
  last_post_at?: string;
  last_post_by?: string;
  created_at: string;
}

/**
 * Forum Discussion Service
 *
 * Beszélgetések listázása, létrehozása, lezárása, kitűzése,
 * részletek lekérése, cache kezelés.
 */
@Injectable({
  providedIn: 'root'
})
export class ForumDiscussionService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Betöltés állapot */
  readonly isLoading = signal<boolean>(false);

  /** Beszélgetések cache */
  readonly discussionsCache = signal<Discussion[]>([]);

  /**
   * Beszélgetések betöltése
   */
  loadDiscussions(filters?: DiscussionFilters): Observable<Discussion[]> {
    this.isLoading.set(true);

    const params: Record<string, string> = {};
    if (filters?.search) params['search'] = filters.search;
    if (filters?.templateId) params['template_id'] = filters.templateId.toString();
    if (filters?.sortBy && filters.sortBy !== 'latest') params['sort_by'] = filters.sortBy;

    return this.http.get<{ data: ApiDiscussionListItem[] }>(
      `${this.apiUrl}/discussions`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => response.data.map(item => this.mapDiscussionListItem(item))),
      tap(discussions => {
        this.discussionsCache.set(discussions);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Beszélgetés részleteinek lekérése hozzászólásokkal
   */
  getDiscussion(slug: string): Observable<DiscussionDetail> {
    return this.http.get<{
      success: boolean;
      data: { discussion: ApiDiscussion; posts: ApiPaginatedPosts };
    }>(
      `${this.apiUrl}/discussions/${slug}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapDiscussionDetail(response.data)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Új beszélgetés létrehozása
   */
  createDiscussion(request: CreateDiscussionRequest): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions`, request, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(discussion => {
        const current = this.discussionsCache();
        this.discussionsCache.set([discussion, ...current]);
      }),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés lezárása
   */
  lockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/lock`, {}, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés feloldása
   */
  unlockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unlock`, {}, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés kitűzése
   */
  pinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/pin`, {}, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés kitűzés megszüntetése
   */
  unpinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unpin`, {}, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés szerkesztése
   */
  updateDiscussion(id: number, data: { title?: string; templateId?: number | null }): Observable<Discussion> {
    const body: Record<string, unknown> = {};
    if (data.title) body['title'] = data.title;
    if (data.templateId !== undefined) body['template_id'] = data.templateId;

    return this.http.put<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}`, body, { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  // === PRIVATE ===

  private mapDiscussionListItem(item: ApiDiscussionListItem): Discussion {
    return {
      id: item.id, title: item.title, slug: item.slug,
      templateId: item.template_id, templateName: item.template_name,
      isPinned: item.is_pinned, isLocked: item.is_locked,
      postsCount: item.posts_count, viewsCount: item.views_count,
      creatorType: item.is_creator_contact ? 'contact' : 'guest',
      creatorName: item.creator_name || 'Ismeretlen',
      createdAt: item.created_at,
      lastPostAt: item.last_post_at, lastPostBy: item.last_post_by
    };
  }

  private mapDiscussionDetail(data: { discussion: ApiDiscussion; posts: ApiPaginatedPosts }): DiscussionDetail {
    const d = data.discussion;
    const posts = data.posts.data || [];
    return {
      id: d.id, title: d.title, slug: d.slug,
      templateId: d.template_id, templateName: d.template_name,
      isPinned: d.is_pinned, isLocked: d.is_locked,
      postsCount: d.posts_count, viewsCount: d.views_count,
      creatorType: d.is_creator_contact ? 'contact' : 'guest',
      creatorName: d.creator_name || 'Ismeretlen',
      createdAt: d.created_at,
      posts: posts.map(post => this.mapPost(post))
    };
  }

  mapPost(post: ApiPost): DiscussionPost {
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

  updateDiscussionInCache(updated: Discussion): void {
    const current = this.discussionsCache();
    const index = current.findIndex(d => d.id === updated.id);
    if (index !== -1) {
      current[index] = updated;
      this.discussionsCache.set([...current]);
    }
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
