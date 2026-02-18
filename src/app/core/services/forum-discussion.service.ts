import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { handleHttpError } from '../../shared/utils/http-error.util';
import type {
  Discussion,
  DiscussionDetail,
  DiscussionFilters,
  CreateDiscussionRequest,
} from './forum.service';
import { type ApiForumPost, mapApiPostToDiscussionPost } from '../models/forum-api.types';

/**
 * API valasz tipusok (snake_case) - discussion specifikus
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

interface ApiPaginatedPosts {
  current_page: number;
  data: ApiForumPost[];
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
      { headers: this.guestService.getGuestSessionHeader(), params }
    ).pipe(
      map(response => response.data.map(item => this.mapDiscussionListItem(item))),
      tap(discussions => {
        this.discussionsCache.set(discussions);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' }));
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
      { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => this.mapDiscussionDetail(response.data)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Új beszélgetés létrehozása
   */
  createDiscussion(request: CreateDiscussionRequest): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions`, request, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(discussion => {
        const current = this.discussionsCache();
        this.discussionsCache.set([discussion, ...current]);
      }),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Beszélgetés lezárása
   */
  lockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/lock`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Beszélgetés feloldása
   */
  unlockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unlock`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Beszélgetés kitűzése
   */
  pinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/pin`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
    );
  }

  /**
   * Beszélgetés kitűzés megszüntetése
   */
  unpinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unpin`, {}, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
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
      `${this.apiUrl}/discussions/${id}`, body, { headers: this.guestService.getGuestSessionHeader() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => handleHttpError(error, { notFoundMessage: 'A beszélgetés nem található' })))
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
      posts: posts.map(post => mapApiPostToDiscussionPost(post))
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

}
