import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Protokoll verzió — ha változik az üzenetformátum, növeld!
 * Régi verziójú üzeneteket a service figyelmen kívül hagyja.
 */
const CHANNEL_VERSION = 1;

/** Mennyi ideig várunk válaszra másik tab-tól (ms) */
const SESSION_REQUEST_TIMEOUT_MS = 300;

/**
 * Tab szinkronizáció üzenet típusok
 */
interface TabSyncMessage {
  type: 'SESSION_REQUEST' | 'SESSION_RESPONSE' | 'SESSION_UPDATED' | 'SESSION_CLEARED';
  /** Az üzenetet küldő tab egyedi azonosítója */
  senderId: string;
  /** Protokoll verzió */
  version: number;
  /** Session adatok (ha van) */
  payload?: TabSyncPayload;
}

/**
 * Szinkronizálandó session adatok
 */
interface TabSyncPayload {
  /** Tablo session: sessionStorage kulcs-érték párok (tablo: prefix) */
  tabloEntries: Record<string, string>;
  /** Marketer session: token + user JSON */
  marketerToken: string | null;
  marketerUser: string | null;
}

/**
 * Tab Sync Service
 *
 * BroadcastChannel API-val szinkronizálja a session adatokat a tabok között.
 * A tokenek sessionStorage-ban maradnak (XSS védelem), de új tab nyitásnál
 * a meglévő tabok átadják a session adatokat.
 *
 * Működés:
 * 1. Új tab nyitáskor: SESSION_REQUEST üzenetet küld
 * 2. Meglévő tabok: SESSION_RESPONSE-szal válaszolnak (session adatokkal)
 * 3. Bejelentkezéskor: SESSION_UPDATED → minden tab megkapja az új session-t
 * 4. Kijelentkezéskor: SESSION_CLEARED → minden tab kijelentkezik
 *
 * SECURITY: A BroadcastChannel same-origin policy-val védett.
 * A tokenek átadása a tabok között tudatos döntés — ugyanaz a fenyegetési modell,
 * mint a sessionStorage közvetlen olvasása. Verzió ellenőrzéssel szűrjük az idegen üzeneteket.
 *
 * Safari kompatibilitás: BroadcastChannel Safari 15.4+ óta támogatott.
 * Ha nem elérhető, a service nem csinál semmit (graceful degradation).
 */
@Injectable({
  providedIn: 'root'
})
export class TabSyncService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);

  private channel: BroadcastChannel | null = null;
  private readonly tabId = this.generateTabId();

  /** Callback-ek a session események kezelésére */
  private onSessionReceived?: (payload: TabSyncPayload) => void;
  private onSessionCleared?: () => void;

  /** Jelzi, hogy a session request-re érkezett-e válasz */
  private sessionRequestResolved = false;
  private sessionRequestResolver?: (received: boolean) => void;

  /** Guard a végtelen ciklus ellen (sync → logout → broadcast → sync → ...) */
  private isProcessingSync = false;

  constructor() {
    this.initChannel();
  }

  ngOnDestroy(): void {
    this.channel?.close();
    this.channel = null;
  }

  /**
   * Egyedi tab azonosító generálása
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * BroadcastChannel inicializálása
   */
  private initChannel(): void {
    try {
      if (typeof BroadcastChannel === 'undefined') {
        this.logger.warn('[TabSync] BroadcastChannel nem elérhető');
        return;
      }

      this.channel = new BroadcastChannel('photostack_tab_sync');

      this.channel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
        // Angular zone-ban futtatjuk a callback-eket
        this.ngZone.run(() => {
          this.handleMessage(event.data);
        });
      };

      this.logger.info(`[TabSync] Inicializálva (tabId: ${this.tabId})`);
    } catch {
      this.logger.warn('[TabSync] BroadcastChannel inicializálás sikertelen');
    }
  }

  /**
   * Callback-ek regisztrálása
   */
  registerCallbacks(callbacks: {
    onSessionReceived: (payload: TabSyncPayload) => void;
    onSessionCleared: () => void;
  }): void {
    this.onSessionReceived = callbacks.onSessionReceived;
    this.onSessionCleared = callbacks.onSessionCleared;
  }

  /**
   * Session kérése a meglévő taboktól
   *
   * Új tab nyitásakor hívódik. Küld egy SESSION_REQUEST-et,
   * majd vár max SESSION_REQUEST_TIMEOUT_MS-t válaszra.
   *
   * @returns Promise<boolean> - true ha kapott session adatokat
   */
  requestSession(): Promise<boolean> {
    if (!this.channel) {
      return Promise.resolve(false);
    }

    this.sessionRequestResolved = false;

    return new Promise<boolean>((resolve) => {
      this.sessionRequestResolver = resolve;

      // Timeout: ha nem jön válasz, nincs másik aktív tab
      setTimeout(() => {
        if (!this.sessionRequestResolved) {
          this.sessionRequestResolved = true;
          this.sessionRequestResolver = undefined;
          resolve(false);
        }
      }, SESSION_REQUEST_TIMEOUT_MS);

      this.send({
        type: 'SESSION_REQUEST',
        senderId: this.tabId,
        version: CHANNEL_VERSION
      });
    });
  }

  /**
   * Session frissítés broadcast (login után)
   */
  broadcastSessionUpdate(): void {
    if (this.isProcessingSync) return;

    const payload = this.collectSessionData();
    if (!payload) return;

    this.send({
      type: 'SESSION_UPDATED',
      senderId: this.tabId,
      version: CHANNEL_VERSION,
      payload
    });
  }

  /**
   * Kijelentkezés broadcast (logout után)
   */
  broadcastSessionClear(): void {
    if (this.isProcessingSync) return;

    this.send({
      type: 'SESSION_CLEARED',
      senderId: this.tabId,
      version: CHANNEL_VERSION
    });
  }

  /**
   * Bejövő üzenetek kezelése
   */
  private handleMessage(message: TabSyncMessage): void {
    // Saját üzeneteket kihagyjuk
    if (message.senderId === this.tabId) return;

    // Verzió ellenőrzés — idegen/régi verziójú üzeneteket eldobjuk
    if (message.version !== CHANNEL_VERSION) return;

    switch (message.type) {
      case 'SESSION_REQUEST':
        this.handleSessionRequest(message.senderId);
        break;

      case 'SESSION_RESPONSE':
        this.handleSessionResponse(message.payload);
        break;

      case 'SESSION_UPDATED':
        this.handleSessionUpdated(message.payload);
        break;

      case 'SESSION_CLEARED':
        this.handleSessionCleared();
        break;
    }
  }

  /**
   * Másik tab kéri a session adatokat → elküldjük
   */
  private handleSessionRequest(requesterId: string): void {
    const payload = this.collectSessionData();
    if (!payload) return;

    // Csak ha van aktív session, válaszolunk
    const hasSession = Object.keys(payload.tabloEntries).length > 0 || payload.marketerToken;
    if (!hasSession) return;

    this.send({
      type: 'SESSION_RESPONSE',
      senderId: this.tabId,
      version: CHANNEL_VERSION,
      payload
    });

    this.logger.info(`[TabSync] Session elküldve tab-nak: ${requesterId}`);
  }

  /**
   * Válasz érkezett a session kérésre → betöltjük
   */
  private handleSessionResponse(payload?: TabSyncPayload): void {
    if (!payload || this.sessionRequestResolved) return;

    this.sessionRequestResolved = true;
    this.applySessionData(payload);
    this.sessionRequestResolver?.(true);
    this.sessionRequestResolver = undefined;

    this.logger.info('[TabSync] Session átvéve másik tab-tól');
  }

  /**
   * Másik tab bejelentkezett → frissítjük a mi session-ünket is
   */
  private handleSessionUpdated(payload?: TabSyncPayload): void {
    if (!payload) return;

    this.isProcessingSync = true;
    try {
      this.applySessionData(payload);
      this.onSessionReceived?.(payload);
    } finally {
      this.isProcessingSync = false;
    }

    this.logger.info('[TabSync] Session szinkronizálva (másik tab bejelentkezett)');
  }

  /**
   * Másik tab kijelentkezett → mi is kijelentkezünk
   *
   * FONTOS: isProcessingSync guard védi a végtelen ciklust:
   * Tab A logout → broadcast → Tab B clearLocalState → NEM broadcast-ol vissza
   */
  private handleSessionCleared(): void {
    if (this.isProcessingSync) return;

    this.isProcessingSync = true;
    try {
      this.logger.info('[TabSync] Kijelentkezés szinkronizálva (másik tab kijelentkezett)');
      this.onSessionCleared?.();
    } finally {
      this.isProcessingSync = false;
    }
  }

  /**
   * Aktuális session adatok összegyűjtése sessionStorage-ból
   */
  private collectSessionData(): TabSyncPayload | null {
    try {
      const tabloEntries: Record<string, string> = {};

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('tablo:')) {
          const value = sessionStorage.getItem(key);
          if (value !== null) {
            tabloEntries[key] = value;
          }
        }
      }

      return {
        tabloEntries,
        marketerToken: sessionStorage.getItem('marketer_token'),
        marketerUser: sessionStorage.getItem('marketer_user')
      };
    } catch {
      return null;
    }
  }

  /**
   * Session adatok alkalmazása a sessionStorage-ba
   */
  private applySessionData(payload: TabSyncPayload): void {
    try {
      // Tablo session adatok — csak tablo: prefixű kulcsokat fogadunk el
      for (const [key, value] of Object.entries(payload.tabloEntries)) {
        if (key.startsWith('tablo:') && typeof value === 'string') {
          sessionStorage.setItem(key, value);
        }
      }

      // Marketer session adatok
      if (payload.marketerToken && typeof payload.marketerToken === 'string') {
        sessionStorage.setItem('marketer_token', payload.marketerToken);
      }
      if (payload.marketerUser && typeof payload.marketerUser === 'string') {
        sessionStorage.setItem('marketer_user', payload.marketerUser);
      }
    } catch {
      this.logger.warn('[TabSync] Session adatok alkalmazása sikertelen');
    }
  }

  /**
   * Üzenet küldése a channel-en
   */
  private send(message: TabSyncMessage): void {
    try {
      this.channel?.postMessage(message);
    } catch {
      // Channel closed vagy nem elérhető — silent fail
    }
  }
}
