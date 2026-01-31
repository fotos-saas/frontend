import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Statisztika sáv a review step-ben.
 * Megmutatja a párosított, hiányzó és szabad képek számát.
 */
@Component({
  selector: 'app-review-stats-bar',
  standalone: true,
  template: `
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-label">Párosítva:</span>
        <span class="stat-value stat-value--success">{{ assignedCount() }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Hiányzik:</span>
        <span class="stat-value stat-value--warning">{{ missingCount() }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Szabad kép:</span>
        <span class="stat-value">{{ unassignedCount() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 32px;
      padding: 12px 20px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-value--success {
      color: #10b981;
    }

    .stat-value--warning {
      color: #f59e0b;
    }

    @media (max-width: 480px) {
      .stats-bar {
        gap: 16px;
        padding: 10px 12px;
      }

      .stat-label {
        font-size: 0.75rem;
      }

      .stat-value {
        font-size: 0.875rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewStatsBarComponent {
  readonly assignedCount = input.required<number>();
  readonly missingCount = input.required<number>();
  readonly unassignedCount = input.required<number>();
}
