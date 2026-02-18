/**
 * Newsfeed API valasz tipusok (snake_case) es mapper fuggveny.
 *
 * Kozos interface-ek a newsfeed-post.service es newsfeed-comment.service szamara.
 */
import type { NewsfeedComment, ReactionsSummary } from '../services/newsfeed.service';

/**
 * API Newsfeed Comment (snake_case valasz a backendtol)
 */
export interface ApiNewsfeedComment {
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

/**
 * Paginalt API valasz
 */
export interface ApiPaginatedResponse<T> {
  current_page: number;
  data: T[];
  total: number;
  last_page: number;
  per_page: number;
}

/**
 * API comment -> NewsfeedComment mapper
 */
export function mapApiCommentToNewsfeedComment(comment: ApiNewsfeedComment): NewsfeedComment {
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
    replies: comment.replies?.map(r => mapApiCommentToNewsfeedComment(r)) || []
  };
}
