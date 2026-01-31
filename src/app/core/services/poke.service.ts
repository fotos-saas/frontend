import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError, of, map, forkJoin, Subject } from 'rxjs';
import { LoggerService } from './logger.service';
import { GuestService } from './guest.service';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import {
  Poke,
  PokePreset,
  PokeDailyLimit,
  PokeCategory,
  PokeReaction,
  MissingUser,
  MissingCategory,
  MissingSummary,
  ApiPokeResponse,
  ApiPokePresetResponse,
  ApiDailyLimitResponse,
  ApiPokeStatusResponse,
  ApiMissingUserResponse,
  ApiMissingCategoryResponse,
  UserPokeStatus
} from '../models/poke.models';

/**
 * Poke Service
 *
 * Peer-to-peer bökés rendszer kezelése.
 * Signal-alapú state management.
 */
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

@Injectable({
  providedIn: 'root'
})
export class PokeService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly guestService = inject(GuestService);
  private readonly websocket = inject(WebsocketService);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /** WebSocket channel neve */
  private notificationChannel: string | null = null;

  /** Új poke értesítés event */
  private readonly _newPokeNotification = new Subject<NotificationPayload>();
  readonly newPokeNotification$ = this._newPokeNotification.asObservable();

  /**
   * HTTP headers guest session-nel
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const sessionToken = this.guestService.getSessionToken();
    if (sessionToken) {
      headers = headers.set('X-Guest-Session', sessionToken);
    }
    return headers;
  }

  // ==========================================
  // SIGNALS - State
  // ==========================================

  /** Preset üzenetek */
  readonly presets = signal<PokePreset[]>([]);

  /** Küldött bökések */
  readonly sentPokes = signal<Poke[]>([]);

  /** Kapott bökések */
  readonly receivedPokes = signal<Poke[]>([]);

  /** Napi limit info */
  readonly dailyLimit = signal<PokeDailyLimit | null>(null);

  /** Olvasatlan bökések száma */
  readonly unreadCount = signal<number>(0);

  /** Hiányzók kategóriánként */
  readonly missingCategories = signal<{
    voting: MissingCategory | null;
    photoshoot: MissingCategory | null;
    image_selection: MissingCategory | null;
  }>({
    voting: null,
    photoshoot: null,
    image_selection: null
  });

  /** Hiányzók összesítés */
  readonly missingSummary = signal<MissingSummary | null>(null);

  /** Töltés állapot */
  readonly loading = signal<boolean>(false);

  // ==========================================
  // COMPUTED
  // ==========================================

  /** Van olvasatlan bökés */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Elérte a napi limitet */
  readonly hasReachedDailyLimit = computed(() =>
    this.dailyLimit()?.hasReachedLimit ?? false
  );

  /** Összes hiányzó szám */
  readonly totalMissing = computed(() =>
    this.missingSummary()?.totalMissing ?? 0
  );

  /** Preset-ek kategória szerint */
  presetsForCategory(category: PokeCategory | null): PokePreset[] {
    const all = this.presets();
    if (!category) return all.filter(p => !p.category);
    return all.filter(p => !p.category || p.category === category);
  }

  // ==========================================
  // API CALLS
  // ==========================================

  /**
   * Preset üzenetek betöltése
   */
  loadPresets(category?: PokeCategory): Observable<PokePreset[]> {
    const options: { headers: HttpHeaders; params?: { category: PokeCategory } } = {
      headers: this.getHeaders(),
      ...(category && { params: { category } })
    };

    return this.http.get<{ success: boolean; data: { presets: ApiPokePresetResponse[] } }>(
      `${this.apiUrl}/pokes/presets`,
      options
    ).pipe(
      map(response => response.data.presets.map(this.mapPreset)),
      tap(presets => this.presets.set(presets)),
      catchError(error => {
        this.logger.error('[Poke] Load presets error:', error);
        return of([]);
      })
    );
  }

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
      success: boolean;
      message: string;
      data: {
        poke: ApiPokeResponse;
        daily_limit: ApiDailyLimitResponse;
      };
    }>(`${this.apiUrl}/pokes`, {
      target_id: targetId,
      category,
      preset_key: presetKey,
      custom_message: customMessage
    }, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          // Küldött bökések frissítése
          const poke = this.mapPoke(response.data.poke);
          this.sentPokes.update(pokes => [poke, ...pokes]);

          // Napi limit frissítése
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
      data: {
        pokes: ApiPokeResponse[];
        daily_limit: ApiDailyLimitResponse;
      };
    }>(`${this.apiUrl}/pokes/sent`, { headers: this.getHeaders() }).pipe(
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
      data: {
        pokes: ApiPokeResponse[];
        unread_count: number;
      };
    }>(`${this.apiUrl}/pokes/received`, { headers: this.getHeaders() }).pipe(
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
  addReaction(pokeId: number, reaction: PokeReaction): Observable<Poke | null> {
    return this.http.post<{
      success: boolean;
      data: { poke: ApiPokeResponse };
    }>(`${this.apiUrl}/pokes/${pokeId}/reaction`, { reaction }, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          const updatedPoke = this.mapPoke(response.data.poke);
          this.receivedPokes.update(pokes =>
            pokes.map(p => p.id === pokeId ? updatedPoke : p)
          );
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
      success: boolean;
      data: { poke: ApiPokeResponse };
    }>(`${this.apiUrl}/pokes/${pokeId}/read`, {}, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          const updatedPoke = this.mapPoke(response.data.poke);
          this.receivedPokes.update(pokes =>
            pokes.map(p => p.id === pokeId ? updatedPoke : p)
          );
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
      success: boolean;
      data: { marked_count: number };
    }>(`${this.apiUrl}/pokes/read-all`, {}, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.receivedPokes.update(pokes =>
            pokes.map(p => ({ ...p, isRead: true }))
          );
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
      success: boolean;
      data: { unread_count: number };
    }>(`${this.apiUrl}/pokes/unread-count`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.unreadCount.set(response.data.unread_count);
        }
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
      success: boolean;
      data: ApiDailyLimitResponse;
    }>(`${this.apiUrl}/pokes/daily-limit`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.dailyLimit.set(this.mapDailyLimit(response.data));
        }
      }),
      map(response => this.mapDailyLimit(response.data)),
      catchError(error => {
        this.logger.error('[Poke] Refresh daily limit error:', error);
        return of(null);
      })
    );
  }

  // ==========================================
  // MISSING USERS
  // ==========================================

  /**
   * Hiányzók betöltése összes kategóriában
   */
  loadMissingUsers(): Observable<boolean> {
    this.loading.set(true);

    return this.http.get<{
      success: boolean;
      data: {
        categories: {
          voting: ApiMissingCategoryResponse;
          photoshoot: ApiMissingCategoryResponse;
          image_selection: ApiMissingCategoryResponse;
        };
        summary: MissingSummary;
      };
    }>(`${this.apiUrl}/missing`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.missingCategories.set({
            voting: this.mapMissingCategory(response.data.categories.voting),
            photoshoot: this.mapMissingCategory(response.data.categories.photoshoot),
            image_selection: this.mapMissingCategory(response.data.categories.image_selection)
          });
          this.missingSummary.set(response.data.summary);
        }
        this.loading.set(false);
      }),
      map(response => response.success),
      catchError(error => {
        this.logger.error('[Poke] Load missing users error:', error);
        this.loading.set(false);
        return of(false);
      })
    );
  }

  /**
   * Inicializálás - minden adat betöltése
   */
  initialize(): Observable<boolean> {
    this.loading.set(true);

    return forkJoin({
      presets: this.loadPresets(),
      received: this.loadReceivedPokes(),
      sent: this.loadSentPokes(),
      missing: this.loadMissingUsers()
    }).pipe(
      tap(() => this.loading.set(false)),
      map(() => true),
      catchError(error => {
        this.logger.error('[Poke] Initialize error:', error);
        this.loading.set(false);
        return of(false);
      })
    );
  }

  // ==========================================
  // MAPPERS
  // ==========================================

  private mapPoke = (api: ApiPokeResponse): Poke => ({
    id: api.id,
    from: api.from,
    target: api.target,
    category: api.category,
    messageType: api.messageType,
    emoji: api.emoji,
    text: api.text,
    status: api.status as any,
    reaction: api.reaction as PokeReaction | null,
    isRead: api.isRead,
    reactedAt: api.reactedAt,
    resolvedAt: api.resolvedAt,
    createdAt: api.createdAt
  });

  private mapPreset = (api: ApiPokePresetResponse): PokePreset => ({
    key: api.key,
    emoji: api.emoji,
    text: api.text,
    category: api.category
  });

  private mapDailyLimit = (api: ApiDailyLimitResponse): PokeDailyLimit => ({
    sentToday: api.sent_today,
    dailyLimit: api.daily_limit,
    remaining: api.remaining,
    hasReachedLimit: api.has_reached_limit
  });

  private mapMissingUser = (api: ApiMissingUserResponse): MissingUser => ({
    id: api.id,
    name: api.name,
    email: api.email,
    isExtra: api.is_extra,
    type: api.type,
    hasGuestSession: api.has_guest_session ?? false,
    guestSessionId: api.guest_session_id ?? null,
    lastActivityAt: api.last_activity_at,
    hasActivity: api.has_activity,
    createdAt: api.created_at,
    pokeStatus: {
      canPoke: api.poke_status.can_poke,
      reason: api.poke_status.reason ?? null,
      reasonHu: api.poke_status.reason_hu ?? null,
      totalPokesSent: api.poke_status.total_pokes_sent ?? 0,
      maxPokes: api.poke_status.max_pokes ?? 3
    } as UserPokeStatus
  });

  private mapMissingCategory = (api: ApiMissingCategoryResponse): MissingCategory => ({
    count: api.count,
    users: api.users.map(this.mapMissingUser),
    hasActivePoll: api.has_active_poll,
    activePollsCount: api.active_polls_count,
    totalMissingPhotos: api.total_missing_photos,
    message: api.message
  });

  // ==========================================
  // RESET
  // ==========================================

  clear(): void {
    this.presets.set([]);
    this.sentPokes.set([]);
    this.receivedPokes.set([]);
    this.dailyLimit.set(null);
    this.unreadCount.set(0);
    this.missingCategories.set({
      voting: null,
      photoshoot: null,
      image_selection: null
    });
    this.missingSummary.set(null);
  }

  // ==========================================
  // WEBSOCKET - Real-time notifications
  // ==========================================

  /**
   * Feliratkozás a notification WebSocket csatornára
   */
  subscribeToNotifications(projectId: number, guestSessionId: number): void {
    const channelName = `notifications.${projectId}.guest.${guestSessionId}`;

    if (this.notificationChannel === channelName) {
      this.logger.info('[Poke] Already subscribed to channel:', channelName);
      return;
    }

    // Előző csatorna elhagyása
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

  /**
   * Leiratkozás a notification csatornáról
   */
  unsubscribeFromNotifications(): void {
    if (this.notificationChannel) {
      this.websocket.leave(this.notificationChannel);
      this.notificationChannel = null;
      this.logger.info('[Poke] Unsubscribed from notification channel');
    }
  }

  /**
   * Notification feldolgozása
   */
  private handleNotification(payload: NotificationPayload): void {
    this.logger.info('[Poke] Received notification:', payload);

    // Poke értesítés kezelése
    if (payload.type === 'poke') {
      // Unread count növelése
      this.unreadCount.update(count => count + 1);

      // Toast megjelenítése
      this.toastService.info(
        payload.title,
        payload.body
      );

      // Event kibocsátása
      this._newPokeNotification.next(payload);

      // Kapott bökések újratöltése
      this.loadReceivedPokes().subscribe();
    }

    // Poke reakció értesítés kezelése
    if (payload.type === 'poke_reaction') {
      // Toast megjelenítése
      this.toastService.success(
        payload.title,
        payload.body
      );

      // Event kibocsátása
      this._newPokeNotification.next(payload);

      // Küldött bökések újratöltése (reakció frissítéshez)
      this.loadSentPokes().subscribe();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeFromNotifications();
    this._newPokeNotification.complete();
  }
}
