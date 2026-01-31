import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { LoggerService } from './logger.service';

// Pusher globálisan elérhető kell legyen Laravel Echo-nak
(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocket Service
 *
 * Laravel Reverb/Echo alapú WebSocket kapcsolat kezelése.
 * Singleton service - egy kapcsolat az app lifetime alatt.
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private readonly logger = inject(LoggerService);

  /** Laravel Echo instance */
  private echo: Echo<'reverb'> | null = null;

  /** Kapcsolat állapota */
  readonly connectionState = signal<ConnectionState>('disconnected');

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Kapcsolódva van-e? */
  readonly isConnected = computed(() => this.connectionState() === 'connected');

  /** Reconnect kísérletek száma */
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Kapcsolódás a WebSocket szerverhez
   *
   * @param authToken Bearer token (Sanctum)
   * @param guestSessionToken Guest session token (X-Guest-Session header)
   */
  connect(authToken?: string, guestSessionToken?: string): void {
    if (!environment.wsEnabled) {
      this.logger.warn('[WebSocket] Disabled in environment');
      return;
    }

    if (this.echo) {
      this.logger.warn('[WebSocket] Already connected');
      return;
    }

    this.connectionState.set('connecting');
    this.errorMessage.set(null);

    // Auth headers összeállítása
    const authHeaders: Record<string, string> = {};
    if (authToken) {
      authHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    if (guestSessionToken) {
      authHeaders['X-Guest-Session'] = guestSessionToken;
    }

    this.logger.info('[WebSocket] Connecting with headers:', Object.keys(authHeaders));
    if (guestSessionToken) {
      this.logger.info('[WebSocket] Guest session token present');
    }

    try {
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.wsKey,
        wsHost: environment.wsHost,
        wsPort: environment.wsPort,
        wssPort: environment.wsPort,
        forceTLS: environment.wsScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
        auth: Object.keys(authHeaders).length > 0 ? {
          headers: authHeaders
        } : undefined
      });

      // Kapcsolat állapot figyelése
      this.echo.connector.pusher.connection.bind('connected', () => {
        this.logger.info('[WebSocket] Connected');
        this.connectionState.set('connected');
        this.reconnectAttempts = 0;
      });

      this.echo.connector.pusher.connection.bind('disconnected', () => {
        this.logger.info('[WebSocket] Disconnected');
        this.connectionState.set('disconnected');
        this.attemptReconnect();
      });

      this.echo.connector.pusher.connection.bind('error', (error: unknown) => {
        this.logger.error('[WebSocket] Error:', error);
        this.connectionState.set('error');
        this.errorMessage.set('Kapcsolati hiba');
        this.attemptReconnect();
      });

    } catch (error) {
      this.logger.error('[WebSocket] Connection failed:', error);
      this.connectionState.set('error');
      this.errorMessage.set('Nem sikerült kapcsolódni');
    }
  }

  /**
   * Kapcsolat bontása
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }

    this.connectionState.set('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Újrakapcsolódás kísérlet
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[WebSocket] Max reconnect attempts reached');
      this.errorMessage.set('Nem sikerült újrakapcsolódni');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.logger.info(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.echo) {
        this.echo.connector.pusher.connect();
      }
    }, delay);
  }

  /**
   * Publikus csatornára feliratkozás
   */
  channel(channelName: string): ReturnType<Echo<'reverb'>['channel']> | null {
    if (!this.echo) {
      this.logger.warn('[WebSocket] Not connected');
      return null;
    }
    return this.echo.channel(channelName);
  }

  /**
   * Privát csatornára feliratkozás
   */
  private(channelName: string): ReturnType<Echo<'reverb'>['private']> | null {
    if (!this.echo) {
      this.logger.warn('[WebSocket] Not connected');
      return null;
    }
    return this.echo.private(channelName);
  }

  /**
   * Presence csatornára feliratkozás
   */
  join(channelName: string): ReturnType<Echo<'reverb'>['join']> | null {
    if (!this.echo) {
      this.logger.warn('[WebSocket] Not connected');
      return null;
    }
    return this.echo.join(channelName);
  }

  /**
   * Csatorna elhagyása
   */
  leave(channelName: string): void {
    if (this.echo) {
      this.echo.leave(channelName);
    }
  }

  /**
   * Összes csatorna elhagyása
   */
  leaveAll(): void {
    if (this.echo) {
      this.echo.leaveAllChannels();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
