import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Notification } from '../../../../../core/services/notification.service';

/**
 * Egyedi értesítés elem a notification bell dropdownban.
 */
@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li
      class="notification-item"
      [class.notification-item--unread]="!notification().is_read"
      (click)="clicked.emit(notification())"
    >
      <div class="notification-item__icon">
        @switch (notification().type) {
          @case ('mention') {
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
          @case ('reply') {
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          }
          @case ('like') {
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          @case ('badge') {
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          @case ('poke') {
            <span class="notification-item__emoji">👉</span>
          }
          @case ('poke_reaction') {
            <span class="notification-item__emoji">👉</span>
          }
          @default {
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        }
      </div>
      <div class="notification-item__content">
        <p class="notification-item__body">{{ getBody() }}</p>
        <span class="notification-item__time">{{ formattedTime() }}</span>
      </div>
      @if (!notification().is_read) {
        <div class="notification-item__dot"></div>
      }
    </li>
  `,
  styles: [`
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #f9fafb;
      }

      &--unread {
        background: #eef2ff;

        &:hover {
          background: #e0e7ff;
        }
      }
    }

    .notification-item__icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: #f3f4f6;
      border-radius: 50%;

      svg {
        width: 18px;
        height: 18px;
        color: #6b7280;
      }

      .notification-item--unread & {
        background: #c7d2fe;

        svg {
          color: #4f46e5;
        }
      }
    }

    .notification-item__emoji {
      font-size: 18px;
      line-height: 1;
    }

    .notification-item__content {
      flex: 1;
      min-width: 0;
    }

    .notification-item__body {
      margin: 0 0 4px;
      font-size: 14px;
      line-height: 1.4;
      color: #374151;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-item__time {
      font-size: 12px;
      color: #9ca3af;
    }

    .notification-item__dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      background: #6366f1;
      border-radius: 50%;
      margin-top: 6px;
    }
  `]
})
export class NotificationItemComponent {
  readonly notification = input.required<Notification>();
  readonly formattedTime = input.required<string>();
  readonly clicked = output<Notification>();

  getBody(): string {
    const notif = this.notification();
    if (notif.type === 'poke_reaction') {
      const reaction = notif.data?.['reaction'] as string;
      const reactorName = notif.data?.['reactor_name'] as string || 'Valaki';
      if (reaction) {
        return `${reactorName} ${reaction} reagált a bökésedre`;
      }
    }
    return notif.body;
  }
}
