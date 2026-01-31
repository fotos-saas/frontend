import { Component, ChangeDetectionStrategy, input, output, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';

export type TypeFilter = 'all' | 'student' | 'teacher';

export interface TypeStats {
  total: number;
  assigned: number;
}

/**
 * Diák/Tanár szűrő tabok.
 */
@Component({
  selector: 'app-review-filter-tabs',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="filter-tabs">
      <button
        class="filter-tab"
        [class.filter-tab--active]="selected() === 'student'"
        (click)="selected.set('student')"
      >
        <lucide-icon [name]="ICONS.GRADUATION_CAP" [size]="14" />
        Diákok ({{ studentStats().assigned }}/{{ studentStats().total }})
      </button>
      <button
        class="filter-tab"
        [class.filter-tab--active]="selected() === 'teacher'"
        (click)="selected.set('teacher')"
      >
        <lucide-icon [name]="ICONS.BRIEFCASE" [size]="14" />
        Tanárok ({{ teacherStats().assigned }}/{{ teacherStats().total }})
      </button>
    </div>
  `,
  styles: [`
    .filter-tabs {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-tab:hover {
      border-color: var(--color-primary, #1e3a5f);
      color: var(--color-primary, #1e3a5f);
    }

    .filter-tab--active {
      background: var(--color-primary, #1e3a5f);
      border-color: var(--color-primary, #1e3a5f);
      color: #ffffff;
    }

    .filter-tab--active:hover {
      background: var(--color-primary-dark, #152a45);
      border-color: var(--color-primary-dark, #152a45);
      color: #ffffff;
    }

    @media (max-width: 480px) {
      .filter-tabs {
        gap: 4px;
      }

      .filter-tab {
        padding: 6px 10px;
        font-size: 0.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewFilterTabsComponent {
  readonly ICONS = ICONS;

  /** Two-way binding: kiválasztott szűrő */
  readonly selected = model.required<TypeFilter>();

  readonly studentStats = input.required<TypeStats>();
  readonly teacherStats = input.required<TypeStats>();
}
