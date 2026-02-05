import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import {
  ReactionPickerComponent,
  ReactionEmoji,
  ReactionsSummary
} from '../reaction-picker/reaction-picker.component';
import {
  DeleteButtonComponent,
  EditButtonComponent,
  ReplyButtonComponent
} from '../action-buttons';

/**
 * PostActionsComponent
 *
 * Újrafelhasználható komponens a post akció gombokhoz.
 * Tartalmazza a reakció pickert és az akció gombokat (válasz, szerkesztés, törlés).
 *
 * @example
 * <app-post-actions
 *   [reactions]="post.reactions"
 *   [userReaction]="post.userReaction"
 *   [canReply]="true"
 *   [canEdit]="post.canEdit"
 *   [canDelete]="post.canDelete"
 *   [remainingEditTime]="'5 perc'"
 *   (reactionSelected)="onReaction($event)"
 *   (reply)="startReply()"
 *   (edit)="startEdit()"
 *   (delete)="onDelete()"
 * />
 */
@Component({
  selector: 'app-post-actions',
  standalone: true,
  imports: [
    ReactionPickerComponent,
    DeleteButtonComponent,
    EditButtonComponent,
    ReplyButtonComponent,
  ],
  template: `
    <div class="post-actions">
      <!-- Bal oldal: Reakció picker + Válasz gomb -->
      <div class="post-actions__left">
        <app-reaction-picker
          [reactions]="reactions()"
          [userReaction]="userReaction()"
          (reactionSelected)="onReactionSelected($event)"
        />

        @if (canReply()) {
          <app-reply-button
            display="icon-text"
            (clicked)="onReplyClick()"
          />
        }
      </div>

      <!-- Jobb oldal: Szerkesztés + Törlés -->
      @if (canEdit() || canDelete()) {
        <div class="post-actions__right">
          @if (canEdit()) {
            <app-edit-button
              display="icon-only"
              (clicked)="onEditClick()"
            />
          }

          @if (canDelete()) {
            <app-delete-button
              display="icon-only"
              (clicked)="onDeleteClick()"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .post-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;

      &__left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      &__right {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-left: 0.5rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostActionsComponent {
  /** Reakciók összesítése */
  readonly reactions = input<ReactionsSummary>({});

  /** User jelenlegi reakciója */
  readonly userReaction = input<string | null>(null);

  /** Válasz gomb látható-e */
  readonly canReply = input<boolean>(false);

  /** Szerkesztés gomb látható-e */
  readonly canEdit = input<boolean>(false);

  /** Törlés gomb látható-e */
  readonly canDelete = input<boolean>(false);

  /** Hátralévő szerkesztési idő (opcionális) */
  readonly remainingEditTime = input<string | undefined>(undefined);

  /** Reakció kiválasztva */
  readonly reactionSelected = output<ReactionEmoji>();

  /** Válasz gomb kattintás */
  readonly reply = output<void>();

  /** Szerkesztés gomb kattintás */
  readonly edit = output<void>();

  /** Törlés gomb kattintás */
  readonly delete = output<void>();

  onReactionSelected(emoji: ReactionEmoji): void {
    this.reactionSelected.emit(emoji);
  }

  onReplyClick(): void {
    this.reply.emit();
  }

  onEditClick(): void {
    this.edit.emit();
  }

  onDeleteClick(): void {
    this.delete.emit();
  }
}
