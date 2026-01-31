import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { ReactionPickerComponent, ReactionEmoji, ReactionsSummary } from '../reaction-picker/reaction-picker.component';
import { CommentButtonComponent } from '../action-buttons';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

/**
 * PostMetaBarComponent
 *
 * Újrahasználható meta sáv postokhoz:
 * - Szerző neve
 * - Idő (óra ikonnal, opcionálisan kattintható)
 * - Reakciók (ReactionPicker)
 * - Hozzászólások (opcionális gomb)
 *
 * @example
 * <app-post-meta-bar
 *   [authorName]="post.authorName"
 *   [createdAt]="post.createdAt"
 *   [reactions]="post.reactions"
 *   [userReaction]="post.userReaction"
 *   [commentsCount]="post.commentsCount"
 *   (reactionSelected)="onReaction($event)"
 *   (commentsClick)="onCommentsToggle()"
 * />
 */
@Component({
  selector: 'app-post-meta-bar',
  standalone: true,
  imports: [ReactionPickerComponent, CommentButtonComponent, TimeAgoPipe],
  templateUrl: './post-meta-bar.component.html',
  styleUrl: './post-meta-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostMetaBarComponent {
  // === INPUTS ===

  /** Szerző neve */
  readonly authorName = input.required<string>();

  /** Létrehozás dátuma (ISO string) */
  readonly createdAt = input.required<string>();

  /** Reakciók objektum */
  readonly reactions = input<ReactionsSummary | null | undefined>({});

  /** Felhasználó reakciója */
  readonly userReaction = input<ReactionEmoji | string | null | undefined>(null);

  /** Hozzászólások száma */
  readonly commentsCount = input<number>(0);

  /** Hozzászólás label (default: "hozzászólás") */
  readonly commentsLabel = input<string>('hozzászólás');

  /** Hozzászólás gomb megjelenítése */
  readonly showComments = input<boolean>(true);

  /** Hozzászólás gomb aktív állapota (kinyitott comments) */
  readonly commentsActive = input<boolean>(false);

  /** Idő gomb kattintható-e (van-e timeClick handler) */
  readonly timeClickable = input<boolean>(false);

  // === OUTPUTS ===

  /** Reakció kiválasztva */
  readonly reactionSelected = output<ReactionEmoji>();

  /** Hozzászólás gombra kattintás */
  readonly commentsClick = output<void>();

  /** Idő gombra kattintás (opcionális) */
  readonly timeClick = output<void>();

  // === COMPUTED ===

  /** Hozzászólás gomb label */
  readonly commentButtonLabel = computed(() =>
    `${this.commentsCount()} ${this.commentsLabel()}`
  );

  // === METHODS ===

  onTimeClick(): void {
    if (this.timeClickable()) {
      this.timeClick.emit();
    }
  }
}
