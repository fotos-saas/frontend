/**
 * Tab rendszer modellek
 * Chrome-szeru tab + split view a PhotoStack Electron apphoz
 */

export interface Tab {
  /** Egyedi azonosito (crypto.randomUUID) */
  id: string;
  /** Tab cime (route title vagy oldal neve) */
  title: string;
  /** Teljes URL amit a tab tart (pl. '/partner/projects/42') */
  url: string;
  /** Lucide ikon neve */
  icon: string;
  /** Tab letrehottenek ideje */
  createdAt: number;
  /** Utolso aktivalas ideje */
  lastActiveAt: number;
  /** Van-e nem mentett valtozas */
  isDirty: boolean;
  /** Rogzitett tab (csak ikon, bal szel) */
  isPinned: boolean;
  /** Scroll pozicio visszaallitashoz */
  scrollPosition: { x: number; y: number };
}

export type SplitMode = 'none' | 'horizontal' | 'vertical';

export interface TabSession {
  tabs: Array<{ url: string; title: string; icon: string; isPinned: boolean }>;
  activeTabId: string | null;
  /** Aktiv tab indexe (restore-hoz, mert az ID-k uj UUID-t kapnak) */
  activeTabIndex: number;
  splitMode: SplitMode;
  splitRatio: number;
  savedAt: number;
}

export interface TabContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
}

/** Tab letrehozasi opciok */
export interface CreateTabOptions {
  /** Aktivalja-e az uj tab-ot (default: true) */
  activate?: boolean;
  /** Egyedi cim (kulonben route-bol jon) */
  title?: string;
  /** Egyedi ikon */
  icon?: string;
}

/** Route data-bol szarmazo tab informaciok */
export interface TabRouteData {
  title?: string;
  icon?: string;
}

/** Default tab URL ha nincs specialis */
export const DEFAULT_TAB_URL = '/partner/dashboard';

/** Maximum tabszam */
export const MAX_TABS = 10;
