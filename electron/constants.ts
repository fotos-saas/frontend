import { app, net } from 'electron';
import Store from 'electron-store';
import log from 'electron-log/main';

// ============ Types & Interfaces ============

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

export interface CacheSchema {
  userProfile: Record<string, unknown> | null;
  projectList: Record<string, unknown>[] | null;
  recentOrders: Record<string, unknown>[] | null;
  requestQueue: QueuedRequest[];
  lastSync: number | null;
  [key: string]: unknown;
}

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

// ============ Constants ============

// Detect if running in development
export const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;

// Production URLs
export const PRODUCTION_URL = 'https://app.tablostudio.hu';
export const API_URL = 'https://api.tablostudio.hu';

// Deep link protocol for the app
export const DEEP_LINK_PROTOCOL = 'photostack';

// Keychain service identifier
export const KEYCHAIN_SERVICE = 'hu.tablostudio.app';

// --background mode flag
export const isBackgroundMode = process.argv.includes('--background');

// Allowed origins for navigation (use URL origin for proper matching)
export const ALLOWED_ORIGINS = new Set([
  'http://localhost:4205',
  PRODUCTION_URL,
  API_URL,
  'https://tablostudio.hu',
  'https://kepvalaszto.hu',
]);

// Allowed domains for external links
export const ALLOWED_EXTERNAL_DOMAINS = [
  'tablostudio.hu',
  'kepvalaszto.hu',
  'github.com',
  'stripe.com',
  'checkout.stripe.com',
  ...(isDev ? ['localhost'] : []),
];

// ============ URL Helpers ============

/**
 * Check if URL origin is allowed for navigation
 */
export function isAllowedOrigin(urlString: string): boolean {
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
export function isAllowedExternalDomain(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    return ALLOWED_EXTERNAL_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// ============ Electron Store for Cache ============

export const store = new Store<CacheSchema>({
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

export function getIsOnline(): boolean {
  return isOnline;
}

export function setIsOnline(value: boolean): void {
  isOnline = value;
}

export function checkNetworkStatus(): boolean {
  return net.isOnline();
}

export function startNetworkMonitoring(mainWindow: Electron.BrowserWindow | null): void {
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
  }, isDev ? 10000 : 3000); // Dev: 10s (CPU kimilies), Prod: 3s
}

// ============ Update State ============

export let updateState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: 0,
  version: null,
  releaseNotes: null,
};

export function setUpdateState(newState: UpdateState): void {
  updateState = newState;
}
