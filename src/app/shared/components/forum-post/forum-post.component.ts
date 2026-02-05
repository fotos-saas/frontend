import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { PostAvatarComponent } from '../post-avatar/post-avatar.component';
import { PostHeaderComponent, AuthorType } from '../post-header/post-header.component';
import { PostContentComponent } from '../post-content/post-content.component';
import { PostMediaGalleryComponent, PostMediaItem } from '../post-media-gallery/post-media-gallery.component';
import { PostActionsComponent } from '../post-actions/post-actions.component';
import { ReactionEmoji, ReactionsSummary } from '../reaction-picker/reaction-picker.component';

/**
 * ForumPostComponent
 *
 * Teljes hozzászólás megjelenítése újrafelhasználható komponensként.
 * Összerakja a kisebb komponenseket (avatar, header, content, media, actions).
 *
 * A `highlightColor` input-tal kívülről konfigurálható a border-left szín.
 * Az `ng-content` használatával beágyazható az edit form, reply form és nested reply-k.
 *
 * @example
 * <app-forum-post
 *   [authorName]="post.authorName"
 *   [authorType]="post.authorType"
 *   [content]="post.content"
 *   [createdAt]="post.createdAt"
 *   [isEdited]="post.isEdited"
 *   [canEdit]="post.canEdit"
 *   [canDelete]="post.canDelete"
 *   [canReply]="true"
 *   [reactions]="post.reactions"
 *   [userReaction]="post.userReaction"
 *   [media]="post.media"
 *   [highlightColor]="post.authorType === 'contact' ? '#3b82f6' : undefined"
 *   (reactionSelected)="onReaction($event)"
 *   (reply)="startReply()"
 *   (edit)="startEdit()"
 *   (delete)="onDelete()"
 *   (mediaClick)="openLightbox($event.index)"
 * >
 *   <!-- Edit form, reply form, vagy nested reply-k -->
 *   <ng-content></ng-content>
 * </app-forum-post>
 */
@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [
    PostAvatarComponent,
    PostHeaderComponent,
    PostContentComponent,
    PostMediaGalleryComponent,
    PostActionsComponent,
  ],
  templateUrl: './forum-post.component.html',
  styleUrls: ['./forum-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumPostComponent {
  // ==================== INPUTS ====================

  /** Szerző neve */
  readonly authorName = input.required<string>();

  /** Szerző típusa */
  readonly authorType = input.required<AuthorType>();

  /** Tartalom (HTML) */
  readonly content = input.required<string>();

  /** Létrehozás időpontja */
  readonly createdAt = input.required<string>();

  /** Szerkesztve lett-e */
  readonly isEdited = input<boolean>(false);

  /** Szerkeszthető-e */
  readonly canEdit = input<boolean>(false);

  /** Törölhető-e */
  readonly canDelete = input<boolean>(false);

  /** Válaszolhat-e */
  readonly canReply = input<boolean>(false);

  /** Reakciók összesítése */
  readonly reactions = input<ReactionsSummary>({});

  /** User jelenlegi reakciója */
  readonly userReaction = input<string | null>(null);

  /** Média csatolmányok */
  readonly media = input<PostMediaItem[]>([]);

  /** Reply-e (kisebb méret) */
  readonly isReply = input<boolean>(false);

  /** Szerkesztés módban van-e */
  readonly isEditing = input<boolean>(false);

  /** Kiemelés szín (border-left) */
  readonly highlightColor = input<string | undefined>(undefined);

  /** Hátralévő szerkesztési idő */
  readonly remainingEditTime = input<string | undefined>(undefined);

  /** Egyedi badge szöveg */
  readonly badgeText = input<string | undefined>(undefined);

  // ==================== OUTPUTS ====================

  /** Reakció kiválasztva */
  readonly reactionSelected = output<ReactionEmoji>();

  /** Válasz gomb kattintás */
  readonly reply = output<void>();

  /** Szerkesztés gomb kattintás */
  readonly edit = output<void>();

  /** Törlés gomb kattintás */
  readonly delete = output<void>();

  /** Média kattintás */
  readonly mediaClick = output<{ index: number }>();

  // ==================== EVENT HANDLERS ====================

  onReactionSelected(emoji: ReactionEmoji): void {
    this.reactionSelected.emit(emoji);
  }

  onReply(): void {
    this.reply.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onMediaClick(event: { index: number }): void {
    this.mediaClick.emit(event);
  }
}
