import { Component, ChangeDetectionStrategy, computed, input, inject, signal, viewChild, DestroyRef, ElementRef, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { NewsfeedPost, NewsfeedMedia, NewsfeedComment } from '../../../core/services/newsfeed.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';
import { ContentBlockComponent } from '../../../shared/components/content-block';
import { PostMetaBarComponent } from '../../../shared/components/post-meta-bar';
import { MediaGridComponent, MediaItem } from '../../../shared/components/media-grid';
import { PostHeaderBarComponent, BadgeConfig } from '../../../shared/components/post-header-bar';
import { MAX_COMMENT_LENGTH } from '../../../shared/constants';

/**
 * Newsfeed Card Component
 *
 * Egy poszt kártyája a listában:
 * - Típus (bejelentés/esemény)
 * - Cím, tartalom előnézet
 * - Esemény részletek (dátum, hely)
 * - Like és komment számok
 */
@Component({
  selector: 'app-newsfeed-card',
  imports: [FormsModule, CommentItemComponent, ContentBlockComponent, PostMetaBarComponent, MediaGridComponent, PostHeaderBarComponent],
  templateUrl: './newsfeed-card.component.html',
  styleUrls: ['./newsfeed-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsfeedCardComponent {
  private readonly destroyRef = inject(DestroyRef);

  /** Signal-alapú input a jobb teljesítményért */
  readonly post = input.required<NewsfeedPost>();

  /** Hozzászólások listája (betöltés után) */
  readonly comments = input<NewsfeedComment[]>([]);

  /** Kommentek betöltés állapota */
  readonly commentsLoading = input<boolean>(false);

  /** Kitűzés engedélyezve-e (kapcsolattartóknak) */
  readonly canPin = input<boolean>(false);

  readonly reactionSelected = output<ReactionEmoji>();
  readonly pinClick = output<void>();
  readonly editClick = output<void>();
  readonly deleteClick = output<void>();
  readonly openLightbox = output<{ media: NewsfeedMedia[], index: number }>();

  /** Kommentek toggle (expand/collapse) */
  readonly toggleComments = output<void>();

  /** Új komment küldése (content + opcionális parentId) */
  readonly submitComment = output<{ content: string; parentId?: number }>();

  /** Komment törlése */
  readonly deleteComment = output<NewsfeedComment>();

  /** Komment reakció */
  readonly commentReaction = output<{ comment: NewsfeedComment; reaction: ReactionEmoji }>();

  /** Kommentek megjelenítése */
  readonly isExpanded = signal<boolean>(false);

  /** Új komment szöveg */
  newCommentText = '';

  /** Válaszolunk-e valakinek */
  readonly replyingTo = signal<NewsfeedComment | null>(null);

  /** Textarea referencia a fókuszáláshoz */
  readonly commentInput = viewChild<ElementRef<HTMLTextAreaElement>>('commentInput');

  /** Szerkeszthető-e a poszt (tulajdonos-e) */
  readonly canEdit = computed(() => this.post().canEdit);

  /** Kitűzött-e */
  readonly isPinned = computed(() => this.post().isPinned);

  /** Esemény típusú-e */
  readonly isEvent = computed(() => this.post().postType === 'event');

  /** Bejelentés típusú-e */
  readonly isAnnouncement = computed(() => this.post().postType === 'announcement');

  /** Header badge-ek */
  readonly headerBadges = computed<BadgeConfig[]>(() => {
    const badges: BadgeConfig[] = [];
    if (this.isEvent()) {
      badges.push({ type: 'event', label: 'Esemény', icon: 'calendar', color: 'purple' });
    } else {
      badges.push({ type: 'announcement', label: 'Bejelentés', icon: 'announcement', color: 'primary' });
    }
    return badges;
  });

  /** Comment buborék variáns a poszt típusa alapján */
  readonly commentVariant = computed<'default' | 'pinned' | 'event'>(() => {
    if (this.isPinned()) return 'pinned';
    if (this.isEvent()) return 'event';
    return 'default';
  });

  /** Melyik kommentek reply-ai vannak kinyitva (comment ID set) */
  readonly expandedReplies = signal<Set<number>>(new Set());

  /** Média lista (MediaItem formátumban) */
  readonly mediaItems = computed<MediaItem[]>(() =>
    this.post().media.map(m => ({
      url: m.url,
      isImage: m.isImage,
      fileName: m.fileName
    }))
  );

  /** Esemény dátum formázva */
  readonly formattedEventDate = computed(() => {
    const eventDate = this.post().eventDate;
    if (!eventDate) return '';
    const date = new Date(eventDate);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('hu-HU', options);
  });

  /**
   * Reakció kiválasztás (megállítjuk a propagációt a ReactionPicker-ben)
   */
  onReaction(reaction: ReactionEmoji): void {
    this.reactionSelected.emit(reaction);
  }

  /**
   * Média kattintás - lightbox megnyitása
   */
  onMediaGridClick(event: { index: number; item: MediaItem }): void {
    // Csak képeknél nyitjuk meg a lightbox-ot
    const imageMedia = this.post().media.filter(m => m.isImage);
    if (imageMedia.length > 0) {
      this.openLightbox.emit({ media: imageMedia, index: event.index });
    }
  }

  /**
   * Kommentek szekció toggle
   */
  onCommentsToggle(): void {
    const wasExpanded = this.isExpanded();
    this.isExpanded.set(!wasExpanded);

    // Ha most nyitjuk ki és még nincsenek betöltve a kommentek
    if (!wasExpanded) {
      this.toggleComments.emit();
    }
  }

  /**
   * Új komment küldése
   * Válasz esetén görget az új válaszhoz
   */
  onSubmitComment(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const content = this.newCommentText.trim();
    if (!content || content.length > MAX_COMMENT_LENGTH) return;

    const replyTo = this.replyingTo();

    this.submitComment.emit({
      content,
      parentId: replyTo?.id
    });

    // Ha válasz volt, kinyitjuk a replies szekciót
    if (replyTo) {
      const current = this.expandedReplies();
      if (!current.has(replyTo.id)) {
        const newSet = new Set(current);
        newSet.add(replyTo.id);
        this.expandedReplies.set(newSet);
      }
    }

    this.newCommentText = '';
    this.replyingTo.set(null);
  }

  /**
   * Komment törlés kérés - továbbítjuk a szülőnek
   */
  onDeleteCommentClick(comment: NewsfeedComment): void {
    this.deleteComment.emit(comment);
  }

  /** Maximum komment hossz (template-ben is használható) */
  readonly maxCommentLength = MAX_COMMENT_LENGTH;

  /**
   * Form érvényesség
   */
  get isCommentValid(): boolean {
    const content = this.newCommentText.trim();
    return content.length >= 1 && content.length <= MAX_COMMENT_LENGTH;
  }

  /**
   * Karakter számláló
   */
  get charCount(): string {
    return `${this.newCommentText.length}/${MAX_COMMENT_LENGTH}`;
  }

  /**
   * TrackBy kommentekhez
   */
  trackByCommentId(_index: number, comment: NewsfeedComment): number {
    return comment.id;
  }

  /**
   * Komment reakció kezelése
   */
  onCommentReaction(comment: NewsfeedComment, reaction: ReactionEmoji): void {
    this.commentReaction.emit({ comment, reaction });
  }

  /**
   * Válasz kommentre
   */
  onReplyToComment(comment: NewsfeedComment): void {
    this.replyingTo.set(comment);
    // Fókusz a textarea-ra (timer a memory leak elkerüléséhez)
    timer(100).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.commentInput()?.nativeElement?.focus();
      this.commentInput()?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /**
   * Válasz megszakítása
   */
  cancelReply(): void {
    this.replyingTo.set(null);
  }

  /**
   * Reply-k toggle (expand/collapse)
   * Kinyitáskor az utolsó válaszokhoz görget
   */
  toggleReplies(commentId: number): void {
    const current = this.expandedReplies();
    const newSet = new Set(current);
    const wasExpanded = newSet.has(commentId);

    if (wasExpanded) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    this.expandedReplies.set(newSet);

    // Ha kinyitottuk, görgetés az utolsó válaszokhoz
    if (!wasExpanded) {
      this.scrollToLastReplies(commentId);
    }
  }

  /**
   * Görgetés az utolsó válaszokhoz (max 3)
   */
  private scrollToLastReplies(commentId: number): void {
    timer(150).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      // Megkeressük a comment thread-et a data-comment-id alapján
      const commentThread = document.querySelector(
        `.newsfeed-card__comment-thread[data-comment-id="${commentId}"]`
      );
      if (!commentThread) return;

      const repliesContainer = commentThread.querySelector('.newsfeed-card__replies');
      if (!repliesContainer) return;

      const replyItems = repliesContainer.querySelectorAll('.newsfeed-card__reply-item');
      if (replyItems.length === 0) return;

      // Ha 3 vagy kevesebb válasz van, az elsőhöz görgetünk
      // Ha több mint 3, akkor a 3.-tól visszaszámolva (utolsó 3 látható)
      const targetIndex = replyItems.length <= 3 ? 0 : replyItems.length - 3;
      const targetElement = replyItems[targetIndex] as HTMLElement;

      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /**
   * Reply-k láthatók-e
   */
  areRepliesExpanded(commentId: number): boolean {
    return this.expandedReplies().has(commentId);
  }
}
