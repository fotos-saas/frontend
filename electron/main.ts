import { app, BrowserWindow, shell, ipcMain, nativeTheme, Notification, session, Menu, net, TouchBar, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as keytar from 'keytar';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import log from 'electron-log/main';
import Store from 'electron-store';

// Sentry importalas es inicializalas (a leheto legkorabban!)
import { initSentryMain, setSentryUser, captureMainException, addMainBreadcrumb } from './sentry';
initSentryMain();

// Modularis IPC handlerek
import { registerPhotoshopHandlers } from './handlers/photoshop.handler';
import { registerSampleGeneratorHandlers } from './handlers/sample-generator.handler';

const { TouchBarButton, TouchBarLabel, TouchBarSpacer, TouchBarSegmentedControl, TouchBarSlider } = TouchBar;

// ============ Logging Setup ============
log.initialize();
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Auto-updater state
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

let mainWindow: BrowserWindow | null = null;

// ============ Electron Store for Cache ============
interface CacheSchema {
  userProfile: Record<string, unknown> | null;
  projectList: Record<string, unknown>[] | null;
  recentOrders: Record<string, unknown>[] | null;
  requestQueue: QueuedRequest[];
  lastSync: number | null;
  [key: string]: unknown;
}

interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

const store = new Store<CacheSchema>({
  name: 'photostack-cache',
  defaults: {
    userProfile: null,
    projectList: null,
    recentOrders: null,
    requestQueue: [],
    lastSync: null,
  },
});

// ============ Network State ============
let isOnline = true;

function checkNetworkStatus(): boolean {
  return net.isOnline();
}

function startNetworkMonitoring(): void {
  // Initial check
  isOnline = checkNetworkStatus();
  log.info(`Initial network status: ${isOnline ? 'online' : 'offline'}`);

  // Poll for network changes (Electron doesn't have built-in event for this)
  setInterval(() => {
    const currentStatus = checkNetworkStatus();
    if (currentStatus !== isOnline) {
      isOnline = currentStatus;
      log.info(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      mainWindow?.webContents.send('online-status-changed', isOnline);
    }
  }, 3000); // Check every 3 seconds
}

// Auto-update state tracking
let updateState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: 0,
  version: null,
  releaseNotes: null,
};

// Store notification callbacks for click/reply handling
const notificationCallbacks = new Map<string, {
  onClick?: () => void;
  onReply?: (reply: string) => void;
}>();

// Detect if running in development
const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;

// Production URLs
const PRODUCTION_URL = 'https://app.tablostudio.hu';
const API_URL = 'https://api.tablostudio.hu';

// Allowed origins for navigation (use URL origin for proper matching)
const ALLOWED_ORIGINS = new Set([
  'http://localhost:4205',
  PRODUCTION_URL,
  API_URL,
  'https://tablostudio.hu',
  'https://kepvalaszto.hu',
]);

// Allowed domains for external links
const ALLOWED_EXTERNAL_DOMAINS = [
  'tablostudio.hu',
  'kepvalaszto.hu',
  'github.com',
  'stripe.com',
  'checkout.stripe.com',
];

// Deep link protocol for the app
const DEEP_LINK_PROTOCOL = 'photostack';

/**
 * Check if URL origin is allowed for navigation
 */
function isAllowedOrigin(urlString: string): boolean {
  // Allow file:// protocol for local files
  if (urlString.startsWith('file://')) {
    return true;
  }

  try {
    const parsedUrl = new URL(urlString);
    return ALLOWED_ORIGINS.has(parsedUrl.origin);
  } catch {
    return false;
  }
}

/**
 * Check if domain is allowed for external links
 */
function isAllowedExternalDomain(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    return ALLOWED_EXTERNAL_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// ============ Touch Bar Support (MacBook Pro 2016-2020) ============
type TouchBarItemType = 'button' | 'label' | 'spacer' | 'segmented' | 'slider';

interface TouchBarItemBase {
  type: TouchBarItemType;
  id?: string;
}

interface TouchBarButtonItem extends TouchBarItemBase {
  type: 'button';
  label?: string;
  backgroundColor?: string;
}

interface TouchBarLabelItem extends TouchBarItemBase {
  type: 'label';
  label: string;
  textColor?: string;
}

interface TouchBarSpacerItem extends TouchBarItemBase {
  type: 'spacer';
  size?: 'small' | 'large' | 'flexible';
}

interface TouchBarSegmentedItem extends TouchBarItemBase {
  type: 'segmented';
  segments: Array<{ label?: string }>;
  selectedIndex?: number;
  mode?: 'single' | 'multiple' | 'buttons';
}

interface TouchBarSliderItem extends TouchBarItemBase {
  type: 'slider';
  minValue?: number;
  maxValue?: number;
  value?: number;
  label?: string;
}

type TouchBarItem = TouchBarButtonItem | TouchBarLabelItem | TouchBarSpacerItem | TouchBarSegmentedItem | TouchBarSliderItem;

function createDefaultTouchBar(): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({
        label: 'Uj projekt',
        backgroundColor: '#6366f1',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'new-project'),
      }),
      new TouchBarButton({
        label: 'Megrendelesek',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'orders'),
      }),
      new TouchBarButton({
        label: 'Statisztikak',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'stats'),
      }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({
        label: 'Frissites',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'refresh'),
      }),
    ],
  });
}

function createGalleryTouchBar(): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({ label: 'Elozo', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-prev') }),
      new TouchBarButton({ label: 'Kovetkezo', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-next') }),
      new TouchBarSpacer({ size: 'small' }),
      new TouchBarSlider({
        label: 'Zoom',
        minValue: 50,
        maxValue: 200,
        value: 100,
        change: (v) => mainWindow?.webContents.send('touch-bar-action', 'gallery-zoom', { value: v }),
      }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({ label: 'Kivalasztas', backgroundColor: '#22c55e', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-select') }),
    ],
  });
}

function createEditorTouchBar(): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({ label: 'Mentes', backgroundColor: '#6366f1', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-save') }),
      new TouchBarSpacer({ size: 'small' }),
      new TouchBarButton({ label: 'Visszavonas', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-undo') }),
      new TouchBarButton({ label: 'Ujra', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-redo') }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({ label: 'Elonezet', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-preview') }),
    ],
  });
}

function createDynamicTouchBar(items: TouchBarItem[]): TouchBar {
  const touchBarItems = items.map((item) => {
    switch (item.type) {
      case 'button':
        return new TouchBarButton({ label: item.label, backgroundColor: item.backgroundColor, click: () => item.id && mainWindow?.webContents.send('touch-bar-action', item.id) });
      case 'label':
        return new TouchBarLabel({ label: item.label, textColor: item.textColor });
      case 'spacer':
        return new TouchBarSpacer({ size: item.size || 'small' });
      case 'segmented':
        return new TouchBarSegmentedControl({ segments: item.segments.map(s => ({ label: s.label })), selectedIndex: item.selectedIndex, mode: item.mode || 'single', change: (idx) => item.id && mainWindow?.webContents.send('touch-bar-action', item.id, { selectedIndex: idx }) });
      case 'slider':
        return new TouchBarSlider({ label: item.label, minValue: item.minValue ?? 0, maxValue: item.maxValue ?? 100, value: item.value ?? 50, change: (v) => item.id && mainWindow?.webContents.send('touch-bar-action', item.id, { value: v }) });
      default:
        return new TouchBarSpacer({ size: 'small' });
    }
  });
  return new TouchBar({ items: touchBarItems });
}

function setTouchBarContext(context: string): void {
  if (process.platform !== 'darwin' || !mainWindow) return;
  let touchBar: TouchBar;
  switch (context) {
    case 'gallery': touchBar = createGalleryTouchBar(); break;
    case 'editor': touchBar = createEditorTouchBar(); break;
    default: touchBar = createDefaultTouchBar(); break;
  }
  mainWindow.setTouchBar(touchBar);
  log.info(`Touch Bar context set to: ${context}`);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hidden', // Mac: traffic lights always visible
    trafficLightPosition: { x: 20, y: 18 },
    vibrancy: 'under-window', // Mac frosted glass effect
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent for vibrancy
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // Extra security layer
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false, // Don't show until ready
  });

  // Custom User-Agent to identify Electron app
  mainWindow.webContents.setUserAgent(
    `${mainWindow.webContents.getUserAgent()} PhotoStack/${app.getVersion()}`
  );

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // macOS: ensure traffic light buttons are always visible
    if (process.platform === 'darwin') {
      mainWindow?.setWindowButtonVisibility(true);
      setTouchBarContext('dashboard');
    }
  });

  // Load the app with error handling
  loadApp();

  // Open external links in default browser (with domain restriction)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      (url.startsWith('http://') || url.startsWith('https://')) &&
      isAllowedExternalDomain(url)
    ) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Disable DevTools in production
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Load the app URL with error handling and retry
 */
async function loadApp(): Promise<void> {
  if (!mainWindow) return;

  const targetUrl = isDev ? 'http://localhost:4205' : PRODUCTION_URL;

  try {
    await mainWindow.loadURL(targetUrl);

    // Open DevTools only in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Failed to load URL:', error);

    // Show error page with retry option
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PhotoStack - Kapcsolódási hiba</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-app-region: drag;
          }
          .container {
            text-align: center;
            padding: 40px;
            -webkit-app-region: no-drag;
          }
          .icon { font-size: 64px; margin-bottom: 24px; }
          h1 { font-size: 24px; margin-bottom: 12px; font-weight: 600; }
          p { color: #a0a0a0; margin-bottom: 32px; line-height: 1.6; }
          button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>Nem sikerült kapcsolódni</h1>
          <p>
            Ellenőrizd az internetkapcsolatod,<br>
            majd próbáld újra.
          </p>
          <button onclick="location.reload()">Újrapróbálkozás</button>
        </div>
      </body>
      </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }
}

// ============ Deep Link Protocol Registration ============
// Register as default protocol handler for photostack://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
}

/**
 * Handle deep link URL
 * Supported URLs:
 * - photostack://gallery/123
 * - photostack://payment/success?session_id=xxx
 * - photostack://payment/cancel
 * - photostack://partner/projects
 */
function handleDeepLink(url: string): void {
  log.info('Deep link received:', url);

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== `${DEEP_LINK_PROTOCOL}:`) {
      log.warn('Invalid deep link protocol:', parsedUrl.protocol);
      return;
    }

    // Extract path for generic deep link handling
    // photostack://gallery/123?foo=bar -> /gallery/123?foo=bar
    const deepPath = '/' + parsedUrl.pathname.replace(/^\/+/, '') + parsedUrl.search;

    // Always send generic deep-link event for routing
    mainWindow?.webContents.send('deep-link', deepPath);

    // Handle specific deep link types
    const pathParts = parsedUrl.pathname.replace(/^\/+/, '').split('/');
    const action = pathParts[0];
    const subAction = pathParts[1];

    if (action === 'payment') {
      if (subAction === 'success') {
        const sessionId = parsedUrl.searchParams.get('session_id');
        if (sessionId) {
          log.info('Payment success, session_id:', sessionId);
          mainWindow?.webContents.send('payment-success', { sessionId });
        }
      } else if (subAction === 'cancel') {
        log.info('Payment cancelled');
        mainWindow?.webContents.send('payment-cancelled');
      }
    }

    // Focus the window for all deep links
    mainWindow?.show();
    mainWindow?.focus();
  } catch (error) {
    log.error('Failed to parse deep link URL:', error);
  }
}

// macOS: Handle deep link when app is already running
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows/Linux: Handle deep link from second instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Windows/Linux: Find the deep link URL in command line args
    const url = commandLine.find(arg => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`));
    if (url) {
      handleDeepLink(url);
    }

    // Focus the main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Start network monitoring
  startNetworkMonitoring();

  // Set Content Security Policy (csak production-ben — dev-ben az index.html meta CSP eleg)
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

  // Setup macOS Dock Menu
  if (process.platform === 'darwin') {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'Új projekt',
        click: () => {
          mainWindow?.webContents.send('dock-menu-action', 'new-project');
          mainWindow?.show();
        }
      },
      {
        label: 'Megrendelések',
        click: () => {
          mainWindow?.webContents.send('dock-menu-action', 'orders');
          mainWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: 'Beállítások',
        click: () => {
          mainWindow?.webContents.send('dock-menu-action', 'settings');
          mainWindow?.show();
        }
      }
    ]);
    app.dock?.setMenu(dockMenu);
  }

  createWindow();

  // Photoshop IPC handlerek regisztralasa
  if (mainWindow) {
    registerPhotoshopHandlers(mainWindow);
  }

  // Minta generalas IPC handlerek regisztralasa
  registerSampleGeneratorHandlers();

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
  // Cleanup tasks before quitting
  mainWindow?.webContents.send('app-closing');
});

// IPC Handlers

// Show native notification (with input validation and macOS features)
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

// ============ Dock Badge (macOS) ============

// Set dock badge count (number)
ipcMain.handle('set-badge-count', async (_event, count: number) => {
  if (typeof count !== 'number' || count < 0) {
    return false;
  }

  try {
    // app.setBadgeCount works on macOS and Linux (Ubuntu Unity)
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
    // app.dock.setBadge allows string badges like "99+" or "!"
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

// ============ Dock Bounce (macOS) ============

// Bounce dock icon to get user attention
ipcMain.handle('dock-bounce', async (_event, type: 'critical' | 'informational' = 'informational') => {
  if (process.platform !== 'darwin') {
    return -1;
  }

  try {
    // Returns bounce request id, or -1 if bouncing is not supported
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

// Get app info
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isDev,
  };
});

// Get dark mode status
ipcMain.handle('get-dark-mode', () => {
  return nativeTheme.shouldUseDarkColors;
});

// ============ Touch Bar IPC Handlers ============
ipcMain.handle('set-touch-bar-context', (_event, context: string) => {
  try {
    setTouchBarContext(context);
    return true;
  } catch (error) {
    log.error('Failed to set Touch Bar context:', error);
    return false;
  }
});

ipcMain.handle('set-touch-bar-items', (_event, items: TouchBarItem[]) => {
  try {
    if (process.platform !== 'darwin' || !mainWindow) return false;
    const touchBar = createDynamicTouchBar(items);
    mainWindow.setTouchBar(touchBar);
    return true;
  } catch (error) {
    log.error('Failed to set Touch Bar items:', error);
    return false;
  }
});

ipcMain.handle('clear-touch-bar', () => {
  try {
    if (process.platform !== 'darwin' || !mainWindow) return false;
    mainWindow.setTouchBar(null);
    return true;
  } catch (error) {
    log.error('Failed to clear Touch Bar:', error);
    return false;
  }
});

// ============ Keychain / Credential Store ============
const KEYCHAIN_SERVICE = 'hu.tablostudio.app';

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
    // Get the last logged in username
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

// Listen for dark mode changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
});

// ============ Network Status Handlers ============
ipcMain.handle('get-online-status', () => {
  return checkNetworkStatus();
});

// ============ Cache Handlers ============
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
      // Store with expiry timestamp
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

// ============ Request Queue Handlers (Offline Mode) ============
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

// ============ Stripe Payment / Checkout ============

/**
 * Open Stripe Checkout URL in external browser
 * The success/cancel redirects will use deep links to return to the app
 */
ipcMain.handle('open-stripe-checkout', async (_event, { checkoutUrl }) => {
  if (typeof checkoutUrl !== 'string') {
    log.warn('Invalid checkout URL');
    return { success: false, error: 'Invalid checkout URL' };
  }

  try {
    // Validate URL is from Stripe
    const parsedUrl = new URL(checkoutUrl);
    const isStripeUrl = parsedUrl.hostname === 'checkout.stripe.com' ||
                        parsedUrl.hostname.endsWith('.stripe.com');

    if (!isStripeUrl) {
      log.warn('Blocked non-Stripe checkout URL:', checkoutUrl);
      return { success: false, error: 'Invalid checkout URL' };
    }

    log.info('Opening Stripe checkout:', checkoutUrl);
    await shell.openExternal(checkoutUrl);
    return { success: true };
  } catch (error) {
    log.error('Failed to open Stripe checkout:', error);
    return { success: false, error: 'Failed to open checkout' };
  }
});

/**
 * Open Stripe Customer Portal URL in external browser
 */
ipcMain.handle('open-stripe-portal', async (_event, { portalUrl }) => {
  if (typeof portalUrl !== 'string') {
    log.warn('Invalid portal URL');
    return { success: false, error: 'Invalid portal URL' };
  }

  try {
    // Validate URL is from Stripe
    const parsedUrl = new URL(portalUrl);
    const isStripeUrl = parsedUrl.hostname === 'billing.stripe.com' ||
                        parsedUrl.hostname.endsWith('.stripe.com');

    if (!isStripeUrl) {
      log.warn('Blocked non-Stripe portal URL:', portalUrl);
      return { success: false, error: 'Invalid portal URL' };
    }

    log.info('Opening Stripe portal:', portalUrl);
    await shell.openExternal(portalUrl);
    return { success: true };
  } catch (error) {
    log.error('Failed to open Stripe portal:', error);
    return { success: false, error: 'Failed to open portal' };
  }
});

// Security: prevent navigation to unknown URLs
app.on('web-contents-created', (_event, contents) => {
  // Navigation security
  contents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedOrigin(navigationUrl)) {
      console.warn('Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  // Redirect security
  contents.on('will-redirect', (event, navigationUrl) => {
    if (!isAllowedOrigin(navigationUrl)) {
      console.warn('Blocked redirect to:', navigationUrl);
      event.preventDefault();
    }
  });

  // Frame navigation security
  contents.on('will-frame-navigate', (event) => {
    const url = event.url;
    if (!isAllowedOrigin(url)) {
      console.warn('Blocked frame navigation to:', url);
      event.preventDefault();
    }
  });

  // Prevent new window creation from renderer
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalDomain(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

// ============ Native File Drag & Drop ============

/**
 * Temporary directory for downloaded files during drag operations
 */
function getTempDragDir(): string {
  const tempDir = path.join(app.getPath('temp'), 'photostack-drag');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Clean up old temp files (older than 1 hour)
 */
function cleanupTempDragDir(): void {
  try {
    const tempDir = getTempDragDir();
    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > ONE_HOUR) {
        fs.unlinkSync(filePath);
        log.info(`Cleaned up old temp file: ${file}`);
      }
    }
  } catch (error) {
    log.error('Failed to cleanup temp drag dir:', error);
  }
}

// Schedule cleanup every hour
setInterval(cleanupTempDragDir, 60 * 60 * 1000);

/**
 * Download a file from URL to temp directory
 * Returns the local file path
 */
async function downloadFileForDrag(url: string, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = getTempDragDir();
    const localPath = path.join(tempDir, fileName);

    // If file already exists and is recent, use it
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - stats.mtimeMs < FIVE_MINUTES) {
        log.info(`Using cached file: ${fileName}`);
        resolve(localPath);
        return;
      }
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(localPath);

    log.info(`Downloading file for drag: ${url}`);

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFileForDrag(redirectUrl, fileName)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        log.info(`Downloaded file: ${fileName}`);
        resolve(localPath);
      });
    }).on('error', (err) => {
      fs.unlink(localPath, () => {}); // Delete incomplete file
      reject(err);
    });
  });
}

/**
 * Create a drag icon from an image URL or use default
 */
async function createDragIcon(imageUrl?: string): Promise<Electron.NativeImage> {
  // Try to create icon from provided image URL
  if (imageUrl) {
    try {
      const response = await new Promise<Buffer>((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;
        protocol.get(imageUrl, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });

      const image = nativeImage.createFromBuffer(response);
      // Resize to appropriate drag icon size (64x64 for macOS, 32x32 for Windows)
      const size = process.platform === 'darwin' ? 64 : 32;
      return image.resize({ width: size, height: size });
    } catch (error) {
      log.warn('Failed to create drag icon from URL, using default:', error);
    }
  }

  // Use default drag icon from assets
  const iconPath = path.join(__dirname, '..', 'assets', 'drag-icon.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // Fallback: use app icon
  const appIconPath = path.join(__dirname, '..', 'assets', 'icons', '64x64.png');
  if (fs.existsSync(appIconPath)) {
    return nativeImage.createFromPath(appIconPath);
  }

  // Last resort: create a simple colored square
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABSSURBVFiF7c6xDQAgDAOwJv9/mW4gCyk6S8h4AAAAAACAfwqWgqXgXHASLAUALgVLQZ0CS0GdAlZQp4AV1ClgBXUKWEGdAtZHwVKwFNQpAAB81wKXlA4zpVXqEgAAAABJRU5ErkJggg=='
  );
}

interface DragFile {
  url: string;
  fileName: string;
  thumbnailUrl?: string;
}

/**
 * IPC Handler: Prepare files for native drag
 * Downloads remote files to temp directory and returns local paths
 */
ipcMain.handle('prepare-drag-files', async (_event, files: DragFile[]): Promise<{ success: boolean; paths: string[]; error?: string }> => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      return { success: false, paths: [], error: 'No files provided' };
    }

    // Limit to prevent abuse
    if (files.length > 50) {
      return { success: false, paths: [], error: 'Maximum 50 files allowed' };
    }

    // Validate URLs are from allowed domains
    for (const file of files) {
      if (!isAllowedOrigin(file.url) && !file.url.startsWith('https://api.tablostudio.hu')) {
        return { success: false, paths: [], error: `Invalid file URL: ${file.url}` };
      }
    }

    // Download files in parallel (with concurrency limit)
    const CONCURRENCY = 5;
    const paths: string[] = [];

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      const batchPaths = await Promise.all(
        batch.map(file => downloadFileForDrag(file.url, file.fileName))
      );
      paths.push(...batchPaths);
    }

    return { success: true, paths };
  } catch (error) {
    log.error('Failed to prepare drag files:', error);
    return { success: false, paths: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

/**
 * IPC Handler: Start native drag operation
 * Uses webContents.startDrag for native OS drag
 */
ipcMain.on('start-drag', async (event, { files, thumbnailUrl }: { files: string[]; thumbnailUrl?: string }) => {
  try {
    if (!mainWindow) {
      log.error('No main window for drag operation');
      return;
    }

    if (!Array.isArray(files) || files.length === 0) {
      log.error('No files provided for drag');
      return;
    }

    // Verify all files exist
    const validFiles = files.filter(filePath => {
      if (!fs.existsSync(filePath)) {
        log.warn(`File does not exist: ${filePath}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      log.error('No valid files for drag');
      return;
    }

    // Create drag icon
    const icon = await createDragIcon(thumbnailUrl);

    // Start native drag
    // Note: Electron's startDrag only supports single file on some platforms
    // For multiple files, we use the first file but indicate count
    if (validFiles.length === 1) {
      mainWindow.webContents.startDrag({
        file: validFiles[0],
        icon: icon,
      });
    } else {
      // For multiple files on macOS, we can pass an array
      // On Windows, we need to handle this differently
      if (process.platform === 'darwin') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mainWindow.webContents.startDrag as any)({
          files: validFiles,
          icon: icon,
        });
      } else {
        // Windows: Create a zip or use first file with indicator
        // For now, we'll just use the first file
        mainWindow.webContents.startDrag({
          file: validFiles[0],
          icon: icon,
        });
        log.info(`Started drag with ${validFiles.length} files (Windows: first file only)`);
      }
    }

    log.info(`Started native drag with ${validFiles.length} file(s)`);
  } catch (error) {
    log.error('Failed to start drag:', error);
  }
});

/**
 * IPC Handler: Get temp directory for drag files
 */
ipcMain.handle('get-drag-temp-dir', () => {
  return getTempDragDir();
});

/**
 * IPC Handler: Cleanup specific temp files
 */
ipcMain.handle('cleanup-drag-files', async (_event, filePaths: string[]) => {
  try {
    const tempDir = getTempDragDir();

    for (const filePath of filePaths) {
      // Security: only delete files within temp directory
      if (filePath.startsWith(tempDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.info(`Cleaned up drag file: ${path.basename(filePath)}`);
      }
    }

    return true;
  } catch (error) {
    log.error('Failed to cleanup drag files:', error);
    return false;
  }
});

// ============ Auto Updater ============

/**
 * Initialize auto-updater with event listeners
 */
function initAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false; // Manual download for user control
  autoUpdater.autoInstallOnAppQuit = true;

  // Event: Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log.info('Frissites keresese...');
    updateState = { ...updateState, checking: true, error: null };
    sendUpdateStatus();
  });

  // Event: Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Frissites elerheto:', info.version);
    updateState = {
      ...updateState,
      checking: false,
      available: true,
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map(n => n.note).join('\n')
          : null,
    };
    sendUpdateStatus();

    // Show notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Frissites elerheto',
        body: `A PhotoStack ${info.version} verzio letoltheto.`,
        silent: false,
      });
      notification.on('click', () => {
        mainWindow?.show();
        mainWindow?.focus();
      });
      notification.show();
    }
  });

  // Event: No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('Nincs uj frissites. Jelenlegi verzio:', info.version);
    updateState = {
      ...updateState,
      checking: false,
      available: false,
      version: info.version,
    };
    sendUpdateStatus();
  });

  // Event: Download progress
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    log.info(`Letoltes: ${Math.round(progress.percent)}%`);
    updateState = {
      ...updateState,
      downloading: true,
      progress: Math.round(progress.percent),
    };
    sendUpdateStatus();
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Frissites letoltve:', info.version);
    updateState = {
      ...updateState,
      downloading: false,
      downloaded: true,
      progress: 100,
      version: info.version,
    };
    sendUpdateStatus();

    // Show notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Frissites telepitesre kesz',
        body: 'Kattints az ujrainditashoz es a frissites telepitesehez.',
        silent: false,
      });
      notification.on('click', () => {
        autoUpdater.quitAndInstall(false, true);
      });
      notification.show();
    }
  });

  // Event: Error
  autoUpdater.on('error', (error: Error) => {
    log.error('Frissitesi hiba:', error);
    updateState = {
      ...updateState,
      checking: false,
      downloading: false,
      error: error.message,
    };
    sendUpdateStatus();
  });

  // Check for updates after a short delay (let app settle)
  if (!isDev) {
    setTimeout(() => {
      log.info('Automatikus frissites ellenorzes inditasa...');
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Frissites ellenorzesi hiba:', err);
      });
    }, 5000);

    // Check for updates every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Idozitett frissites ellenorzesi hiba:', err);
      });
    }, 4 * 60 * 60 * 1000);
  }
}

/**
 * Send update status to renderer process
 */
function sendUpdateStatus(): void {
  mainWindow?.webContents.send('update-status', updateState);
}

// ============ Auto Updater IPC Handlers ============

// Check for updates manually
ipcMain.handle('check-for-updates', async () => {
  log.info('Manualis frissites ellenorzes...');
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      success: true,
      updateAvailable: !!result?.updateInfo,
      version: result?.updateInfo?.version || null,
    };
  } catch (error) {
    log.error('Frissites ellenorzesi hiba:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

// Download update
ipcMain.handle('download-update', async () => {
  log.info('Frissites letoltese...');
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    log.error('Frissites letoltesi hiba:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

// Install update (quit and install)
ipcMain.handle('install-update', async () => {
  log.info('Frissites telepitese...');
  // Give the renderer a moment to clean up
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 500);
  return { success: true };
});

// Get current update status
ipcMain.handle('get-update-status', () => {
  return updateState;
});

// Initialize auto-updater when app is ready
app.whenReady().then(() => {
  initAutoUpdater();
});
