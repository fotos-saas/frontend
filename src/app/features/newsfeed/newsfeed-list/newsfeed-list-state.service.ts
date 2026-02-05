import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NewsfeedService, NewsfeedPost, NewsfeedFilters, NewsfeedMedia, NewsfeedComment } from '../../../core/services/newsfeed.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { CreatePostResult } from '../create-post-dialog/create-post-dialog.component';
import { ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { ToastService } from '../../../core/services/toast.service';
import { calculateOptimisticReaction, calculateLikesCount } from '../../../shared/utils/optimistic-reaction.util';
import {
  insertCommentInMap, removeCommentFromMap, updateCommentReactionInMap,
  scheduleScrollToComment, scheduleClearNewFlag, updateMapSignal
} from './newsfeed-list-comments.helper';

/**
 * Newsfeed List State Service
 *
 * Hírfolyam lista üzleti logika:
 * - Posztok betöltése, szűrése, rendezése
 * - Reakciók kezelése (optimistic update)
 * - Kommentek CRUD
 * - Kitűzés / Törlés
 * - Vendég regisztráció
 */
@Injectable()
export class NewsfeedListStateService {
  private readonly newsfeedService = inject(NewsfeedService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  // ==================== SIGNALS ====================

  readonly posts = signal<NewsfeedPost[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly showGuestNameDialog = signal(false);
  readonly isGuestRegistering = signal(false);
  readonly guestError = signal<string | null>(null);

  readonly showCreateDialog = signal(false);
  readonly editingPost = signal<NewsfeedPost | null>(null);
  readonly activeFilter = signal<'all' | 'announcement' | 'event'>('all');

  readonly lightboxOpen = signal(false);
  readonly lightboxMedia = signal<NewsfeedMedia[]>([]);
  readonly lightboxIndex = signal(0);

  readonly showDeleteDialog = signal(false);
  readonly postToDelete = signal<NewsfeedPost | null>(null);
  readonly isDeleting = signal(false);

  readonly showCommentDeleteDialog = signal(false);
  readonly commentToDelete = signal<{ post: NewsfeedPost; comment: NewsfeedComment } | null>(null);

  readonly commentsMap = signal<Map<number, NewsfeedComment[]>>(new Map());
  readonly commentsLoadingMap = signal<Map<number, boolean>>(new Map());

  readonly pinnedPosts = computed(() => this.posts().filter(p => p.isPinned));
  readonly regularPosts = computed(() => this.posts().filter(p => !p.isPinned));

  private currentFilters: NewsfeedFilters = {};

  // ==================== INICIALIZÁLÁS ====================

  init(): void {
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showGuestNameDialog.set(true);
    }
    this.loadPosts();
  }

  isContact(): boolean {
    return this.authService.hasFullAccess();
  }

  // ==================== POSZTOK ====================

  loadPosts(filters?: NewsfeedFilters): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentFilters = filters || {};

    this.newsfeedService.loadPosts(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.posts.set(this.sortPosts(posts));
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        }
      });
  }

  applyFilter(filter: 'all' | 'announcement' | 'event'): void {
    this.activeFilter.set(filter);
    const filters: NewsfeedFilters = {};
    if (filter !== 'all') filters.type = filter;
    this.loadPosts(filters);
  }

  openCreateDialog(): void {
    this.editingPost.set(null);
    this.showCreateDialog.set(true);
  }

  openEditDialog(post: NewsfeedPost): void {
    this.editingPost.set(post);
    this.showCreateDialog.set(true);
  }

  handleCreatePostResult(result: CreatePostResult): void {
    this.showCreateDialog.set(false);
    this.editingPost.set(null);
    if (result.action === 'created' || result.action === 'updated') {
      this.loadPosts(this.currentFilters);
    }
  }

  // ==================== REAKCIÓK ====================

  handleReaction(post: NewsfeedPost, reaction: ReactionEmoji): void {
    const { optimisticReactions, optimisticUserReaction, rollback } =
      calculateOptimisticReaction(post.reactions, post.userReaction, reaction);

    this.updatePostInList(post.id, {
      hasLiked: optimisticUserReaction !== null,
      userReaction: optimisticUserReaction,
      reactions: optimisticReactions,
      likesCount: calculateLikesCount(optimisticReactions)
    });

    this.newsfeedService.toggleReaction(post.id, reaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.updatePostInList(post.id, {
            hasLiked: result.hasReacted,
            userReaction: result.userReaction,
            reactions: result.reactions,
            likesCount: result.likesCount
          });
        },
        error: () => {
          const original = rollback();
          this.updatePostInList(post.id, {
            hasLiked: original.userReaction !== null,
            userReaction: original.userReaction,
            reactions: original.reactions,
            likesCount: calculateLikesCount(original.reactions)
          });
          this.toastService.error('Hiba', 'Nem sikerült a reakció mentése.', 3000);
        }
      });
  }

  // ==================== KITŰZÉS ====================

  togglePin(post: NewsfeedPost): void {
    const wasPinned = post.isPinned;
    this.updatePostInList(post.id, { isPinned: !wasPinned });

    const action$ = wasPinned
      ? this.newsfeedService.unpinPost(post.id)
      : this.newsfeedService.pinPost(post.id);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.posts.update(posts => this.sortPosts(posts));
        this.toastService.success(
          wasPinned ? 'Levéve' : 'Kitűzve',
          wasPinned ? 'A bejegyzés kitűzése levéve.' : 'A bejegyzés kitűzve.',
          3000
        );
      },
      error: () => {
        this.updatePostInList(post.id, { isPinned: wasPinned });
        this.toastService.error('Hiba', 'Nem sikerült a művelet.', 3000);
      }
    });
  }

  // ==================== TÖRLÉS ====================

  openDeleteDialog(post: NewsfeedPost): void {
    this.postToDelete.set(post);
    this.showDeleteDialog.set(true);
  }

  handleDeleteDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.resetDeleteDialog();
      return;
    }
    const post = this.postToDelete();
    if (!post) return;

    this.isDeleting.set(true);
    this.newsfeedService.deletePost(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.posts.set(this.posts().filter(p => p.id !== post.id));
          this.resetDeleteDialog();
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.resetDeleteDialog();
        }
      });
  }

  // ==================== KOMMENTEK ====================

  getCommentsForPost(postId: number): NewsfeedComment[] {
    return this.commentsMap().get(postId) || [];
  }

  isCommentsLoading(postId: number): boolean {
    return this.commentsLoadingMap().get(postId) || false;
  }

  toggleComments(post: NewsfeedPost): void {
    if (this.commentsMap().has(post.id)) return;
    updateMapSignal(this.commentsLoadingMap, post.id, true);

    this.newsfeedService.getComments(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          updateMapSignal(this.commentsMap, post.id, comments);
          updateMapSignal(this.commentsLoadingMap, post.id, false);
        },
        error: () => updateMapSignal(this.commentsLoadingMap, post.id, false)
      });
  }

  submitComment(post: NewsfeedPost, data: { content: string; parentId?: number }): void {
    this.newsfeedService.createComment(post.id, data.content, data.parentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newComment) => {
          insertCommentInMap(this.commentsMap, post.id, { ...newComment, isNew: true }, data.parentId);
          this.updatePostInList(post.id, { commentsCount: post.commentsCount + 1 });
          scheduleScrollToComment(this.destroyRef, data.parentId);
          scheduleClearNewFlag(this.commentsMap, this.destroyRef, post.id, newComment.id, data.parentId);
        },
        error: () => { /* Silent fail */ }
      });
  }

  openCommentDeleteDialog(post: NewsfeedPost, comment: NewsfeedComment): void {
    this.commentToDelete.set({ post, comment });
    this.showCommentDeleteDialog.set(true);
  }

  handleCommentDeleteResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const data = this.commentToDelete();
      if (data) this.executeCommentDelete(data.post, data.comment);
    }
    this.showCommentDeleteDialog.set(false);
    this.commentToDelete.set(null);
  }

  handleCommentReaction(post: NewsfeedPost, comment: NewsfeedComment, reaction: ReactionEmoji): void {
    this.newsfeedService.toggleCommentReaction(comment.id, reaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          updateCommentReactionInMap(
            this.commentsMap, post.id, comment.id,
            result.userReaction, result.reactions
          );
        }
      });
  }

  // ==================== VENDÉG ====================

  handleGuestNameResult(result: GuestNameResult): void {
    if (result.action === 'close') return;
    this.isGuestRegistering.set(true);
    this.guestError.set(null);

    this.guestService.register(result.name, result.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showGuestNameDialog.set(false);
          this.isGuestRegistering.set(false);
          this.loadPosts();
        },
        error: (err) => {
          this.guestError.set(err.message);
          this.isGuestRegistering.set(false);
        }
      });
  }

  // ==================== LIGHTBOX ====================

  openLightbox(event: { media: NewsfeedMedia[], index: number }): void {
    this.lightboxMedia.set(event.media);
    this.lightboxIndex.set(event.index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  navigateLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  // ==================== PRIVÁT ====================

  private sortPosts(posts: NewsfeedPost[]): NewsfeedPost[] {
    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private updatePostInList(postId: number, partial: Partial<NewsfeedPost>): void {
    this.posts.update(posts => posts.map(p =>
      p.id === postId ? { ...p, ...partial } : p
    ));
  }

  private resetDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.postToDelete.set(null);
    this.isDeleting.set(false);
  }

  private executeCommentDelete(post: NewsfeedPost, comment: NewsfeedComment): void {
    this.newsfeedService.deleteComment(comment.id, post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          removeCommentFromMap(this.commentsMap, post.id, comment.id);
          this.updatePostInList(post.id, {
            commentsCount: Math.max(0, post.commentsCount - 1)
          });
        },
        error: () => { /* Silent fail */ }
      });
  }
}
