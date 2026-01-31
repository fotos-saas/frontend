import { Injectable, signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, of } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

/**
 * Értesítés típusok
 */
export type NotificationType = 'mention' | 'reply' | 'like' | 'badge' | 'poke' | 'poke_reaction';

/**
 * Értesítés interface
 */
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Értesítések API válasz
 */
interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unread_count: number;
  };
}

/**
 * Notification Service
 *
 * Értesítések kezelése: lekérdezés, olvasottnak jelölés,
 * real-time frissítések WebSocket-en keresztül.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebsocketService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly injector = inject(Injector);

  /** Értesítések listája */
  readonly notifications = signal<Notification[]>([]);

  /** Olvasatlan értesítések száma */
  readonly unreadCount = signal<number>(0);

  /** Töltés állapot */
  readonly loading = signal<boolean>(false);

  /** Vannak olvasatlan értesítések? */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Legfrissebb 5 értesítés */
  readonly recentNotifications = computed(() =>
    this.notifications().slice(0, 5)
  );

  /** Projekt ID */
  private currentProjectId: number | null = null;

  /**
   * Értesítések betöltése
   */
  loadNotifications(projectId: number, unreadOnly = false): Observable<Notification[]> {
    this.loading.set(true);
    this.currentProjectId = projectId;

    const params: Record<string, string> = { limit: '50' };
    if (unreadOnly) {
      params['unread_only'] = 'true';
    }

    return this.http.get<NotificationsResponse>(
      `${environment.apiUrl}/tablo-frontend/notifications`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.notifications.set(response.data.notifications);
          this.unreadCount.set(response.data.unread_count);
        }
        this.loading.set(false);
      }),
      catchError(error => {
        this.logger.error('[Notification] Load error:', error);
        this.loading.set(false);
        return of({ success: false, data: { notifications: [], unread_count: 0 } });
      }),
      // Map to just notifications for easier use
      tap(() => {}),
    ) as unknown as Observable<Notification[]>;
  }

  /**
   * Legfrissebb értesítések lekérése (dropdown-hoz)
   * NEM frissíti a fő notifications signal-t!
   */
  fetchRecentForDropdown(projectId: number): Observable<Notification[]> {
    return this.http.get<NotificationsResponse>(
      `${environment.apiUrl}/tablo-frontend/notifications`,
      { params: { limit: '5' } }
    ).pipe(
      tap(response => {
        if (response.success) {
          // Csak az unread count-ot frissítjük, a notifications listát NEM
          this.unreadCount.set(response.data.unread_count);
        }
      }),
      catchError(error => {
        this.logger.error('[Notification] Fetch recent error:', error);
        return of({ success: false, data: { notifications: [], unread_count: 0 } });
      }),
      // Return just the notifications array
      tap(() => {}),
    ) as unknown as Observable<Notification[]>;
  }

  /**
   * Olvasatlan szám frissítése
   */
  refreshUnreadCount(projectId: number): void {
    this.http.get<{ success: boolean; data: { unread_count: number } }>(
      `${environment.apiUrl}/tablo-frontend/notifications/unread-count`
    ).pipe(
      catchError(() => of({ success: false, data: { unread_count: 0 } }))
    ).subscribe(response => {
      if (response.success) {
        this.unreadCount.set(response.data.unread_count);
      }
    });
  }

  /**
   * Értesítés olvasottnak jelölése
   */
  markAsRead(projectId: number, notificationId: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/tablo-frontend/notifications/${notificationId}/read`,
      {}
    ).pipe(
      tap(() => {
        // Helyi state frissítése
        const current = this.notifications();
        const updated = current.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        this.notifications.set(updated);
        this.unreadCount.update(count => Math.max(0, count - 1));
      }),
      catchError(error => {
        this.logger.error('[Notification] Mark as read error:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Összes olvasottnak jelölése
   */
  markAllAsRead(projectId: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/tablo-frontend/notifications/read-all`,
      {}
    ).pipe(
      tap(() => {
        // Helyi state frissítése
        const current = this.notifications();
        const updated = current.map(n => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString()
        }));
        this.notifications.set(updated);
        this.unreadCount.set(0);
      }),
      catchError(error => {
        this.logger.error('[Notification] Mark all as read error:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Real-time értesítés csatornára feliratkozás
   */
  subscribeToNotifications(
    projectId: number,
    recipientType: 'contact' | 'guest',
    recipientId: number
  ): void {
    const channelName = `notifications.${projectId}.${recipientType}.${recipientId}`;
    const channel = this.ws.private(channelName);

    if (!channel) {
      this.logger.warn('[Notification] Could not subscribe to channel');
      return;
    }

    // Debug: channel subscription állapot
    this.logger.info(`[Notification] Setting up listener on channel: ${channelName}`);

    channel.listen('.new.notification', (notification: Notification) => {
      this.logger.info('[Notification] 🔔 REALTIME notification received!');
      this.logger.info('[Notification] Notification data:', notification);

      // Hozzáadás a listához
      const current = this.notifications();
      this.logger.info(`[Notification] Current count: ${current.length}, adding new notification`);
      this.notifications.set([notification, ...current]);
      this.unreadCount.update(count => count + 1);
      this.logger.info(`[Notification] New unread count: ${this.unreadCount()}`);

      // Poke típusú értesítésnél PokeService frissítése is
      if (notification.type === 'poke' || notification.type === 'poke_reaction') {
        this.handlePokeNotification(notification);
      }
    });

    // Debug: error event figyelés
    channel.error((error: unknown) => {
      this.logger.error('[Notification] Channel error:', error);
    });

    this.logger.info(`[Notification] ✅ Subscribed to ${channelName}`);
  }

  /**
   * Értesítés csatorna leiratkozás
   */
  unsubscribeFromNotifications(
    projectId: number,
    recipientType: 'contact' | 'guest',
    recipientId: number
  ): void {
    const channelName = `notifications.${projectId}.${recipientType}.${recipientId}`;
    this.ws.leave(channelName);
    this.logger.info(`[Notification] Unsubscribed from ${channelName}`);
  }

  /**
   * Új értesítés hozzáadása (helyi, pl. badge szerzéskor)
   */
  addLocalNotification(notification: Notification): void {
    const current = this.notifications();
    this.notifications.set([notification, ...current]);
    if (!notification.is_read) {
      this.unreadCount.update(count => count + 1);
    }
  }

  /**
   * Értesítések törlése (helyi)
   */
  clear(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  /**
   * Poke típusú értesítés kezelése
   * Frissíti a PokeService-t és megjelenít toast-ot
   */
  private handlePokeNotification(notification: Notification): void {
    this.logger.info('[Notification] 👉 Handling poke notification:', notification.type);

    // Toast megjelenítése
    if (notification.type === 'poke') {
      this.toastService.info(notification.title, notification.body);
    } else if (notification.type === 'poke_reaction') {
      this.toastService.success(notification.title, notification.body);
    }

    // PokeService frissítése - közvetlen inject-tel (nem lazy)
    this.refreshPokeServiceData(notification.type);
  }

  /**
   * PokeService adatok frissítése
   * Közvetlenül injektáljuk a PokeService-t az Injector segítségével
   */
  private refreshPokeServiceData(notificationType: NotificationType): void {
    try {
      // Közvetlen inject az Injector-ral (nem lazy, de csak itt hívjuk)
      import('./poke.service').then(({ PokeService }) => {
        const pokeService = runInInjectionContext(this.injector, () => inject(PokeService));

        if (notificationType === 'poke') {
          this.logger.info('[Notification] Refreshing PokeService received pokes...');
          pokeService.loadReceivedPokes().subscribe({
            next: () => this.logger.info('[Notification] PokeService received pokes refreshed'),
            error: (err: unknown) => this.logger.error('[Notification] Failed to refresh poke received:', err)
          });
        } else if (notificationType === 'poke_reaction') {
          this.logger.info('[Notification] Refreshing PokeService sent pokes...');
          pokeService.loadSentPokes().subscribe({
            next: () => this.logger.info('[Notification] PokeService sent pokes refreshed'),
            error: (err: unknown) => this.logger.error('[Notification] Failed to refresh poke sent:', err)
          });
        }
      }).catch(err => {
        this.logger.error('[Notification] Failed to import PokeService:', err);
      });
    } catch (e) {
      this.logger.error('[Notification] Error refreshing PokeService:', e);
    }
  }
}
