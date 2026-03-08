/**
 * TabManagerService — fo tab kezelesi logika (Signal-alapu)
 *
 * Chrome-szeru tab rendszer Angular 21+ SPA-ban.
 * Csak Electron modban aktiv.
 */

import { Injectable, inject, Injector, signal, computed, effect, NgZone, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouteReuseStrategy } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ElectronService } from '../../services/electron.service';
import { LoggerService } from '../../services/logger.service';
import { TabSessionService } from './tab-session.service';
import { TabTitleResolver } from '../utils/tab-title.resolver';
import { Tab, SplitMode, CreateTabOptions, DEFAULT_TAB_URL, MAX_TABS } from '../models/tab.model';
import type { TabRouteReuseStrategy } from '../strategies/tab-route-reuse.strategy';

@Injectable({ providedIn: 'root' })
export class TabManagerService {
  private readonly router = inject(Router);
  private readonly electronService = inject(ElectronService);
  private readonly logger = inject(LoggerService);
  private readonly sessionService = inject(TabSessionService);
  private readonly titleResolver = inject(TabTitleResolver);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // === Belso allapot flag-ek ===
  private _isTabSwitchNavigation = false;
  private readonly _initialized = signal(false);
  private _routeReuseStrategy: TabRouteReuseStrategy | null = null;

  // === Allapot ===
  readonly tabs = signal<Tab[]>([]);
  readonly activeTabId = signal<string | null>(null);
  readonly splitMode = signal<SplitMode>('none');
  readonly splitTabs = signal<[string, string] | null>(null);
  readonly splitRatio = signal<number>(0.5);

  // === Szarmaztatott ===
  readonly activeTab = computed(() =>
    this.tabs().find(t => t.id === this.activeTabId()) ?? null
  );
  readonly tabCount = computed(() => this.tabs().length);
  readonly canCreateTab = computed(() => this.tabs().length < MAX_TABS);
  readonly isTabSystemEnabled = computed(() => this.electronService.isElectron);

  constructor() {
    // Session auto-mentes minden allapot valtozaskor
    effect(() => {
      const tabList = this.tabs();
      const activeId = this.activeTabId();
      const split = this.splitMode();
      const ratio = this.splitRatio();

      if (!this._initialized() || tabList.length === 0) return;

      const activeIndex = tabList.findIndex(t => t.id === activeId);
      this.sessionService.save({
        tabs: tabList.map(t => ({
          url: t.url,
          title: t.title,
          icon: t.icon,
          isPinned: t.isPinned,
        })),
        activeTabId: activeId,
        activeTabIndex: activeIndex >= 0 ? activeIndex : 0,
        splitMode: split,
        splitRatio: ratio,
        savedAt: Date.now(),
      });
    });

    // Route valtozas figyelese — aktiv tab URL frissitese
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      if (this._isTabSwitchNavigation) {
        this._isTabSwitchNavigation = false;
        return;
      }
      this.updateActiveTabUrl(event.urlAfterRedirects);
    });
  }

  /** Tab rendszer inicializalas (app indulaskor hivando) */
  async initialize(): Promise<void> {
    if (!this.isTabSystemEnabled() || this._initialized()) return;

    // Session visszaallitas
    const session = await this.sessionService.load();
    if (session && session.tabs.length > 0) {
      const restoredTabs: Tab[] = session.tabs.map(t => this.createTabObject(t.url, {
        title: t.title,
        icon: t.icon,
      }));

      // Rogzitett tabok visszaallitasa
      session.tabs.forEach((saved, i) => {
        if (saved.isPinned && restoredTabs[i]) {
          restoredTabs[i].isPinned = true;
        }
      });

      this.tabs.set(restoredTabs);

      // Aktiv tab: mentett index alapjan (uj ID-k generaltunk, eredeti ID nem hasznalhato)
      const activeIndex = Math.min(session.activeTabIndex ?? 0, restoredTabs.length - 1);
      const activeTab = restoredTabs[Math.max(0, activeIndex)];
      if (activeTab) {
        this.activeTabId.set(activeTab.id);
        this._isTabSwitchNavigation = true;
        this.router.navigateByUrl(activeTab.url);
      }

      this.splitMode.set(session.splitMode || 'none');
      this.splitRatio.set(session.splitRatio || 0.5);
    } else {
      // Elso inditaskor: egy tab a jelenlegi URL-lel
      const currentUrl = this.router.url || DEFAULT_TAB_URL;
      const info = this.titleResolver.resolveFromUrl(currentUrl);
      const tab = this.createTabObject(currentUrl, info);
      this.tabs.set([tab]);
      this.activeTabId.set(tab.id);
    }

    this._initialized.set(true);
    this.logger.info('Tab rendszer inicializalva', { tabCount: this.tabs().length });
  }

  // === Tab muveletek ===

  /** Uj tab letrehozasa */
  createTab(url: string, options?: CreateTabOptions): string | null {
    if (!this.canCreateTab()) {
      this.logger.warn('Maximum tabszam elerve', { max: MAX_TABS });
      return null;
    }

    const info = this.titleResolver.resolveFromUrl(url);
    const tab = this.createTabObject(url, {
      title: options?.title || info.title,
      icon: options?.icon || info.icon,
    });

    this.tabs.update(tabs => [...tabs, tab]);

    if (options?.activate !== false) {
      this.activateTab(tab.id);
    }

    this.logger.debug('Tab letrehozva', { id: tab.id, url });
    return tab.id;
  }

  /** Tab bezarasa */
  closeTab(tabId: string): void {
    const currentTabs = this.tabs();
    const tabIndex = currentTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = currentTabs[tabIndex];
    if (tab.isPinned) return; // Rogzitett tabot nem lehet bezarni

    const isActive = tabId === this.activeTabId();
    const newTabs = currentTabs.filter(t => t.id !== tabId);

    // Route cache takaritasa a bezart tabhoz
    this.getRouteReuseStrategy().clearCacheForTab(tabId);

    // Split mod kezelese
    const split = this.splitTabs();
    if (split && (split[0] === tabId || split[1] === tabId)) {
      this.unsplit();
    }

    if (newTabs.length === 0) {
      // Utolso tab: uj ures tab nyilik
      const info = this.titleResolver.resolveFromUrl(DEFAULT_TAB_URL);
      const newTab = this.createTabObject(DEFAULT_TAB_URL, info);
      this.tabs.set([newTab]);
      this.activateTab(newTab.id);
      return;
    }

    this.tabs.set(newTabs);

    // Ha az aktiv tabot zartuk be, navigaljunk a kovetkezore
    if (isActive) {
      const nextIndex = Math.min(tabIndex, newTabs.length - 1);
      this.activateTab(newTabs[nextIndex].id);
    }

    this.logger.debug('Tab bezarva', { id: tabId });
  }

  /** Osszes tobbi tab bezarasa */
  closeOtherTabs(tabId: string): void {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab) return;

    // Eredeti sorrend megtartasa: megmaradt tabok = pinned + target
    const keptTabs = this.tabs().filter(t => t.id === tabId || (t.isPinned && t.id !== tabId));

    // Bezart tabok cache takaritasa
    const closedIds = this.tabs().filter(t => !keptTabs.includes(t)).map(t => t.id);
    closedIds.forEach(id => this.getRouteReuseStrategy().clearCacheForTab(id));

    this.tabs.set(keptTabs);
    this.unsplit();
    this.activateTab(tabId);
  }

  /** Jobbra levo tabok bezarasa */
  closeTabsToRight(tabId: string): void {
    const currentTabs = this.tabs();
    const index = currentTabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const keptTabs = currentTabs.filter((t, i) => i <= index || t.isPinned);
    this.tabs.set(keptTabs);

    // Ha az aktiv tab el lett tavolitva
    if (!keptTabs.find(t => t.id === this.activeTabId())) {
      this.activateTab(tabId);
    }
  }

  /** Tab aktivalasa (focusba hozas) */
  activateTab(tabId: string): void {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab) return;

    // Elozo tab scroll pozicio mentese
    const prevTab = this.activeTab();
    if (prevTab) {
      this.updateTab(prevTab.id, {
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY,
        },
      });
    }

    this.activeTabId.set(tabId);
    this.updateTab(tabId, { lastActiveAt: Date.now() });

    // Navigalas a tab URL-re
    this._isTabSwitchNavigation = true;
    this.router.navigateByUrl(tab.url).then(() => {
      // Scroll pozicio visszaallitasa
      setTimeout(() => {
        window.scrollTo(tab.scrollPosition.x, tab.scrollPosition.y);
      }, 0);
    });
  }

  /** Tab atherenderezese (drag & drop) */
  moveTab(fromIndex: number, toIndex: number): void {
    this.tabs.update(tabs => {
      const result = [...tabs];
      const [moved] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, moved);
      return result;
    });
  }

  /** Tab cim frissitese */
  updateTabTitle(tabId: string, title: string): void {
    this.updateTab(tabId, { title });
  }

  /** Tab dirty allapot frissitese */
  updateTabDirty(tabId: string, isDirty: boolean): void {
    this.updateTab(tabId, { isDirty });
  }

  /** Tab rogzites be/ki */
  togglePinTab(tabId: string): void {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab) return;

    this.updateTab(tabId, { isPinned: !tab.isPinned });

    // Rogzitett tabok a sor elejere kerulnek
    this.tabs.update(tabs => {
      const pinned = tabs.filter(t => t.isPinned);
      const unpinned = tabs.filter(t => !t.isPinned);
      return [...pinned, ...unpinned];
    });
  }

  /** Tab duplikalasa */
  duplicateTab(tabId: string): string | null {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab) return null;

    return this.createTab(tab.url, { title: tab.title, icon: tab.icon });
  }

  /** Tab valtasa indexszel (Ctrl+1-9) */
  switchToTabByIndex(index: number): void {
    const tab = this.tabs()[index];
    if (tab) {
      this.activateTab(tab.id);
    }
  }

  /** Kovetkezo tab */
  nextTab(): void {
    const currentTabs = this.tabs();
    if (currentTabs.length < 2) return;

    const activeId = this.activeTabId();
    const index = currentTabs.findIndex(t => t.id === activeId);
    const nextIndex = (index + 1) % currentTabs.length;
    this.activateTab(currentTabs[nextIndex].id);
  }

  /** Elozo tab */
  previousTab(): void {
    const currentTabs = this.tabs();
    if (currentTabs.length < 2) return;

    const activeId = this.activeTabId();
    const index = currentTabs.findIndex(t => t.id === activeId);
    const prevIndex = (index - 1 + currentTabs.length) % currentTabs.length;
    this.activateTab(currentTabs[prevIndex].id);
  }

  // === Split View ===

  /** Split view aktivalasa */
  splitView(leftTabId: string, rightTabId: string, mode: SplitMode): void {
    if (mode === 'none') {
      this.unsplit();
      return;
    }
    this.splitMode.set(mode);
    this.splitTabs.set([leftTabId, rightTabId]);
    this.splitRatio.set(0.5);
  }

  /** Split view kikapcsolasa */
  unsplit(): void {
    this.splitMode.set('none');
    this.splitTabs.set(null);
    this.splitRatio.set(0.5);
  }

  /** Split arany beallitasa */
  setSplitRatio(ratio: number): void {
    this.splitRatio.set(Math.max(0.2, Math.min(0.8, ratio)));
  }

  /** Tab valtas navigacio-e? (RouteReuseStrategy hasznalja) */
  get isTabSwitchNavigation(): boolean {
    return this._isTabSwitchNavigation;
  }

  // === Belso segedmetodusok ===

  /** RouteReuseStrategy lazy eleres (circular dependency elkerulese) */
  private getRouteReuseStrategy(): TabRouteReuseStrategy {
    if (!this._routeReuseStrategy) {
      this._routeReuseStrategy = this.injector.get(RouteReuseStrategy) as TabRouteReuseStrategy;
    }
    return this._routeReuseStrategy;
  }

  private createTabObject(url: string, info: { title?: string; icon?: string }): Tab {
    return {
      id: crypto.randomUUID(),
      title: info.title || 'Uj tab',
      url,
      icon: info.icon || 'file',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      isDirty: false,
      isPinned: false,
      scrollPosition: { x: 0, y: 0 },
    };
  }

  private updateTab(tabId: string, updates: Partial<Tab>): void {
    this.tabs.update(tabs =>
      tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
    );
  }

  private updateActiveTabUrl(url: string): void {
    const activeId = this.activeTabId();
    if (!activeId) return;

    const info = this.titleResolver.resolveFromUrl(url);
    this.updateTab(activeId, {
      url,
      title: info.title || this.activeTab()?.title || 'Tab',
      icon: info.icon || this.activeTab()?.icon || 'file',
    });
  }
}
