import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NewsfeedPostService } from './newsfeed-post.service';
import { NewsfeedCommentService } from './newsfeed-comment.service';

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
  userReaction: string | null;
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
 * Newsfeed Service (Facade)
 *
 * Backward compatible facade a NewsfeedPostService és NewsfeedCommentService fölött.
 * Az interfészek és típusok innen exportálódnak (a meglévő importok ne törjenek el).
 */
@Injectable({
  providedIn: 'root'
})
export class NewsfeedService {
  private readonly postService = inject(NewsfeedPostService);
  private readonly commentService = inject(NewsfeedCommentService);

  /** Betöltés állapot */
  get isLoading() { return this.postService.isLoading; }

  /** Cache-elt posztok */
  get posts$(): Observable<NewsfeedPost[]> { return this.postService.posts$; }

  // === POST DELEGÁLÁS ===

  loadPosts(filters?: NewsfeedFilters) { return this.postService.loadPosts(filters); }
  getUpcomingEvents(limit = 5) { return this.postService.getUpcomingEvents(limit); }
  getPost(id: number) { return this.postService.getPost(id); }
  createPost(request: CreatePostRequest, mediaFiles?: File[]) { return this.postService.createPost(request, mediaFiles); }
  updatePost(id: number, request: UpdatePostRequest, mediaFiles?: File[]) { return this.postService.updatePost(id, request, mediaFiles); }
  deleteMedia(mediaId: number) { return this.postService.deleteMedia(mediaId); }
  deletePost(id: number) { return this.postService.deletePost(id); }
  toggleReaction(postId: number, reaction?: string) { return this.postService.toggleReaction(postId, reaction); }
  /** @deprecated Use toggleReaction() instead */
  toggleLike(postId: number) { return this.postService.toggleLike(postId); }
  pinPost(id: number) { return this.postService.pinPost(id); }
  unpinPost(id: number) { return this.postService.unpinPost(id); }

  // === COMMENT DELEGÁLÁS ===

  toggleCommentReaction(commentId: number, reaction?: string) { return this.commentService.toggleCommentReaction(commentId, reaction); }
  getComments(postId: number, perPage = 20) { return this.commentService.getComments(postId, perPage); }
  createComment(postId: number, content: string, parentId?: number) { return this.commentService.createComment(postId, content, parentId); }
  deleteComment(commentId: number, postId: number) { return this.commentService.deleteComment(commentId, postId); }
}
