import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';

/**
 * Discussion (Beszélgetés) interfész
 */
export interface Discussion {
  id: number;
  title: string;
  slug: string;
  templateId?: number;
  templateName?: string;
  isPinned: boolean;
  isLocked: boolean;
  postsCount: number;
  viewsCount: number;
  creatorType: 'contact' | 'guest';
  creatorName: string;
  createdAt: string;
  lastPostAt?: string;
  lastPostBy?: string;
}

/**
 * Reakciók összesítés
 */
export interface ReactionsSummary {
  [emoji: string]: number;
}

/**
 * Discussion Post (Hozzászólás) interfész
 */
export interface DiscussionPost {
  id: number;
  discussionId: number;
  parentId?: number;
  authorType: 'contact' | 'guest';
  authorName: string;
  content: string;
  mentions: string[];
  isEdited: boolean;
  editedAt?: string;
  likesCount: number;
  hasLiked: boolean;
  /** User jelenlegi reakciója (ha van) */
  userReaction: string | null;
  /** Reakciók összesítése { emoji: count } */
  reactions: ReactionsSummary;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  replies?: DiscussionPost[];
  media?: PostMedia[];
}

/**
 * Post Media (Csatolmány) interfész
 */
export interface PostMedia {
  id: number;
  url: string;
  fileName: string;
  isImage: boolean;
}

/**
 * Discussion részletei hozzászólásokkal
 */
export interface DiscussionDetail extends Discussion {
  posts: DiscussionPost[];
}

/**
 * Beszélgetés létrehozás request
 */
export interface CreateDiscussionRequest {
  title: string;
  content: string;
  templateId?: number;
}

/**
 * Hozzászólás létrehozás request
 */
export interface CreatePostRequest {
  content: string;
  parentId?: number;
  mentions?: string[];
  media?: File[];
}

/**
 * Beszélgetés lista szűrés
 */
export interface DiscussionFilters {
  search?: string;
  templateId?: number;
  sortBy?: 'latest' | 'oldest' | 'most_posts' | 'most_views';
}

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
 * Forum Service
 *
 * A fórum/beszélgetés rendszer service-e.
 * Kezeli a beszélgetések listázását, létrehozását,
 * hozzászólások írását, like-olását.
 */
@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** Betöltés állapot */
  readonly isLoading = signal<boolean>(false);

  /** Beszélgetések cache */
  private discussionsCache$ = new BehaviorSubject<Discussion[]>([]);

  /**
   * Beszélgetések betöltése (opcionális szűréssel)
   */
  loadDiscussions(filters?: DiscussionFilters): Observable<Discussion[]> {
    this.isLoading.set(true);

    // Query paraméterek összeállítása
    const params: Record<string, string> = {};
    if (filters?.search) {
      params['search'] = filters.search;
    }
    if (filters?.templateId) {
      params['template_id'] = filters.templateId.toString();
    }
    if (filters?.sortBy && filters.sortBy !== 'latest') {
      params['sort_by'] = filters.sortBy;
    }

    return this.http.get<{ data: ApiDiscussionListItem[] }>(
      `${this.apiUrl}/discussions`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => response.data.map(item => this.mapDiscussionListItem(item))),
      tap(discussions => {
        this.discussionsCache$.next(discussions);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * API discussion lista elem mappelése
   */
  private mapDiscussionListItem(item: ApiDiscussionListItem): Discussion {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      templateId: item.template_id,
      templateName: item.template_name,
      isPinned: item.is_pinned,
      isLocked: item.is_locked,
      postsCount: item.posts_count,
      viewsCount: item.views_count,
      creatorType: item.is_creator_contact ? 'contact' : 'guest',
      creatorName: item.creator_name || 'Ismeretlen',
      createdAt: item.created_at,
      lastPostAt: item.last_post_at,
      lastPostBy: item.last_post_by
    };
  }

  /**
   * Beszélgetés részleteinek lekérése hozzászólásokkal
   */
  getDiscussion(slug: string): Observable<DiscussionDetail> {
    return this.http.get<{
      success: boolean;
      data: {
        discussion: ApiDiscussion;
        posts: ApiPaginatedPosts;
      };
    }>(
      `${this.apiUrl}/discussions/${slug}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapDiscussionDetail(response.data)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * API válasz mappelése frontend formátumra
   */
  private mapDiscussionDetail(data: { discussion: ApiDiscussion; posts: ApiPaginatedPosts }): DiscussionDetail {
    const discussion = data.discussion;
    const posts = data.posts.data || [];

    return {
      id: discussion.id,
      title: discussion.title,
      slug: discussion.slug,
      templateId: discussion.template_id,
      templateName: discussion.template_name,
      isPinned: discussion.is_pinned,
      isLocked: discussion.is_locked,
      postsCount: discussion.posts_count,
      viewsCount: discussion.views_count,
      creatorType: discussion.is_creator_contact ? 'contact' : 'guest',
      creatorName: discussion.creator_name || 'Ismeretlen',
      createdAt: discussion.created_at,
      posts: posts.map(post => this.mapPost(post))
    };
  }

  /**
   * API post mappelése frontend formátumra
   */
  private mapPost(post: ApiPost): DiscussionPost {
    return {
      id: post.id,
      discussionId: 0, // Nem használjuk közvetlenül
      parentId: post.parent_id,
      authorType: post.is_author_contact ? 'contact' : 'guest',
      authorName: post.author_name || 'Ismeretlen',
      content: post.content,
      mentions: post.mentions || [],
      isEdited: post.is_edited,
      editedAt: post.edited_at,
      likesCount: post.likes_count,
      hasLiked: post.is_liked,
      userReaction: post.user_reaction || null,
      reactions: post.reactions || {},
      canEdit: post.can_edit,
      canDelete: post.can_delete,
      createdAt: post.created_at,
      replies: (post.replies || []).map(r => this.mapPost(r)),
      media: (post.media || []).map(m => ({
        id: m.id,
        url: m.url,
        fileName: m.file_name || m.fileName || 'file',
        isImage: m.is_image || m.isImage || false
      }))
    };
  }

  /**
   * Új beszélgetés létrehozása (csak kapcsolattartó)
   */
  createDiscussion(request: CreateDiscussionRequest): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(discussion => {
        const current = this.discussionsCache$.getValue();
        this.discussionsCache$.next([discussion, ...current]);
      }),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés lezárása (csak kapcsolattartó)
   */
  lockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/lock`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés feloldása (csak kapcsolattartó)
   */
  unlockDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unlock`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés kitűzése (csak kapcsolattartó)
   */
  pinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/pin`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés kitűzés megszüntetése (csak kapcsolattartó)
   */
  unpinDiscussion(id: number): Observable<Discussion> {
    return this.http.post<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}/unpin`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Beszélgetés szerkesztése (cím módosítása)
   */
  updateDiscussion(id: number, data: { title?: string; templateId?: number | null }): Observable<Discussion> {
    const body: Record<string, unknown> = {};
    if (data.title) body['title'] = data.title;
    if (data.templateId !== undefined) body['template_id'] = data.templateId;

    return this.http.put<{ data: Discussion }>(
      `${this.apiUrl}/discussions/${id}`,
      body,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(updated => this.updateDiscussionInCache(updated)),
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Hozzászólás írása (opcionális média fájlokkal)
   */
  createPost(discussionId: number, request: CreatePostRequest): Observable<DiscussionPost> {
    // Ha van média fájl, FormData-t használunk
    if (request.media && request.media.length > 0) {
      const formData = new FormData();
      formData.append('content', request.content);
      if (request.parentId) {
        formData.append('parent_id', request.parentId.toString());
      }
      request.media.forEach(file => {
        formData.append('media[]', file, file.name);
      });

      // FormData esetén ne állítsunk Content-Type-ot
      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ data: ApiPost }>(
        `${this.apiUrl}/discussions/${discussionId}/posts`,
        formData,
        { headers }
      ).pipe(
        map(response => this.mapPost(response.data)),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    // Sima JSON kérés média nélkül
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
   * Támogatja a média módosítását is (új feltöltés, meglévő törlés)
   */
  updatePost(
    postId: number,
    content: string,
    newMedia?: File[],
    deleteMediaIds?: number[]
  ): Observable<{ media: PostMedia[] }> {
    // Ha van média változtatás, FormData-t használunk
    if ((newMedia && newMedia.length > 0) || (deleteMediaIds && deleteMediaIds.length > 0)) {
      const formData = new FormData();
      formData.append('content', content);

      // Új média fájlok
      if (newMedia && newMedia.length > 0) {
        newMedia.forEach(file => {
          formData.append('media[]', file, file.name);
        });
      }

      // Törölendő média ID-k
      if (deleteMediaIds && deleteMediaIds.length > 0) {
        deleteMediaIds.forEach((id, index) => {
          formData.append(`delete_media[${index}]`, id.toString());
        });
      }

      // FormData esetén ne állítsunk Content-Type-ot
      const headers = this.guestService.getGuestSessionHeader();
      return this.http.post<{ success: boolean; data: { media: ApiMedia[] }; message: string }>(
        `${this.apiUrl}/posts/${postId}`,
        formData,
        { headers, params: { '_method': 'PUT' } } // Laravel form method spoofing
      ).pipe(
        map(response => ({
          media: (response.data?.media || []).map(m => ({
            id: m.id,
            url: m.url,
            fileName: m.file_name || m.fileName || 'file',
            isImage: m.is_image || m.isImage || false
          }))
        })),
        catchError(error => throwError(() => this.handleError(error)))
      );
    }

    // Sima JSON kérés média nélkül
    return this.http.put<{ success: boolean; data: { media: ApiMedia[] }; message: string }>(
      `${this.apiUrl}/posts/${postId}`,
      { content },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        media: (response.data?.media || []).map(m => ({
          id: m.id,
          url: m.url,
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
      `${this.apiUrl}/posts/${postId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Reakció toggle (emoji reakció hozzáadása/eltávolítása)
   */
  toggleReaction(postId: number, reaction: string = '❤️'): Observable<{
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
      `${this.apiUrl}/posts/${postId}/like`,
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
   * Hozzászólás like toggle (legacy - ❤️ reakció)
   * @deprecated Use toggleReaction() instead
   */
  toggleLike(postId: number): Observable<{ hasLiked: boolean; likesCount: number }> {
    return this.toggleReaction(postId, '❤️').pipe(
      map(result => ({
        hasLiked: result.hasReacted,
        likesCount: result.likesCount
      }))
    );
  }

  /**
   * HTTP headers összeállítása X-Guest-Session-nel
   */
  private getHeaders(): HttpHeaders {
    return this.guestService.getGuestSessionHeader();
  }

  /**
   * Cache-elt beszélgetés frissítése
   */
  private updateDiscussionInCache(updated: Discussion): void {
    const current = this.discussionsCache$.getValue();
    const index = current.findIndex(d => d.id === updated.id);
    if (index !== -1) {
      current[index] = updated;
      this.discussionsCache$.next([...current]);
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
      message = 'A beszélgetés nem található';
    } else if (error.status === 422) {
      message = 'Érvénytelen adatok';
    } else if (error.status === 429) {
      message = 'Túl sok kérés, kérlek várj egy kicsit';
    }

    return new Error(message);
  }
}
