/**
 * Forum API valasz tipusok (snake_case) es mapper fuggveny.
 *
 * Kozos interface-ek a forum-post.service es forum-discussion.service szamara.
 */
import type { DiscussionPost, PostMedia, ReactionsSummary } from '../services/forum.service';

/**
 * API Post (snake_case valasz a backendtol)
 */
export interface ApiForumPost {
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
  replies: ApiForumPost[];
  media: ApiForumMedia[];
  created_at: string;
}

/**
 * API Media (snake_case valasz a backendtol)
 */
export interface ApiForumMedia {
  id: number;
  url: string;
  file_name?: string;
  fileName?: string;
  is_image?: boolean;
  isImage?: boolean;
}

/**
 * API post -> DiscussionPost mapper
 */
export function mapApiPostToDiscussionPost(post: ApiForumPost): DiscussionPost {
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
    replies: (post.replies || []).map(r => mapApiPostToDiscussionPost(r)),
    media: (post.media || []).map(m => mapApiMediaToPostMedia(m))
  };
}

/**
 * API media -> PostMedia mapper
 */
export function mapApiMediaToPostMedia(m: ApiForumMedia): PostMedia {
  return {
    id: m.id, url: m.url,
    fileName: m.file_name || m.fileName || 'file',
    isImage: m.is_image || m.isImage || false
  };
}
