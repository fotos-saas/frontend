import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';

/**
 * Real-time fórum események típusai
 */
export interface NewPostEvent {
  id: number;
  discussion_id: number;
  author_name: string;
  content_preview: string;
  created_at: string;
}

export interface PostUpdatedEvent {
  id: number;
  discussion_id: number;
  content_preview: string;
  updated_at: string;
}

export interface PostDeletedEvent {
  id: number;
  discussion_id: number;
  deleted_by: string;
}

export interface PostLikedEvent {
  post_id: number;
  discussion_id: number;
  likes_count: number;
  liker_name: string;
}

export interface TypingEvent {
  discussion_id: number;
  user_name: string;
  is_typing: boolean;
}

/**
 * Realtime Forum Service
 *
 * Fórum-specifikus real-time események kezelése.
 * Feliratkozás discussion csatornákra, új post, like események.
 */
@Injectable({
  providedIn: 'root'
})
export class RealtimeForumService implements OnDestroy {
  private readonly ws = inject(WebsocketService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);

  /** Aktívan figyelt discussion ID-k */
  private subscribedDiscussions = new Set<number>();

  /** Projekt ID amire feliratkoztunk */
  private currentProjectId: number | null = null;

  /** Éppen gépelő felhasználók (discussion_id -> user_name[]) */
  readonly typingUsers = signal<Map<number, string[]>>(new Map());

  /** Új post érkezett (discussion_id -> post) */
  readonly newPosts = signal<Map<number, NewPostEvent[]>>(new Map());

  /** Like frissítések (post_id -> likes_count) */
  readonly likeUpdates = signal<Map<number, number>>(new Map());

  /**
   * Projekt szintű fórum csatornára feliratkozás
   */
  subscribeToProject(projectId: number): void {
    if (this.currentProjectId === projectId) {
      return;
    }

    // Előző projekt csatorna elhagyása
    if (this.currentProjectId) {
      this.ws.leave(`forum.project.${this.currentProjectId}`);
    }

    this.currentProjectId = projectId;
    const channel = this.ws.channel(`forum.project.${projectId}`);

    if (!channel) {
      this.logger.warn('[RealtimeForum] Could not subscribe to project channel');
      return;
    }

    // Új post
    channel.listen('.new.post', (event: NewPostEvent) => {
      this.logger.info('[RealtimeForum] New post:', event);
      this.handleNewPost(event);
    });

    // Post frissítve
    channel.listen('.post.updated', (event: PostUpdatedEvent) => {
      this.logger.info('[RealtimeForum] Post updated:', event);
    });

    // Post törölve
    channel.listen('.post.deleted', (event: PostDeletedEvent) => {
      this.logger.info('[RealtimeForum] Post deleted:', event);
    });

    // Like
    channel.listen('.post.liked', (event: PostLikedEvent) => {
      this.logger.info('[RealtimeForum] Post liked:', event);
      this.handlePostLiked(event);
    });

    this.logger.info(`[RealtimeForum] Subscribed to project ${projectId}`);
  }

  /**
   * Discussion szintű csatornára feliratkozás (typing indicator, stb.)
   */
  subscribeToDiscussion(discussionId: number): void {
    if (this.subscribedDiscussions.has(discussionId)) {
      return;
    }

    const channel = this.ws.join(`forum.discussion.${discussionId}`);

    if (!channel) {
      this.logger.warn('[RealtimeForum] Could not subscribe to discussion channel');
      return;
    }

    this.subscribedDiscussions.add(discussionId);

    // Typing indicator
    channel.listenForWhisper('typing', (event: TypingEvent) => {
      this.handleTyping(event);
    });

    // Jelenlét kezelés
    channel
      .here((users: Array<{ name: string }>) => {
        this.logger.debug(`[RealtimeForum] Discussion ${discussionId} users:`, users);
      })
      .joining((user: { name: string }) => {
        this.logger.debug(`[RealtimeForum] User joined discussion ${discussionId}:`, user.name);
      })
      .leaving((user: { name: string }) => {
        this.logger.debug(`[RealtimeForum] User left discussion ${discussionId}:`, user.name);
      });

    this.logger.info(`[RealtimeForum] Subscribed to discussion ${discussionId}`);
  }

  /**
   * Discussion csatorna elhagyása
   */
  unsubscribeFromDiscussion(discussionId: number): void {
    if (!this.subscribedDiscussions.has(discussionId)) {
      return;
    }

    this.ws.leave(`forum.discussion.${discussionId}`);
    this.subscribedDiscussions.delete(discussionId);

    // Typing users törlése
    const currentTyping = new Map(this.typingUsers());
    currentTyping.delete(discussionId);
    this.typingUsers.set(currentTyping);

    this.logger.info(`[RealtimeForum] Unsubscribed from discussion ${discussionId}`);
  }

  /**
   * Typing indicator küldése
   */
  sendTypingIndicator(discussionId: number, isTyping: boolean): void {
    const channel = this.ws.join(`forum.discussion.${discussionId}`);
    if (channel) {
      channel.whisper('typing', {
        discussion_id: discussionId,
        is_typing: isTyping
      });
    }
  }

  /**
   * Új post kezelése
   */
  private handleNewPost(event: NewPostEvent): void {
    // Hozzáadás a new posts listához
    const currentPosts = new Map(this.newPosts());
    const discussionPosts = currentPosts.get(event.discussion_id) || [];
    discussionPosts.push(event);
    currentPosts.set(event.discussion_id, discussionPosts);
    this.newPosts.set(currentPosts);

    // Toast értesítés
    this.toast.info(
      'Új hozzászólás',
      `${event.author_name} új hozzászólást írt`
    );
  }

  /**
   * Like esemény kezelése
   */
  private handlePostLiked(event: PostLikedEvent): void {
    const currentLikes = new Map(this.likeUpdates());
    currentLikes.set(event.post_id, event.likes_count);
    this.likeUpdates.set(currentLikes);
  }

  /**
   * Typing esemény kezelése
   */
  private handleTyping(event: TypingEvent): void {
    const currentTyping = new Map(this.typingUsers());
    const users = currentTyping.get(event.discussion_id) || [];

    if (event.is_typing) {
      if (!users.includes(event.user_name)) {
        users.push(event.user_name);
      }
    } else {
      const index = users.indexOf(event.user_name);
      if (index > -1) {
        users.splice(index, 1);
      }
    }

    if (users.length > 0) {
      currentTyping.set(event.discussion_id, users);
    } else {
      currentTyping.delete(event.discussion_id);
    }

    this.typingUsers.set(currentTyping);
  }

  /**
   * New posts lista törlése egy discussionhoz
   */
  clearNewPosts(discussionId: number): void {
    const currentPosts = new Map(this.newPosts());
    currentPosts.delete(discussionId);
    this.newPosts.set(currentPosts);
  }

  /**
   * Összes feliratkozás törlése
   */
  unsubscribeAll(): void {
    // Discussion csatornák
    for (const discussionId of this.subscribedDiscussions) {
      this.ws.leave(`forum.discussion.${discussionId}`);
    }
    this.subscribedDiscussions.clear();

    // Projekt csatorna
    if (this.currentProjectId) {
      this.ws.leave(`forum.project.${this.currentProjectId}`);
      this.currentProjectId = null;
    }

    // State reset
    this.typingUsers.set(new Map());
    this.newPosts.set(new Map());
    this.likeUpdates.set(new Map());
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
