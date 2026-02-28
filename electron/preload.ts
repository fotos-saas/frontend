import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type for cleanup function
type CleanupFn = () => void;

// Sentry DSN es app verzio atadasa a renderer process-nek (window objektumon keresztul)
// Ez a Sentry inicializalashoz szukseges
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';

// Expose Sentry DSN to window object for renderer initialization
contextBridge.exposeInMainWorld('SENTRY_DSN', SENTRY_DSN);

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

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
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

  // ============ Native File Drag & Drop ============
  nativeDrag: {
    /**
     * Prepare files for native drag (downloads remote files to temp)
     * @param files - Array of files with URL and fileName
     * @returns Object with success status and local file paths
     */
    prepareFiles: (files: Array<{ url: string; fileName: string; thumbnailUrl?: string }>) =>
      ipcRenderer.invoke('prepare-drag-files', files) as Promise<{
        success: boolean;
        paths: string[];
        error?: string;
      }>,

    /**
     * Start native drag operation with prepared files
     * @param files - Array of local file paths (from prepareFiles)
     * @param thumbnailUrl - Optional thumbnail URL for drag icon
     */
    startDrag: (files: string[], thumbnailUrl?: string) =>
      ipcRenderer.send('start-drag', { files, thumbnailUrl }),

    /**
     * Get temp directory for drag files
     */
    getTempDir: () =>
      ipcRenderer.invoke('get-drag-temp-dir') as Promise<string>,

    /**
     * Cleanup specific temp files after drag
     * @param filePaths - Array of file paths to clean up
     */
    cleanupFiles: (filePaths: string[]) =>
      ipcRenderer.invoke('cleanup-drag-files', filePaths) as Promise<boolean>,
  },

  // ============ Overlay (Always-on-top Command Palette) ============
  overlay: {
    executeCommand: (commandId: string) =>
      ipcRenderer.invoke('overlay:execute-command', commandId) as Promise<{ success: boolean; error?: string }>,
    getContext: () =>
      ipcRenderer.invoke('overlay:get-context') as Promise<{ mode: 'designer' | 'normal'; projectId?: number }>,
    setContext: (ctx: { mode: 'designer' | 'normal'; projectId?: number }) =>
      ipcRenderer.invoke('overlay:set-context', ctx) as Promise<{ success: boolean; error?: string }>,
    onContextChanged: (callback: (ctx: { mode: 'designer' | 'normal'; projectId?: number }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, ctx: { mode: 'designer' | 'normal'; projectId?: number }) => callback(ctx);
      ipcRenderer.on('overlay:context-changed', handler);
      return () => ipcRenderer.removeListener('overlay:context-changed', handler);
    },
    getProjectId: () =>
      ipcRenderer.invoke('overlay:get-project-id') as Promise<{ projectId: number | null }>,
    hide: () =>
      ipcRenderer.invoke('overlay:hide') as Promise<{ success: boolean }>,
    showMainWindow: () =>
      ipcRenderer.invoke('overlay:show-main-window') as Promise<{ success: boolean }>,
    setIgnoreMouseEvents: (ignore: boolean) =>
      ipcRenderer.send('overlay:set-ignore-mouse', ignore),
    onCommand: (callback: (commandId: string) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, commandId: string) => callback(commandId);
      ipcRenderer.on('overlay-command', handler);
      return () => ipcRenderer.removeListener('overlay-command', handler);
    },
    getActiveDoc: () =>
      ipcRenderer.invoke('overlay:get-active-doc') as Promise<{ name: string | null; path: string | null; dir: string | null }>,
    setActiveDoc: (doc: { name: string | null; path: string | null; dir: string | null }) =>
      ipcRenderer.invoke('overlay:set-active-doc', doc) as Promise<{ success: boolean; error?: string }>,
    onActiveDocChanged: (callback: (doc: { name: string | null; path: string | null; dir: string | null }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, doc: { name: string | null; path: string | null; dir: string | null }) => callback(doc);
      ipcRenderer.on('overlay:active-doc-changed', handler);
      return () => ipcRenderer.removeListener('overlay:active-doc-changed', handler);
    },
  },

  // ============ Photoshop Integration ============
  photoshop: {
    setPath: (psPath: string) =>
      ipcRenderer.invoke('photoshop:set-path', psPath) as Promise<{ success: boolean; error?: string }>,
    getPath: () =>
      ipcRenderer.invoke('photoshop:get-path') as Promise<string | null>,
    launch: () =>
      ipcRenderer.invoke('photoshop:launch') as Promise<{ success: boolean; error?: string }>,
    checkInstalled: () =>
      ipcRenderer.invoke('photoshop:check-installed') as Promise<{ found: boolean; path: string | null }>,
    browsePath: () =>
      ipcRenderer.invoke('photoshop:browse-path') as Promise<{ cancelled: boolean; path?: string }>,
    generatePsd: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) =>
      ipcRenderer.invoke('photoshop:generate-psd', params) as Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>,
    generatePsdDebug: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) =>
      ipcRenderer.invoke('photoshop:generate-psd-debug', params) as Promise<{ success: boolean; error?: string }>,
    onPsdDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => {
      const handler = (_event: any, data: { line: string; stream: 'stdout' | 'stderr' }) => callback(data);
      ipcRenderer.on('psd-debug-log', handler);
      return () => { ipcRenderer.removeListener('psd-debug-log', handler); };
    },
    getDownloadsPath: () =>
      ipcRenderer.invoke('photoshop:get-downloads-path') as Promise<string>,
    openFile: (filePath: string) =>
      ipcRenderer.invoke('photoshop:open-file', filePath) as Promise<{ success: boolean; error?: string }>,
    getWorkDir: () =>
      ipcRenderer.invoke('photoshop:get-work-dir') as Promise<string | null>,
    setWorkDir: (dirPath: string) =>
      ipcRenderer.invoke('photoshop:set-work-dir', dirPath) as Promise<{ success: boolean; error?: string }>,
    browseWorkDir: () =>
      ipcRenderer.invoke('photoshop:browse-work-dir') as Promise<{ cancelled: boolean; path?: string }>,
    revealInFinder: (filePath: string) =>
      ipcRenderer.invoke('photoshop:reveal-in-finder', filePath) as Promise<{ success: boolean; error?: string }>,
    getMargin: () =>
      ipcRenderer.invoke('photoshop:get-margin') as Promise<number>,
    setMargin: (marginCm: number) =>
      ipcRenderer.invoke('photoshop:set-margin', marginCm) as Promise<{ success: boolean; error?: string }>,
    getStudentSize: () =>
      ipcRenderer.invoke('photoshop:get-student-size') as Promise<number>,
    setStudentSize: (sizeCm: number) =>
      ipcRenderer.invoke('photoshop:set-student-size', sizeCm) as Promise<{ success: boolean; error?: string }>,
    getTeacherSize: () =>
      ipcRenderer.invoke('photoshop:get-teacher-size') as Promise<number>,
    setTeacherSize: (sizeCm: number) =>
      ipcRenderer.invoke('photoshop:set-teacher-size', sizeCm) as Promise<{ success: boolean; error?: string }>,
    getGapH: () =>
      ipcRenderer.invoke('photoshop:get-gap-h') as Promise<number>,
    setGapH: (gapCm: number) =>
      ipcRenderer.invoke('photoshop:set-gap-h', gapCm) as Promise<{ success: boolean; error?: string }>,
    getGapV: () =>
      ipcRenderer.invoke('photoshop:get-gap-v') as Promise<number>,
    setGapV: (gapCm: number) =>
      ipcRenderer.invoke('photoshop:set-gap-v', gapCm) as Promise<{ success: boolean; error?: string }>,
    getNameGap: () =>
      ipcRenderer.invoke('photoshop:get-name-gap') as Promise<number>,
    setNameGap: (gapCm: number) =>
      ipcRenderer.invoke('photoshop:set-name-gap', gapCm) as Promise<{ success: boolean; error?: string }>,
    getNameBreakAfter: () =>
      ipcRenderer.invoke('photoshop:get-name-break-after') as Promise<number>,
    setNameBreakAfter: (breakAfter: number) =>
      ipcRenderer.invoke('photoshop:set-name-break-after', breakAfter) as Promise<{ success: boolean; error?: string }>,
    getTextAlign: () =>
      ipcRenderer.invoke('photoshop:get-text-align') as Promise<string>,
    setTextAlign: (align: string) =>
      ipcRenderer.invoke('photoshop:set-text-align', align) as Promise<{ success: boolean; error?: string }>,
    getGridAlign: () =>
      ipcRenderer.invoke('photoshop:get-grid-align') as Promise<string>,
    setGridAlign: (align: string) =>
      ipcRenderer.invoke('photoshop:set-grid-align', align) as Promise<{ success: boolean; error?: string }>,
    getPositionGap: () =>
      ipcRenderer.invoke('photoshop:get-position-gap') as Promise<number>,
    setPositionGap: (gapCm: number) =>
      ipcRenderer.invoke('photoshop:set-position-gap', gapCm) as Promise<{ success: boolean; error?: string }>,
    getPositionFontSize: () =>
      ipcRenderer.invoke('photoshop:get-position-font-size') as Promise<number>,
    setPositionFontSize: (fontSize: number) =>
      ipcRenderer.invoke('photoshop:set-position-font-size', fontSize) as Promise<{ success: boolean; error?: string }>,
    runJsx: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) =>
      ipcRenderer.invoke('photoshop:run-jsx', params) as Promise<{ success: boolean; error?: string; output?: string }>,
    runJsxDebug: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) =>
      ipcRenderer.invoke('photoshop:run-jsx-debug', params) as Promise<{ success: boolean; error?: string }>,
    onJsxDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => {
      const handler = (_event: any, data: { line: string; stream: 'stdout' | 'stderr' }) => callback(data);
      ipcRenderer.on('jsx-debug-log', handler);
      return () => { ipcRenderer.removeListener('jsx-debug-log', handler); };
    },
    checkPsdExists: (params: { psdPath: string }) =>
      ipcRenderer.invoke('photoshop:check-psd-exists', params) as Promise<{ success: boolean; exists: boolean; hasLayouts: boolean; hasPlacedPhotos: boolean }>,
    refreshPlacedJson: (params: { psdFilePath: string; layers: Array<{ layerName: string; photoUrl: string }>; syncBorder?: boolean }) =>
      ipcRenderer.invoke('photoshop:refresh-placed-json', params) as Promise<{ success: boolean; count?: number; error?: string }>,
    writeProjectInfo: (params: { psdFilePath: string; projectId: number; projectName?: string; schoolName?: string; className?: string }) =>
      ipcRenderer.invoke('photoshop:write-project-info', params) as Promise<{ success: boolean; error?: string }>,
    backupPsd: (params: { psdPath: string }) =>
      ipcRenderer.invoke('photoshop:backup-psd', params) as Promise<{ success: boolean; error?: string; backupPath?: string }>,
    saveLayoutJson: (params: { psdPath: string; layoutData: Record<string, unknown> }) =>
      ipcRenderer.invoke('photoshop:save-layout-json', params) as Promise<{ success: boolean; error?: string; jsonPath?: string }>,
    saveSnapshot: (params: { psdPath: string; snapshotData: Record<string, unknown>; fileName: string }) =>
      ipcRenderer.invoke('photoshop:save-snapshot', params) as Promise<{ success: boolean; error?: string; snapshotPath?: string }>,
    listSnapshots: (params: { psdPath: string }) =>
      ipcRenderer.invoke('photoshop:list-snapshots', params) as Promise<{ success: boolean; error?: string; snapshots: Array<{ fileName: string; filePath: string; snapshotName: string; createdAt: string | null; personCount: number }> }>,
    loadSnapshot: (params: { snapshotPath: string }) =>
      ipcRenderer.invoke('photoshop:load-snapshot', params) as Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }>,
    deleteSnapshot: (params: { snapshotPath: string }) =>
      ipcRenderer.invoke('photoshop:delete-snapshot', params) as Promise<{ success: boolean; error?: string }>,
    renameSnapshot: (params: { snapshotPath: string; newName: string }) =>
      ipcRenderer.invoke('photoshop:rename-snapshot', params) as Promise<{ success: boolean; error?: string }>,
    saveTemplate: (params: { templateData: any }) =>
      ipcRenderer.invoke('photoshop:save-template', params) as Promise<{ success: boolean; error?: string }>,
    listTemplates: () =>
      ipcRenderer.invoke('photoshop:list-templates') as Promise<{ success: boolean; error?: string; templates: any[] }>,
    loadTemplate: (params: { templateId: string }) =>
      ipcRenderer.invoke('photoshop:load-template', params) as Promise<{ success: boolean; error?: string; data?: any }>,
    deleteTemplate: (params: { templateId: string }) =>
      ipcRenderer.invoke('photoshop:delete-template', params) as Promise<{ success: boolean; error?: string }>,
    renameTemplate: (params: { templateId: string; newName: string }) =>
      ipcRenderer.invoke('photoshop:rename-template', params) as Promise<{ success: boolean; error?: string }>,
    applyTemplate: (params: { templateId: string; targetDocName?: string; psdFilePath?: string }) =>
      ipcRenderer.invoke('photoshop:apply-template', params) as Promise<{ success: boolean; error?: string; output?: string }>,
    placePhotos: (params: { layers: Array<{ layerName: string; photoUrl: string }>; targetDocName?: string; psdFilePath?: string; syncBorder?: boolean }) =>
      ipcRenderer.invoke('photoshop:place-photos', params) as Promise<{ success: boolean; error?: string; output?: string }>,
    saveTempFiles: (params: { files: Array<{ name: string; data: ArrayBuffer }> }) =>
      ipcRenderer.invoke('photoshop:save-temp-files', params) as Promise<{ success: boolean; paths: string[]; error?: string }>,
  },

  // ============ Minta generálás ============
  sample: {
    getSettings: () =>
      ipcRenderer.invoke('sample:get-settings') as Promise<{
        success: boolean;
        error?: string;
        settings?: {
          sizeLarge: number;
          sizeSmall: number;
          watermarkText: string;
          watermarkColor: 'white' | 'black';
          watermarkOpacity: number;
          useLargeSize: boolean;
          sampleVersion: string;
        };
      }>,
    setSettings: (settings: Partial<{
      sizeLarge: number;
      sizeSmall: number;
      watermarkText: string;
      watermarkColor: 'white' | 'black';
      watermarkOpacity: number;
      useLargeSize: boolean;
      sampleVersion: string;
    }>) =>
      ipcRenderer.invoke('sample:set-settings', settings) as Promise<{ success: boolean; error?: string }>,
    generate: (params: {
      psdFilePath: string;
      outputDir: string;
      projectId: number;
      projectName: string;
      apiBaseUrl: string;
      authToken: string;
      watermarkText?: string;
      watermarkColor?: 'white' | 'black';
      watermarkOpacity?: number;
      sampleVersion?: string;
      sizes?: Array<{ name: string; width: number }>;
    }) =>
      ipcRenderer.invoke('sample:generate', params) as Promise<{
        success: boolean;
        error?: string;
        localPaths?: string[];
        uploadedCount?: number;
        errors?: string[];
      }>,
  },

  // ============ Véglegesítés ============
  finalizer: {
    upload: (params: {
      flattenedJpgPath: string;
      outputDir: string;
      projectId: number;
      projectName: string;
      apiBaseUrl: string;
      authToken: string;
      type?: 'flat' | 'small_tablo';
      maxSize?: number;
    }) =>
      ipcRenderer.invoke('finalizer:upload', params) as Promise<{
        success: boolean;
        error?: string;
        localPath?: string;
        uploadedCount?: number;
      }>,
  },

  // ============ Portrait háttér feldolgozás ============
  portrait: {
    checkPython: () =>
      ipcRenderer.invoke('portrait:check-python') as Promise<{ available: boolean; error?: string }>,
    processSingle: (params: { inputPath: string; outputPath: string; settings: Record<string, unknown> }) =>
      ipcRenderer.invoke('portrait:process-single', params) as Promise<{
        success: boolean; error?: string; processing_time?: number;
      }>,
    processBatch: (params: { items: Array<{ input: string; output: string }>; settings: Record<string, unknown> }) =>
      ipcRenderer.invoke('portrait:process-batch', params) as Promise<{
        success: boolean; error?: string;
        results?: Array<{ success: boolean; input: string; output?: string; error?: string; processing_time?: number }>;
        total?: number; successful?: number;
      }>,
    downloadBackground: (params: { url: string; outputPath: string }) =>
      ipcRenderer.invoke('portrait:download-background', params) as Promise<{
        success: boolean; error?: string; path?: string;
      }>,
    getTempDir: () =>
      ipcRenderer.invoke('portrait:get-temp-dir') as Promise<string>,
    cleanupTemp: (filePaths: string[]) =>
      ipcRenderer.invoke('portrait:cleanup-temp', filePaths) as Promise<{ success: boolean; cleaned?: number }>,
    readProcessedFile: (params: { filePath: string }) =>
      ipcRenderer.invoke('portrait:read-processed-file', params) as Promise<{
        success: boolean; data?: ArrayBuffer; error?: string;
      }>,
  },

  // ============ LAN Szinkronizálás ============
  sync: {
    getStatus: () =>
      ipcRenderer.invoke('sync:get-status') as Promise<{ success: boolean; state: string; enabled: boolean; deviceId: string; deviceName: string; serverPort: number; workspacePath: string; pairedPeers: unknown[]; discoveredPeers: unknown[]; error?: string }>,
    enable: (params: { userId: string; workspacePath: string }) =>
      ipcRenderer.invoke('sync:enable', params) as Promise<{ success: boolean; port?: number; error?: string }>,
    disable: () =>
      ipcRenderer.invoke('sync:disable') as Promise<{ success: boolean; error?: string }>,
    pair: (code?: string) =>
      ipcRenderer.invoke('sync:pair', code) as Promise<{ success: boolean; mode: 'generate' | 'accept'; code: string; error?: string }>,
    pairWithPeer: (params: { peerId: string; code: string }) =>
      ipcRenderer.invoke('sync:pair-with-peer', params) as Promise<{ success: boolean; error?: string }>,
    acceptPair: (params: { peerId: string; code: string }) =>
      ipcRenderer.invoke('sync:accept-pair', params) as Promise<{ success: boolean; error?: string }>,
    unpair: (peerId: string) =>
      ipcRenderer.invoke('sync:unpair', peerId) as Promise<{ success: boolean; error?: string }>,
    getPeers: () =>
      ipcRenderer.invoke('sync:get-peers') as Promise<{ success: boolean; discovered: unknown[]; paired: unknown[]; error?: string }>,
    forceSync: () =>
      ipcRenderer.invoke('sync:force-sync') as Promise<{ success: boolean; error?: string }>,
    getSettings: () =>
      ipcRenderer.invoke('sync:get-settings') as Promise<{ success: boolean; settings?: { enabled: boolean; ignorePatterns: string[]; autoSync: boolean }; error?: string }>,
    setSettings: (settings: { ignorePatterns?: string[] }) =>
      ipcRenderer.invoke('sync:set-settings', settings) as Promise<{ success: boolean; error?: string }>,
    onStatusChanged: (callback: (data: { state: string }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { state: string }) => callback(data);
      ipcRenderer.on('sync:status-changed', handler);
      return () => ipcRenderer.removeListener('sync:status-changed', handler);
    },
    onPeerDiscovered: (callback: (peer: unknown) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, peer: unknown) => callback(peer);
      ipcRenderer.on('sync:peer-discovered', handler);
      return () => ipcRenderer.removeListener('sync:peer-discovered', handler);
    },
    onPeerLost: (callback: (peer: unknown) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, peer: unknown) => callback(peer);
      ipcRenderer.on('sync:peer-lost', handler);
      return () => ipcRenderer.removeListener('sync:peer-lost', handler);
    },
    onProgress: (callback: (progress: { fileName: string; percent: number; bytesTransferred: number; totalBytes: number; overallPercent?: number }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, progress: { fileName: string; percent: number; bytesTransferred: number; totalBytes: number; overallPercent?: number }) => callback(progress);
      ipcRenderer.on('sync:progress', handler);
      return () => ipcRenderer.removeListener('sync:progress', handler);
    },
    onError: (callback: (data: { message: string }) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, data: { message: string }) => callback(data);
      ipcRenderer.on('sync:error', handler);
      return () => ipcRenderer.removeListener('sync:error', handler);
    },
  },

  // ============ Touch Bar (MacBook Pro 2016-2020) ============
  touchBar: {
    /**
     * Touch Bar kontextus beallitasa (eloredefinalt Touch Bar-ok)
     * @param context - 'dashboard' | 'gallery' | 'editor'
     */
    setContext: (context: string) =>
      ipcRenderer.invoke('set-touch-bar-context', context) as Promise<boolean>,

    /**
     * Egyedi Touch Bar elemek beallitasa
     * @param items - Touch Bar elemek tombje
     */
    setItems: (items: Array<{
      type: 'button' | 'label' | 'spacer' | 'segmented' | 'slider';
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
    }>) =>
      ipcRenderer.invoke('set-touch-bar-items', items) as Promise<boolean>,

    /**
     * Touch Bar eltavolitasa (ures Touch Bar)
     */
    clear: () =>
      ipcRenderer.invoke('clear-touch-bar') as Promise<boolean>,

    /**
     * Touch Bar akcio esemeny figyelese
     * A callback megkapja az actionId-t es opcionalis extra adatokat
     */
    onAction: (callback: (actionId: string, data?: Record<string, unknown>) => void): CleanupFn => {
      const handler = (_event: IpcRendererEvent, actionId: string, data?: Record<string, unknown>) =>
        callback(actionId, data);
      ipcRenderer.on('touch-bar-action', handler);
      return () => ipcRenderer.removeListener('touch-bar-action', handler);
    },
  },
});

// TypeScript type declaration is in electron.service.ts to avoid duplication
