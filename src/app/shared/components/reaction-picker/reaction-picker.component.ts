import {
  Component,
  output,
  input,
  signal,
  computed,
  HostListener,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
@Component({
  selector: 'app-reaction-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reaction-container" (click)="$event.stopPropagation()">
      <!-- Reactions summary (megjelenített reakciók) -->
      @if (hasReactions()) {
        <div class="reactions-summary">
          @for (item of sortedReactions(); track item.emoji) {
            <button
              type="button"
              class="reaction-badge click-feedback"
              [class.reaction-badge--selected]="userReaction() === item.emoji"
              [disabled]="disabled()"
              (click)="onReactionClick(item.emoji)"
              [title]="getTooltip(item.emoji)"
            >
              <span class="reaction-badge__emoji">{{ item.emoji }}</span>
              <span class="reaction-badge__count">{{ item.count }}</span>
            </button>
          }
        </div>
      }

      <!-- Add reaction button (csak ha még nincs reakció) -->
      @if (!userReaction()) {
        <div class="reaction-add-wrapper">
          <button
            type="button"
            class="reaction-add-btn click-feedback"
            [class.reaction-add-btn--active]="isPickerOpen()"
            [disabled]="disabled()"
            (click)="togglePicker(); $event.stopPropagation()"
            title="Reakció hozzáadása"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>

          <!-- Picker dropdown -->
          @if (isPickerOpen()) {
            <div class="reaction-picker" (click)="$event.stopPropagation()">
              @for (emoji of availableReactions; track emoji) {
                <button
                  type="button"
                  class="reaction-picker__btn click-feedback--button"
                  [disabled]="disabled()"
                  (click)="selectReaction(emoji)"
                  [title]="getTooltip(emoji)"
                >
                  {{ emoji }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .reaction-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .reactions-summary {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .reaction-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      &--selected {
        background: #eef2ff;
        border-color: #6366f1;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &__emoji {
        font-size: 1rem;
      }

      &__count {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
      }
    }

    .reaction-add-wrapper {
      position: relative;
    }

    .reaction-add-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      transition: all 0.15s ease;

      svg {
        width: 18px;
        height: 18px;
        color: #9ca3af;
      }

      &:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;

        svg {
          color: #6b7280;
        }
      }

      &--active {
        background: #eef2ff;
        border-color: #6366f1;

        svg {
          color: #6366f1;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &__current {
        font-size: 1rem;
      }
    }

    .reaction-picker {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.5rem;
      background: white;
      border-radius: 2rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

      &__btn {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background: #f3f4f6;
          transform: scale(1.15);
        }

        &:active:not(:disabled) {
          transform: scale(0.95);
        }

        &--selected {
          background: #eef2ff;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .reaction-picker {
        animation: none;
      }
    }
  `]
})
export class ReactionPickerComponent {
  private readonly elementRef = inject(ElementRef);

  /** Dokumentum kattintás - picker bezárása ha kívülre kattintunk */
  @HostListener('document:click', ['$event'])
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
