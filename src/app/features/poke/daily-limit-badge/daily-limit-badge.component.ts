import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeDailyLimit } from '../../../core/models/poke.models';

/**
 * Daily Limit Badge Component
 *
 * Napi bökés limit kijelző.
 */
@Component({
  selector: 'app-daily-limit-badge',
  imports: [CommonModule],
  template: `
    @if (limit()) {
      <div class="limit-badge" [class.exhausted]="limit()!.hasReachedLimit">
        <span class="count">{{ limit()!.sentToday }}/{{ limit()!.dailyLimit }}</span>
        <span class="label">bökés ma</span>
      </div>
    }
  `,
  styles: [`
    .limit-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      height: 2.25rem;
      padding: 0 0.875rem;
      background: #f3f4f6;
      border-radius: 2rem;
      font-size: 0.875rem;

      .count {
        font-weight: 600;
        color: #4b5563;
      }

      .label {
        color: #9ca3af;
        text-transform: lowercase;
      }

      &.exhausted {
        background: #fee2e2;

        .count {
          color: #dc2626;
        }

        .label {
          color: #f87171;
        }
      }
    }

    @media (prefers-color-scheme: dark) {
      .limit-badge {
        background: #374151;

        .count {
          color: #d1d5db;
        }

        .label {
          color: #6b7280;
        }

        &.exhausted {
          background: #450a0a;

          .count {
            color: #f87171;
          }

          .label {
            color: #fca5a5;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLimitBadgeComponent {
  readonly limit = input<PokeDailyLimit | null>(null);
}
