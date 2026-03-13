import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { WebsocketService } from './websocket.service';

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
  private readonly wsService = inject(WebsocketService);

  private get baseUrl(): string {
    const prefix = this.authService.isPrintShop() ? 'print-shop' : 'partner';
    return `${environment.apiUrl}/${prefix}/notifications`;
  }
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  /** Kijelentkezés után true — megakadályozza az újraindítást */
  private pollingStopped = false;
  /** WebSocket csatorna neve (ha aktív) */
  private wsChannelName: string | null = null;

  /** Dropdown értesítések */
  readonly notifications = signal<PartnerNotification[]>([]);

  /** Olvasatlan szám */
  readonly unreadCount = signal<number>(0);

  /** Töltés */
  readonly loading = signal<boolean>(false);

  /** Van olvasatlan? */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /**
   * Polling indítása (15 másodpercenként lekérdezi az unread count-ot).
   * Ha WebSocket elérhető, arra is feliratkozik (azonnali értesítés).
   * Hívd meg a partner shell init-ben.
   */
  startPolling(): void {
    if (this.pollingTimer || this.pollingStopped) return;

    // Ha nincs session, ne indítsunk polling-ot
    if (!this.authService.getMarketerToken()) return;

    // Azonnal lekérjük
    this.refreshUnreadCount();

    // WebSocket feliratkozás (ha elérhető)
    this.subscribeToWebSocket();

    // 15s polling (fallback ha nincs WebSocket)
    this.pollingTimer = setInterval(() => {
      this.refreshUnreadCount();
    }, 15_000);

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
    this.unsubscribeFromWebSocket();
  }

  /**
   * WebSocket kapcsolat inicializálása és feliratkozás a privát user csatornára.
   * Ha jön 'app.notification.created' event, azonnal frissíti a badge-et.
   */
  private subscribeToWebSocket(): void {
    if (!environment.wsEnabled) return;

    const user = this.authService.currentUserSignal();
    if (!user?.id) return;

    const token = this.authService.getMarketerToken();
    if (!token) return;

    // WebSocket connect indítása ha még nincs (partner shell-ben nincs külön init)
    if (!this.wsService.isConnected()) {
      this.wsService.connect(token);
    }

    // Várunk a connected állapotra, majd feliratkozunk
    this.waitForConnectionAndSubscribe(user.id);
  }

  /**
   * Megvárja a WebSocket connected állapotot, majd feliratkozik.
   */
  private waitForConnectionAndSubscribe(userId: number): void {
    // Ha már connected, azonnal feliratkozunk
    if (this.wsService.isConnected()) {
      this.doSubscribe(userId);
      return;
    }

    // Egyébként figyelünk a connection state-re (max 10s)
    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = setInterval(() => {
      attempts++;
      if (this.wsService.isConnected()) {
        clearInterval(checkInterval);
        this.doSubscribe(userId);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        this.logger.warn('[PartnerNotification] WebSocket nem kapcsolódott 10s alatt, csak polling marad');
      }
    }, 500);

    this.destroyRef.onDestroy(() => clearInterval(checkInterval));
  }

  /**
   * Tényleges feliratkozás a privát csatornára.
   */
  private doSubscribe(userId: number): void {
    this.wsChannelName = `App.Models.User.${userId}`;

    const channel = this.wsService.private(this.wsChannelName);
    if (!channel) return;

    channel.listen('.app.notification.created', (data: PartnerNotification) => {
      this.logger.info('[PartnerNotification] WebSocket: új értesítés érkezett', data);

      // Badge szám növelése
      this.unreadCount.update(c => c + 1);

      // Ha a dropdown nyitva van (vannak betöltött értesítések), hozzáadjuk az elejéhez
      if (this.notifications().length > 0) {
        const newNotification: PartnerNotification = {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          emoji: data.emoji,
          action_url: data.action_url,
          metadata: data.metadata,
          is_read: false,
          read_at: null,
          created_at: data.created_at,
        };
        this.notifications.update(list => [newNotification, ...list.slice(0, 4)]);
      }
    });

    this.logger.info(`[PartnerNotification] WebSocket feliratkozva: ${this.wsChannelName}`);
  }

  /**
   * WebSocket leiratkozás.
   */
  private unsubscribeFromWebSocket(): void {
    if (this.wsChannelName) {
      this.wsService.leave(this.wsChannelName);
      this.wsChannelName = null;
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
   * A pollingStopped flag megakadályozza az újraindítást ugyanabban az app lifecycle-ban.
   */
  clear(): void {
    this.pollingStopped = true;
    this.stopPolling();
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
