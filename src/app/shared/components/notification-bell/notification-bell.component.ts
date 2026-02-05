import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  HostListener,
  DestroyRef
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { GuestService } from '../../../core/services/guest.service';
import { LoggerService } from '../../../core/services/logger.service';
import { NotificationListComponent } from './components/notification-list/notification-list.component';

/**
 * Notification Bell Component
 *
 * Értesítési csengő dropdown-nal a navbar-ban.
 * Mutatja az olvasatlan értesítések számát és a legfrissebb értesítéseket.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterModule, NotificationListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnInit {
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

  /** Lokális state a dropdown-hoz */
  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(false);

  /** Unread count és hasUnread a service-ből */
  readonly unreadCount = this.notificationService.unreadCount;
  readonly hasUnread = this.notificationService.hasUnread;

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
    this.loadInitialUnreadCount();
  }

  toggleDropdown(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);

    if (newState) {
      this.loadDropdownNotifications();
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

    if (!notification.is_read && projectId) {
      this.notificationService.markAsRead(projectId, notification.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    if (notification.action_url) {
      this.isOpen.set(false);
      this.safeNavigate(notification.action_url);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  private loadDropdownNotifications(): void {
    const projectId = this.guestService.currentProjectId();
    if (!projectId) return;

    this.loading.set(true);

    this.notificationService.fetchRecentForDropdown(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          const data = response as { success?: boolean; data?: { notifications: Notification[] } };
          if (data?.success && data?.data?.notifications) {
            this.notifications.set(data.data.notifications.slice(0, 5));
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private loadInitialUnreadCount(): void {
    const projectId = this.guestService.currentProjectId();
    if (projectId) {
      this.notificationService.refreshUnreadCount(projectId);
    }
  }

  private safeNavigate(url: string): void {
    try {
      if (url.startsWith('/') && !url.startsWith('//')) {
        this.router.navigateByUrl(url);
        return;
      }

      const parsedUrl = new URL(url, window.location.origin);

      if (this.trustedDomains.includes(parsedUrl.hostname)) {
        if (parsedUrl.origin === window.location.origin) {
          this.router.navigateByUrl(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash);
        } else {
          window.location.href = url;
        }
      } else {
        this.logger.warn('Blocked untrusted redirect URL', { url, hostname: parsedUrl.hostname });
      }
    } catch (e) {
      this.logger.error('Invalid notification action URL', e);
    }
  }
}
