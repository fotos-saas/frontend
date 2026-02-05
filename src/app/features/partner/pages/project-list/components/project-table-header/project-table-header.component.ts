import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

export interface SortColumn {
  id: string;
  label: string;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

/**
 * Projekt táblázat fejléc komponens - asztali nézet.
 * Rendezési logikával és vizuális visszajelzéssel.
 */
@Component({
  selector: 'app-project-table-header',
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
      <span class="th th-aware" data-tooltip="Tudnak róla">
        <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="12" />
      </span>
      <button
        class="th th-status"
        [class.th--active]="sortBy() === 'tablo_status'"
        (click)="onSort('tablo_status')"
      >
        Státusz
        @if (sortBy() === 'tablo_status') {
          <lucide-icon [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
        }
      </button>
      <button
        class="th th-num"
        [class.th--active]="sortBy() === 'missing_count'"
        (click)="onSort('missing_count')"
      >
        Hiányzó
        @if (sortBy() === 'missing_count') {
          <lucide-icon [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN" [size]="12" />
        }
      </button>
      <span class="th th-qr">QR</span>
    </div>
  `,
  styles: [`
    .table-header {
      display: grid;
      grid-template-columns: 48px 1fr 24px 110px 75px 32px;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 4px;
    }

    .th-sample {
      /* üres oszlop a minta kép helyén */
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

    .th-aware {
      justify-content: center;
      cursor: default;
      color: #94a3b8;
    }
    .th-aware:hover {
      background: none;
      color: #94a3b8;
    }

    .th-status { justify-content: center; }
    .th-num { justify-content: center; }

    .th-qr {
      justify-content: center;
      cursor: default;
    }
    .th-qr:hover {
      background: none;
      color: #64748b;
    }

    @media (max-width: 640px) {
      .table-header {
        display: none;
      }
    }
  `]
})
export class ProjectTableHeaderComponent {
  readonly sortBy = input.required<string>();
  readonly sortDir = input.required<'asc' | 'desc'>();
  readonly sortChange = output<string>();

  readonly ICONS = ICONS;

  onSort(column: string): void {
    this.sortChange.emit(column);
  }
}
