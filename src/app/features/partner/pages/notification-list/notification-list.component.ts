import { Component, inject, signal, ChangeDetectionStrategy, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { environment } from '../../../../../environments/environment';
import { PartnerNotificationService, PartnerNotification } from '../../../../core/services/partner-notification.service';
import { LoggerService } from '../../../../core/services/logger.service';

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: PartnerNotification[];
    unread_count: number;
  };
}

type FilterType = 'all' | 'unread';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(PartnerNotificationService);
  private readonly logger = inject(LoggerService);

  readonly ICONS = ICONS;
  readonly notifications = signal<PartnerNotification[]>([]);
  readonly loading = signal(false);
  readonly filter = signal<FilterType>('all');

  private readonly baseUrl = `${environment.apiUrl}/partner/notifications`;

  /** Trusted domains az action URL-ekhez */
  private readonly trustedDomains = [
    window.location.hostname,
    'tablostudio.hu',
    'api.tablostudio.hu',
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    const unreadOnly = this.filter() === 'unread';

    this.http.get<NotificationsResponse>(this.baseUrl, {
      params: {
        limit: '50',
        ...(unreadOnly ? { unread_only: 'true' } : {}),
      }
    })
      .pipe(
        catchError(err => {
          this.logger.error('[Notifications] Betöltés hiba:', err);
          this.loading.set(false);
          return of({ success: false, data: { notifications: [], unread_count: 0 } });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(res => {
        if (res.success) {
          this.notifications.set(res.data.notifications);
          this.notificationService.unreadCount.set(res.data.unread_count);
        }
        this.loading.set(false);
      });
  }

  setFilter(filter: FilterType): void {
    this.filter.set(filter);
    this.loadNotifications();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.notifications.update(list =>
      list.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
  }

  onNotificationClick(notification: PartnerNotification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
      this.notifications.update(list =>
        list.map(n => n.id === notification.id
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
        )
      );
    }

    if (notification.action_url) {
      this.safeNavigate(notification.action_url);
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
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }

  get hasUnread(): boolean {
    return this.notificationService.hasUnread();
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
