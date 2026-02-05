import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import {
  ForumService,
  DiscussionDetail,
  DiscussionPost,
  CreatePostRequest
} from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { PostEditService } from '../../../core/services/post-edit.service';
import { GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { PostEditSaveData } from '../../../shared/components/post-edit-form';
import { BadgeConfig } from '../../../shared/components/post-header-bar';
import { CreateDiscussionResult, EditDiscussionData } from '../create-discussion-dialog/create-discussion-dialog.component';
import { formatTimeAgo } from '../../../shared/utils/time-formatter.util';
import { updatePostInTree, addPostToTree } from '../../../shared/utils/post-tree-updater.util';
import { ToastService } from '../../../core/services/toast.service';
import { calculateOptimisticReaction, calculateLikesCount } from '../../../shared/utils/optimistic-reaction.util';

/**
 * Forum Detail State Service
 *
 * Komponens-szintű service a forum-detail oldalhoz.
 * Kezeli az adatlekérést, reakciókat, szerkesztést, törlést, vendég regisztrációt.
 */
@Injectable({ providedIn: null })
export class ForumDetailStateService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly toastService = inject(ToastService);
  readonly postEditService = inject(PostEditService);

  // ==================== STATE ====================

  readonly discussion = signal<DiscussionDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly replyingToId = signal<number | null>(null);

  // Guest
  readonly showGuestNameDialog = signal(false);
  readonly isGuestRegistering = signal(false);
  readonly guestError = signal<string | null>(null);

  // Delete
  readonly showDeleteDialog = signal(false);
  readonly postToDelete = signal<DiscussionPost | null>(null);
  readonly isDeleting = signal(false);

  // Topic edit
  readonly showTopicEditDialog = signal(false);
  readonly isTopicSaving = signal(false);
  readonly topicEditError = signal<string | null>(null);

  // ==================== COMPUTED ====================

  readonly discussionTimeAgo = computed(() => {
    const d = this.discussion();
    return d ? formatTimeAgo(d.createdAt) : '';
  });

  readonly topicDescription = computed(() => {
    const disc = this.discussion();
    if (!disc || disc.posts.length === 0) return null;
    return disc.posts[0];
  });

  readonly topicComments = computed(() => {
    const disc = this.discussion();
    if (!disc) return [];
    return disc.posts.slice(1);
  });

  readonly hasComments = computed(() => this.topicComments().length > 0);

  readonly hasTopicReactions = computed(() => {
    const description = this.topicDescription();
    if (!description?.reactions) return false;
    return Object.values(description.reactions).some(count => count > 0);
  });

  readonly isTopicAuthor = computed(() => {
    const description = this.topicDescription();
    if (!description) return false;
    return description.canEdit !== undefined || description.canDelete !== undefined;
  });

  readonly canEditTopic = computed(() => {
    const description = this.topicDescription();
    if (!description) return false;
    if (this.hasComments()) return false;
    if (this.hasTopicReactions()) return false;
    return description.canEdit ?? false;
  });

  readonly editData = computed<EditDiscussionData | undefined>(() => {
    const disc = this.discussion();
    const description = this.topicDescription();
    if (!disc || !description) return undefined;
    return {
      discussionId: disc.id,
      postId: description.id,
      title: disc.title,
      content: description.content,
      media: description.media
    };
  });

  readonly headerBadges = computed<BadgeConfig[]>(() => {
    const disc = this.discussion();
    if (!disc) return [];
    const badges: BadgeConfig[] = [];
    if (disc.isPinned) {
      badges.push({ type: 'pinned', label: 'Kitűzött', icon: 'pin', color: 'warning' });
    }
    if (disc.isLocked) {
      badges.push({ type: 'locked', label: 'Lezárt', icon: 'lock', color: 'gray' });
    }
    if (disc.templateId && disc.templateName) {
      badges.push({ type: 'template', label: disc.templateName, icon: 'template', color: 'purple' });
    }
    return badges;
  });

  readonly canReply = computed(() => {
    const d = this.discussion();
    return d !== null && !d.isLocked;
  });

  readonly hasFullAccess = computed(() => this.authService.hasFullAccess());

  // ==================== INIT ====================

  /** Vendég névbekérés ellenőrzése */
  checkGuestStatus(): void {
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showGuestNameDialog.set(true);
    }
  }

  // ==================== DATA LOADING ====================

  loadDiscussion(slug: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.forumService.getDiscussion(slug).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (discussion) => {
        this.discussion.set(discussion);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  // ==================== REPLY ====================

  submitReply(data: { content: string; parentId?: number; media?: File[] }, resetFormFn?: () => void): void {
    const currentDiscussion = this.discussion();
    if (!currentDiscussion || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: CreatePostRequest = {
      content: data.content,
      parentId: data.parentId,
      media: data.media
    };

    this.forumService.createPost(currentDiscussion.id, request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (newPost: DiscussionPost) => {
        this.toastService.success('Siker', 'Hozzászólás elküldve!');
        this.isSubmitting.set(false);
        this.replyingToId.set(null);
        resetFormFn?.();

        const updatedPosts = addPostToTree(currentDiscussion.posts, newPost);
        this.discussion.set({
          ...currentDiscussion,
          posts: updatedPosts,
          postsCount: currentDiscussion.postsCount + 1
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 429) {
          this.toastService.error(
            'Túl sok kérés',
            'Kérlek várj egy kicsit, mielőtt újra próbálkozol.',
            5000
          );
          return;
        }
        this.errorMessage.set(err.message);
      }
    });
  }

  // ==================== REACTIONS ====================

  onReaction(post: DiscussionPost, reaction: ReactionEmoji): void {
    const currentDiscussion = this.discussion();
    if (!currentDiscussion) return;

    const { optimisticReactions, optimisticUserReaction, rollback } =
      calculateOptimisticReaction(post.reactions, post.userReaction, reaction);

    const optimisticPosts = updatePostInTree(
      currentDiscussion.posts,
      post.id,
      (p) => ({
        ...p,
        hasLiked: optimisticUserReaction !== null,
        userReaction: optimisticUserReaction,
        reactions: optimisticReactions,
        likesCount: calculateLikesCount(optimisticReactions)
      })
    );

    this.discussion.set({ ...currentDiscussion, posts: optimisticPosts });

    this.forumService.toggleReaction(post.id, reaction).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        const freshDiscussion = this.discussion();
        if (freshDiscussion) {
          const updatedPosts = updatePostInTree(
            freshDiscussion.posts,
            post.id,
            (p) => ({
              ...p,
              hasLiked: result.hasReacted,
              userReaction: result.userReaction,
              reactions: result.reactions,
              likesCount: result.likesCount
            })
          );
          this.discussion.set({ ...freshDiscussion, posts: updatedPosts });
        }
      },
      error: () => {
        const original = rollback();
        const freshDiscussion = this.discussion();
        if (freshDiscussion) {
          const rolledBackPosts = updatePostInTree(
            freshDiscussion.posts,
            post.id,
            (p) => ({
              ...p,
              hasLiked: original.userReaction !== null,
              userReaction: original.userReaction,
              reactions: original.reactions,
              likesCount: calculateLikesCount(original.reactions)
            })
          );
          this.discussion.set({ ...freshDiscussion, posts: rolledBackPosts });
        }
        this.toastService.error('Hiba', 'Nem sikerült a reakció mentése.', 3000);
      }
    });
  }

  // ==================== TOPIC EDIT ====================

  onEditTopic(): void {
    const description = this.topicDescription();
    if (!description) return;

    if (this.postEditService.isEditTimeExpired(description.createdAt)) {
      this.toastService.error('Szerkesztés nem lehetséges', 'A szerkesztési időkorlát lejárt (15 perc).', 4000);
      return;
    }
    if (this.hasComments()) {
      this.toastService.error('Szerkesztés nem lehetséges', 'A témához már érkeztek hozzászólások, ezért nem módosítható.', 4000);
      return;
    }
    if (this.hasTopicReactions()) {
      this.toastService.error('Szerkesztés nem lehetséges', 'A témára már érkeztek reakciók, ezért nem módosítható.', 4000);
      return;
    }
    if (!description.canEdit) {
      this.toastService.error('Szerkesztés nem lehetséges', 'Nincs jogosultságod a téma szerkesztéséhez.', 4000);
      return;
    }

    this.topicEditError.set(null);
    this.showTopicEditDialog.set(true);
  }

  onTopicEditResult(result: CreateDiscussionResult): void {
    if (result.action === 'close') {
      this.showTopicEditDialog.set(false);
      return;
    }
    if (result.action !== 'updated') return;

    const currentDiscussion = this.discussion();
    const description = this.topicDescription();
    if (!currentDiscussion || !description) return;

    this.isTopicSaving.set(true);
    this.topicEditError.set(null);

    this.forumService.updateDiscussion(currentDiscussion.id, { title: result.title }).pipe(
      switchMap(() => this.forumService.updatePost(
        description.id,
        result.content,
        result.newMedia,
        result.deleteMediaIds
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showSuccess('Téma frissítve!');
        this.showTopicEditDialog.set(false);
        this.isTopicSaving.set(false);
        this.loadDiscussion(currentDiscussion.slug);
      },
      error: (err) => {
        console.error('[ForumDetail] Update error:', err);
        this.showTopicEditDialog.set(false);
        this.isTopicSaving.set(false);

        let errorTitle = 'Hiba';
        let errorMsg = err.message || 'Nem sikerült menteni a módosításokat.';
        if (err.message?.includes('jogosultság') || err.message?.includes('Forbidden')) {
          errorTitle = 'Szerkesztés nem lehetséges';
          errorMsg = 'A szerkesztési időkorlát lejárt (15 perc), vagy nincs jogosultságod a módosításhoz.';
        }
        this.toastService.error(errorTitle, errorMsg, 5000);
      }
    });
  }

  // ==================== DELETE ====================

  onDeletePost(post: DiscussionPost): void {
    this.postToDelete.set(post);
    this.showDeleteDialog.set(true);
  }

  onDeleteDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.showDeleteDialog.set(false);
      this.postToDelete.set(null);
      return;
    }

    const post = this.postToDelete();
    if (!post) return;

    this.isDeleting.set(true);

    this.forumService.deletePost(post.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showSuccess('Hozzászólás törölve!');
        this.showDeleteDialog.set(false);
        this.postToDelete.set(null);
        this.isDeleting.set(false);
        const currentDiscussion = this.discussion();
        if (currentDiscussion) {
          this.loadDiscussion(currentDiscussion.slug);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.message);
        this.showDeleteDialog.set(false);
        this.postToDelete.set(null);
        this.isDeleting.set(false);
      }
    });
  }

  // ==================== POST EDIT ====================

  startEdit(post: DiscussionPost): void {
    if (!post.canEdit) return;
    this.postEditService.startEdit(post.id, post.content);
    this.replyingToId.set(null);
  }

  cancelEdit(): void {
    this.postEditService.cancelEdit();
  }

  saveEditContent(post: DiscussionPost, data: PostEditSaveData): void {
    const trimmedContent = data.content.trim();
    if (!trimmedContent || this.postEditService.isSubmitting()) return;

    this.postEditService.setSubmitting(true);
    this.errorMessage.set(null);

    this.forumService.updatePost(
      post.id,
      trimmedContent,
      data.newMedia,
      data.deleteMediaIds
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.showSuccess('Hozzászólás frissítve!');
        this.postEditService.finishEdit();

        const currentDiscussion = this.discussion();
        if (currentDiscussion) {
          const updatedPosts = updatePostInTree(
            currentDiscussion.posts,
            post.id,
            (p) => ({
              ...p,
              content: trimmedContent,
              media: result.media,
              isEdited: true
            })
          );
          this.discussion.set({ ...currentDiscussion, posts: updatedPosts });
        }
      },
      error: (err) => {
        this.errorMessage.set(err.message);
        this.postEditService.setSubmitting(false);
      }
    });
  }

  // ==================== GUEST ====================

  onGuestNameResult(result: GuestNameResult): void {
    if (result.action === 'close') return;

    this.isGuestRegistering.set(true);
    this.guestError.set(null);

    this.guestService.register(result.name, result.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showGuestNameDialog.set(false);
        this.isGuestRegistering.set(false);
        const currentDiscussion = this.discussion();
        if (currentDiscussion) {
          this.loadDiscussion(currentDiscussion.slug);
        }
      },
      error: (err) => {
        this.guestError.set(err.message);
        this.isGuestRegistering.set(false);
      }
    });
  }

  // ==================== HELPERS ====================

  getRemainingEditTime(post: DiscussionPost): string {
    return this.postEditService.getRemainingEditTime(post.createdAt);
  }

  isEditTimeExpired(post: DiscussionPost): boolean {
    return this.postEditService.isEditTimeExpired(post.createdAt);
  }

  formatTimeAgo(dateStr: string): string {
    return formatTimeAgo(dateStr);
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    timer(3000).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.successMessage.set(null));
  }
}
