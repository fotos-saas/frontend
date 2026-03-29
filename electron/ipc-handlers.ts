import { app, ipcMain, nativeTheme, Notification, BrowserWindow } from 'electron';
import * as keytar from 'keytar';
import log from 'electron-log/main';
import {
  KEYCHAIN_SERVICE,
  store,
  CacheSchema,
  QueuedRequest,
  checkNetworkStatus,
} from './constants';
import { setTouchBarContext, createDynamicTouchBar, TouchBarItem } from './touch-bar';
import { registerDragDropHandlers } from './drag-drop-handler';
import { registerStripeHandlers, registerSecurityHandlers } from './security-handlers';

/**
 * Register all IPC handlers.
 * Call once during app.whenReady().
 */
export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  registerNotificationHandlers(getMainWindow);
  registerBadgeHandlers();
  registerAppInfoHandlers();
  registerTouchBarHandlers(getMainWindow);
  registerKeychainHandlers();
  registerNetworkHandlers();
  registerCacheHandlers();
  registerRequestQueueHandlers();
  registerStripeHandlers();
  registerDragDropHandlers(getMainWindow);
  registerSecurityHandlers();
  registerDarkModeListener(getMainWindow);
}

// ============ Notification Handlers ============

function registerNotificationHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('show-notification', async (_event, options: {
    title: string;
    body: string;
    subtitle?: string;
    actions?: Array<{ type: 'button'; text: string }>;
    hasReply?: boolean;
    replyPlaceholder?: string;
    notificationId?: string;
  }) => {
    const { title, body, subtitle, actions, hasReply, replyPlaceholder, notificationId } = options;

    // Input validation
    if (typeof title !== 'string' || typeof body !== 'string') {
      console.warn('Invalid notification parameters');
      return { success: false, id: null };
    }

    // Sanitize and limit length
    const safeTitle = title.slice(0, 100);
    const safeBody = body.slice(0, 500);
    const safeSubtitle = subtitle?.slice(0, 100);

    if (Notification.isSupported()) {
      const notificationOptions: Electron.NotificationConstructorOptions = {
        title: safeTitle,
        body: safeBody,
        silent: false,
      };

      // macOS specific options
      if (process.platform === 'darwin') {
        if (safeSubtitle) {
          notificationOptions.subtitle = safeSubtitle;
        }
        if (hasReply) {
          notificationOptions.hasReply = true;
          if (replyPlaceholder) {
            notificationOptions.replyPlaceholder = replyPlaceholder.slice(0, 100);
          }
        }
        if (actions && actions.length > 0) {
          notificationOptions.actions = actions.slice(0, 2).map(action => ({
            type: action.type,
            text: action.text.slice(0, 50)
          }));
        }
      }

      const notification = new Notification(notificationOptions);
      const id = notificationId || `notification-${Date.now()}`;
      const mainWindow = getMainWindow();

      // Handle click event
      notification.on('click', () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('notification-clicked', { id });
      });

      // Handle reply event (macOS)
      notification.on('reply', (_event, reply) => {
        mainWindow?.webContents.send('notification-reply', { id, reply });
      });

      // Handle action click (macOS)
      notification.on('action', (_event, index) => {
        mainWindow?.webContents.send('notification-action', { id, actionIndex: index });
      });

      notification.show();
      return { success: true, id };
    }
    return { success: false, id: null };
  });
}

// ============ Badge / Dock Handlers ============

function registerBadgeHandlers(): void {
  // Set dock badge count (number)
  ipcMain.handle('set-badge-count', async (_event, count: number) => {
    if (typeof count !== 'number' || count < 0) {
      return false;
    }

    try {
      const success = app.setBadgeCount(Math.floor(count));
      return success;
    } catch (error) {
      console.error('Failed to set badge count:', error);
      return false;
    }
  });

  // Set dock badge string (macOS only - for "99+" style badges)
  ipcMain.handle('set-badge-string', async (_event, text: string) => {
    if (process.platform !== 'darwin') {
      return false;
    }

    if (typeof text !== 'string') {
      return false;
    }

    try {
      app.dock?.setBadge(text.slice(0, 10));
      return true;
    } catch (error) {
      console.error('Failed to set badge string:', error);
      return false;
    }
  });

  // Clear dock badge
  ipcMain.handle('clear-badge', async () => {
    try {
      app.setBadgeCount(0);
      if (process.platform === 'darwin') {
        app.dock?.setBadge('');
      }
      return true;
    } catch (error) {
      console.error('Failed to clear badge:', error);
      return false;
    }
  });

  // Bounce dock icon to get user attention
  ipcMain.handle('dock-bounce', async (_event, type: 'critical' | 'informational' = 'informational') => {
    if (process.platform !== 'darwin') {
      return -1;
    }

    try {
      const bounceId = app.dock?.bounce(type) ?? -1;
      return bounceId;
    } catch (error) {
      console.error('Failed to bounce dock:', error);
      return -1;
    }
  });

  // Cancel dock bounce
  ipcMain.handle('dock-cancel-bounce', async (_event, bounceId: number) => {
    if (process.platform !== 'darwin') {
      return false;
    }

    try {
      app.dock?.cancelBounce(bounceId);
      return true;
    } catch (error) {
      console.error('Failed to cancel dock bounce:', error);
      return false;
    }
  });
}

// ============ App Info & Dark Mode ============

function registerAppInfoHandlers(): void {
  ipcMain.handle('get-app-info', () => {
    const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      isDev,
    };
  });

  ipcMain.handle('get-dark-mode', () => {
    return nativeTheme.shouldUseDarkColors;
  });
}

// ============ Touch Bar IPC ============

function registerTouchBarHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('set-touch-bar-context', (_event, context: string) => {
    try {
      setTouchBarContext(context, getMainWindow());
      return true;
    } catch (error) {
      log.error('Failed to set Touch Bar context:', error);
      return false;
    }
  });

  ipcMain.handle('set-touch-bar-items', (_event, items: TouchBarItem[]) => {
    try {
      const mainWindow = getMainWindow();
      if (process.platform !== 'darwin' || !mainWindow) return false;
      const touchBar = createDynamicTouchBar(items, mainWindow);
      mainWindow.setTouchBar(touchBar);
      return true;
    } catch (error) {
      log.error('Failed to set Touch Bar items:', error);
      return false;
    }
  });

  ipcMain.handle('clear-touch-bar', () => {
    try {
      const mainWindow = getMainWindow();
      if (process.platform !== 'darwin' || !mainWindow) return false;
      mainWindow.setTouchBar(null);
      return true;
    } catch (error) {
      log.error('Failed to clear Touch Bar:', error);
      return false;
    }
  });
}

// ============ Keychain / Credential Store ============

function registerKeychainHandlers(): void {
  // Store credentials in OS keychain
  ipcMain.handle('store-credentials', async (_event, { username, password }) => {
    if (typeof username !== 'string' || typeof password !== 'string') {
      return false;
    }
    try {
      await keytar.setPassword(KEYCHAIN_SERVICE, username, password);
      // Store the username separately so we know which account to retrieve
      await keytar.setPassword(KEYCHAIN_SERVICE, '__last_user__', username);
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  });

  // Get credentials from OS keychain
  ipcMain.handle('get-credentials', async () => {
    try {
      const username = await keytar.getPassword(KEYCHAIN_SERVICE, '__last_user__');
      if (!username) {
        return null;
      }
      const password = await keytar.getPassword(KEYCHAIN_SERVICE, username);
      if (!password) {
        return null;
      }
      return { username, password };
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  });

  // Delete credentials from OS keychain
  ipcMain.handle('delete-credentials', async () => {
    try {
      const username = await keytar.getPassword(KEYCHAIN_SERVICE, '__last_user__');
      if (username) {
        await keytar.deletePassword(KEYCHAIN_SERVICE, username);
      }
      await keytar.deletePassword(KEYCHAIN_SERVICE, '__last_user__');
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  });

  // Check if credentials exist
  ipcMain.handle('has-credentials', async () => {
    try {
      const username = await keytar.getPassword(KEYCHAIN_SERVICE, '__last_user__');
      if (!username) {
        return false;
      }
      const password = await keytar.getPassword(KEYCHAIN_SERVICE, username);
      return !!password;
    } catch {
      return false;
    }
  });
}

// ============ Network Status Handlers ============

function registerNetworkHandlers(): void {
  ipcMain.handle('get-online-status', () => {
    return checkNetworkStatus();
  });
}

// ============ Cache Handlers ============

function registerCacheHandlers(): void {
  ipcMain.handle('cache-get', (_event, key: string) => {
    try {
      return store.get(key);
    } catch (error) {
      log.error('Failed to get cache:', error);
      return null;
    }
  });

  ipcMain.handle('cache-set', (_event, { key, value, ttl }: { key: string; value: unknown; ttl?: number }) => {
    try {
      if (ttl) {
        store.set(key, { value, expiry: Date.now() + ttl });
      } else {
        store.set(key, value);
      }
      return true;
    } catch (error) {
      log.error('Failed to set cache:', error);
      return false;
    }
  });

  ipcMain.handle('cache-delete', (_event, key: string) => {
    try {
      store.delete(key as keyof CacheSchema);
      return true;
    } catch (error) {
      log.error('Failed to delete cache:', error);
      return false;
    }
  });

  ipcMain.handle('cache-clear', () => {
    try {
      store.clear();
      return true;
    } catch (error) {
      log.error('Failed to clear cache:', error);
      return false;
    }
  });

  ipcMain.handle('cache-get-all', () => {
    try {
      return store.store;
    } catch (error) {
      log.error('Failed to get all cache:', error);
      return {};
    }
  });
}

// ============ Request Queue Handlers (Offline Mode) ============

function registerRequestQueueHandlers(): void {
  ipcMain.handle('queue-request', (_event, request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
    try {
      const queue = store.get('requestQueue') || [];
      const newRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      queue.push(newRequest);
      store.set('requestQueue', queue);
      log.info(`Request queued: ${request.method} ${request.url}`);
      return newRequest.id;
    } catch (error) {
      log.error('Failed to queue request:', error);
      return null;
    }
  });

  ipcMain.handle('get-queued-requests', () => {
    try {
      return store.get('requestQueue') || [];
    } catch (error) {
      log.error('Failed to get queued requests:', error);
      return [];
    }
  });

  ipcMain.handle('remove-queued-request', (_event, requestId: string) => {
    try {
      const queue = store.get('requestQueue') || [];
      const newQueue = queue.filter(req => req.id !== requestId);
      store.set('requestQueue', newQueue);
      return true;
    } catch (error) {
      log.error('Failed to remove queued request:', error);
      return false;
    }
  });

  ipcMain.handle('clear-request-queue', () => {
    try {
      store.set('requestQueue', []);
      return true;
    } catch (error) {
      log.error('Failed to clear request queue:', error);
      return false;
    }
  });

  ipcMain.handle('set-last-sync', (_event, timestamp: number) => {
    try {
      store.set('lastSync', timestamp);
      return true;
    } catch (error) {
      log.error('Failed to set last sync:', error);
      return false;
    }
  });

  ipcMain.handle('get-last-sync', () => {
    try {
      return store.get('lastSync');
    } catch (error) {
      log.error('Failed to get last sync:', error);
      return null;
    }
  });
}

// Stripe + Security handlers are in security-handlers.ts
// Drag & drop handlers are in drag-drop-handler.ts

// ============ Dark Mode Listener ============

function registerDarkModeListener(getMainWindow: () => BrowserWindow | null): void {
  nativeTheme.on('updated', () => {
    getMainWindow()?.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
  });
}
