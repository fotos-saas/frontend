import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * EmptyState Component
 *
 * Újrafelhasználható üres állapot megjelenítő.
 * Használandó: listák, szűrők, keresések üres eredményeinél.
 *
 * Használat:
 *   <app-empty-state
 *     emoji="📭"
 *     message="még nem kaptál bökést"
 *     [buttonText]="'új bökés'"
 *     (buttonClickEvent)="onNewPoke()" />
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state" [class.compact]="compact()">
      @if (emoji()) {
        <span class="empty-state__emoji">{{ emoji() }}</span>
      }
      <p class="empty-state__message">{{ message() }}</p>
      @if (buttonText()) {
        <button
          type="button"
          class="empty-state__button"
          (click)="buttonClickEvent.emit()">
          {{ buttonText() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1rem;

      &.compact {
        padding: 2rem 1rem;

        .empty-state__emoji {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
      }

      &__emoji {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
        animation: float 3s ease-in-out infinite;
      }

      &__message {
        color: #9ca3af;
        margin: 0;
        text-transform: lowercase;
        font-size: 0.95rem;
        line-height: 1.5;
        max-width: 280px;
      }

      &__button {
        margin-top: 1rem;
        padding: 0.625rem 1.25rem;
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        border: none;
        border-radius: 2rem;
        cursor: pointer;
        font-size: 0.9rem;
        color: white;
        font-weight: 500;
        text-transform: lowercase;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @media (prefers-color-scheme: dark) {
      .empty-state {
        &__message {
          color: #6b7280;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .empty-state__emoji {
        animation: none;
      }

      .empty-state__button {
        transition: none;

        &:hover {
          transform: none;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  /** Signal-based inputs */
  readonly emoji = input<string | undefined>(undefined);
  readonly message = input.required<string>();
  readonly buttonText = input<string | undefined>(undefined);
  readonly compact = input<boolean>(false);

  /** Signal-based output */
  readonly buttonClickEvent = output<void>();
}
