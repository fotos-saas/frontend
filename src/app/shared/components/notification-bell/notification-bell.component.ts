import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NotificationService,
  Notification
} from '../../../core/services/notification.service';
import { GuestService } from '../../../core/services/guest.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Notification Bell Component
 *
 * Értesítési csengő dropdown-nal a navbar-ban.
 * Mutatja az olvasatlan értesítések számát és a legfrissebb értesítéseket.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-bell">
      <!-- Bell icon -->
      <button
        type="button"
        class="notification-bell__trigger"
        [class.notification-bell__trigger--has-unread]="hasUnread()"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen()"
        aria-label="Értesítések"
      >
        <svg
          class="notification-bell__icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        @if (hasUnread()) {
          <span class="notification-bell__badge">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="notification-bell__dropdown">
          <!-- Header -->
          <div class="notification-bell__header">
            <h3 class="notification-bell__title">Értesítések</h3>
            @if (hasUnread()) {
              <button
                type="button"
                class="notification-bell__mark-all"
                (click)="markAllAsRead()"
              >
                Összes olvasott
              </button>
            }
          </div>

          <!-- Content -->
          <div class="notification-bell__content">
            @if (loading()) {
              <div class="notification-bell__loading">
                <div class="notification-bell__spinner"></div>
                <span>Betöltés...</span>
              </div>
            } @else if (notifications().length === 0) {
              <div class="notification-bell__empty">
                <svg
                  class="notification-bell__empty-icon"
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
              <ul class="notification-bell__list">
                @for (notification of notifications(); track notification.id) {
                  <li
                    class="notification-bell__item"
                    [class.notification-bell__item--unread]="!notification.is_read"
                    (click)="onNotificationClick(notification)"
                  >
                    <div class="notification-bell__item-icon">
                      @switch (notification.type) {
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
                          <span class="notification-bell__emoji">👉</span>
                        }
                        @case ('poke_reaction') {
                          <span class="notification-bell__emoji">👉</span>
                        }
                        @default {
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        }
                      }
                    </div>
                    <div class="notification-bell__item-content">
                      <p class="notification-bell__item-body">{{ getNotificationBody(notification) }}</p>
                      <span class="notification-bell__item-time">
                        {{ formatTime(notification.created_at) }}
                      </span>
                    </div>
                    @if (!notification.is_read) {
                      <div class="notification-bell__item-dot"></div>
                    }
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Footer - Összes értesítés link -->
          @if (notifications().length > 0 || hasUnread()) {
            <div class="notification-bell__footer">
              <a
                routerLink="/notifications"
                class="notification-bell__view-all"
                (click)="isOpen.set(false)"
              >
                Összes értesítés
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-bell {
      position: relative;
    }

    .notification-bell__trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      &--has-unread {
        .notification-bell__icon {
          animation: bell-ring 0.5s ease-in-out;
        }
      }
    }

    .notification-bell__icon {
      width: 24px;
      height: 24px;
      color: #374151;
    }

    .notification-bell__badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      text-align: center;
      color: white;
      background: #ef4444;
      border-radius: 9px;
    }

    .notification-bell__dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      max-height: 520px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 1000;
      animation: dropdown-in 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    .notification-bell__header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .notification-bell__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .notification-bell__mark-all {
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 500;
      color: #6366f1;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #eef2ff;
      }
    }

    .notification-bell__content {
      flex: 1;
      max-height: 360px;
      overflow-y: auto;
    }

    .notification-bell__loading,
    .notification-bell__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: #6b7280;
    }

    .notification-bell__spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .notification-bell__empty-icon {
      width: 48px;
      height: 48px;
      color: #d1d5db;
    }

    .notification-bell__list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .notification-bell__item {
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

    .notification-bell__item-icon {
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

      .notification-bell__item--unread & {
        background: #c7d2fe;

        svg {
          color: #4f46e5;
        }
      }
    }

    .notification-bell__emoji {
      font-size: 18px;
      line-height: 1;
    }

    .notification-bell__item-content {
      flex: 1;
      min-width: 0;
    }

    .notification-bell__item-body {
      margin: 0 0 4px;
      font-size: 14px;
      line-height: 1.4;
      color: #374151;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-bell__item-time {
      font-size: 12px;
      color: #9ca3af;
    }

    .notification-bell__item-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      background: #6366f1;
      border-radius: 50%;
      margin-top: 6px;
    }

    .notification-bell__footer {
      flex-shrink: 0;
      border-top: 1px solid #e5e7eb;
      padding: 12px 16px;
      text-align: center;
      background: white;
    }

    .notification-bell__view-all {
      font-size: 14px;
      font-weight: 500;
      color: #6366f1;
      text-decoration: none;
      transition: text-decoration 0.2s ease;

      &:hover {
        text-decoration: underline;
      }
    }

    @keyframes bell-ring {
      0%, 100% { transform: rotate(0); }
      20% { transform: rotate(15deg); }
      40% { transform: rotate(-15deg); }
      60% { transform: rotate(10deg); }
      80% { transform: rotate(-10deg); }
    }

    @keyframes dropdown-in {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly guestService = inject(GuestService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  /** Dropdown nyitva van-e */
  readonly isOpen = signal(false);

  /** Trusted domains az action URL-ekhez (Open Redirect prevention) */
  private readonly trustedDomains = [
    window.location.hostname,
    'kepvalaszto.hu',
    'fotopack.kepvalaszto.hu',
    'admin.kepvalaszto.hu',
    'admin-fotopack.kepvalaszto.hu'
  ];

  /** Lokális state a dropdown-hoz (független a notifications oldaltól) */
  readonly dropdownNotifications = signal<Notification[]>([]);
  readonly dropdownLoading = signal(false);

  /** Unread count és hasUnread a service-ből (ez közös, mert a badge-nek kell) */
  readonly unreadCount = this.notificationService.unreadCount;
  readonly hasUnread = this.notificationService.hasUnread;

  /** Alias a template-hez */
  readonly notifications = this.dropdownNotifications;
  readonly loading = this.dropdownLoading;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell')) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  ngOnInit(): void {
    // Csak az unread count-ot töltjük be kezdetben (badge-hez)
    this.loadInitialUnreadCount();
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  toggleDropdown(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);

    // Lenyitáskor frissítjük a dropdown saját adatait
    if (newState) {
      this.loadDropdownNotifications();
    }
  }

  /**
   * Dropdown értesítések betöltése (lokális, nem frissíti a notifications oldalt)
   */
  private loadDropdownNotifications(): void {
    const projectId = this.guestService.currentProjectId();
    if (!projectId) return;

    this.dropdownLoading.set(true);

    this.notificationService.fetchRecentForDropdown(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          const data = response as { success?: boolean; data?: { notifications: Notification[] } };
          if (data?.success && data?.data?.notifications) {
            this.dropdownNotifications.set(data.data.notifications.slice(0, 5));
          }
          this.dropdownLoading.set(false);
        },
        error: () => {
          this.dropdownLoading.set(false);
        }
      });
  }

  /**
   * Kezdeti unread count betöltése (csak a badge-hez)
   */
  private loadInitialUnreadCount(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.notificationService.refreshUnreadCount(projectId);
    }
  }

  markAllAsRead(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.notificationService.markAllAsRead(projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  onNotificationClick(notification: Notification): void {
    const projectId = this.guestService.currentProjectId();

    // Mark as read
    if (!notification.is_read && projectId) {
      this.notificationService.markAsRead(projectId, notification.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    // Navigate if has action URL (with Open Redirect protection)
    if (notification.action_url) {
      this.isOpen.set(false);
      this.safeNavigate(notification.action_url);
    }
  }

  /**
   * Biztonságos navigáció Open Redirect védelemmel.
   * Csak trusted domain-ekre enged navigálni, vagy relatív URL-ekre.
   */
  private safeNavigate(url: string): void {
    try {
      // Relatív URL check
      if (url.startsWith('/') && !url.startsWith('//')) {
        this.router.navigateByUrl(url);
        return;
      }

      // Abszolút URL validálás
      const parsedUrl = new URL(url, window.location.origin);

      if (this.trustedDomains.includes(parsedUrl.hostname)) {
        // Same-origin vagy trusted domain - biztonságos
        if (parsedUrl.origin === window.location.origin) {
          // Same-origin: használjuk a Router-t
          this.router.navigateByUrl(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash);
        } else {
          // Trusted external domain
          window.location.href = url;
        }
      } else {
        // Untrusted domain - logoljuk és ignoráljuk
        this.logger.warn('Blocked untrusted redirect URL', { url, hostname: parsedUrl.hostname });
      }
    } catch (e) {
      this.logger.error('Invalid notification action URL', e);
    }
  }

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

  /**
   * Értesítés szöveg formázása
   * Poke reakciónál hozzáfűzi az emojit
   */
  getNotificationBody(notification: Notification): string {
    if (notification.type === 'poke_reaction') {
      const reaction = notification.data?.['reaction'] as string;
      const reactorName = notification.data?.['reactor_name'] as string || 'Valaki';
      if (reaction) {
        return `${reactorName} ${reaction} reagált a bökésedre`;
      }
    }
    return notification.body;
  }
}
