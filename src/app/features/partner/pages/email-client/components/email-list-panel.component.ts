import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailListItem } from '../../../models/email-client.models';
import { EmailRowComponent } from './email-row.component';

@Component({
  selector: 'app-email-list-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, EmailRowComponent],
  template: `
    <!-- Keresés -->
    <div class="list-toolbar">
      <div class="search-box">
        <lucide-icon [name]="ICONS.SEARCH" [size]="16" />
        <input
          type="text"
          class="search-input"
          placeholder="Keresés emailekben..."
          [ngModel]="search()"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>
      <span class="email-count">{{ total() }} email</span>
    </div>

    <!-- Email lista -->
    <div class="email-list">
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="skeleton-row">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-line--short"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        }
      } @else if (emails().length === 0) {
        <div class="empty-list">
          <lucide-icon [name]="ICONS.INBOX" [size]="32" />
          <p>Nincs email ebben a mappában</p>
        </div>
      } @else {
        @for (email of emails(); track email.id; let i = $index) {
          <app-email-row
            [email]="email"
            [isSelected]="selectedEmailId() === email.id"
            (select)="selectEmail.emit($event)"
            (toggleStar)="toggleStar.emit($event)"
            [style.animation-delay]="i * 0.02 + 's'"
          />
        }
      }
    </div>

    <!-- Paginálás -->
    @if (lastPage() > 1) {
      <div class="pagination">
        <button
          class="page-btn"
          [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)"
        >
          <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
        </button>
        <span class="page-info">{{ page() }} / {{ lastPage() }}</span>
        <button
          class="page-btn"
          [disabled]="page() >= lastPage()"
          (click)="pageChange.emit(page() + 1)"
        >
          <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .list-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--bg-primary, #fff);
      color: var(--text-tertiary, #9ca3af);

      &:focus-within {
        border-color: var(--primary-500, #6366f1);
        box-shadow: 0 0 0 2px var(--primary-100, #e0e7ff);
      }
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      background: transparent;
      color: var(--text-primary, #111827);
      min-width: 0;

      &::placeholder {
        color: var(--text-tertiary, #9ca3af);
      }
    }

    .email-count {
      font-size: 12px;
      color: var(--text-tertiary, #9ca3af);
      white-space: nowrap;
    }

    .email-list {
      flex: 1;
      overflow-y: auto;
    }

    .empty-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 8px;
      color: var(--text-tertiary, #9ca3af);

      p {
        font-size: 13px;
        margin: 0;
      }
    }

    // Skeleton
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .skeleton-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-hover, #e5e7eb);
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .skeleton-line {
      height: 10px;
      border-radius: 4px;
      background: var(--bg-hover, #e5e7eb);
      animation: shimmer 1.5s infinite;
      width: 80%;

      &--short { width: 40%; }
    }

    @keyframes shimmer {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    // Pagination
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
      border-top: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      background: var(--bg-primary, #fff);
      cursor: pointer;
      color: var(--text-secondary, #6b7280);

      &:hover:not(:disabled) {
        background: var(--bg-hover, #f3f4f6);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }

    .page-info {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }
  `],
})
export class EmailListPanelComponent {
  readonly ICONS = ICONS;

  readonly emails = input.required<EmailListItem[]>();
  readonly loading = input.required<boolean>();
  readonly search = input.required<string>();
  readonly page = input.required<number>();
  readonly lastPage = input.required<number>();
  readonly total = input.required<number>();
  readonly selectedEmailId = input.required<number | null>();

  readonly searchChange = output<string>();
  readonly selectEmail = output<EmailListItem>();
  readonly toggleStar = output<EmailListItem>();
  readonly pageChange = output<number>();
}
