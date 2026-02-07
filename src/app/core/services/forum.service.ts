import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ForumDiscussionService } from './forum-discussion.service';
import { ForumPostService } from './forum-post.service';

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
  userReaction: string | null;
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
 * Forum Service (Facade)
 *
 * Backward compatible facade a ForumDiscussionService és ForumPostService fölött.
 * Az interfészek és típusok innen exportálódnak (a meglévő importok ne törjenek el).
 */
@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly discussionService = inject(ForumDiscussionService);
  private readonly postService = inject(ForumPostService);

  /** Betöltés állapot */
  get isLoading() { return this.discussionService.isLoading; }

  // === DISCUSSION DELEGÁLÁS ===

  loadDiscussions(filters?: DiscussionFilters) { return this.discussionService.loadDiscussions(filters); }
  getDiscussion(slug: string) { return this.discussionService.getDiscussion(slug); }
  createDiscussion(request: CreateDiscussionRequest) { return this.discussionService.createDiscussion(request); }
  lockDiscussion(id: number) { return this.discussionService.lockDiscussion(id); }
  unlockDiscussion(id: number) { return this.discussionService.unlockDiscussion(id); }
  pinDiscussion(id: number) { return this.discussionService.pinDiscussion(id); }
  unpinDiscussion(id: number) { return this.discussionService.unpinDiscussion(id); }
  updateDiscussion(id: number, data: { title?: string; templateId?: number | null }) { return this.discussionService.updateDiscussion(id, data); }

  // === POST DELEGÁLÁS ===

  createPost(discussionId: number, request: CreatePostRequest) { return this.postService.createPost(discussionId, request); }
  updatePost(postId: number, content: string, newMedia?: File[], deleteMediaIds?: number[]) {
    return this.postService.updatePost(postId, content, newMedia, deleteMediaIds);
  }
  deletePost(postId: number) { return this.postService.deletePost(postId); }
  toggleReaction(postId: number, reaction?: string) { return this.postService.toggleReaction(postId, reaction); }
  /** @deprecated Use toggleReaction() instead */
  toggleLike(postId: number) { return this.postService.toggleLike(postId); }
}
