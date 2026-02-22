/**
 * Icons & Emojis Constants
 *
 * Központosított ikon és emoji rendszer.
 * Minden UI ikon és emoji innen származik.
 *
 * @example
 * import { REACTION_EMOJIS, CATEGORY_EMOJIS } from '@shared/constants';
 */

// ============================================
// REAKCIÓ RENDSZER
// ============================================

/**
 * Reakció emoji típus (type-safe)
 */
export type ReactionEmoji = '💀' | '😭' | '🫡' | '❤️' | '👀';

/**
 * Elérhető reakciók listája
 * @satisfies - biztosítja hogy a típus megfelelő
 */
export const REACTION_EMOJIS = ['💀', '😭', '🫡', '❤️', '👀'] as const satisfies readonly ReactionEmoji[];

/**
 * Reakció tooltipek magyarul
 */
export const REACTION_TOOLTIPS: Record<ReactionEmoji, string> = {
  '💀': 'Meghaltam',
  '😭': 'Bocs!',
  '🫡': 'Igenis!',
  '❤️': 'Tetszik',
  '👀': 'Mivan???',
} as const;

/**
 * Reakció ARIA labelek (accessibility)
 */
export const REACTION_ARIA_LABELS: Record<ReactionEmoji, string> = {
  '💀': 'halott',
  '😭': 'sírok',
  '🫡': 'rendben',
  '❤️': 'szeretlek',
  '👀': 'láttalak',
} as const;

// ============================================
// KATEGÓRIA EMOJIK (UI elemekhez)
// ============================================

/**
 * Kategória és funkció emojik
 */
export const CATEGORY_EMOJIS = {
  // Fő funkciók
  POKE: '👉',
  PHOTO: '📸',
  VOTING: '🗳️',
  IMAGE: '🖼️',

  // Személyek
  STUDENT: '🎓',
  TEACHER: '👨‍🏫',

  // UI elemek
  STATS: '📊',
  SEARCH: '🔍',
  BELL: '🔔',
  INBOX_FULL: '📬',
  INBOX_EMPTY: '📭',
  PARTY: '🎉',
  ERROR: '😵',
  LIGHTBULB: '💡',
  WRITE: '✍️',
  CALENDAR: '📅',
  CLOCK: '🕐',
  CHECK: '✅',
  CROSS: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOCK: '🔒',
  UNLOCK: '🔓',
  STAR: '⭐',
  FIRE: '🔥',
  SPARKLES: '✨',
  TROPHY: '🏆',
  MEDAL: '🎖️',
  GIFT: '🎁',
  HEART: '❤️',
  WAVE: '👋',
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  EYES: '👀',
  SPEECH: '💬',
  MEGAPHONE: '📢',
} as const;

export type CategoryEmojiKey = keyof typeof CATEGORY_EMOJIS;

// ============================================
// NOTIFICATION TÍPUSOK
// ============================================

/**
 * Értesítés típusok
 */
export type NotificationType = 'mention' | 'reply' | 'like' | 'badge' | 'poke' | 'poke_reaction' | 'forum_post' | 'voting';

/**
 * Értesítés típus emojik
 */
export const NOTIFICATION_EMOJIS: Record<NotificationType, string> = {
  mention: '📢',
  reply: '💬',
  like: '❤️',
  badge: '🏆',
  poke: '👉',
  poke_reaction: '👉',
  forum_post: '📝',
  voting: '🗳️',
} as const;

// ============================================
// TOAST / ALERT TÍPUSOK
// ============================================

/**
 * Toast/alert típusok
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast típus emojik
 */
export const TOAST_EMOJIS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
} as const;

// ============================================
// REAKCIÓK ÖSSZESÍTÉS (interface)
// ============================================

/**
 * Reakciók összesítés interface
 */
export interface ReactionsSummary {
  [emoji: string]: number;
}

// ============================================
// LUCIDE ICON NEVEK (type-safe)
// ============================================

/**
 * Lucide icon nevek - központosított konstansok
 * Használat: <lucide-icon [name]="ICONS.QR_CODE" [size]="20" />
 */
export const ICONS = {
  // Navigáció
  ARROW_LEFT: 'arrow-left',
  ARROW_RIGHT: 'arrow-right',
  CHEVRON_LEFT: 'chevron-left',
  CHEVRON_RIGHT: 'chevron-right',
  X: 'x',
  MENU: 'menu',
  MORE_VERTICAL: 'more-vertical',

  // Általános műveletek
  PLUS: 'plus',
  PLUS_CIRCLE: 'plus-circle',
  MINUS: 'minus',
  EDIT: 'pencil',
  DELETE: 'trash-2',
  COPY: 'copy',
  CODE: 'code',
  CHECK: 'check',
  REFRESH: 'refresh-cw',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  EXTERNAL_LINK: 'external-link',
  PLAY: 'play',

  // QR kód és regisztráció
  QR_CODE: 'qr-code',
  SMARTPHONE: 'smartphone',
  SCAN: 'scan',

  // Nyomtatás
  PRINTER: 'printer',

  // Státusz és feedback
  ALERT_CIRCLE: 'alert-circle',
  ALERT_TRIANGLE: 'alert-triangle',
  CHECK_CIRCLE: 'check-circle',
  MINUS_CIRCLE: 'minus-circle',
  X_CIRCLE: 'x-circle',
  INFO: 'info',
  BAN: 'ban',
  CIRCLE: 'circle',
  FILE_CHECK: 'file-check',
  CAMERA: 'camera',
  UNDO: 'undo-2',

  // Fájlok és mappák
  FOLDER: 'folder',
  FOLDER_OPEN: 'folder-open',
  FILE: 'file',
  FILE_TEXT: 'file-text',
  FILE_PLUS: 'file-plus',
  TAG: 'tag',

  // Felhasználók
  USER: 'user',
  USERS: 'users',
  USER_PLUS: 'user-plus',
  USER_CHECK: 'user-check',
  USER_X: 'user-x',
  USER_QUESTION: 'user-round-search',

  // Kommunikáció
  MAIL: 'mail',
  MAIL_CHECK: 'mail-check',
  PHONE: 'phone',
  MESSAGE_CIRCLE: 'message-circle',
  FORWARD: 'forward',

  // Zoom
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',

  // Téma
  SUN: 'sun',
  MOON: 'moon',

  // Dashboard
  LAYOUT_DASHBOARD: 'layout-dashboard',

  // Egyéb
  CALENDAR: 'calendar',
  CLOCK: 'clock',
  SEARCH: 'search',
  SETTINGS: 'settings',
  HOME: 'home',
  BUILDING: 'building',
  BUILDING_2: 'building-2',
  SCHOOL: 'school',
  LINK: 'link',
  UNLINK: 'unlink',
  IMAGE: 'image',
  IMAGE_DOWN: 'image-down',
  EXPAND: 'expand',
  FOLDER_PLUS: 'folder-plus',
  LAYOUT_TEMPLATE: 'layout-template',

  // Navigáció és rendezés
  ARROW_UP: 'arrow-up',
  ARROW_DOWN: 'arrow-down',
  CHEVRON_UP: 'chevron-up',
  CHEVRON_DOWN: 'chevron-down',
  FILTER: 'filter',

  // Marketer specifikus
  HISTORY: 'history',
  MAP_PIN: 'map-pin',
  GRADUATION_CAP: 'graduation-cap',
  BRIEFCASE: 'briefcase',
  INBOX: 'inbox',

  // AI és automatizálás
  WAND: 'wand-2',
  SPARKLES: 'sparkles',
  SPARKLE: 'sparkle',
  HAND: 'hand',
  MOUSE_POINTER: 'mouse-pointer-2',

  // Partner Orders
  KEY: 'key',
  GRID: 'grid-3x3',
  LAYOUT_GRID: 'layout-grid',
  FRAME: 'frame',
  SHOPPING_BAG: 'shopping-bag',
  LIST: 'list',
  FILE_SPREADSHEET: 'file-spreadsheet',

  // Client / Auth
  LOGOUT: 'log-out',
  IMAGES: 'images',
  SAVE: 'save',

  // Password visibility
  EYE: 'eye',
  EYE_OFF: 'eye-off',

  // Payment & Billing
  CREDIT_CARD: 'credit-card',
  PACKAGE: 'package',
  PACKAGE_CHECK: 'package-check',
  WALLET: 'wallet',
  PERCENT: 'percent',

  // Loading & Spinners
  LOADER: 'loader-2',

  // Subscription & Settings
  HARD_DRIVE: 'hard-drive',
  PAUSE_CIRCLE: 'pause-circle',
  PLAY_CIRCLE: 'play-circle',
  PUZZLE: 'puzzle',

  // Biometric / Security
  SCAN_FACE: 'scan-face',
  FINGERPRINT: 'fingerprint',
  SHIELD_CHECK: 'shield-check',
  LOCK: 'lock',

  // Network / Offline
  WIFI: 'wifi',
  WIFI_OFF: 'wifi-off',

  // Help & Documentation
  HELP_CIRCLE: 'help-circle',
  BOOK_OPEN: 'book-open',

  // Design & Roles
  PALETTE: 'palette',
  CLIPBOARD_LIST: 'clipboard-list',
  MEGAPHONE: 'megaphone',

  // Bug Reports
  BUG: 'bug',
  SEND: 'send',
  PAPERCLIP: 'paperclip',

  // QR Code Types
  PIN: 'pin',

  // Deadline countdown
  HOURGLASS: 'hourglass',
  TIMER: 'timer',

  // Monitoring & Export
  ACTIVITY: 'activity',
  ARCHIVE: 'archive',

  // Invoicing
  RECEIPT: 'receipt',
  BANKNOTE: 'banknote',

  // Marketplace modulok (backend config ikonok)
  BAR_CHART: 'bar-chart-3',
  MONITOR: 'monitor',
  GLOBE: 'globe',
  ERASER: 'eraser',
  CROP: 'crop',
  BOT: 'bot',
  MESSAGE_SQUARE: 'message-square',
  VOTE: 'vote',
  CONTACT: 'contact',

  // Webshop
  STORE: 'store',
  TRUCK: 'truck',

  // Tablóméretek
  RULER: 'ruler',

  // Tablókészítő
  LAYERS: 'layers',

  // Igazítás
  ALIGN_LEFT: 'align-left',
  ALIGN_CENTER: 'align-center',
  ALIGN_RIGHT: 'align-right',
  ALIGN_START_V: 'align-start-vertical',
  ALIGN_CENTER_V: 'align-center-vertical',
  ALIGN_END_V: 'align-end-vertical',
  ALIGN_START_H: 'align-start-horizontal',
  ALIGN_CENTER_H: 'align-center-horizontal',
  ALIGN_END_H: 'align-end-horizontal',
  ROWS_3: 'rows-3',
  COLUMNS_3: 'columns-3',

  // Vizuális szerkesztő
  MOVE: 'move',
  ALIGN_H_DISTRIBUTE: 'align-horizontal-distribute-center',
  ALIGN_V_DISTRIBUTE: 'align-vertical-distribute-center',
  MAXIMIZE_2: 'maximize-2',

  // Rendezés
  ARROW_DOWN_AZ: 'arrow-down-a-z',
  LIST_ORDERED: 'list-ordered',

  // Undo/Redo
  REDO: 'redo-2',

  // Booking Calendar
  CALENDAR_DAYS: 'calendar-days',
  CALENDAR_CLOCK: 'calendar-clock',
  CALENDAR_CHECK: 'calendar-check',
  CALENDAR_PLUS: 'calendar-plus',
  CLOCK_3: 'clock-3',
  MAP: 'map',
  USERS_ROUND: 'users-round',
  FILE_DOWN: 'file-down',
  REPEAT: 'repeat',

  // Floating Overlay
  COMMAND: 'command',
  ZAPS: 'zap',
  SQUARE_STACK: 'square-stack',
  PANEL_LEFT: 'panel-left',
  TYPE: 'type',
  MINIMIZE_2: 'minimize-2',
  GRIP: 'grip-vertical',
  CHEVRONS_LEFT_RIGHT: 'chevrons-left-right',
  MOUSE_POINTER_CLICK: 'mouse-pointer-click',
  SCAN_LINE: 'scan-line',
  REPLACE: 'replace',
  FLIP_HORIZONTAL: 'flip-horizontal',
  FLIP_VERTICAL: 'flip-vertical-2',
  SHRINK: 'shrink',
  SQUARE_DASHED_BOTTOM: 'square-dashed-bottom',
  COMPONENT: 'component',
  BLEND: 'blend',
} as const;

export type IconName = typeof ICONS[keyof typeof ICONS];
