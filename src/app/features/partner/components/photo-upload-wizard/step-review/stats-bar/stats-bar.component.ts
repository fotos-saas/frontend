import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

/**
 * Statisztika sáv + keresőmező a review step-ben.
 * Megmutatja a párosított, hiányzó és szabad képek számát, jobb oldalon keresővel.
 */
@Component({
  selector: 'app-review-stats-bar',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="stats-bar">
      <div class="stats-left">
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
      <div class="search-box">
        <lucide-icon [name]="ICONS.SEARCH" class="search-icon" [size]="14" />
        <input
          type="text"
          placeholder="Keresés..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="search-input"
        />
        @if (searchQuery()) {
          <button class="clear-btn" (click)="searchQuery.set('')">
            <lucide-icon [name]="ICONS.X" [size]="14" />
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .stats-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
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

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 180px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      color: #94a3b8;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 30px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.8125rem;
      transition: all 0.15s ease;
      background: #fff;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 6px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
    }

    .clear-btn:hover {
      color: #64748b;
      background: #f1f5f9;
    }

    @media (max-width: 480px) {
      .stats-bar {
        flex-direction: column;
        gap: 8px;
      }

      .stats-left {
        gap: 12px;
      }

      .stat-label {
        font-size: 0.75rem;
      }

      .stat-value {
        font-size: 0.875rem;
      }

      .search-box {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewStatsBarComponent {
  readonly ICONS = ICONS;

  readonly assignedCount = input.required<number>();
  readonly missingCount = input.required<number>();
  readonly unassignedCount = input.required<number>();

  /** Two-way binding: keresési query */
  readonly searchQuery = model.required<string>();
}
