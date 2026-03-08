/**
 * TabRouteReuseStrategy — tab-onkenti route cache
 *
 * Tab valtaskor a korabbi tab komponenset detach-olja (nem destroyolja),
 * igy a form allapot, scroll pozicio, stb. megmarad.
 *
 * FONTOS: NEM inject-alja kozvetlenul a TabManagerService-t a konstruktorban,
 * mert az circular dependency-t okoz (Router -> RouteReuseStrategy -> TabManager -> Router).
 * Helyette Injector.get()-tel lazy modon eri el.
 */

import { Injectable, inject, Injector } from '@angular/core';
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { TAB_MANAGER_TOKEN } from '../models/tab-manager.token';

@Injectable({ providedIn: 'root' })
export class TabRouteReuseStrategy implements RouteReuseStrategy {
  private readonly injector = inject(Injector);
  private readonly routeCache = new Map<string, DetachedRouteHandle>();
  private readonly MAX_CACHED = 10;
  private _tabManager: any = null;

  /** Lazy TabManager eleres — circular dependency elkerulese */
  private getTabManager() {
    if (!this._tabManager) {
      this._tabManager = this.injector.get(TAB_MANAGER_TOKEN, null);
    }
    return this._tabManager;
  }

  /** Tarolnunk kell-e az elhagyott route-ot? */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const tm = this.getTabManager();
    if (!tm) return false;
    if (!tm.isTabSystemEnabled()) return false;
    if (!tm.isTabSwitchNavigation) return false;
    return !!tm.activeTab();
  }

  /** Mentjuk a route-ot a korabbi tab ID-vel */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const tm = this.getTabManager();
    if (!tm) return;

    const tabs = tm.tabs();
    const activeId = tm.activeTabId();
    const routeUrl = this.getRouteUrl(route);
    const sourceTab = tabs.find((t: any) => t.id !== activeId && t.url === routeUrl);

    if (handle && sourceTab) {
      if (this.routeCache.size >= this.MAX_CACHED) {
        const oldest = this.findOldestCacheKey();
        if (oldest) {
          this.routeCache.delete(oldest);
        }
      }
      this.routeCache.set(sourceTab.id, handle);
    }
  }

  /** Van-e mentett route a cel tab-hoz? */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const tm = this.getTabManager();
    if (!tm) return false;
    if (!tm.isTabSystemEnabled()) return false;
    const tabId = tm.activeTabId();
    return !!tabId && this.routeCache.has(tabId);
  }

  /** Visszaadjuk a mentett route-ot */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const tm = this.getTabManager();
    if (!tm) return null;

    const tabId = tm.activeTabId();
    if (!tabId) return null;

    const handle = this.routeCache.get(tabId) ?? null;
    if (handle) {
      this.routeCache.delete(tabId);
    }
    return handle;
  }

  /** Standard route reuse logika */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  /** Tab bezaraskor cache torles */
  clearCacheForTab(tabId: string): void {
    this.routeCache.delete(tabId);
  }

  /** Teljes cache torles */
  clearAll(): void {
    this.routeCache.clear();
  }

  // === Segedmetodusok ===

  private getRouteUrl(route: ActivatedRouteSnapshot): string {
    return '/' + route.pathFromRoot
      .map(r => r.url.map(s => s.path).join('/'))
      .filter(Boolean)
      .join('/');
  }

  private findOldestCacheKey(): string | null {
    const firstKey = this.routeCache.keys().next().value;
    return firstKey ?? null;
  }
}
