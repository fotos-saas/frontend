import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef, computed, Signal, ViewChild, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsfeedService, NewsfeedPost, NewsfeedFilters, NewsfeedMedia, NewsfeedComment } from '../../../core/services/newsfeed.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { NewsfeedCardComponent } from '../newsfeed-card/newsfeed-card.component';
import { CreatePostDialogComponent, CreatePostResult } from '../create-post-dialog/create-post-dialog.component';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { ToastService } from '../../../core/services/toast.service';
import { calculateOptimisticReaction, calculateLikesCount } from '../../../shared/utils/optimistic-reaction.util';

/**
 * Newsfeed List Component
 *
 * Hírfolyam lista:
 * - Kitűzött posztok felül
 * - Típus szerinti szűrés (bejelentés/esemény)
 * - Új poszt létrehozás (mindenki)
 */
@Component({
  selector: 'app-newsfeed-list',
  imports: [
    CommonModule,
    RouterModule,
    GuestNameDialogComponent,
    NewsfeedCardComponent,
    CreatePostDialogComponent,
    MediaLightboxComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './newsfeed-list.component.html',
  styleUrls: ['./newsfeed-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsfeedListComponent implements OnInit, AfterViewInit {
  /** Filter container és gombok a sliding indicator-hoz */
  @ViewChild('filterContainer') filterContainer!: ElementRef<HTMLElement>;
  @ViewChildren('filterBtn') filterButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly newsfeedService = inject(NewsfeedService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  /** Posztok */
  readonly posts = signal<NewsfeedPost[]>([]);

  /** Betöltés */
  readonly isLoading = signal<boolean>(true);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Guest név dialógus */
  readonly showGuestNameDialog = signal<boolean>(false);
  readonly isGuestRegistering = signal<boolean>(false);
  readonly guestError = signal<string | null>(null);

  /** Új poszt dialógus */
  readonly showCreateDialog = signal<boolean>(false);

  /** Szerkesztendő poszt (edit módhoz) */
  readonly editingPost = signal<NewsfeedPost | null>(null);

  /** Aktuális szűrő */
  readonly activeFilter = signal<'all' | 'announcement' | 'event'>('all');

  /** Lightbox állapot */
  readonly lightboxOpen = signal<boolean>(false);
  readonly lightboxMedia = signal<NewsfeedMedia[]>([]);
  readonly lightboxIndex = signal<number>(0);

  /** Törlés dialógus állapot (poszt) */
  readonly showDeleteDialog = signal<boolean>(false);
  readonly postToDelete = signal<NewsfeedPost | null>(null);
  readonly isDeleting = signal<boolean>(false);

  /** Törlés dialógus állapot (komment) */
  readonly showCommentDeleteDialog = signal<boolean>(false);
  readonly commentToDelete = signal<{ post: NewsfeedPost; comment: NewsfeedComment } | null>(null);

  /** Kommentek post-onként (postId -> comments) */
  readonly commentsMap = signal<Map<number, NewsfeedComment[]>>(new Map());

  /** Kommentek betöltés állapota (postId -> loading) */
  readonly commentsLoadingMap = signal<Map<number, boolean>>(new Map());

  /** Kitűzött posztok (computed - hatékonyabb mint getter) */
  readonly pinnedPosts: Signal<NewsfeedPost[]> = computed(() =>
    this.posts().filter(p => p.isPinned)
  );

  /** Nem kitűzött posztok (computed - hatékonyabb mint getter) */
  readonly regularPosts: Signal<NewsfeedPost[]> = computed(() =>
    this.posts().filter(p => !p.isPinned)
  );

  ngOnInit(): void {
    // Vendég névbekérés ellenőrzése - csak 'share' session esetén
    // A 'code' session kapcsolattartóként működik (van contact_id a token-ben)
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showGuestNameDialog.set(true);
    }

    this.loadPosts();
  }

  ngAfterViewInit(): void {
    // Sliding indicator inicializálása (timer a memory leak elkerüléséhez)
    timer(0).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateFilterIndicator());
  }

  /**
   * Filter indicator pozíciójának frissítése
   */
  private updateFilterIndicator(): void {
    if (!this.filterContainer || !this.filterButtons) return;

    const container = this.filterContainer.nativeElement;
    const buttons = this.filterButtons.toArray();
    const filterMap = { all: 0, announcement: 1, event: 2 };
    const activeIndex = filterMap[this.activeFilter()];
    const activeBtn = buttons[activeIndex]?.nativeElement;

    if (activeBtn) {
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      container.style.setProperty('--indicator-left', `${left}px`);
      container.style.setProperty('--indicator-width', `${width}px`);
    }
  }

  /**
   * Posztok betöltése (opcionális szűréssel)
   */
  loadPosts(filters?: NewsfeedFilters): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentFilters = filters || {};

    this.newsfeedService.loadPosts(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          // Rendezés: kitűzöttek felül, aztán dátum szerint
          const sorted = [...posts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.posts.set(sorted);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Szűrő változás
   */
  onFilterChange(filter: 'all' | 'announcement' | 'event'): void {
    this.activeFilter.set(filter);

    // Sliding indicator frissítése (timer a memory leak elkerüléséhez)
    timer(0).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateFilterIndicator());

    const filters: NewsfeedFilters = {};
    if (filter !== 'all') {
      filters.type = filter;
    }
    this.loadPosts(filters);
  }

  /**
   * Kommentek lekérése egy poszthoz
   */
  getCommentsForPost(postId: number): NewsfeedComment[] {
    return this.commentsMap().get(postId) || [];
  }

  /**
   * Komment betöltés állapot
   */
  isCommentsLoading(postId: number): boolean {
    return this.commentsLoadingMap().get(postId) || false;
  }

  /**
   * Új poszt létrehozása
   */
  createPost(): void {
    this.editingPost.set(null); // Biztosan nincs edit mód
    this.showCreateDialog.set(true);
  }

  /**
   * Poszt szerkesztése
   */
  editPost(post: NewsfeedPost): void {
    this.editingPost.set(post);
    this.showCreateDialog.set(true);
  }

  /**
   * Card edit gomb kattintás
   */
  onCardEditClick(post: NewsfeedPost): void {
    this.editPost(post);
  }

  /**
   * Új poszt / szerkesztés dialógus eredmény
   */
  onCreatePostResult(result: CreatePostResult): void {
    this.showCreateDialog.set(false);
    this.editingPost.set(null);

    if (result.action === 'created' || result.action === 'updated') {
      // Poszt létrejött/frissült - újratöltjük a listát
      this.loadPosts(this.currentFilters);
    }
  }

  /** Aktuális szűrők tárolása */
  private currentFilters: NewsfeedFilters = {};

  /**
   * Guest név dialógus eredmény
   */
  onGuestNameResult(result: GuestNameResult): void {
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

  /**
   * Reakció kezelés - Optimistic Update
   */
  onReaction(post: NewsfeedPost, reaction: ReactionEmoji): void {
    // Optimistic update - azonnal frissítjük az UI-t
    const { optimisticReactions, optimisticUserReaction, rollback } =
      calculateOptimisticReaction(post.reactions, post.userReaction, reaction);

    const optimisticPosts = this.posts().map(p =>
      p.id === post.id
        ? {
            ...p,
            hasLiked: optimisticUserReaction !== null,
            userReaction: optimisticUserReaction,
            reactions: optimisticReactions,
            likesCount: calculateLikesCount(optimisticReactions)
          }
        : p
    );
    this.posts.set(optimisticPosts);

    // API hívás háttérben
    this.newsfeedService.toggleReaction(post.id, reaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          // Szerver válasz - frissítjük a pontos értékekkel
          const updated = this.posts().map(p =>
            p.id === post.id
              ? {
                  ...p,
                  hasLiked: result.hasReacted,
                  userReaction: result.userReaction,
                  reactions: result.reactions,
                  likesCount: result.likesCount
                }
              : p
          );
          this.posts.set(updated);
        },
        error: () => {
          // Hiba esetén rollback az eredeti állapotra
          const original = rollback();
          const rolledBack = this.posts().map(p =>
            p.id === post.id
              ? {
                  ...p,
                  hasLiked: original.userReaction !== null,
                  userReaction: original.userReaction,
                  reactions: original.reactions,
                  likesCount: calculateLikesCount(original.reactions)
                }
              : p
          );
          this.posts.set(rolledBack);
          this.toastService.error('Hiba', 'Nem sikerült a reakció mentése.', 3000);
        }
      });
  }

  /**
   * TrackBy post id alapján
   */
  trackByPostId(index: number, post: NewsfeedPost): number {
    return post.id;
  }

  /**
   * Kapcsolattartó-e a bejelentkezett felhasználó (code vagy preview token)
   */
  isContact(): boolean {
    return this.authService.hasFullAccess();
  }

  // ==================== KITŰZÉS ====================

  /**
   * Poszt kitűzés/levétel toggle
   */
  onTogglePin(post: NewsfeedPost): void {
    const wasPinned = post.isPinned;

    // Optimistic update
    this.posts.update(posts => posts.map(p =>
      p.id === post.id ? { ...p, isPinned: !wasPinned } : p
    ));

    const action$ = wasPinned
      ? this.newsfeedService.unpinPost(post.id)
      : this.newsfeedService.pinPost(post.id);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        // Siker - újrarendezzük a listát
        this.posts.update(posts => {
          const sorted = [...posts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          return sorted;
        });
        this.toastService.success(
          wasPinned ? 'Levéve' : 'Kitűzve',
          wasPinned ? 'A bejegyzés kitűzése levéve.' : 'A bejegyzés kitűzve.',
          3000
        );
      },
      error: () => {
        // Rollback
        this.posts.update(posts => posts.map(p =>
          p.id === post.id ? { ...p, isPinned: wasPinned } : p
        ));
        this.toastService.error('Hiba', 'Nem sikerült a művelet.', 3000);
      }
    });
  }

  // ==================== TÖRLÉS ====================

  /**
   * Törlés gomb kattintás - dialógus megnyitása
   */
  onPostDeleteClick(post: NewsfeedPost): void {
    this.postToDelete.set(post);
    this.showDeleteDialog.set(true);
  }

  /**
   * Törlés dialógus eredmény kezelése
   */
  onDeleteDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.showDeleteDialog.set(false);
      this.postToDelete.set(null);
      return;
    }

    // Törlés végrehajtása
    const post = this.postToDelete();
    if (!post) return;

    this.isDeleting.set(true);
    this.newsfeedService.deletePost(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Poszt eltávolítása a listából
          this.posts.set(this.posts().filter(p => p.id !== post.id));
          this.showDeleteDialog.set(false);
          this.postToDelete.set(null);
          this.isDeleting.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.showDeleteDialog.set(false);
          this.postToDelete.set(null);
          this.isDeleting.set(false);
        }
      });
  }

  // ==================== KOMMENTEK ====================

  /**
   * Kommentek toggle - betöltés ha még nem töltöttük be
   */
  onToggleComments(post: NewsfeedPost): void {
    const postId = post.id;

    // Ha már van betöltve, nem töltjük újra
    if (this.commentsMap().has(postId)) {
      return;
    }

    // Betöltés indítása
    const loadingMap = new Map(this.commentsLoadingMap());
    loadingMap.set(postId, true);
    this.commentsLoadingMap.set(loadingMap);

    this.newsfeedService.getComments(postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          const map = new Map(this.commentsMap());
          map.set(postId, comments);
          this.commentsMap.set(map);

          const loading = new Map(this.commentsLoadingMap());
          loading.set(postId, false);
          this.commentsLoadingMap.set(loading);
        },
        error: () => {
          const loading = new Map(this.commentsLoadingMap());
          loading.set(postId, false);
          this.commentsLoadingMap.set(loading);
        }
      });
  }

  /**
   * Új komment küldése
   */
  onSubmitComment(post: NewsfeedPost, data: { content: string; parentId?: number }): void {
    this.newsfeedService.createComment(post.id, data.content, data.parentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newComment) => {
          // Új komment megjelölése animációhoz
          const newCommentWithFlag = { ...newComment, isNew: true };

          const map = new Map(this.commentsMap());
          const existing = map.get(post.id) || [];

          if (data.parentId) {
            // Ez egy válasz - a szülő komment replies-ába kell tenni
            const updatedComments = existing.map(c => {
              if (c.id === data.parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newCommentWithFlag]
                };
              }
              return c;
            });
            map.set(post.id, updatedComments);
          } else {
            // Új top-level komment
            map.set(post.id, [...existing, newCommentWithFlag]);
          }
          this.commentsMap.set(map);

          // Frissítjük a poszt komment számát
          this.posts.update(posts => posts.map(p =>
            p.id === post.id
              ? { ...p, commentsCount: p.commentsCount + 1 }
              : p
          ));

          // Scrollozás az új kommenthez
          timer(100).pipe(
            take(1),
            takeUntilDestroyed(this.destroyRef)
          ).subscribe(() => {
            this.scrollToNewComment(post.id, newComment.id, data.parentId);
          });

          // isNew flag eltávolítása az animáció után
          timer(2500).pipe(
            take(1),
            takeUntilDestroyed(this.destroyRef)
          ).subscribe(() => {
            const currentMap = new Map(this.commentsMap());
            const currentComments = currentMap.get(post.id) || [];

            if (data.parentId) {
              // Reply - eltávolítjuk az isNew flag-et
              const updatedComments = currentComments.map(c => {
                if (c.id === data.parentId && c.replies) {
                  return {
                    ...c,
                    replies: c.replies.map(r =>
                      r.id === newComment.id ? { ...r, isNew: false } : r
                    )
                  };
                }
                return c;
              });
              currentMap.set(post.id, updatedComments);
            } else {
              // Top-level komment - eltávolítjuk az isNew flag-et
              currentMap.set(post.id, currentComments.map(c =>
                c.id === newComment.id ? { ...c, isNew: false } : c
              ));
            }
            this.commentsMap.set(currentMap);
          });
        },
        error: () => {
          // Silent fail - UI already handles error state
        }
      });
  }

  /**
   * Komment törlés kérés - dialógus megnyitása
   */
  onDeleteComment(post: NewsfeedPost, comment: NewsfeedComment): void {
    this.commentToDelete.set({ post, comment });
    this.showCommentDeleteDialog.set(true);
  }

  /**
   * Komment törlés dialógus eredmény
   */
  onCommentDeleteDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const data = this.commentToDelete();
      if (data) {
        this.executeCommentDelete(data.post, data.comment);
      }
    }
    this.showCommentDeleteDialog.set(false);
    this.commentToDelete.set(null);
  }

  /**
   * Komment törlés végrehajtása
   */
  private executeCommentDelete(post: NewsfeedPost, comment: NewsfeedComment): void {
    this.newsfeedService.deleteComment(comment.id, post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Eltávolítjuk a kommentet a listából
          const map = new Map(this.commentsMap());
          const existing = map.get(post.id) || [];
          map.set(post.id, existing.filter(c => c.id !== comment.id));
          this.commentsMap.set(map);

          // Frissítjük a poszt komment számát
          this.posts.update(posts => posts.map(p =>
            p.id === post.id
              ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
              : p
          ));
        },
        error: () => {
          // Silent fail
        }
      });
  }

  /**
   * Komment reakció (top-level és reply kommentekhez is)
   */
  onCommentReaction(post: NewsfeedPost, comment: NewsfeedComment, reaction: ReactionEmoji): void {
    this.newsfeedService.toggleCommentReaction(comment.id, reaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          // Frissítjük a kommentet a listában (top-level vagy reply)
          const map = new Map(this.commentsMap());
          const existing = map.get(post.id) || [];
          map.set(post.id, existing.map(c => {
            // Top-level komment?
            if (c.id === comment.id) {
              return { ...c, userReaction: result.userReaction, reactions: result.reactions };
            }
            // Reply komment?
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.map(r =>
                  r.id === comment.id
                    ? { ...r, userReaction: result.userReaction, reactions: result.reactions }
                    : r
                )
              };
            }
            return c;
          }));
          this.commentsMap.set(map);
        }
      });
  }

  /**
   * Scrollozás az újonnan hozzáadott kommenthez
   */
  private scrollToNewComment(postId: number, commentId: number, parentId?: number): void {
    // Ha reply, akkor a szülő komment replies-ában keressük
    if (parentId) {
      const replyElement = document.querySelector(
        `.newsfeed-card__comment-thread[data-comment-id="${parentId}"] .comment-item--new`
      );
      if (replyElement) {
        replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Top-level komment - az utolsó új kommentet keressük
      const newCommentElement = document.querySelector(
        `.newsfeed-card .comment-item--new`
      );
      if (newCommentElement) {
        newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ==================== LIGHTBOX ====================

  /**
   * Card lightbox esemény kezelése
   */
  onCardLightbox(event: { media: NewsfeedMedia[], index: number }): void {
    this.lightboxMedia.set(event.media);
    this.lightboxIndex.set(event.index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Lightbox bezárása
   */
  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  /**
   * Lightbox navigáció
   */
  onLightboxNavigate(index: number): void {
    this.lightboxIndex.set(index);
  }
}
