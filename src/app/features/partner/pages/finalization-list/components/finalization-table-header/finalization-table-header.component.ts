import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-finalization-table-header',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-header">
      <span class="th th-sample"></span>
      <button
        class="th th-school"
        [class.th--active]="sortBy() === 'school_name'"
        (click)="onSort('school_name')"
      >
        Iskola / Osztály
        @if (sortBy() === 'school_name') {
          <lucide-icon [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
        }
      </button>
      <button
        class="th th-date"
        [class.th--active]="sortBy() === 'finalized_at'"
        (click)="onSort('finalized_at')"
      >
        Véglegesítve
        @if (sortBy() === 'finalized_at') {
          <lucide-icon [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
        }
      </button>
      <span class="th th-size">Méret</span>
      <span class="th th-file">Fájl</span>
      <span class="th th-actions"></span>
    </div>
  `,
  styles: [`
    .table-header {
      display: grid;
      grid-template-columns: 48px 1fr 100px 80px 140px 104px;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 4px;
    }

    .th {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      background: none;
      border: none;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .th:hover {
      background: #f1f5f9;
      color: #475569;
    }

    .th--active {
      color: var(--color-primary, #1e3a5f);
      background: #e0f2fe;
    }

    .th-school { justify-content: flex-start; }
    .th-date { justify-content: center; }

    .th-size,
    .th-file {
      justify-content: center;
      cursor: default;
      color: #94a3b8;
    }
    .th-size:hover,
    .th-file:hover {
      background: none;
      color: #94a3b8;
    }

    .th-actions {
      cursor: default;
    }
    .th-actions:hover {
      background: none;
    }

    @media (max-width: 768px) {
      .table-header {
        display: none;
      }
    }
  `]
})
export class FinalizationTableHeaderComponent {
  readonly sortBy = input.required<string>();
  readonly sortDir = input.required<'asc' | 'desc'>();
  readonly sortChange = output<string>();

  readonly ICONS = ICONS;

  onSort(column: string): void {
    this.sortChange.emit(column);
  }
}
