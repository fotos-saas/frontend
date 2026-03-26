import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  ElementRef,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PartnerNotificationService, PartnerNotification } from '../../../../core/services/partner-notification.service';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Partner Értesítési Csengő
 *
 * A partner topbar-ba integrálható értesítési csengő + dropdown.
 * A PartnerNotificationService-t használja (NEM a tablo NotificationService-t).
 */
@Component({
  selector: 'app-partner-notification-bell',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partner-notification-bell.component.html',
  styleUrl: './partner-notification-bell.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class PartnerNotificationBellComponent implements OnInit {
  private readonly notificationService = inject(PartnerNotificationService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly elementRef = inject(ElementRef);

  /** Dropdown nyitva van-e */
  readonly isOpen = signal(false);

  /** Service signal-ok közvetlen használata */
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly hasUnread = this.notificationService.hasUnread;
  readonly loading = this.notificationService.loading;

  /** Trusted domains az action URL-ekhez (Open Redirect prevention) */
  private readonly trustedDomains = [
    window.location.hostname,
    'tablostudio.hu',
    'api.tablostudio.hu',
  ];

  ngOnInit(): void {
    this.notificationService.startPolling();
  }

  onDocumentClick(event: MouseEvent): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    if (!host.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  onEscape(): void {
    this.isOpen.set(false);
  }

  toggleDropdown(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);

    if (newState) {
      this.notificationService.loadNotifications(5);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onNotificationClick(notification: PartnerNotification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }

    if (notification.action_url) {
      this.isOpen.set(false);
      this.safeNavigate(notification.action_url);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
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
