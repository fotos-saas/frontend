import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { GuestService } from './guest.service';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import {
  Poke,
  PokeDailyLimit,
  PokeCategory,
  PokeStatus,
  ApiPokeResponse,
  ApiDailyLimitResponse,
} from '../models/poke.models';
import { ReactionEmoji } from '@shared/constants';
import { PokePresetService } from './poke-preset.service';

/**
 * WebSocket notification payload
 */
interface NotificationPayload {
  id: number;
  type: string;
  title: string;
  body: string;
  data: {
    poke_id?: number;
    from_name?: string;
    emoji?: string;
    message?: string;
    reaction?: string;
    [key: string]: unknown;
  };
  action_url: string;
  created_at: string;
}

/**
 * Poke Action Service
 *
 * Bökés küldése/fogadása, reakciók, olvasottság, WebSocket.
 */
@Injectable({
  providedIn: 'root'
})
export class PokeActionService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly guestService = inject(GuestService);
  private readonly websocket = inject(WebsocketService);
  private readonly toastService = inject(ToastService);
  private readonly presetService = inject(PokePresetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** WebSocket channel neve */
  private notificationChannel: string | null = null;

  /** Új poke értesítés event */
  private readonly _newPokeNotification = new Subject<NotificationPayload>();
  readonly newPokeNotification$ = this._newPokeNotification.asObservable();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unsubscribeFromNotifications();
      this._newPokeNotification.complete();
    });
  }

  // === SIGNALS ===

  /** Küldött bökések */
  readonly sentPokes = signal<Poke[]>([]);

  /** Kapott bökések */
  readonly receivedPokes = signal<Poke[]>([]);

  /** Napi limit info */
  readonly dailyLimit = signal<PokeDailyLimit | null>(null);

  /** Olvasatlan bökések száma */
  readonly unreadCount = signal<number>(0);

  // === COMPUTED ===

  /** Van olvasatlan bökés */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Elérte a napi limitet */
  readonly hasReachedDailyLimit = computed(() =>
    this.dailyLimit()?.hasReachedLimit ?? false
  );

  /** Összes hiányzó szám */
  readonly totalMissing = computed(() =>
    this.presetService.missingSummary()?.totalMissing ?? 0
  );

  // === API CALLS ===

  /**
   * Bökés küldése
   */
  sendPoke(
    targetId: number,
    category: PokeCategory = 'general',
    presetKey?: string,
    customMessage?: string
  ): Observable<{ poke: Poke; dailyLimit: PokeDailyLimit } | null> {
    return this.http.post<{
      success: boolean; message: string;
      data: { poke: ApiPokeResponse; daily_limit: ApiDailyLimitResponse };
    }>(`${this.apiUrl}/pokes`, {
      target_id: targetId, category, preset_key: presetKey, custom_message: customMessage
    }, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          const poke = this.mapPoke(response.data.poke);
          this.sentPokes.update(pokes => [poke, ...pokes]);
          this.dailyLimit.set(this.mapDailyLimit(response.data.daily_limit));
        }
      }),
      map(response => response.success ? {
        poke: this.mapPoke(response.data.poke),
        dailyLimit: this.mapDailyLimit(response.data.daily_limit)
      } : null),
      catchError(error => {
        this.logger.error('[Poke] Send poke error:', error);
        return of(null);
      })
    );
  }

  /**
   * Küldött bökések betöltése
   */
  loadSentPokes(): Observable<Poke[]> {
    return this.http.get<{
      success: boolean;
      data: { pokes: ApiPokeResponse[]; daily_limit: ApiDailyLimitResponse };
    }>(`${this.apiUrl}/pokes/sent`, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          this.sentPokes.set(response.data.pokes.map(this.mapPoke));
          this.dailyLimit.set(this.mapDailyLimit(response.data.daily_limit));
        }
      }),
      map(response => response.data.pokes.map(this.mapPoke)),
      catchError(error => {
        this.logger.error('[Poke] Load sent pokes error:', error);
        return of([]);
      })
    );
  }

  /**
   * Kapott bökések betöltése
   */
  loadReceivedPokes(): Observable<Poke[]> {
    return this.http.get<{
      success: boolean;
      data: { pokes: ApiPokeResponse[]; unread_count: number };
    }>(`${this.apiUrl}/pokes/received`, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          this.receivedPokes.set(response.data.pokes.map(this.mapPoke));
          this.unreadCount.set(response.data.unread_count);
        }
      }),
      map(response => response.data.pokes.map(this.mapPoke)),
      catchError(error => {
        this.logger.error('[Poke] Load received pokes error:', error);
        return of([]);
      })
    );
  }

  /**
   * Reakció hozzáadása
   */
  addReaction(pokeId: number, reaction: ReactionEmoji): Observable<Poke | null> {
    return this.http.post<{
      success: boolean; data: { poke: ApiPokeResponse };
    }>(`${this.apiUrl}/pokes/${pokeId}/reaction`, { reaction }, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          const updatedPoke = this.mapPoke(response.data.poke);
          this.receivedPokes.update(pokes => pokes.map(p => p.id === pokeId ? updatedPoke : p));
        }
      }),
      map(response => response.success ? this.mapPoke(response.data.poke) : null),
      catchError(error => {
        this.logger.error('[Poke] Add reaction error:', error);
        return of(null);
      })
    );
  }

  /**
   * Olvasottnak jelölés
   */
  markAsRead(pokeId: number): Observable<boolean> {
    return this.http.post<{
      success: boolean; data: { poke: ApiPokeResponse };
    }>(`${this.apiUrl}/pokes/${pokeId}/read`, {}, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          const updatedPoke = this.mapPoke(response.data.poke);
          this.receivedPokes.update(pokes => pokes.map(p => p.id === pokeId ? updatedPoke : p));
          this.unreadCount.update(count => Math.max(0, count - 1));
        }
      }),
      map(response => response.success),
      catchError(error => {
        this.logger.error('[Poke] Mark as read error:', error);
        return of(false);
      })
    );
  }

  /**
   * Összes olvasottnak jelölése
   */
  markAllAsRead(): Observable<number> {
    return this.http.post<{
      success: boolean; data: { marked_count: number };
    }>(`${this.apiUrl}/pokes/read-all`, {}, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          this.receivedPokes.update(pokes => pokes.map(p => ({ ...p, isRead: true })));
          this.unreadCount.set(0);
        }
      }),
      map(response => response.data.marked_count),
      catchError(error => {
        this.logger.error('[Poke] Mark all as read error:', error);
        return of(0);
      })
    );
  }

  /**
   * Olvasatlan szám frissítése
   */
  refreshUnreadCount(): Observable<number> {
    return this.http.get<{
      success: boolean; data: { unread_count: number };
    }>(`${this.apiUrl}/pokes/unread-count`, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) this.unreadCount.set(response.data.unread_count);
      }),
      map(response => response.data.unread_count),
      catchError(error => {
        this.logger.error('[Poke] Refresh unread count error:', error);
        return of(0);
      })
    );
  }

  /**
   * Napi limit frissítése
   */
  refreshDailyLimit(): Observable<PokeDailyLimit | null> {
    return this.http.get<{
      success: boolean; data: ApiDailyLimitResponse;
    }>(`${this.apiUrl}/pokes/daily-limit`, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) this.dailyLimit.set(this.mapDailyLimit(response.data));
      }),
      map(response => this.mapDailyLimit(response.data)),
      catchError(error => {
        this.logger.error('[Poke] Refresh daily limit error:', error);
        return of(null);
      })
    );
  }

  /**
   * Inicializálás - minden adat betöltése
   */
  initialize(): Observable<boolean> {
    this.presetService.loading.set(true);

    return forkJoin({
      presets: this.presetService.loadPresets(),
      received: this.loadReceivedPokes(),
      sent: this.loadSentPokes(),
      missing: this.presetService.loadMissingUsers()
    }).pipe(
      tap(() => this.presetService.loading.set(false)),
      map(() => true),
      catchError(error => {
        this.logger.error('[Poke] Initialize error:', error);
        this.presetService.loading.set(false);
        return of(false);
      })
    );
  }

  // === RESET ===

  clear(): void {
    this.sentPokes.set([]);
    this.receivedPokes.set([]);
    this.dailyLimit.set(null);
    this.unreadCount.set(0);
    this.presetService.clearPresets();
  }

  // === WEBSOCKET ===

  subscribeToNotifications(projectId: number, guestSessionId: number): void {
    const channelName = `notifications.${projectId}.guest.${guestSessionId}`;
    if (this.notificationChannel === channelName) {
      this.logger.info('[Poke] Already subscribed to channel:', channelName);
      return;
    }
    if (this.notificationChannel) {
      this.websocket.leave(this.notificationChannel);
    }
    this.notificationChannel = channelName;
    const channel = this.websocket.private(channelName);
    if (channel) {
      channel.listen('.new.notification', (payload: NotificationPayload) => {
        this.handleNotification(payload);
      });
      this.logger.info('[Poke] Subscribed to notification channel:', channelName);
    } else {
      this.logger.warn('[Poke] Failed to subscribe to channel:', channelName);
    }
  }

  unsubscribeFromNotifications(): void {
    if (this.notificationChannel) {
      this.websocket.leave(this.notificationChannel);
      this.notificationChannel = null;
      this.logger.info('[Poke] Unsubscribed from notification channel');
    }
  }

  private handleNotification(payload: NotificationPayload): void {
    this.logger.info('[Poke] Received notification:', payload);
    if (payload.type === 'poke') {
      this.unreadCount.update(count => count + 1);
      this.toastService.info(payload.title, payload.body);
      this._newPokeNotification.next(payload);
      this.loadReceivedPokes().subscribe();
    }
    if (payload.type === 'poke_reaction') {
      this.toastService.success(payload.title, payload.body);
      this._newPokeNotification.next(payload);
      this.loadSentPokes().subscribe();
    }
  }


  // === PRIVATE ===

  private mapPoke = (api: ApiPokeResponse): Poke => ({
    id: api.id, from: api.from, target: api.target,
    category: api.category, messageType: api.messageType,
    emoji: api.emoji, text: api.text, status: api.status as PokeStatus,
    reaction: api.reaction as ReactionEmoji | null,
    isRead: api.isRead, reactedAt: api.reactedAt,
    resolvedAt: api.resolvedAt, createdAt: api.createdAt
  });

  private mapDailyLimit = (api: ApiDailyLimitResponse): PokeDailyLimit => ({
    sentToday: api.sent_today, dailyLimit: api.daily_limit,
    remaining: api.remaining, hasReachedLimit: api.has_reached_limit
  });
}
