import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

/**
 * Lapozó komponens - újrahasználható pagination.
 */
@Component({
  selector: 'app-project-pagination',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <div class="pagination">
        <button
          class="page-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
        >
          <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
          Előző
        </button>

        <div class="page-info">
          {{ currentPage() }} / {{ totalPages() }} oldal
          <span class="total-count">({{ totalItems() }} {{ itemLabel() }})</span>
        </div>

        <button
          class="page-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
        >
          Következő
          <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
        </button>
      </div>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding: 16px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: var(--color-primary, #1e3a5f);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #475569;
    }

    .total-count {
      color: #94a3b8;
    }
  `]
})
export class ProjectPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly itemLabel = input<string>('elem');
  readonly pageChange = output<number>();

  readonly ICONS = ICONS;

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }
}
