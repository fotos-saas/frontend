import { ipcRenderer, IpcRendererEvent } from 'electron';

// Type for cleanup function
type CleanupFn = () => void;

// Queued request interface
interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

// Update state interface
interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: number;
  version: string | null;
  releaseNotes: string | null;
}

// Notification options interface
interface NotificationOptions {
  title: string;
  body: string;
  subtitle?: string;
  actions?: Array<{ type: 'button'; text: string }>;
  hasReply?: boolean;
  replyPlaceholder?: string;
  notificationId?: string;
}

// Notification result interface
interface NotificationResult {
  success: boolean;
  id: string | null;
}

/**
 * Core API: notifications, dock, app info, dark mode, lifecycle,
 * deep link, payment, credentials, network, cache, queue, stripe, auto update
 */
export function buildCoreApi() {
  return {
    // Notifications (extended with macOS features)
    showNotification: (options: NotificationOptions | string, body?: string) => {
      // Support both old API (title, body) and new API (options object)
      if (typeof options === 'string') {
        return ipcRenderer.invoke('show-notification', { title: options, body: body || '' });
      }
      return ipcRenderer.invoke('show-notification', options) as Promise<NotificationResult>;
    },

    // Notification event handlers
    onNotificationClicked: (callback: (data: { id: string }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { id: string }) => callback(data);
      ipcRenderer.on('notification-clicked', handler);
      return () => ipcRenderer.removeListener('notification-clicked', handler);
    },

    onNotificationReply: (callback: (data: { id: string; reply: string }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { id: string; reply: string }) => callback(data);
      ipcRenderer.on('notification-reply', handler);
      return () => ipcRenderer.removeListener('notification-reply', handler);
    },

    onNotificationAction: (callback: (data: { id: string; actionIndex: number }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { id: string; actionIndex: number }) => callback(data);
      ipcRenderer.on('notification-action', handler);
      return () => ipcRenderer.removeListener('notification-action', handler);
    },

    // ============ Dock Badge (macOS) ============
    dock: {
      setBadgeCount: (count: number) =>
        ipcRenderer.invoke('set-badge-count', count) as Promise<boolean>,
      setBadgeString: (text: string) =>
        ipcRenderer.invoke('set-badge-string', text) as Promise<boolean>,
      clearBadge: () =>
        ipcRenderer.invoke('clear-badge') as Promise<boolean>,
      bounce: (type: 'critical' | 'informational' = 'informational') =>
        ipcRenderer.invoke('dock-bounce', type) as Promise<number>,
      cancelBounce: (bounceId: number) =>
        ipcRenderer.invoke('dock-cancel-bounce', bounceId) as Promise<boolean>,
    },

    // Dock menu action handler
    onDockMenuAction: (callback: (action: string) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on('dock-menu-action', handler);
      return () => ipcRenderer.removeListener('dock-menu-action', handler);
    },

    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    // Dark mode
    getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
    onDarkModeChange: (callback: (isDark: boolean) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, isDark: boolean) => callback(isDark);
      ipcRenderer.on('dark-mode-changed', handler);
      // Return cleanup function to prevent memory leaks
      return () => ipcRenderer.removeListener('dark-mode-changed', handler);
    },

    // App lifecycle
    onAppClosing: (callback: () => void): CleanupFn => {
      const handler = () => callback();
      ipcRenderer.on('app-closing', handler);
      return () => ipcRenderer.removeListener('app-closing', handler);
    },

    // Deep link handling
    onDeepLink: (callback: (path: string) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, path: string) => callback(path);
      ipcRenderer.on('deep-link', handler);
      return () => ipcRenderer.removeListener('deep-link', handler);
    },

    // Payment deep link handlers
    onPaymentSuccess: (callback: (data: { sessionId: string }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { sessionId: string }) => callback(data);
      ipcRenderer.on('payment-success', handler);
      return () => ipcRenderer.removeListener('payment-success', handler);
    },

    onPaymentCancelled: (callback: () => void): CleanupFn => {
      const handler = () => callback();
      ipcRenderer.on('payment-cancelled', handler);
      return () => ipcRenderer.removeListener('payment-cancelled', handler);
    },

    // Platform detection
    platform: process.platform,
    isElectron: true,

    // Credential Store (OS Keychain)
    storeCredentials: (username: string, password: string) =>
      ipcRenderer.invoke('store-credentials', { username, password }),
    getCredentials: () =>
      ipcRenderer.invoke('get-credentials'),
    deleteCredentials: () =>
      ipcRenderer.invoke('delete-credentials'),
    hasCredentials: () =>
      ipcRenderer.invoke('has-credentials'),

    // ============ Network Status ============
    getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),
    onOnlineStatusChange: (callback: (isOnline: boolean) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, isOnline: boolean) => callback(isOnline);
      ipcRenderer.on('online-status-changed', handler);
      return () => ipcRenderer.removeListener('online-status-changed', handler);
    },

    // ============ Cache API ============
    cache: {
      get: (key: string) => ipcRenderer.invoke('cache-get', key),
      set: (key: string, value: unknown, ttl?: number) =>
        ipcRenderer.invoke('cache-set', { key, value, ttl }),
      delete: (key: string) => ipcRenderer.invoke('cache-delete', key),
      clear: () => ipcRenderer.invoke('cache-clear'),
      getAll: () => ipcRenderer.invoke('cache-get-all'),
    },

    // ============ Request Queue (Offline Mode) ============
    requestQueue: {
      add: (request: Omit<QueuedRequest, 'id' | 'timestamp'>) =>
        ipcRenderer.invoke('queue-request', request),
      getAll: () => ipcRenderer.invoke('get-queued-requests') as Promise<QueuedRequest[]>,
      remove: (requestId: string) => ipcRenderer.invoke('remove-queued-request', requestId),
      clear: () => ipcRenderer.invoke('clear-request-queue'),
    },

    // ============ Sync Status ============
    setLastSync: (timestamp: number) => ipcRenderer.invoke('set-last-sync', timestamp),
    getLastSync: () => ipcRenderer.invoke('get-last-sync') as Promise<number | null>,

    // ============ Stripe Payment ============
    stripe: {
      openCheckout: (checkoutUrl: string) =>
        ipcRenderer.invoke('open-stripe-checkout', { checkoutUrl }) as Promise<{ success: boolean; error?: string }>,
      openPortal: (portalUrl: string) =>
        ipcRenderer.invoke('open-stripe-portal', { portalUrl }) as Promise<{ success: boolean; error?: string }>,
    },

    // ============ Auto Update ============
    autoUpdate: {
      checkForUpdates: () =>
        ipcRenderer.invoke('check-for-updates') as Promise<{
          success: boolean;
          updateAvailable?: boolean;
          version?: string | null;
          error?: string;
        }>,
      downloadUpdate: () =>
        ipcRenderer.invoke('download-update') as Promise<{ success: boolean; error?: string }>,
      installUpdate: () =>
        ipcRenderer.invoke('install-update') as Promise<{ success: boolean }>,
      getStatus: () =>
        ipcRenderer.invoke('get-update-status') as Promise<UpdateState>,
      onStatusChange: (callback: (status: UpdateState) => void): CleanupFn => {
        const handler = (_event: IpcRendererEvent, status: UpdateState) => callback(status);
        ipcRenderer.on('update-status', handler);
        return () => ipcRenderer.removeListener('update-status', handler);
      },
    },
  };
}
