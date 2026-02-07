import { Injectable, NgZone, OnDestroy } from '@angular/core';

type CleanupFn = () => void;

/** Ertesitesi opciok */
export interface NotificationOptions {
  title: string;
  body: string;
  subtitle?: string;
  actions?: Array<{ type: 'button'; text: string }>;
  hasReply?: boolean;
  replyPlaceholder?: string;
  notificationId?: string;
}

/** Ertesites eredmeny */
export interface NotificationResult {
  success: boolean;
  id: string | null;
}

/**
 * ElectronNotificationService - Ertesitesek es Dock badge kezeles
 *
 * Funkcionalitas:
 * - Native ertesitesek (fallback browser Notification)
 * - Ertesites esemenyek (click, reply, action)
 * - Dock badge (macOS) - szam, szoveg, bounce
 * - Dock menu callback-ek
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronNotificationService implements OnDestroy {
  private cleanupFunctions: CleanupFn[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  private get isMac(): boolean {
    return (window.electronAPI?.platform ?? 'browser') === 'darwin';
  }

  /**
   * Native ertesites megjelenitese (fallback browser notification)
   */
  async showNotification(titleOrOptions: string | NotificationOptions, body?: string): Promise<NotificationResult> {
    if (this.isElectron) {
      const result = await window.electronAPI!.showNotification(titleOrOptions, body);
      if (typeof result === 'boolean') {
        return { success: result, id: null };
      }
      return result;
    }

    // Browser fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = typeof titleOrOptions === 'string' ? titleOrOptions : titleOrOptions.title;
      const notifBody = typeof titleOrOptions === 'string' ? body || '' : titleOrOptions.body;
      new Notification(title, { body: notifBody });
      return { success: true, id: null };
    }

    return { success: false, id: null };
  }

  /** Ertesites kattintas callback */
  onNotificationClicked(callback: (data: { id: string }) => void): void {
    if (!this.isElectron) return;
    const cleanup = window.electronAPI!.onNotificationClicked((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  /** Ertesites valasz callback (macOS) */
  onNotificationReply(callback: (data: { id: string; reply: string }) => void): void {
    if (!this.isElectron) return;
    const cleanup = window.electronAPI!.onNotificationReply((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  /** Ertesites akcio callback (macOS) */
  onNotificationAction(callback: (data: { id: string; actionIndex: number }) => void): void {
    if (!this.isElectron) return;
    const cleanup = window.electronAPI!.onNotificationAction((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  // ============ Dock Badge (macOS) ============

  /** Dock badge szam beallitasa */
  async setBadgeCount(count: number): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.setBadgeCount(count);
  }

  /** Dock badge szoveg beallitasa (pl. "99+") */
  async setBadgeString(text: string): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.setBadgeString(text);
  }

  /** Dock badge torlese */
  async clearBadge(): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.dock.clearBadge();
  }

  /** Dock ikon ugraltatasa (macOS) */
  async bounceDock(type: 'critical' | 'informational' = 'informational'): Promise<number> {
    if (!this.isElectron || !this.isMac) return -1;
    return window.electronAPI!.dock.bounce(type);
  }

  /** Dock bounce megszakitasa */
  async cancelDockBounce(bounceId: number): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.cancelBounce(bounceId);
  }

  /** Dock menu akciok callback-je (macOS) */
  onDockMenuAction(callback: (action: string) => void): void {
    if (!this.isElectron || !this.isMac) return;
    const cleanup = window.electronAPI!.onDockMenuAction((action) => {
      this.ngZone.run(() => callback(action));
    });
    this.cleanupFunctions.push(cleanup);
  }
}
