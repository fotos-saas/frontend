import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';

export interface PartnerNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  emoji: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: PartnerNotification[];
    unread_count: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PartnerNotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  private get baseUrl(): string {
    const prefix = this.authService.isPrintShop() ? 'print-shop' : 'partner';
    return `${environment.apiUrl}/${prefix}/notifications`;
  }
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  /** Dropdown értesítések */
  readonly notifications = signal<PartnerNotification[]>([]);

  /** Olvasatlan szám */
  readonly unreadCount = signal<number>(0);

  /** Töltés */
  readonly loading = signal<boolean>(false);

  /** Van olvasatlan? */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /**
   * Polling indítása (60 másodpercenként lekérdezi az unread count-ot).
   * Hívd meg a partner shell init-ben.
   */
  startPolling(): void {
    if (this.pollingTimer) return;

    // Azonnal lekérjük
    this.refreshUnreadCount();

    // 60s polling
    this.pollingTimer = setInterval(() => {
      this.refreshUnreadCount();
    }, 60_000);

    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  /**
   * Polling leállítása.
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Olvasatlan szám frissítése (lightweight endpoint).
   * Ha nincs marketer token (kijelentkezés után), leállítja a polling-ot.
   */
  refreshUnreadCount(): void {
    // Ha nincs session, ne hívjunk API-t — polling leállítás
    if (!this.authService.getMarketerToken()) {
      this.clear();
      return;
    }

    this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(
        catchError(err => {
          // 401 esetén polling leállítás (token lejárt/érvénytelen)
          if (err.status === 401) {
            this.clear();
          }
          this.logger.error('[PartnerNotification] Unread count hiba:', err);
          return of({ success: false, data: { unread_count: 0 } });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(res => {
        if (res.success) {
          this.unreadCount.set(res.data.unread_count);
        }
      });
  }

  /**
   * Értesítések betöltése a dropdown-hoz.
   */
  loadNotifications(limit = 10): void {
    this.loading.set(true);

    this.http.get<NotificationsResponse>(this.baseUrl, {
      params: { limit: limit.toString() }
    })
      .pipe(
        catchError(err => {
          this.logger.error('[PartnerNotification] Lista betöltés hiba:', err);
          this.loading.set(false);
          return of({ success: false, data: { notifications: [], unread_count: 0 } });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(res => {
        if (res.success) {
          this.notifications.set(res.data.notifications);
          this.unreadCount.set(res.data.unread_count);
        }
        this.loading.set(false);
      });
  }

  /**
   * Egyetlen értesítés olvasottnak jelölése.
   */
  markAsRead(notificationId: number): void {
    const notification = this.notifications().find(n => n.id === notificationId);
    const wasUnread = notification && !notification.is_read;
    const prevNotifications = this.notifications();
    const prevCount = this.unreadCount();

    // Optimistic update
    this.notifications.update(list =>
      list.map(n => n.id === notificationId
        ? { ...n, is_read: true, read_at: new Date().toISOString() }
        : n
      )
    );
    if (wasUnread) {
      this.unreadCount.update(c => Math.max(0, c - 1));
    }

    this.http.post(`${this.baseUrl}/${notificationId}/read`, {})
      .pipe(
        catchError(err => {
          this.logger.error('[PartnerNotification] Olvasottnak jelölés hiba:', err);
          this.notifications.set(prevNotifications);
          this.unreadCount.set(prevCount);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Összes olvasottnak jelölése.
   */
  markAllAsRead(): void {
    const prevNotifications = this.notifications();
    const prevCount = this.unreadCount();

    // Optimistic update
    this.notifications.update(list =>
      list.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    this.unreadCount.set(0);

    this.http.post(`${this.baseUrl}/read-all`, {})
      .pipe(
        catchError(err => {
          this.logger.error('[PartnerNotification] Összes olvasottnak jelölés hiba:', err);
          this.notifications.set(prevNotifications);
          this.unreadCount.set(prevCount);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * State törlése (kijelentkezéskor).
   */
  clear(): void {
    this.stopPolling();
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
