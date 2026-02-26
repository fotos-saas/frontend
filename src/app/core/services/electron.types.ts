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

export interface OverlayContext {
  mode: 'designer' | 'normal';
  projectId?: number;
}

export interface ActiveDocInfo {
  name: string | null;
  path: string | null;
  dir: string | null;
  selectedLayers?: number;
  selectedLayerNames?: string[];
}

interface OverlayAPI {
  executeCommand: (commandId: string) => Promise<{ success: boolean; error?: string }>;
  getContext: () => Promise<OverlayContext>;
  setContext: (ctx: OverlayContext) => Promise<{ success: boolean; error?: string }>;
  onContextChanged: (callback: (ctx: OverlayContext) => void) => CleanupFn;
  getProjectId: () => Promise<{ projectId: number | null }>;
  hide: () => Promise<{ success: boolean }>;
  showMainWindow: () => Promise<{ success: boolean }>;
  setIgnoreMouseEvents: (ignore: boolean) => Promise<{ success: boolean }>;
  onCommand: (callback: (commandId: string) => void) => CleanupFn;
  getActiveDoc: () => Promise<ActiveDocInfo>;
  setActiveDoc: (doc: ActiveDocInfo) => Promise<{ success: boolean; error?: string }>;
  onActiveDocChanged: (callback: (doc: ActiveDocInfo) => void) => CleanupFn;
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

export interface SnapshotListItem {
  fileName: string;
  filePath: string;
  snapshotName: string;
  createdAt: string | null;
  personCount: number;
  layerCount: number;
  version: number;
}

/** Snapshot v3 layer adat — egyetlen layer a dokumentumbol */
export interface SnapshotLayer {
  layerId: number;
  layerName: string;
  groupPath: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'normal' | 'text';
  text?: string;
  justification?: 'left' | 'center' | 'right';
  /** Linked Layers — össze van-e linkelve más layerekkel (lánc ikon a PS-ben) */
  linked?: boolean;
  /** Layer láthatósága a Photoshop-ban (rejtett layerek kiszűréséhez) */
  visible?: boolean;
}

/** Sablon slot — egy szemely pozicioja (kep + nev) */
export interface TemplateSlot {
  index: number;
  image: { x: number; y: number; width: number; height: number };
  name: { x: number; y: number; width: number; height: number; justification: 'left' | 'center' | 'right' } | null;
}

/** Sablon fix layer (hatter, diszites, cim — nem slot) */
export interface TemplateFixedLayer {
  layerName: string;
  groupPath: string[];
  x: number; y: number; width: number; height: number;
  kind: 'normal' | 'text';
}

/** Sablon lista elem (rovid osszefoglalo) */
export interface TemplateListItem {
  id: string;
  templateName: string;
  createdAt: string;
  studentSlotCount: number;
  teacherSlotCount: number;
  boardWidthCm: number;
  boardHeightCm: number;
  sourceDocName: string;
}

/** Teljes sablon JSON */
export interface GlobalTemplate {
  version: number;
  type: 'template';
  id: string;
  templateName: string;
  createdAt: string;
  source: { documentName: string; widthPx: number; heightPx: number; dpi: number };
  board: { widthCm: number; heightCm: number; marginCm: number; gapHCm: number; gapVCm: number; gridAlign: string };
  nameSettings: { nameGapCm: number; textAlign: string; nameBreakAfter: number };
  studentSlots: TemplateSlot[];
  teacherSlots: TemplateSlot[];
  fixedLayers: TemplateFixedLayer[];
}

interface PhotoshopAPI {
  setPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  getPath: () => Promise<string | null>;
  launch: () => Promise<{ success: boolean; error?: string }>;
  checkInstalled: () => Promise<{ found: boolean; path: string | null }>;
  browsePath: () => Promise<{ cancelled: boolean; path?: string }>;
  generatePsd: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) => Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>;
  generatePsdDebug: (params: { widthCm: number; heightCm: number; dpi: number; mode: string; outputPath: string; persons?: Array<{ id: number; name: string; type: string }> }) => Promise<{ success: boolean; error?: string }>;
  onPsdDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => () => void;
  getDownloadsPath: () => Promise<string>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getWorkDir: () => Promise<string | null>;
  setWorkDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  browseWorkDir: () => Promise<{ cancelled: boolean; path?: string }>;
  revealInFinder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getMargin: () => Promise<number>;
  setMargin: (marginCm: number) => Promise<{ success: boolean; error?: string }>;
  getStudentSize: () => Promise<number>;
  setStudentSize: (sizeCm: number) => Promise<{ success: boolean; error?: string }>;
  getTeacherSize: () => Promise<number>;
  setTeacherSize: (sizeCm: number) => Promise<{ success: boolean; error?: string }>;
  getGapH: () => Promise<number>;
  setGapH: (gapCm: number) => Promise<{ success: boolean; error?: string }>;
  getGapV: () => Promise<number>;
  setGapV: (gapCm: number) => Promise<{ success: boolean; error?: string }>;
  getNameGap: () => Promise<number>;
  setNameGap: (gapCm: number) => Promise<{ success: boolean; error?: string }>;
  getNameBreakAfter: () => Promise<number>;
  setNameBreakAfter: (breakAfter: number) => Promise<{ success: boolean; error?: string }>;
  getTextAlign: () => Promise<string>;
  setTextAlign: (align: string) => Promise<{ success: boolean; error?: string }>;
  getGridAlign: () => Promise<string>;
  setGridAlign: (align: string) => Promise<{ success: boolean; error?: string }>;
  getPositionGap: () => Promise<number>;
  setPositionGap: (gapCm: number) => Promise<{ success: boolean; error?: string }>;
  getPositionFontSize: () => Promise<number>;
  setPositionFontSize: (fontSize: number) => Promise<{ success: boolean; error?: string }>;
  runJsx: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) => Promise<{ success: boolean; error?: string; output?: string }>;
  runJsxDebug: (params: { scriptName: string; dataFilePath?: string; targetDocName?: string; psdFilePath?: string; personsData?: Array<{ id: number; name: string; type: string }>; imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number }; jsonData?: Record<string, unknown> }) => Promise<{ success: boolean; error?: string }>;
  onJsxDebugLog: (callback: (data: { line: string; stream: 'stdout' | 'stderr' }) => void) => () => void;
  checkPsdExists: (params: { psdPath: string }) => Promise<{ success: boolean; exists: boolean; hasLayouts: boolean }>;
  backupPsd: (params: { psdPath: string }) => Promise<{ success: boolean; error?: string; backupPath?: string }>;
  saveLayoutJson: (params: { psdPath: string; layoutData: Record<string, unknown> }) => Promise<{ success: boolean; error?: string; jsonPath?: string }>;
  saveSnapshot: (params: { psdPath: string; snapshotData: Record<string, unknown>; fileName: string }) => Promise<{ success: boolean; error?: string; snapshotPath?: string }>;
  listSnapshots: (params: { psdPath: string }) => Promise<{ success: boolean; error?: string; snapshots: SnapshotListItem[] }>;
  loadSnapshot: (params: { snapshotPath: string }) => Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }>;
  deleteSnapshot: (params: { snapshotPath: string }) => Promise<{ success: boolean; error?: string }>;
  renameSnapshot: (params: { snapshotPath: string; newName: string }) => Promise<{ success: boolean; error?: string }>;
  saveTemplate: (params: { templateData: GlobalTemplate }) => Promise<{ success: boolean; error?: string }>;
  listTemplates: () => Promise<{ success: boolean; error?: string; templates: TemplateListItem[] }>;
  loadTemplate: (params: { templateId: string }) => Promise<{ success: boolean; error?: string; data?: GlobalTemplate }>;
  deleteTemplate: (params: { templateId: string }) => Promise<{ success: boolean; error?: string }>;
  renameTemplate: (params: { templateId: string; newName: string }) => Promise<{ success: boolean; error?: string }>;
  applyTemplate: (params: { templateId: string; targetDocName?: string; psdFilePath?: string }) => Promise<{ success: boolean; error?: string; output?: string }>;
  placePhotos: (params: { layers: Array<{ layerName: string; photoUrl: string }>; targetDocName?: string; psdFilePath?: string; syncBorder?: boolean }) => Promise<{ success: boolean; error?: string; output?: string }>;
  saveTempFiles: (params: { files: Array<{ name: string; data: ArrayBuffer }> }) => Promise<{ success: boolean; paths: string[]; error?: string }>;
}

interface SampleAPI {
  getSettings: () => Promise<{
    success: boolean;
    error?: string;
    settings?: {
      sizeLarge: number;
      sizeSmall: number;
      watermarkText: string;
      watermarkColor: 'white' | 'black';
      watermarkOpacity: number;
      useLargeSize: boolean;
    };
  }>;
  setSettings: (settings: Partial<{
    sizeLarge: number;
    sizeSmall: number;
    watermarkText: string;
    watermarkColor: 'white' | 'black';
    watermarkOpacity: number;
    useLargeSize: boolean;
  }>) => Promise<{ success: boolean; error?: string }>;
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
    sizes?: Array<{ name: string; width: number }>;
  }) => Promise<{
    success: boolean;
    error?: string;
    localPaths?: string[];
    uploadedCount?: number;
    errors?: string[];
  }>;
}

interface FinalizerAPI {
  upload: (params: {
    flattenedJpgPath: string;
    outputDir: string;
    projectId: number;
    projectName: string;
    apiBaseUrl: string;
    authToken: string;
    type?: 'flat' | 'small_tablo';
    maxSize?: number;
  }) => Promise<{
    success: boolean;
    error?: string;
    localPath?: string;
    uploadedCount?: number;
  }>;
}

// ============ Portrait API ============

export interface PortraitProcessResult {
  success: boolean;
  error?: string;
  processing_time?: number;
}

export interface PortraitBatchResult {
  success: boolean;
  error?: string;
  results?: Array<{ success: boolean; input: string; output?: string; error?: string; processing_time?: number }>;
  total?: number;
  successful?: number;
}

interface PortraitAPI {
  checkPython: () => Promise<{ available: boolean; error?: string }>;
  processSingle: (params: {
    inputPath: string;
    outputPath: string;
    settings: Record<string, unknown>;
  }) => Promise<PortraitProcessResult>;
  processBatch: (params: {
    items: Array<{ input: string; output: string }>;
    settings: Record<string, unknown>;
  }) => Promise<PortraitBatchResult>;
  downloadBackground: (params: {
    url: string;
    outputPath: string;
  }) => Promise<{ success: boolean; error?: string; path?: string }>;
  getTempDir: () => Promise<string>;
  cleanupTemp: (filePaths: string[]) => Promise<{ success: boolean; cleaned?: number }>;
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
  overlay: OverlayAPI;
  touchBar: TouchBarAPI;
  autoUpdate: AutoUpdateAPI;
  photoshop: PhotoshopAPI;
  sample: SampleAPI;
  finalizer: FinalizerAPI;
  portrait: PortraitAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
