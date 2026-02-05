import { Component, OnInit, ChangeDetectionStrategy, signal, DestroyRef, inject, computed, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { LightboxService } from '../../../core/services/lightbox.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReplyFormComponent } from '../reply-form/reply-form.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox';
import { ForumPostComponent } from '../../../shared/components/forum-post';
import { PostEditFormComponent, PostEditSaveData } from '../../../shared/components/post-edit-form';
import { ContentBlockComponent } from '../../../shared/components/content-block';
import { ReactionPickerComponent } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { PostMetaBarComponent } from '../../../shared/components/post-meta-bar';
import { PostHeaderBarComponent, BadgeConfig } from '../../../shared/components/post-header-bar';
import { CreateDiscussionDialogComponent, CreateDiscussionResult, EditDiscussionData } from '../create-discussion-dialog/create-discussion-dialog.component';
import { formatTimeAgo } from '../../../shared/utils/time-formatter.util';
import { updatePostInTree, addPostToTree } from '../../../shared/utils/post-tree-updater.util';
import { ToastService } from '../../../core/services/toast.service';
import { calculateOptimisticReaction, calculateLikesCount } from '../../../shared/utils/optimistic-reaction.util';

/**
 * Forum Detail Component
 *
 * Beszélgetés részletes nézete:
 * - Téma fejléc (cím, állapot)
 * - Hozzászólások listája (threaded)
 * - Válasz form
 */
@Component({
    selector: 'app-forum-detail',
    imports: [
        RouterModule,
        FormsModule,
        GuestNameDialogComponent,
        ConfirmDialogComponent,
        ReplyFormComponent,
        MediaLightboxComponent,
        ForumPostComponent,
        PostEditFormComponent,
        ContentBlockComponent,
        PostMetaBarComponent,
        PostHeaderBarComponent,
        CreateDiscussionDialogComponent,
  ],
    templateUrl: './forum-detail.component.html',
    styleUrls: ['./forum-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumDetailComponent implements OnInit {
  // ==================== INJECTIONS ====================
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  readonly postEditService = inject(PostEditService);
  readonly lightboxService = inject(LightboxService);

  // ==================== VIEW CHILDREN ====================
  /** Fő reply form referencia (reset-hez) */
  private readonly mainReplyForm = viewChild<ReplyFormComponent>('mainReplyForm');

  // ==================== STATE ====================
  /** Beszélgetés adatok */
  readonly discussion = signal<DiscussionDetail | null>(null);

  /** Betöltés */
  readonly isLoading = signal<boolean>(true);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Sikeres üzenet */
  readonly successMessage = signal<string | null>(null);

  /** Hozzászólás küldés folyamatban */
  readonly isSubmitting = signal<boolean>(false);

  /** Válaszolás erre a post-ra (ID) */
  readonly replyingToId = signal<number | null>(null);

  /** Guest név dialógus */
  readonly showGuestNameDialog = signal<boolean>(false);
  readonly isGuestRegistering = signal<boolean>(false);
  readonly guestError = signal<string | null>(null);

  /** Törlés megerősítő dialógus */
  readonly showDeleteDialog = signal<boolean>(false);
  readonly postToDelete = signal<DiscussionPost | null>(null);
  readonly isDeleting = signal<boolean>(false);

  /** Téma szerkesztés dialógus */
  readonly showTopicEditDialog = signal<boolean>(false);
  readonly isTopicSaving = signal<boolean>(false);
  readonly topicEditError = signal<string | null>(null);

  /** Computed: discussion createdAt formázva (elkerüli a template függvényhívást) */
  readonly discussionTimeAgo = computed(() => {
    const d = this.discussion();
    return d ? formatTimeAgo(d.createdAt) : '';
  });

  /** Computed: Téma leírása (első post) */
  readonly topicDescription = computed(() => {
    const disc = this.discussion();
    if (!disc || disc.posts.length === 0) return null;
    return disc.posts[0]; // Első post = leírás
  });

  /** Computed: Valódi hozzászólások (többi post) */
  readonly topicComments = computed(() => {
    const disc = this.discussion();
    if (!disc) return [];
    return disc.posts.slice(1); // Többi post = hozzászólások
  });

  /** Computed: Van-e hozzászólás (nem csak a leírás) */
  readonly hasComments = computed(() => this.topicComments().length > 0);

  /** Computed: Van-e reakció a témán (első post-on) */
  readonly hasTopicReactions = computed(() => {
    const description = this.topicDescription();
    if (!description?.reactions) return false;
    return Object.values(description.reactions).some(count => count > 0);
  });

  /** Computed: A jelenlegi felhasználó a téma szerzője-e */
  readonly isTopicAuthor = computed(() => {
    const description = this.topicDescription();
    if (!description) return false;
    // Ha a post-nak van canEdit vagy canDelete property-je, akkor a szerző
    return description.canEdit !== undefined || description.canDelete !== undefined;
  });

  /** Computed: Téma szerkeszthető-e (MINDENKIRE vonatkozik, contact-ra is!) */
  readonly canEditTopic = computed(() => {
    const description = this.topicDescription();
    if (!description) return false;

    // 1. Nincs hozzászólás
    if (this.hasComments()) return false;

    // 2. Nincs reakció
    if (this.hasTopicReactions()) return false;

    // 3. Backend szerinti jogosultság (15 percen belül + saját post)
    return description.canEdit ?? false;
  });

  /** Computed: Edit data a dialógushoz */
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

  /** Computed: Header badge-ek */
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private authService: AuthService,
    private guestService: GuestService
  ) {
    // Lightbox cleanup regisztrálása
    this.lightboxService.registerCleanup(this.destroyRef);
  }

  ngOnInit(): void {
    // Vendég névbekérés ellenőrzése
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showGuestNameDialog.set(true);
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadDiscussion(slug);
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

  // ==================== NAVIGATION ====================

  goBack(): void {
    this.router.navigate(['/forum']);
  }

  /** Görgetés a hozzászólások szekcióhoz */
  scrollToComments(): void {
    const postsElement = document.querySelector('.forum-detail__posts');
    if (postsElement) {
      postsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==================== REPLY ====================

  submitReply(data: { content: string; parentId?: number; media?: File[] }): void {
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

        // Form reset sikeres küldés után
        this.mainReplyForm()?.reset();

        // Optimista UI update - NEM reload!
        const updatedPosts = addPostToTree(currentDiscussion.posts, newPost);
        this.discussion.set({
          ...currentDiscussion,
          posts: updatedPosts,
          postsCount: currentDiscussion.postsCount + 1
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);

        // 429 Too Many Requests kezelése
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

  startReply(postId: number): void {
    this.replyingToId.set(postId);
  }

  cancelReply(): void {
    this.replyingToId.set(null);
  }

  // ==================== REACTIONS ====================

  onReaction(post: DiscussionPost, reaction: ReactionEmoji): void {
    const currentDiscussion = this.discussion();
    if (!currentDiscussion) return;

    // Optimistic update - azonnal frissítjük az UI-t
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

    this.discussion.set({
      ...currentDiscussion,
      posts: optimisticPosts
    });

    // API hívás háttérben
    this.forumService.toggleReaction(post.id, reaction).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        // Szerver válasz - frissítjük a pontos értékekkel
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

          this.discussion.set({
            ...freshDiscussion,
            posts: updatedPosts
          });
        }
      },
      error: () => {
        // Hiba esetén rollback az eredeti állapotra
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

          this.discussion.set({
            ...freshDiscussion,
            posts: rolledBackPosts
          });
        }
        this.toastService.error('Hiba', 'Nem sikerült a reakció mentése.', 3000);
      }
    });
  }

  // ==================== TOPIC EDIT/DELETE ====================

  /** Téma (első post) szerkesztése - dialógus megnyitása */
  onEditTopic(): void {
    const description = this.topicDescription();
    if (!description) return;

    // 1. Időkorlát (15 perc) - MINDENKIRE vonatkozik!
    if (this.isEditTimeExpired(description)) {
      this.toastService.error(
        'Szerkesztés nem lehetséges',
        'A szerkesztési időkorlát lejárt (15 perc).',
        4000
      );
      return;
    }

    // 2. Hozzászólások ellenőrzése - MINDENKIRE vonatkozik!
    if (this.hasComments()) {
      this.toastService.error(
        'Szerkesztés nem lehetséges',
        'A témához már érkeztek hozzászólások, ezért nem módosítható.',
        4000
      );
      return;
    }

    // 3. Reakciók ellenőrzése - MINDENKIRE vonatkozik!
    if (this.hasTopicReactions()) {
      this.toastService.error(
        'Szerkesztés nem lehetséges',
        'A témára már érkeztek reakciók, ezért nem módosítható.',
        4000
      );
      return;
    }

    // 4. Backend szerinti jogosultság (saját post-e)
    if (!description.canEdit) {
      this.toastService.error(
        'Szerkesztés nem lehetséges',
        'Nincs jogosultságod a téma szerkesztéséhez.',
        4000
      );
      return;
    }

    this.topicEditError.set(null);
    this.showTopicEditDialog.set(true);
  }

  /** Téma szerkesztés dialógus eredmény kezelése */
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

    // Először a cím frissítése (discussion title)
    this.forumService.updateDiscussion(currentDiscussion.id, { title: result.title }).pipe(
      switchMap(() => {
        // Majd a tartalom + média frissítése (első post content + media)
        return this.forumService.updatePost(
          description.id,
          result.content,
          result.newMedia,
          result.deleteMediaIds
        );
      }),
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

        // Specifikus hibaüzenet
        let errorTitle = 'Hiba';
        let errorMessage = err.message || 'Nem sikerült menteni a módosításokat.';

        if (err.message?.includes('jogosultság') || err.message?.includes('Forbidden')) {
          errorTitle = 'Szerkesztés nem lehetséges';
          errorMessage = 'A szerkesztési időkorlát lejárt (15 perc), vagy nincs jogosultságod a módosításhoz.';
        }

        this.toastService.error(errorTitle, errorMessage, 5000);
      }
    });
  }

  /** Téma törlése (teljes beszélgetés) */
  onDeleteTopic(): void {
    const description = this.topicDescription();
    if (description) {
      this.onDeletePost(description);
    }
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

  // ==================== EDIT ====================

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

        // Optimista UI update - NEM reload!
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

          this.discussion.set({
            ...currentDiscussion,
            posts: updatedPosts
          });
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

  // ==================== LIGHTBOX ====================

  openLightbox(media: DiscussionPost['media'], index: number): void {
    if (media) {
      this.lightboxService.open(media, index);
    }
  }

  closeLightbox(): void {
    this.lightboxService.close();
  }

  onLightboxNavigate(index: number): void {
    this.lightboxService.navigateTo(index);
  }

  // ==================== COMPUTED ACCESSORS ====================

  /** Computed: Lehet-e válaszolni (nem lezárt téma) */
  readonly canReply = computed(() => {
    const d = this.discussion();
    return d !== null && !d.isLocked;
  });

  /** Computed: Contact jogosultság (teljes hozzáférés) */
  readonly hasFullAccess = computed(() => this.authService.hasFullAccess());

  // ==================== HELPERS ====================

  /** TrackBy - egyszerű ID alapú (gyors) */
  trackByPost(index: number, post: DiscussionPost): number {
    return post.id;
  }

  /** Relatív idő formázás (utility használata) */
  formatTimeAgo(dateStr: string): string {
    return formatTimeAgo(dateStr);
  }

  /** Hátralévő szerkesztési idő (service használata) */
  getRemainingEditTime(post: DiscussionPost): string {
    return this.postEditService.getRemainingEditTime(post.createdAt);
  }

  /** Szerkesztési idő lejárt-e (service használata) */
  isEditTimeExpired(post: DiscussionPost): boolean {
    return this.postEditService.isEditTimeExpired(post.createdAt);
  }

  /** Sikeres üzenet megjelenítése 3mp-re (memory-safe timer) */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    // timer + takeUntilDestroyed helyett setTimeout
    // mert a sikeres üzenet eltűnése nem kritikus ha a komponens destroyolódik
    timer(3000).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.successMessage.set(null));
  }
}
