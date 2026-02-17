import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../constants/icons.constants';
import { TableColumn, SortDirection } from './table-header.types';

@Component({
  selector: 'app-table-header',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'table-header-host' },
  template: `
    <div class="table-header" [style.grid-template-columns]="gridTemplate()">
      @for (col of columns(); track col.key) {
        @if (col.sortable) {
          <button
            class="th th--sortable"
            [class.th--active]="sortBy() === col.key"
            [class.th--center]="col.align === 'center'"
            [class.th--right]="col.align === 'right'"
            [attr.aria-label]="'Rendezés: ' + col.label"
            (click)="onSort(col.key)"
          >
            @if (col.icon && !col.label) {
              <lucide-icon [name]="col.icon" [size]="12" [matTooltip]="col.tooltip ?? ''" />
            } @else {
              {{ col.label }}
            }
            @if (sortBy() === col.key) {
              <lucide-icon
                class="sort-icon"
                [name]="sortDir() === 'asc' ? ICONS.ARROW_UP : ICONS.ARROW_DOWN"
                [size]="12"
              />
            }
          </button>
        } @else {
          <span
            class="th"
            [class.th--center]="col.align === 'center'"
            [class.th--right]="col.align === 'right'"
            [matTooltip]="col.tooltip ?? ''"
            [matTooltipDisabled]="!col.tooltip"
          >
            @if (col.icon && !col.label) {
              <lucide-icon [name]="col.icon" [size]="12" />
            } @else {
              {{ col.label }}
            }
          </span>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .table-header {
      display: grid;
      gap: 8px;
      padding: 8px 16px;
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
      padding: 4px 6px;
      border-radius: 4px;
      cursor: default;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .th--center { justify-content: center; }
    .th--right { justify-content: flex-end; }

    .th--sortable {
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .th--sortable:hover {
      color: #475569;
    }

    .th--active {
      color: #475569;
    }

    .sort-icon {
      color: var(--color-primary, #3b82f6);
    }

    @media (max-width: 640px) {
      .table-header {
        display: none;
      }
    }
  `]
})
export class TableHeaderComponent {
  readonly columns = input.required<TableColumn[]>();
  readonly sortBy = input<string>('');
  readonly sortDir = input<SortDirection>('asc');

  readonly sortChange = output<string>();

  readonly ICONS = ICONS;

  readonly gridTemplate = computed(() =>
    this.columns().map(c => c.width ?? '1fr').join(' ')
  );

  onSort(key: string): void {
    this.sortChange.emit(key);
  }
}
