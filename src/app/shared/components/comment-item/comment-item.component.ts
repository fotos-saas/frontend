import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import {
  ReactionsSummary,
  ReactionEmoji,
  ReactionPickerComponent
} from '../reaction-picker/reaction-picker.component';
import { PostAvatarComponent } from '../post-avatar/post-avatar.component';
import { AuthorType } from '../post-header/post-header.component';
import { ReplyToggleButtonComponent } from '../action-buttons';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

/**
 * Szerző típus (badge megjelenítéshez)
 * Kompatibilis a PostHeaderComponent AuthorType-jával
 */
export type CommentAuthorType = AuthorType;

/**
 * Komment buborék variáns (szín)
 * - default: kék/szürke
 * - pinned: sárga/narancs
 * - event: lila
 */
export type CommentVariant = 'default' | 'pinned' | 'event';

/**
 * CommentItem Component
 *
 * Újrafelhasználható hozzászólás komponens fórum stílusban.
 * Használható: fórum, newsfeed, bökések, stb.
 *
 * Újrafelhasználja:
 * - PostAvatarComponent - avatar megjelenítés
 * - PostHeaderComponent - szerző név, badge, időpont
 *
 * Modern Angular API:
 * - input() / output() signals (Angular 17+)
 * - OnPush change detection
 *
 * @example
 * <app-comment-item
 *   [authorName]="comment.authorName"
 *   [authorType]="comment.authorType"
 *   [content]="comment.content"
 *   [createdAt]="comment.createdAt"
 *   [isEdited]="comment.isEdited"
 *   [canDelete]="comment.canDelete"
 *   [showReactions]="true"
 *   [reactions]="comment.reactions"
 *   [userReaction]="comment.userReaction"
 *   (delete)="onDelete(comment)"
 *   (reactionSelected)="onReaction(comment, $event)"
 * />
 */
@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    PostAvatarComponent,
    ReactionPickerComponent,
    ReplyToggleButtonComponent,
    TimeAgoPipe,
  ],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentItemComponent {
  // ==================== INPUTS (Signal-based) ====================

  /** Szerző neve */
  readonly authorName = input.required<string>();

  /** Szerző típus (badge-hez) */
  readonly authorType = input<CommentAuthorType>('guest');

  /** Hozzászólás tartalma */
  readonly content = input.required<string>();

  /** Létrehozás ideje */
  readonly createdAt = input.required<string>();

  /** Szerkesztve-e */
  readonly isEdited = input<boolean>(false);

  /** Törölhető-e */
  readonly canDelete = input<boolean>(false);

  /** Reakciók összesítése */
  readonly reactions = input<ReactionsSummary>({});

  /** User reakciója */
  readonly userReaction = input<string | null>(null);

  /** Reakciók megjelenítése */
  readonly showReactions = input<boolean>(false);

  /** Válasz gomb megjelenítése */
  readonly showReply = input<boolean>(false);

  /** Border nélküli megjelenítés (nested kommentekhez) */
  readonly noBorder = input<boolean>(false);

  /** Buborék színvariáns (default/pinned/event) */
  readonly variant = input<CommentVariant>('default');

  /** Reply-e (világosabb buborék) */
  readonly isReply = input<boolean>(false);

  /** Válaszok száma (ha van, megjelenik a toggle gomb) */
  readonly repliesCount = input<number>(0);

  /** Válaszok kinyitva-e */
  readonly repliesExpanded = input<boolean>(false);

  /** Új komment jelzés (animációhoz) */
  readonly isNew = input<boolean>(false);

  // ==================== OUTPUTS (Signal-based) ====================

  /** Törlés event */
  readonly delete = output<void>();

  /** Reakció kiválasztva event */
  readonly reactionSelected = output<ReactionEmoji>();

  /** Válasz event */
  readonly reply = output<void>();

  /** Toggle replies event */
  readonly toggleReplies = output<void>();

  // ==================== METHODS ====================

  /**
   * Reakció kezelése
   */
  onReactionSelected(emoji: ReactionEmoji): void {
    this.reactionSelected.emit(emoji);
  }

  /**
   * Törlés kezelése
   */
  onDeleteClick(): void {
    this.delete.emit();
  }

  /**
   * Válasz kezelése
   */
  onReplyClick(): void {
    this.reply.emit();
  }

  /**
   * Replies toggle kezelése
   */
  onToggleReplies(): void {
    this.toggleReplies.emit();
  }
}
