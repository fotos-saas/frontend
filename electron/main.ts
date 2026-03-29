import { app, BrowserWindow, ipcMain, session, Menu, globalShortcut } from 'electron';
import * as keytar from 'keytar';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log/main';

// Sentry importalas es inicializalas (a leheto legkorabban!)
import { initSentryMain } from './sentry';
initSentryMain();

// Modularis IPC handlerek
import { registerPhotoshopHandlers, jsxRunner, psStore } from './handlers/photoshop.handler';
import { PsdCacheService } from './services/psd-cache.service';
import { registerSampleGeneratorHandlers } from './handlers/sample-generator.handler';
import { registerFinalizerHandlers } from './handlers/finalizer.handler';
import { registerOverlayHandlers } from './handlers/overlay.handler';
import { registerPortraitHandlers } from './handlers/portrait.handler';
import { registerSyncHandlers } from './handlers/sync.handler';
import { registerCropHandlers } from './handlers/crop.handler';

// Background mod service-ek
import { TrayManagerService } from './services/tray-manager.service';
import { WorkflowPollerService } from './services/workflow-poller.service';

// Extracted modules
import { isDev, isBackgroundMode, KEYCHAIN_SERVICE, startNetworkMonitoring } from './constants';
import { createWindow, getMainWindow } from './window-manager';
import { registerProtocol, registerOpenUrlHandler, requestSingleInstanceLock } from './protocol-handler';
import { createOverlayWindow, getOverlayWindow, toggleOverlayWindow, listenMainWindowAuthChanges } from './overlay-manager';
import { registerIpcHandlers } from './ipc-handlers';
import { initAutoUpdater, registerAutoUpdaterHandlers } from './auto-updater';

// ============ Logging Setup ============
log.initialize();
log.transports.file.level = 'info';
autoUpdater.logger = log;

// ============ Deep Link Protocol Registration ============
registerProtocol();

// macOS: Handle deep link when app is already running
registerOpenUrlHandler(getMainWindow);

// Windows/Linux: Handle deep link from second instance
const gotTheLock = requestSingleInstanceLock(getMainWindow);

if (!gotTheLock) {
  app.quit();
} else {
  // ============ App Ready ============
  app.whenReady().then(async () => {
    // ============ Background mod: csak tray + polling ============
    if (isBackgroundMode) {
      log.info('PhotoStack indul BACKGROUND modban');
      app.dock?.hide(); // macOS: nincs dock ikon

      const trayManager = new TrayManagerService();
      const poller = new WorkflowPollerService(jsxRunner, trayManager);
      await poller.start();

      // Kecses leallas
      app.on('before-quit', () => {
        poller.stop();
      });

      return; // A normal mod tobbi resze nem fut le
    }

    // ============ Normal mod: ablak + Angular UI ============
    log.info('PhotoStack indul NORMAL modban');

    // Set Content Security Policy (csak production-ben -- dev-ben az index.html meta CSP eleg)
    if (!isDev) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' https://app.tablostudio.hu https://api.tablostudio.hu; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.tablostudio.hu; " +
              "style-src 'self' 'unsafe-inline' https://app.tablostudio.hu https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: blob: https:; " +
              "connect-src 'self' https://api.tablostudio.hu wss://api.tablostudio.hu https://app.tablostudio.hu https://*.ingest.de.sentry.io; " +
              "media-src 'self' blob:; " +
              "frame-src 'none';"
            ]
          }
        });
      });
    }

    createWindow();

    // Start network monitoring (after createWindow so mainWindow reference is set)
    startNetworkMonitoring(getMainWindow());

    // Setup macOS Dock Menu (after createWindow so getMainWindow() works in click handlers)
    if (process.platform === 'darwin') {
      const dockMenu = Menu.buildFromTemplate([
        {
          label: 'Uj projekt',
          click: () => {
            const mw = getMainWindow();
            mw?.webContents.send('dock-menu-action', 'new-project');
            mw?.show();
          }
        },
        {
          label: 'Megrendelesek',
          click: () => {
            const mw = getMainWindow();
            mw?.webContents.send('dock-menu-action', 'orders');
            mw?.show();
          }
        },
        { type: 'separator' },
        {
          label: 'Beallitasok',
          click: () => {
            const mw = getMainWindow();
            mw?.webContents.send('dock-menu-action', 'settings');
            mw?.show();
          }
        }
      ]);
      app.dock?.setMenu(dockMenu);
    }

    // Register all IPC handlers (notifications, badge, cache, keychain, stripe, drag, etc.)
    registerIpcHandlers(getMainWindow);

    // Register auto-updater IPC handlers
    registerAutoUpdaterHandlers();

    // Auth szinkronizacio figyeles: main window -> overlay
    listenMainWindowAuthChanges();

    // Overlay window letrehozasa (rejtett, Ctrl+Space-re jelenik meg)
    createOverlayWindow();

    // Overlay IPC handlerek regisztralasa
    registerOverlayHandlers(
      getOverlayWindow,
      getMainWindow,
    );

    // GlobalShortcut: Ctrl+K (command palette -- PS-ben nem foglalt)
    const shortcutRegistered = globalShortcut.register('Control+K', () => {
      toggleOverlayWindow();
    });
    if (!shortcutRegistered) {
      log.warn('Failed to register Ctrl+K global shortcut');
    } else {
      log.info('Overlay shortcut registered: Ctrl+K');
    }

    // Photoshop IPC handlerek regisztralasa
    const mainWindow = getMainWindow();
    if (mainWindow) {
      registerPhotoshopHandlers(mainWindow);
    }

    // PSD cache watcher inditasa (hatterben figyeli a workDir-t)
    const psdCache = new PsdCacheService(psStore, mainWindow);
    psdCache.start();

    // Minta generalas IPC handlerek regisztralasa
    registerSampleGeneratorHandlers();

    // Veglegesites IPC handlerek regisztralasa
    registerFinalizerHandlers();

    // Portrait hatter feldolgozas IPC handlerek regisztralasa
    registerPortraitHandlers();

    // Auto Crop IPC handlerek regisztralasa
    registerCropHandlers();

    // LAN szinkronizalas IPC handlerek regisztralasa
    registerSyncHandlers(mainWindow || undefined);

    // Normal modban is: daemon token mentes login utan (IPC)
    ipcMain.handle('workflow:store-daemon-token', async (_event, token: string) => {
      try {
        await keytar.setPassword(KEYCHAIN_SERVICE, '__daemon_token__', token);
        return true;
      } catch (error) {
        log.error('Daemon token mentes sikertelen:', error);
        return false;
      }
    });

    // Initialize auto-updater
    initAutoUpdater(getMainWindow);

    // macOS: recreate window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Quit when all windows are closed (except on macOS)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Graceful shutdown
  app.on('before-quit', () => {
    getMainWindow()?.webContents.send('app-closing');
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
