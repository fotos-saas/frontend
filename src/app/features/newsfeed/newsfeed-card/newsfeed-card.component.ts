import { Component, ChangeDetectionStrategy, computed, input, inject, signal, viewChild, DestroyRef, ElementRef, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { NewsfeedPost, NewsfeedMedia, NewsfeedComment } from '../../../core/services/newsfeed.service';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';
import { ContentBlockComponent } from '../../../shared/components/content-block';
import { PostMetaBarComponent } from '../../../shared/components/post-meta-bar';
import { MediaGridComponent, MediaItem } from '../../../shared/components/media-grid';
import { PostHeaderBarComponent, BadgeConfig } from '../../../shared/components/post-header-bar';
import { MAX_COMMENT_LENGTH } from '../../../shared/constants';
import { NewsfeedCardCommentService } from './newsfeed-card-comment.service';

/**
 * Newsfeed Card Component
 *
 * Egy poszt kartyaja a listaban:
 * - Tipus (bejelentes/esemeny)
 * - Cim, tartalom elonezet
 * - Esemeny reszletek (datum, hely)
 * - Like es komment szamok
 */
@Component({
  selector: 'app-newsfeed-card',
  imports: [FormsModule, CommentItemComponent, ContentBlockComponent, PostMetaBarComponent, MediaGridComponent, PostHeaderBarComponent],
  templateUrl: './newsfeed-card.component.html',
  styleUrls: ['./newsfeed-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NewsfeedCardCommentService]
})
export class NewsfeedCardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly commentService = inject(NewsfeedCardCommentService);

  readonly post = input.required<NewsfeedPost>();
  readonly comments = input<NewsfeedComment[]>([]);
  readonly commentsLoading = input<boolean>(false);
  readonly canPin = input<boolean>(false);

  readonly reactionSelected = output<ReactionEmoji>();
  readonly pinClick = output<void>();
  readonly editClick = output<void>();
  readonly deleteClick = output<void>();
  readonly openLightbox = output<{ media: NewsfeedMedia[], index: number }>();
  readonly toggleComments = output<void>();
  readonly submitComment = output<{ content: string; parentId?: number }>();
  readonly deleteComment = output<NewsfeedComment>();
  readonly commentReaction = output<{ comment: NewsfeedComment; reaction: ReactionEmoji }>();

  readonly isExpanded = signal<boolean>(false);
  newCommentText = '';
  readonly replyingTo = signal<NewsfeedComment | null>(null);
  readonly commentInput = viewChild<ElementRef<HTMLTextAreaElement>>('commentInput');

  // Computed signals
  readonly canEdit = computed(() => this.post().canEdit);
  readonly isPinned = computed(() => this.post().isPinned);
  readonly isEvent = computed(() => this.post().postType === 'event');
  readonly isAnnouncement = computed(() => this.post().postType === 'announcement');

  readonly headerBadges = computed<BadgeConfig[]>(() => {
    const badges: BadgeConfig[] = [];
    if (this.isEvent()) {
      badges.push({ type: 'event', label: 'Esemeny', icon: 'calendar', color: 'purple' });
    } else {
      badges.push({ type: 'announcement', label: 'Bejelentes', icon: 'announcement', color: 'primary' });
    }
    return badges;
  });

  readonly commentVariant = computed<'default' | 'pinned' | 'event'>(() => {
    if (this.isPinned()) return 'pinned';
    if (this.isEvent()) return 'event';
    return 'default';
  });

  // Delegate to comment service
  readonly expandedReplies = this.commentService.expandedReplies;

  readonly mediaItems = computed<MediaItem[]>(() =>
    this.post().media.map(m => ({
      url: m.url,
      isImage: m.isImage,
      fileName: m.fileName
    }))
  );

  readonly formattedEventDate = computed(() => {
    const eventDate = this.post().eventDate;
    if (!eventDate) return '';
    const date = new Date(eventDate);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('hu-HU', options);
  });

  // === EVENT HANDLERS ===

  onReaction(reaction: ReactionEmoji): void { this.reactionSelected.emit(reaction); }

  onMediaGridClick(event: { index: number; item: MediaItem }): void {
    const imageMedia = this.post().media.filter(m => m.isImage);
    if (imageMedia.length > 0) {
      this.openLightbox.emit({ media: imageMedia, index: event.index });
    }
  }

  onCommentsToggle(): void {
    const wasExpanded = this.isExpanded();
    this.isExpanded.set(!wasExpanded);
    if (!wasExpanded) { this.toggleComments.emit(); }
  }

  onSubmitComment(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const content = this.newCommentText.trim();
    if (!content || content.length > MAX_COMMENT_LENGTH) return;

    const replyTo = this.replyingTo();

    this.submitComment.emit({ content, parentId: replyTo?.id });

    if (replyTo) {
      this.commentService.ensureRepliesExpanded(replyTo.id);
    }

    this.newCommentText = '';
    this.replyingTo.set(null);
  }

  onDeleteCommentClick(comment: NewsfeedComment): void { this.deleteComment.emit(comment); }

  readonly maxCommentLength = MAX_COMMENT_LENGTH;

  readonly isCommentValid = computed(() => {
    const content = this.newCommentText.trim();
    return content.length >= 1 && content.length <= MAX_COMMENT_LENGTH;
  });

  readonly charCount = computed(() => `${this.newCommentText.length}/${MAX_COMMENT_LENGTH}`);

  trackByCommentId(_index: number, comment: NewsfeedComment): number { return comment.id; }

  onCommentReaction(comment: NewsfeedComment, reaction: ReactionEmoji): void {
    this.commentReaction.emit({ comment, reaction });
  }

  onReplyToComment(comment: NewsfeedComment): void {
    this.replyingTo.set(comment);
    timer(100).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.commentInput()?.nativeElement?.focus();
      this.commentInput()?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  cancelReply(): void { this.replyingTo.set(null); }

  toggleReplies(commentId: number): void {
    this.commentService.toggleReplies(commentId, this.destroyRef);
  }

  areRepliesExpanded(commentId: number): boolean {
    return this.commentService.areRepliesExpanded(commentId);
  }
}
