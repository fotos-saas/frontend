import { Injectable, NgZone, DestroyRef, inject, signal } from '@angular/core';
import { LoggerService } from './logger.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ElectronNotificationService } from './electron-notification.service';
import { ElectronCacheService } from './electron-cache.service';
import { ElectronPaymentService } from './electron-payment.service';
import { ElectronDragService } from './electron-drag.service';
import { ElectronPortraitService } from './electron-portrait.service';

// Re-export tipusok backward kompatibilitashoz
export type { NotificationOptions, NotificationResult } from './electron-notification.service';
export type { QueuedRequest } from './electron-cache.service';
export type { NativeDragFile, TouchBarItem, TouchBarItemType, TouchBarContext } from './electron-drag.service';
export type { UpdateState, PortraitProcessResult, PortraitBatchResult, PortraitProcessingSettings } from './electron.types';

// Window.electronAPI tipus deklaracio importalasa (side-effect)
import './electron.types';

/**
 * ElectronService - Platform detection, dark mode, credentials, online allapot
 *
 * A kovetkezo sub-service-ekre delegal:
 * - ElectronNotificationService: ertesitesek, dock badge
 * - ElectronCacheService: cache, offline queue, sync
 * - ElectronPaymentService: Stripe fizetes, deep link
 * - ElectronDragService: native drag & drop, Touch Bar
 * - ElectronPortraitService: portre hatter feldolgozas
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(ElectronNotificationService);
  private readonly cacheService = inject(ElectronCacheService);
  private readonly paymentService = inject(ElectronPaymentService);
  private readonly dragService = inject(ElectronDragService);
  private readonly portraitService = inject(ElectronPortraitService);

  private readonly _darkMode = signal<boolean>(false);
  private readonly _onlineStatus = signal<boolean>(true);
  private cleanupFunctions: Array<() => void> = [];

  /** Dark mode signal */
  readonly darkMode = this._darkMode.asReadonly();
  /** Online allapot signal */
  readonly onlineStatus = this._onlineStatus.asReadonly();

  constructor(private ngZone: NgZone) {
    this.initDarkModeListener();
    this.initAppClosingListener();
    this.initOnlineStatusListener();

    // Cleanup funkciok regisztrálása DestroyRef-fel
    this.destroyRef.onDestroy(() => {
      this.cleanupFunctions.forEach(cleanup => cleanup());
      this.cleanupFunctions = [];
    });
  }

  // ============ Platform Detection ============

  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  get platform(): string {
    return window.electronAPI?.platform ?? 'browser';
  }

  get isMac(): boolean {
    return this.platform === 'darwin';
  }

  get isWindows(): boolean {
    return this.platform === 'win32';
  }

  // ============ Dark Mode ============

  readonly darkModeChanges: Observable<boolean> = toObservable(this._darkMode);

  get isDarkMode(): boolean {
    return this._darkMode();
  }

  async getDarkMode(): Promise<boolean> {
    if (this.isElectron) {
      return window.electronAPI!.getDarkMode();
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // ============ Online Status ============

  readonly onlineStatusChanges: Observable<boolean> = toObservable(this._onlineStatus);

  get isOnline(): boolean {
    return this._onlineStatus();
  }

  // ============ App Info ============

  async getAppInfo(): Promise<{ version: string; name: string; platform: string; isDev: boolean } | null> {
    if (this.isElectron) return window.electronAPI!.getAppInfo();
    return null;
  }

  // ============ Credential Store (OS Keychain) ============

  async storeCredentials(username: string, password: string): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.storeCredentials(username, password);
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    if (!this.isElectron) return null;
    return window.electronAPI!.getCredentials();
  }

  async deleteCredentials(): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.deleteCredentials();
  }

  async hasCredentials(): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.hasCredentials();
  }

  // ============ Private Init Methods ============

  private async initDarkModeListener(): Promise<void> {
    const isDark = await this.getDarkMode();
    this._darkMode.set(isDark);

    if (this.isElectron) {
      const cleanup = window.electronAPI!.onDarkModeChange((isDark) => {
        this.ngZone.run(() => this._darkMode.set(isDark));
      });
      this.cleanupFunctions.push(cleanup);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        this.ngZone.run(() => this._darkMode.set(e.matches));
      };
      mediaQuery.addEventListener('change', handler);
      this.cleanupFunctions.push(() => mediaQuery.removeEventListener('change', handler));
    }
  }

  private initAppClosingListener(): void {
    if (!this.isElectron) return;
    const cleanup = window.electronAPI!.onAppClosing(() => {
      this.ngZone.run(() => this.logger.info('App is closing, performing cleanup...'));
    });
    this.cleanupFunctions.push(cleanup);
  }

  private async initOnlineStatusListener(): Promise<void> {
    if (this.isElectron) {
      const isOnline = await window.electronAPI!.getOnlineStatus();
      this._onlineStatus.set(isOnline);
      const cleanup = window.electronAPI!.onOnlineStatusChange((isOnline) => {
        this.ngZone.run(() => this._onlineStatus.set(isOnline));
      });
      this.cleanupFunctions.push(cleanup);
    } else {
      this._onlineStatus.set(navigator.onLine);
      const handleOnline = () => this.ngZone.run(() => this._onlineStatus.set(true));
      const handleOffline = () => this.ngZone.run(() => this._onlineStatus.set(false));
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      this.cleanupFunctions.push(() => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      });
    }
  }

  // ============ Delegalt metodusok (backward compat) ============

  // --- Notification ---
  showNotification(...args: Parameters<ElectronNotificationService['showNotification']>) {
    return this.notificationService.showNotification(...args);
  }
  onNotificationClicked(cb: (data: { id: string }) => void): void {
    this.notificationService.onNotificationClicked(cb);
  }
  onNotificationReply(cb: (data: { id: string; reply: string }) => void): void {
    this.notificationService.onNotificationReply(cb);
  }
  onNotificationAction(cb: (data: { id: string; actionIndex: number }) => void): void {
    this.notificationService.onNotificationAction(cb);
  }
  setBadgeCount(count: number) { return this.notificationService.setBadgeCount(count); }
  setBadgeString(text: string) { return this.notificationService.setBadgeString(text); }
  clearBadge() { return this.notificationService.clearBadge(); }
  bounceDock(type?: 'critical' | 'informational') { return this.notificationService.bounceDock(type); }
  cancelDockBounce(id: number) { return this.notificationService.cancelDockBounce(id); }
  onDockMenuAction(cb: (action: string) => void): void { this.notificationService.onDockMenuAction(cb); }

  // --- Cache ---
  cacheGet<T = unknown>(key: string) { return this.cacheService.cacheGet<T>(key); }
  cacheSet(key: string, value: unknown, ttl?: number) { return this.cacheService.cacheSet(key, value, ttl); }
  cacheDelete(key: string) { return this.cacheService.cacheDelete(key); }
  cacheClear() { return this.cacheService.cacheClear(); }
  queueRequest(req: Parameters<ElectronCacheService['queueRequest']>[0]) {
    return this.cacheService.queueRequest(req);
  }
  getQueuedRequests() { return this.cacheService.getQueuedRequests(); }
  removeQueuedRequest(id: string) { return this.cacheService.removeQueuedRequest(id); }
  clearRequestQueue() { return this.cacheService.clearRequestQueue(); }
  setLastSync(ts: number) { return this.cacheService.setLastSync(ts); }
  getLastSync() { return this.cacheService.getLastSync(); }

  // --- Payment ---
  openStripeCheckout(url: string) { return this.paymentService.openStripeCheckout(url); }
  openStripePortal(url: string) { return this.paymentService.openStripePortal(url); }
  onDeepLink(cb: (path: string) => void): void { this.paymentService.onDeepLink(cb); }
  onPaymentSuccess(cb: (data: { sessionId: string }) => void): void { this.paymentService.onPaymentSuccess(cb); }
  onPaymentCancelled(cb: () => void): void { this.paymentService.onPaymentCancelled(cb); }

  // --- Drag & Touch Bar ---
  prepareDragFiles(...args: Parameters<ElectronDragService['prepareDragFiles']>) {
    return this.dragService.prepareDragFiles(...args);
  }
  startNativeDrag(files: string[], thumbnailUrl?: string): void {
    this.dragService.startNativeDrag(files, thumbnailUrl);
  }
  getDragTempDir() { return this.dragService.getDragTempDir(); }
  cleanupDragFiles(paths: string[]) { return this.dragService.cleanupDragFiles(paths); }
  prepareAndStartDrag(...args: Parameters<ElectronDragService['prepareAndStartDrag']>) {
    return this.dragService.prepareAndStartDrag(...args);
  }
  get hasTouchBar(): boolean { return this.dragService.hasTouchBar; }
  setTouchBarContext(...args: Parameters<ElectronDragService['setTouchBarContext']>) {
    return this.dragService.setTouchBarContext(...args);
  }
  setTouchBarItems(...args: Parameters<ElectronDragService['setTouchBarItems']>) {
    return this.dragService.setTouchBarItems(...args);
  }
  clearTouchBar() { return this.dragService.clearTouchBar(); }
  onTouchBarAction(cb: (actionId: string, data?: Record<string, unknown>) => void): void {
    this.dragService.onTouchBarAction(cb);
  }

  // --- Portrait ---
  get pythonAvailable() { return this.portraitService.pythonAvailable; }
  checkPortraitPython() { return this.portraitService.checkPython(); }
  isPortraitPythonAvailable() { return this.portraitService.isPythonAvailable(); }
  processPortraitSingle(...args: Parameters<ElectronPortraitService['processSingle']>) {
    return this.portraitService.processSingle(...args);
  }
  processPortraitBatch(...args: Parameters<ElectronPortraitService['processBatch']>) {
    return this.portraitService.processBatch(...args);
  }
  downloadPortraitBackground(...args: Parameters<ElectronPortraitService['downloadBackground']>) {
    return this.portraitService.downloadBackground(...args);
  }
  getPortraitTempDir() { return this.portraitService.getTempDir(); }
  cleanupPortraitTemp(paths: string[]) { return this.portraitService.cleanupTemp(paths); }
}
