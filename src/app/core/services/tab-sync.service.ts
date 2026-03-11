import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * localStorage kulcs a session mirror-hoz.
 * JSON tartalom: TabSyncPayload | null
 */
const SESSION_MIRROR_KEY = 'photostack_session_mirror';

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
 * Két mechanizmussal szinkronizálja a session adatokat a tabok között:
 *
 * 1. **localStorage mirror** (session megosztás):
 *    Login-kor a session adatokat localStorage-ba is mentjük (mirror).
 *    Új tab nyitáskor SZINKRONBAN olvashatja és sessionStorage-ba másolja.
 *    Ez 0ms-es, megbízható, és nem függ a BroadcastChannel-től.
 *
 * 2. **BroadcastChannel** (logout szinkronizáció):
 *    Kijelentkezéskor az összes tab értesül és szinkronban kijelentkezik.
 *
 * SECURITY: A localStorage mirror ugyanaz a fenyegetési modell mint a sessionStorage
 * (XSS támadás mindkettőt olvasni tudja). A tokenek védelme a CSP headerek és
 * az input sanitizálás feladata — nem a storage típusé.
 *
 * Safari kompatibilitás: BroadcastChannel Safari 15.4+ óta támogatott.
 * Ha nem elérhető, a logout szinkronizáció nem működik, de a session megosztás igen.
 */
@Injectable({
  providedIn: 'root'
})
export class TabSyncService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);

  private channel: BroadcastChannel | null = null;
  private readonly tabId = this.generateTabId();

  /** Callback kijelentkezés szinkronizáláshoz */
  private onSessionCleared?: () => void;

  /** Guard a végtelen ciklus ellen */
  private isProcessingSync = false;

  constructor() {
    this.initChannel();
  }

  ngOnDestroy(): void {
    this.channel?.close();
    this.channel = null;
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * BroadcastChannel inicializálása (logout szinkronizáláshoz)
   */
  private initChannel(): void {
    try {
      if (typeof BroadcastChannel === 'undefined') return;

      this.channel = new BroadcastChannel('photostack_tab_sync');
      this.channel.onmessage = (event: MessageEvent) => {
        this.ngZone.run(() => this.handleChannelMessage(event.data));
      };
    } catch {
      // BroadcastChannel nem elérhető — graceful degradation
    }
  }

  /** Callback regisztrálás */
  registerCallbacks(callbacks: { onSessionCleared: () => void }): void {
    this.onSessionCleared = callbacks.onSessionCleared;
  }

  // ==========================================
  // SESSION MIRROR (localStorage → szinkron)
  // ==========================================

  /**
   * Session adatok mentése localStorage mirror-ba (login után).
   * Új tab nyitásakor a restoreFromMirror() szinkronban visszaolvassa.
   */
  saveToMirror(): void {
    try {
      const payload = this.collectSessionData();
      if (!payload) return;

      const hasSession = Object.keys(payload.tabloEntries).length > 0 || payload.marketerToken;
      if (!hasSession) return;

      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));
      this.logger.info('[TabSync] Session mirror mentve localStorage-ba');
    } catch {
      // localStorage nem elérhető — silent fail
    }
  }

  /**
   * Session visszaállítása localStorage mirror-ból (szinkron, 0ms).
   * Új tab nyitásakor hívódik — a session adatokat sessionStorage-ba másolja.
   *
   * @returns true ha sikerült session-t visszaállítani
   */
  restoreFromMirror(): boolean {
    try {
      const stored = localStorage.getItem(SESSION_MIRROR_KEY);
      if (!stored) return false;

      const payload: TabSyncPayload = JSON.parse(stored);
      if (!payload) return false;

      const hasSession = Object.keys(payload.tabloEntries).length > 0 || payload.marketerToken;
      if (!hasSession) return false;

      this.applySessionData(payload);
      this.logger.info('[TabSync] Session visszaállítva localStorage mirror-ból');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mirror törlése (logout után)
   */
  clearMirror(): void {
    try {
      localStorage.removeItem(SESSION_MIRROR_KEY);
    } catch {
      // Silent fail
    }
  }

  // ==========================================
  // BROADCAST CHANNEL (logout szinkronizáció)
  // ==========================================

  /**
   * Kijelentkezés broadcast — minden tab kijelentkezik
   */
  broadcastSessionClear(): void {
    if (this.isProcessingSync) return;

    this.clearMirror();

    try {
      this.channel?.postMessage({
        type: 'SESSION_CLEARED',
        senderId: this.tabId
      });
    } catch {
      // Channel closed — silent fail
    }
  }

  /**
   * Bejövő BroadcastChannel üzenet kezelése
   */
  private handleChannelMessage(message: { type: string; senderId: string }): void {
    if (!message || message.senderId === this.tabId) return;

    if (message.type === 'SESSION_CLEARED' && !this.isProcessingSync) {
      this.isProcessingSync = true;
      try {
        this.logger.info('[TabSync] Kijelentkezés szinkronizálva (másik tab kijelentkezett)');
        this.onSessionCleared?.();
      } finally {
        this.isProcessingSync = false;
      }
    }
  }

  // ==========================================
  // SESSION DATA HELPERS
  // ==========================================

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
      for (const [key, value] of Object.entries(payload.tabloEntries)) {
        if (key.startsWith('tablo:') && typeof value === 'string') {
          sessionStorage.setItem(key, value);
        }
      }

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
}
