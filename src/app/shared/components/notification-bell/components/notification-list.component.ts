import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../../core/services/notification.service';
import { NotificationItemComponent } from './notification-item.component';

/**
 * Értesítések listája a notification bell dropdownban.
 * Loading, empty state és lista megjelenítés.
 */
@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="notification-list__loading">
        <div class="notification-list__spinner"></div>
        <span>Betöltés...</span>
      </div>
    } @else if (notifications().length === 0) {
      <div class="notification-list__empty">
        <svg
          class="notification-list__empty-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <span>Nincs értesítés</span>
      </div>
    } @else {
      <ul class="notification-list">
        @for (notification of notifications(); track notification.id) {
          <app-notification-item
            [notification]="notification"
            [formattedTime]="formatTime(notification.created_at)"
            (clicked)="notificationClick.emit($event)"
          />
        }
      </ul>
    }
  `,
  styles: [`
    .notification-list__loading,
    .notification-list__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: #6b7280;
    }

    .notification-list__spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .notification-list__empty-icon {
      width: 48px;
      height: 48px;
      color: #d1d5db;
    }

    .notification-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class NotificationListComponent {
  readonly notifications = input.required<Notification[]>();
  readonly loading = input.required<boolean>();
  readonly notificationClick = output<Notification>();

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Most';
    } else if (diffMins < 60) {
      return `${diffMins} perce`;
    } else if (diffHours < 24) {
      return `${diffHours} órája`;
    } else if (diffDays < 7) {
      return `${diffDays} napja`;
    } else {
      return date.toLocaleDateString('hu-HU');
    }
  }
}
