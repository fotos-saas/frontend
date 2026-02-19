/**
 * Electron API tipus definiciok
 * Kozos tipusok az electron service-ekhez es a window.electronAPI deklaraciohoz
 */

type CleanupFn = () => void;

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

interface DockAPI {
  setBadgeCount: (count: number) => Promise<boolean>;
  setBadgeString: (text: string) => Promise<boolean>;
  clearBadge: () => Promise<boolean>;
  bounce: (type?: 'critical' | 'informational') => Promise<number>;
  cancelBounce: (bounceId: number) => Promise<boolean>;
}

interface CacheAPI {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, ttl?: number) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  getAll: () => Promise<Record<string, unknown>>;
}

export interface QueuedRequestData {
  id: string;
  method: string;
  url: string;
  body: unknown;
  timestamp: number;
  headers?: Record<string, string>;
}

interface RequestQueueAPI {
  add: (request: { method: string; url: string; body: unknown; headers?: Record<string, string> }) => Promise<string | null>;
  getAll: () => Promise<QueuedRequestData[]>;
  remove: (requestId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
}

interface StripeResult {
  success: boolean;
  error?: string;
}

interface NativeDragAPI {
  prepareFiles: (files: unknown[]) => Promise<{ success: boolean; paths: string[]; error?: string }>;
  startDrag: (files: string[], thumbnailUrl?: string) => void;
  getTempDir: () => Promise<string>;
  cleanupFiles: (filePaths: string[]) => Promise<boolean>;
}

interface TouchBarAPI {
  setContext: (context: string) => Promise<boolean>;
  setItems: (items: unknown[]) => Promise<boolean>;
  clear: () => Promise<boolean>;
  onAction: (callback: (actionId: string, data?: Record<string, unknown>) => void) => CleanupFn;
}

export interface NotificationResultData {
  success: boolean;
  id: string | null;
}

interface PhotoshopAPI {
  setPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  getPath: () => Promise<string | null>;
  launch: () => Promise<{ success: boolean; error?: string }>;
  checkInstalled: () => Promise<{ found: boolean; path: string | null }>;
  browsePath: () => Promise<{ cancelled: boolean; path?: string }>;
  generatePsd: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) => Promise<{ success: boolean; error?: string }>;
  getDownloadsPath: () => Promise<string>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getWorkDir: () => Promise<string | null>;
  setWorkDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  browseWorkDir: () => Promise<{ cancelled: boolean; path?: string }>;
  getMargin: () => Promise<number>;
  setMargin: (marginCm: number) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronAPI {
  showNotification: (options: unknown, body?: string) => Promise<NotificationResultData | boolean>;
  onNotificationClicked: (callback: (data: { id: string }) => void) => CleanupFn;
  onNotificationReply: (callback: (data: { id: string; reply: string }) => void) => CleanupFn;
  onNotificationAction: (callback: (data: { id: string; actionIndex: number }) => void) => CleanupFn;
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
  onDeepLink: (callback: (path: string) => void) => CleanupFn;
  onPaymentSuccess: (callback: (data: { sessionId: string }) => void) => CleanupFn;
  onPaymentCancelled: (callback: () => void) => CleanupFn;
  platform: string;
  isElectron: boolean;
  storeCredentials: (username: string, password: string) => Promise<boolean>;
  getCredentials: () => Promise<{ username: string; password: string } | null>;
  deleteCredentials: () => Promise<boolean>;
  hasCredentials: () => Promise<boolean>;
  getOnlineStatus: () => Promise<boolean>;
  onOnlineStatusChange: (callback: (isOnline: boolean) => void) => CleanupFn;
  cache: CacheAPI;
  requestQueue: RequestQueueAPI;
  setLastSync: (timestamp: number) => Promise<boolean>;
  getLastSync: () => Promise<number | null>;
  stripe: {
    openCheckout: (checkoutUrl: string) => Promise<StripeResult>;
    openPortal: (portalUrl: string) => Promise<StripeResult>;
  };
  nativeDrag: NativeDragAPI;
  touchBar: TouchBarAPI;
  autoUpdate: AutoUpdateAPI;
  photoshop: PhotoshopAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
