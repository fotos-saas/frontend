import { Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

type CleanupFn = () => void;

// Queued request interface
export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

interface CacheAPI {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, ttl?: number) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  getAll: () => Promise<Record<string, unknown>>;
}

interface RequestQueueAPI {
  add: (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => Promise<string | null>;
  getAll: () => Promise<QueuedRequest[]>;
  remove: (requestId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
}

interface StripeResult {
  success: boolean;
  error?: string;
}

// Native drag file interface
export interface NativeDragFile {
  url: string;
  fileName: string;
  thumbnailUrl?: string;
}

interface NativeDragAPI {
  prepareFiles: (files: NativeDragFile[]) => Promise<{ success: boolean; paths: string[]; error?: string }>;
  startDrag: (files: string[], thumbnailUrl?: string) => void;
  getTempDir: () => Promise<string>;
  cleanupFiles: (filePaths: string[]) => Promise<boolean>;
}

// Touch Bar elem tipusok
export type TouchBarItemType = 'button' | 'label' | 'spacer' | 'segmented' | 'slider';

export interface TouchBarItem {
  type: TouchBarItemType;
  id?: string;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  size?: 'small' | 'large' | 'flexible';
  segments?: Array<{ label?: string }>;
  selectedIndex?: number;
  mode?: 'single' | 'multiple' | 'buttons';
  minValue?: number;
  maxValue?: number;
  value?: number;
}

// Touch Bar kontextusok
export type TouchBarContext = 'dashboard' | 'gallery' | 'editor';

interface TouchBarAPI {
  setContext: (context: string) => Promise<boolean>;
  setItems: (items: TouchBarItem[]) => Promise<boolean>;
  clear: () => Promise<boolean>;
  onAction: (callback: (actionId: string, data?: Record<string, unknown>) => void) => CleanupFn;
}

// Auto Update state interface
export interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: number;
  version: string | null;
  releaseNotes: string | null;
}

// Auto Update API interface
interface AutoUpdateAPI {
  checkForUpdates: () => Promise<{
    success: boolean;
    updateAvailable?: boolean;
    version?: string | null;
    error?: string;
  }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean }>;
  getStatus: () => Promise<UpdateState>;
  onStatusChange: (callback: (status: UpdateState) => void) => CleanupFn;
}

// Notification options interface
export interface NotificationOptions {
  title: string;
  body: string;
  subtitle?: string;
  actions?: Array<{ type: 'button'; text: string }>;
  hasReply?: boolean;
  replyPlaceholder?: string;
  notificationId?: string;
}

// Notification result interface
export interface NotificationResult {
  success: boolean;
  id: string | null;
}

// Dock API interface
interface DockAPI {
  setBadgeCount: (count: number) => Promise<boolean>;
  setBadgeString: (text: string) => Promise<boolean>;
  clearBadge: () => Promise<boolean>;
  bounce: (type?: 'critical' | 'informational') => Promise<number>;
  cancelBounce: (bounceId: number) => Promise<boolean>;
}

interface ElectronAPI {
  showNotification: (options: NotificationOptions | string, body?: string) => Promise<NotificationResult | boolean>;
  // Notification event handlers
  onNotificationClicked: (callback: (data: { id: string }) => void) => CleanupFn;
  onNotificationReply: (callback: (data: { id: string; reply: string }) => void) => CleanupFn;
  onNotificationAction: (callback: (data: { id: string; actionIndex: number }) => void) => CleanupFn;
  // Dock API (macOS)
  dock: DockAPI;
  onDockMenuAction: (callback: (action: string) => void) => CleanupFn;
  getAppInfo: () => Promise<{
    version: string;
    name: string;
    platform: string;
    isDev: boolean;
  }>;
  getDarkMode: () => Promise<boolean>;
  onDarkModeChange: (callback: (isDark: boolean) => void) => CleanupFn;
  onAppClosing: (callback: () => void) => CleanupFn;
  // Deep link handlers
  onDeepLink: (callback: (path: string) => void) => CleanupFn;
  onPaymentSuccess: (callback: (data: { sessionId: string }) => void) => CleanupFn;
  onPaymentCancelled: (callback: () => void) => CleanupFn;
  platform: string;
  isElectron: boolean;
  // Credential Store (OS Keychain)
  storeCredentials: (username: string, password: string) => Promise<boolean>;
  getCredentials: () => Promise<{ username: string; password: string } | null>;
  deleteCredentials: () => Promise<boolean>;
  hasCredentials: () => Promise<boolean>;
  // Network Status
  getOnlineStatus: () => Promise<boolean>;
  onOnlineStatusChange: (callback: (isOnline: boolean) => void) => CleanupFn;
  // Cache API
  cache: CacheAPI;
  // Request Queue
  requestQueue: RequestQueueAPI;
  // Sync Status
  setLastSync: (timestamp: number) => Promise<boolean>;
  getLastSync: () => Promise<number | null>;
  // Stripe Payment
  stripe: {
    openCheckout: (checkoutUrl: string) => Promise<StripeResult>;
    openPortal: (portalUrl: string) => Promise<StripeResult>;
  };
  // Native File Drag & Drop
  nativeDrag: NativeDragAPI;
  // Touch Bar (MacBook Pro 2016-2020)
  touchBar: TouchBarAPI;
  // Auto Update
  autoUpdate: AutoUpdateAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService implements OnDestroy {
  private readonly _darkMode = signal<boolean>(false);
  private readonly _onlineStatus = signal<boolean>(true);
  private cleanupFunctions: CleanupFn[] = [];

  /** Public readonly signal for dark mode */
  readonly darkMode = this._darkMode.asReadonly();
  /** Public readonly signal for online status */
  readonly onlineStatus = this._onlineStatus.asReadonly();

  constructor(private ngZone: NgZone) {
    this.initDarkModeListener();
    this.initAppClosingListener();
    this.initOnlineStatusListener();
  }

  ngOnDestroy(): void {
    // Cleanup all IPC listeners to prevent memory leaks
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  /**
   * Check if running in Electron environment
   */
  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  /**
   * Get current platform (darwin, win32, linux)
   */
  get platform(): string {
    return window.electronAPI?.platform ?? 'browser';
  }

  /**
   * Check if running on macOS
   */
  get isMac(): boolean {
    return this.platform === 'darwin';
  }

  /**
   * Check if running on Windows
   */
  get isWindows(): boolean {
    return this.platform === 'win32';
  }

  /**
   * Observable for dark mode changes (backward compat)
   */
  readonly darkModeChanges: Observable<boolean> = toObservable(this._darkMode);

  /**
   * Get current dark mode value
   */
  get isDarkMode(): boolean {
    return this._darkMode();
  }

  /**
   * Observable for online status changes (backward compat)
   */
  readonly onlineStatusChanges: Observable<boolean> = toObservable(this._onlineStatus);

  /**
   * Get current online status
   */
  get isOnline(): boolean {
    return this._onlineStatus();
  }

  /**
   * Show native notification (falls back to browser notification if not Electron)
   * Supports both simple (title, body) and advanced (options object) API
   */
  async showNotification(titleOrOptions: string | NotificationOptions, body?: string): Promise<NotificationResult> {
    if (this.isElectron) {
      const result = await window.electronAPI!.showNotification(titleOrOptions, body);
      // Handle both old boolean return and new object return
      if (typeof result === 'boolean') {
        return { success: result, id: null };
      }
      return result;
    }

    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = typeof titleOrOptions === 'string' ? titleOrOptions : titleOrOptions.title;
      const notifBody = typeof titleOrOptions === 'string' ? body || '' : titleOrOptions.body;
      new Notification(title, { body: notifBody });
      return { success: true, id: null };
    }

    return { success: false, id: null };
  }

  // ============ Notification Event Handlers ============

  /**
   * Register callback for notification click events
   */
  onNotificationClicked(callback: (data: { id: string }) => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onNotificationClicked((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register callback for notification reply events (macOS)
   */
  onNotificationReply(callback: (data: { id: string; reply: string }) => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onNotificationReply((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register callback for notification action events (macOS)
   */
  onNotificationAction(callback: (data: { id: string; actionIndex: number }) => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onNotificationAction((data) => {
      this.ngZone.run(() => callback(data));
    });
    this.cleanupFunctions.push(cleanup);
  }

  // ============ Dock Badge (macOS) ============

  /**
   * Set dock badge count (number)
   * Works on macOS and Linux (Ubuntu Unity)
   */
  async setBadgeCount(count: number): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.setBadgeCount(count);
  }

  /**
   * Set dock badge string (macOS only)
   * Use for "99+" style badges or custom text
   */
  async setBadgeString(text: string): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.setBadgeString(text);
  }

  /**
   * Clear dock badge
   */
  async clearBadge(): Promise<boolean> {
    if (!this.isElectron) return false;
    return window.electronAPI!.dock.clearBadge();
  }

  /**
   * Bounce dock icon (macOS only)
   * @param type - 'critical' (bounces until user clicks) or 'informational' (bounces once)
   * @returns bounce request ID (use with cancelBounce)
   */
  async bounceDock(type: 'critical' | 'informational' = 'informational'): Promise<number> {
    if (!this.isElectron || !this.isMac) return -1;
    return window.electronAPI!.dock.bounce(type);
  }

  /**
   * Cancel dock bounce (macOS only)
   */
  async cancelDockBounce(bounceId: number): Promise<boolean> {
    if (!this.isElectron || !this.isMac) return false;
    return window.electronAPI!.dock.cancelBounce(bounceId);
  }

  /**
   * Register callback for dock menu actions (macOS)
   * Actions: 'new-project', 'orders', 'settings'
   */
  onDockMenuAction(callback: (action: string) => void): void {
    if (!this.isElectron || !this.isMac) return;

    const cleanup = window.electronAPI!.onDockMenuAction((action) => {
      this.ngZone.run(() => callback(action));
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Get app info (version, name, etc.)
   */
  async getAppInfo(): Promise<{ version: string; name: string; platform: string; isDev: boolean } | null> {
    if (this.isElectron) {
      return window.electronAPI!.getAppInfo();
    }
    return null;
  }

  /**
   * Get current dark mode status
   */
  async getDarkMode(): Promise<boolean> {
    if (this.isElectron) {
      return window.electronAPI!.getDarkMode();
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private async initDarkModeListener(): Promise<void> {
    // Get initial value
    const isDark = await this.getDarkMode();
    this._darkMode.set(isDark);

    if (this.isElectron) {
      // Listen for Electron dark mode changes with cleanup
      const cleanup = window.electronAPI!.onDarkModeChange((isDark) => {
        this.ngZone.run(() => {
          this._darkMode.set(isDark);
        });
      });
      this.cleanupFunctions.push(cleanup);
    } else {
      // Listen for browser dark mode changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        this.ngZone.run(() => {
          this._darkMode.set(e.matches);
        });
      };
      mediaQuery.addEventListener('change', handler);
      this.cleanupFunctions.push(() => mediaQuery.removeEventListener('change', handler));
    }
  }

  private initAppClosingListener(): void {
    if (this.isElectron) {
      const cleanup = window.electronAPI!.onAppClosing(() => {
        this.ngZone.run(() => {
          // Handle app closing - save state, cleanup, etc.
          console.log('App is closing, performing cleanup...');
        });
      });
      this.cleanupFunctions.push(cleanup);
    }
  }

  private async initOnlineStatusListener(): Promise<void> {
    if (this.isElectron) {
      // Get initial status from Electron
      const isOnline = await window.electronAPI!.getOnlineStatus();
      this._onlineStatus.set(isOnline);

      // Listen for status changes
      const cleanup = window.electronAPI!.onOnlineStatusChange((isOnline) => {
        this.ngZone.run(() => {
          this._onlineStatus.set(isOnline);
        });
      });
      this.cleanupFunctions.push(cleanup);
    } else {
      // Browser fallback using navigator.onLine
      this._onlineStatus.set(navigator.onLine);

      const handleOnline = () => {
        this.ngZone.run(() => this._onlineStatus.set(true));
      };
      const handleOffline = () => {
        this.ngZone.run(() => this._onlineStatus.set(false));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      this.cleanupFunctions.push(() => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      });
    }
  }

  // ============ Credential Store (OS Keychain) ============

  /**
   * Store credentials in OS Keychain (macOS) / Credential Manager (Windows)
   */
  async storeCredentials(username: string, password: string): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    return window.electronAPI!.storeCredentials(username, password);
  }

  /**
   * Get stored credentials from OS Keychain
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    if (!this.isElectron) {
      return null;
    }
    return window.electronAPI!.getCredentials();
  }

  /**
   * Delete stored credentials from OS Keychain
   */
  async deleteCredentials(): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    return window.electronAPI!.deleteCredentials();
  }

  /**
   * Check if credentials are stored
   */
  async hasCredentials(): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    return window.electronAPI!.hasCredentials();
  }

  // ============ Deep Link Handlers ============

  /**
   * Register a callback for deep links
   * Example URLs: photostack://gallery/123, photostack://payment/success?session_id=xxx
   * @param callback - Function to call with the path when a deep link is received
   */
  onDeepLink(callback: (path: string) => void): void {
    if (!this.isElectron) {
      return;
    }

    const cleanup = window.electronAPI!.onDeepLink((path) => {
      this.ngZone.run(() => {
        console.log('Deep link received:', path);
        callback(path);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register a callback for payment success deep links
   * Called when app receives: photostack://payment/success?session_id=xxx
   * @param callback - Function to call with session data
   */
  onPaymentSuccess(callback: (data: { sessionId: string }) => void): void {
    if (!this.isElectron) {
      return;
    }

    const cleanup = window.electronAPI!.onPaymentSuccess((data) => {
      this.ngZone.run(() => {
        console.log('Payment success received:', data);
        callback(data);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Register a callback for payment cancelled deep links
   * Called when app receives: photostack://payment/cancel
   * @param callback - Function to call when payment is cancelled
   */
  onPaymentCancelled(callback: () => void): void {
    if (!this.isElectron) {
      return;
    }

    const cleanup = window.electronAPI!.onPaymentCancelled(() => {
      this.ngZone.run(() => {
        console.log('Payment cancelled');
        callback();
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  // ============ Stripe Payment ============

  /**
   * Open Stripe Checkout in external browser
   * Used for subscription registration/upgrade in desktop app
   * @param checkoutUrl - Stripe Checkout Session URL
   * @returns Promise with success status
   */
  async openStripeCheckout(checkoutUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      // In browser, just redirect
      window.location.href = checkoutUrl;
      return { success: true };
    }

    return window.electronAPI!.stripe.openCheckout(checkoutUrl);
  }

  /**
   * Open Stripe Customer Portal in external browser
   * Used for subscription management (change plan, payment method, cancel)
   * @param portalUrl - Stripe Customer Portal URL
   * @returns Promise with success status
   */
  async openStripePortal(portalUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      // In browser, just redirect
      window.location.href = portalUrl;
      return { success: true };
    }

    return window.electronAPI!.stripe.openPortal(portalUrl);
  }

  // ============ Cache API ============

  /**
   * Get cached value by key
   */
  async cacheGet<T = unknown>(key: string): Promise<T | null> {
    if (!this.isElectron) {
      // Browser fallback to localStorage
      try {
        const item = localStorage.getItem(`photostack_cache_${key}`);
        if (item) {
          const parsed = JSON.parse(item);
          // Check for expiry
          if (parsed.expiry && parsed.expiry < Date.now()) {
            localStorage.removeItem(`photostack_cache_${key}`);
            return null;
          }
          return parsed.value ?? parsed;
        }
      } catch {
        return null;
      }
      return null;
    }
    return window.electronAPI!.cache.get(key) as Promise<T | null>;
  }

  /**
   * Set cached value
   * @param ttl Time to live in milliseconds (optional)
   */
  async cacheSet(key: string, value: unknown, ttl?: number): Promise<boolean> {
    if (!this.isElectron) {
      // Browser fallback to localStorage
      try {
        const item = ttl
          ? { value, expiry: Date.now() + ttl }
          : { value };
        localStorage.setItem(`photostack_cache_${key}`, JSON.stringify(item));
        return true;
      } catch {
        return false;
      }
    }
    return window.electronAPI!.cache.set(key, value, ttl);
  }

  /**
   * Delete cached value
   */
  async cacheDelete(key: string): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.removeItem(`photostack_cache_${key}`);
      return true;
    }
    return window.electronAPI!.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async cacheClear(): Promise<boolean> {
    if (!this.isElectron) {
      // Clear only photostack cache items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('photostack_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    }
    return window.electronAPI!.cache.clear();
  }

  // ============ Request Queue (Offline Mode) ============

  /**
   * Add request to offline queue
   */
  async queueRequest(request: {
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body: unknown;
    headers?: Record<string, string>;
  }): Promise<string | null> {
    if (!this.isElectron) {
      // Browser fallback
      try {
        const queue = JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
        const newRequest = {
          ...request,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        queue.push(newRequest);
        localStorage.setItem('photostack_request_queue', JSON.stringify(queue));
        return newRequest.id;
      } catch {
        return null;
      }
    }
    return window.electronAPI!.requestQueue.add(request);
  }

  /**
   * Get all queued requests
   */
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.isElectron) {
      try {
        return JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
      } catch {
        return [];
      }
    }
    return window.electronAPI!.requestQueue.getAll();
  }

  /**
   * Remove request from queue
   */
  async removeQueuedRequest(requestId: string): Promise<boolean> {
    if (!this.isElectron) {
      try {
        const queue = JSON.parse(localStorage.getItem('photostack_request_queue') || '[]');
        const newQueue = queue.filter((req: QueuedRequest) => req.id !== requestId);
        localStorage.setItem('photostack_request_queue', JSON.stringify(newQueue));
        return true;
      } catch {
        return false;
      }
    }
    return window.electronAPI!.requestQueue.remove(requestId);
  }

  /**
   * Clear request queue
   */
  async clearRequestQueue(): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.removeItem('photostack_request_queue');
      return true;
    }
    return window.electronAPI!.requestQueue.clear();
  }

  // ============ Sync Status ============

  /**
   * Set last sync timestamp
   */
  async setLastSync(timestamp: number): Promise<boolean> {
    if (!this.isElectron) {
      localStorage.setItem('photostack_last_sync', String(timestamp));
      return true;
    }
    return window.electronAPI!.setLastSync(timestamp);
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    if (!this.isElectron) {
      const value = localStorage.getItem('photostack_last_sync');
      return value ? parseInt(value, 10) : null;
    }
    return window.electronAPI!.getLastSync();
  }

  // ============ Native File Drag & Drop ============

  /**
   * Prepare files for native drag operation
   * Downloads remote files to temp directory and returns local paths
   * @param files - Array of files with URL and fileName
   * @returns Object with success status and local file paths
   */
  async prepareDragFiles(files: NativeDragFile[]): Promise<{ success: boolean; paths: string[]; error?: string }> {
    if (!this.isElectron) {
      return { success: false, paths: [], error: 'Native drag only supported in Electron' };
    }
    return window.electronAPI!.nativeDrag.prepareFiles(files);
  }

  /**
   * Start native drag operation with prepared files
   * This initiates OS-level drag that allows dropping files to Finder/Explorer
   * @param files - Array of local file paths (from prepareDragFiles)
   * @param thumbnailUrl - Optional thumbnail URL for drag icon
   */
  startNativeDrag(files: string[], thumbnailUrl?: string): void {
    if (!this.isElectron) {
      console.warn('Native drag only supported in Electron');
      return;
    }
    window.electronAPI!.nativeDrag.startDrag(files, thumbnailUrl);
  }

  /**
   * Get temp directory for drag files
   * @returns Path to temp drag directory
   */
  async getDragTempDir(): Promise<string | null> {
    if (!this.isElectron) {
      return null;
    }
    return window.electronAPI!.nativeDrag.getTempDir();
  }

  /**
   * Cleanup specific temp files after drag operation
   * @param filePaths - Array of file paths to clean up
   */
  async cleanupDragFiles(filePaths: string[]): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    return window.electronAPI!.nativeDrag.cleanupFiles(filePaths);
  }

  /**
   * Helper: Prepare and start drag in one call
   * Convenience method that combines prepareFiles and startDrag
   * @param files - Array of files with URL and fileName
   * @param thumbnailUrl - Optional thumbnail URL for drag icon
   * @returns Object with success status and prepared file paths
   */
  async prepareAndStartDrag(files: NativeDragFile[], thumbnailUrl?: string): Promise<{ success: boolean; paths: string[]; error?: string }> {
    const result = await this.prepareDragFiles(files);
    if (result.success && result.paths.length > 0) {
      this.startNativeDrag(result.paths, thumbnailUrl);
    }
    return result;
  }

  // ============ Touch Bar (MacBook Pro 2016-2020) ============

  /**
   * Check if Touch Bar is available
   * Only available on macOS with Touch Bar enabled MacBook Pro models (2016-2020)
   */
  get hasTouchBar(): boolean {
    return this.isElectron && this.isMac;
  }

  /**
   * Set Touch Bar context (predefined Touch Bar layouts)
   * @param context - 'dashboard' | 'gallery' | 'editor'
   * @returns Promise with success status
   */
  async setTouchBarContext(context: TouchBarContext): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.setContext(context);
  }

  /**
   * Set custom Touch Bar items
   * Use this for dynamic Touch Bar configurations
   * @param items - Array of Touch Bar items
   * @returns Promise with success status
   */
  async setTouchBarItems(items: TouchBarItem[]): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.setItems(items);
  }

  /**
   * Clear Touch Bar (set to empty)
   * @returns Promise with success status
   */
  async clearTouchBar(): Promise<boolean> {
    if (!this.hasTouchBar) return false;
    return window.electronAPI!.touchBar.clear();
  }

  /**
   * Register callback for Touch Bar action events
   * Called when user taps a Touch Bar button or changes a slider/segmented control
   * @param callback - Function to call with actionId and optional data
   *
   * Action IDs for predefined contexts:
   * - Dashboard: 'new-project', 'orders', 'stats', 'refresh'
   * - Gallery: 'gallery-prev', 'gallery-next', 'gallery-zoom', 'gallery-select'
   * - Editor: 'editor-save', 'editor-undo', 'editor-redo', 'editor-preview'
   *
   * Data for sliders: { value: number }
   * Data for segmented controls: { selectedIndex: number }
   */
  onTouchBarAction(callback: (actionId: string, data?: Record<string, unknown>) => void): void {
    if (!this.hasTouchBar) return;

    const cleanup = window.electronAPI!.touchBar.onAction((actionId, data) => {
      this.ngZone.run(() => {
        console.log('Touch Bar action:', actionId, data);
        callback(actionId, data);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }
}
