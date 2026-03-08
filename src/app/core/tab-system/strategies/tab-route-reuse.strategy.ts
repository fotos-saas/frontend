/**
 * TabRouteReuseStrategy — tab-onkenti route cache
 *
 * Tab valtaskor a korabbi tab komponenset detach-olja (nem destroyolja),
 * igy a form allapot, scroll pozicio, stb. megmarad.
 */

import { Injectable, inject } from '@angular/core';
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { TabManagerService } from '../services/tab-manager.service';

@Injectable({ providedIn: 'root' })
export class TabRouteReuseStrategy implements RouteReuseStrategy {
  private readonly tabManager = inject(TabManagerService);
  private readonly routeCache = new Map<string, DetachedRouteHandle>();
  private readonly MAX_CACHED = 10;

  /** Tarolnunk kell-e az elhagyott route-ot? */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Csak tab valtas eseten detach-olunk
    if (!this.tabManager.isTabSystemEnabled()) return false;
    if (!this.tabManager.isTabSwitchNavigation) return false;

    // Csak ha van aktiv tab
    const activeTab = this.tabManager.activeTab();
    return !!activeTab;
  }

  /** Mentjuk a route-ot a korabbi tab ID-vel */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    // Az elozo tab ID-je kell (nem az uj aktiv)
    // A store ELOTT mar beallitottuk az uj active tab-ot,
    // szoval az elozo tab-ot keressuk a tabs listaban
    const tabs = this.tabManager.tabs();
    const activeId = this.tabManager.activeTabId();

    // Keressuk azt a tab-ot, aminek az URL-je egyezik a route URL-jevel
    const routeUrl = this.getRouteUrl(route);
    const sourceTab = tabs.find(t => t.id !== activeId && t.url === routeUrl);

    if (handle && sourceTab) {
      // Cache meret korlatozas
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
    if (!this.tabManager.isTabSystemEnabled()) return false;

    const tabId = this.tabManager.activeTabId();
    return !!tabId && this.routeCache.has(tabId);
  }

  /** Visszaadjuk a mentett route-ot */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const tabId = this.tabManager.activeTabId();
    if (!tabId) return null;

    const handle = this.routeCache.get(tabId) ?? null;
    if (handle) {
      // Felhasznaltas utan toroljuk (egy tab-hoz csak egyszer attach-olunk)
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
    // FIFO — az elso elem a Map-bol
    const firstKey = this.routeCache.keys().next().value;
    return firstKey ?? null;
  }
}
