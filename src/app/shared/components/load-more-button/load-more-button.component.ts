import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';

/**
 * LoadMoreButtonComponent
 *
 * "Több kép betöltése" gomb komponens - US-008 pagination fallback.
 * Csak akkor jelenik meg, ha van még betöltetlen kép.
 *
 * @example
 * <app-load-more-button
 *   [loadedCount]="photos().length"
 *   [totalCount]="totalPhotos"
 *   [pageSize]="100"
 *   [isLoading]="isLoadingMore()"
 *   (loadMore)="onLoadMore()"
 * />
 */
@Component({
  selector: 'app-load-more-button',
  standalone: true,
  template: `
    @if (hasMore()) {
      <div class="load-more">
        <button
          type="button"
          class="load-more__button"
          [disabled]="isLoading()"
          [attr.aria-busy]="isLoading()"
          aria-live="polite"
          (click)="onLoadMoreClick()"
        >
          @if (isLoading()) {
            <span class="load-more__spinner" aria-hidden="true"></span>
            <span>Betöltés...</span>
          } @else {
            <svg
              class="load-more__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Több kép betöltése</span>
            <span class="load-more__count">({{ remainingCount() }} db)</span>
          }
        </button>

        <p class="load-more__info" aria-live="polite">
          {{ loadedCount() }} / {{ totalCount() }} kép betöltve
        </p>
      </div>
    }
  `,
  styles: [`
    .load-more {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      margin-top: 8px;

      &__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 24px;
        font-size: 15px;
        font-weight: 600;
        color: var(--color-primary, #3b82f6);
        background: var(--bg-primary, white);
        border: 2px solid var(--color-primary, #3b82f6);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 200px;

        // Safari: margin helyett gap
        > * {
          margin-left: 8px;
        }
        > *:first-child {
          margin-left: 0;
        }

        &:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.08);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }

        &:focus-visible {
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }

      &__icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      &__spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(59, 130, 246, 0.2);
        border-top-color: var(--color-primary, #3b82f6);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        flex-shrink: 0;
      }

      &__count {
        font-weight: 400;
        opacity: 0.8;
      }

      &__info {
        margin: 12px 0 0;
        font-size: 13px;
        color: var(--text-muted, #64748b);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    // Dark mode
    @media (prefers-color-scheme: dark) {
      .load-more {
        &__button {
          background: var(--bg-secondary, #1e293b);
          border-color: var(--color-primary, #60a5fa);
          color: var(--color-primary, #60a5fa);

          &:hover:not(:disabled) {
            background: rgba(96, 165, 250, 0.1);
          }
        }
      }
    }

    .dark .load-more {
      &__button {
        background: var(--bg-secondary, #1e293b);
        border-color: var(--color-primary, #60a5fa);
        color: var(--color-primary, #60a5fa);

        &:hover:not(:disabled) {
          background: rgba(96, 165, 250, 0.1);
        }
      }
    }

    // Reduced motion
    @media (prefers-reduced-motion: reduce) {
      .load-more {
        &__button {
          transition: none;
        }

        &__spinner {
          animation-duration: 1.5s;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadMoreButtonComponent {
  /** Betöltött elemek száma */
  readonly loadedCount = input.required<number>();

  /** Összes elem száma */
  readonly totalCount = input.required<number>();

  /** Betöltés folyamatban */
  readonly isLoading = input<boolean>(false);

  /** Több betöltése esemény */
  readonly loadMore = output<void>();

  /** Van-e még betöltetlen elem */
  readonly hasMore = computed(() =>
    this.loadedCount() < this.totalCount()
  );

  /** Még betöltetlen elemek száma */
  readonly remainingCount = computed(() =>
    Math.max(0, this.totalCount() - this.loadedCount())
  );

  /** Gombra kattintás */
  onLoadMoreClick(): void {
    if (!this.isLoading() && this.hasMore()) {
      this.loadMore.emit();
    }
  }
}
