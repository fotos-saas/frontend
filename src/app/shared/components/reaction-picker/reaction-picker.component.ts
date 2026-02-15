import {
  Component,
  ChangeDetectionStrategy,
  output,
  input,
  signal,
  computed,
  ElementRef,
  inject
} from '@angular/core';
import {
  ReactionEmoji,
  REACTION_EMOJIS,
  REACTION_TOOLTIPS,
  ReactionsSummary
} from '@shared/constants';

// Re-export for backward compatibility
export { ReactionEmoji, REACTION_TOOLTIPS, ReactionsSummary } from '@shared/constants';

/**
 * @deprecated - Használd a REACTION_EMOJIS-t a @shared/constants-ból
 */
export const REACTIONS = [...REACTION_EMOJIS];

/**
 * ReactionPicker Component
 *
 * Újrafelhasználható reakció választó komponens.
 * Használható: fórum, hozzászólások, bökések, stb.
 *
 * @example
 * <app-reaction-picker
 *   [reactions]="post.reactions"
 *   [userReaction]="post.userReaction"
 *   [disabled]="isLoading"
 *   (reactionSelected)="onReaction($event)"
 * />
 */
import { DropdownFlipDirective } from '@shared/directives';

@Component({
  selector: 'app-reaction-picker',
  standalone: true,
  imports: [DropdownFlipDirective],
  templateUrl: './reaction-picker.component.html',
  styleUrls: ['./reaction-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class ReactionPickerComponent {
  private readonly elementRef = inject(ElementRef);

  /** Dokumentum kattintás - picker bezárása ha kívülre kattintunk */
  onDocumentClick(event: MouseEvent): void {
    if (this.isPickerOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isPickerOpen.set(false);
    }
  }

  /** Signal-based inputs (Angular 19+) */
  readonly reactions = input<ReactionsSummary | null | undefined>({});
  readonly userReaction = input<ReactionEmoji | string | null | undefined>(null);
  readonly disabled = input<boolean>(false);

  /** Signal-based output (Angular 19+) */
  readonly reactionSelected = output<ReactionEmoji>();

  /** Elérhető reakciók */
  readonly availableReactions = REACTIONS;

  /** Picker nyitva-e */
  readonly isPickerOpen = signal(false);

  /** Van-e reakció */
  readonly hasReactions = computed(() => {
    const r = this.reactions() ?? {};
    return Object.keys(r).length > 0;
  });

  /** Rendezett reakciók lista */
  readonly sortedReactions = computed(() => {
    const r = this.reactions() ?? {};
    return Object.entries(r)
      .map(([emoji, count]) => ({ emoji: emoji as ReactionEmoji, count }))
      .sort((a, b) => b.count - a.count);
  });

  /** Tooltip lekérése */
  getTooltip(emoji: ReactionEmoji): string {
    return REACTION_TOOLTIPS[emoji] || '';
  }

  /** Picker toggle */
  togglePicker(): void {
    this.isPickerOpen.update(v => !v);
  }

  /** Reakció kiválasztása picker-ből */
  selectReaction(emoji: ReactionEmoji): void {
    this.isPickerOpen.set(false);
    this.reactionSelected.emit(emoji);
  }

  /** Kattintás meglévő reakció badge-re (csak saját reakció esetén) */
  onReactionClick(emoji: ReactionEmoji): void {
    // Csak a saját reakciójára kattintva reagálunk (eltávolítás)
    if (this.userReaction() === emoji) {
      this.reactionSelected.emit(emoji);
    }
  }
}
