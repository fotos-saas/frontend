import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarStateService } from './sidebar-state.service';
import { MenuConfigService } from './menu-config.service';

/**
 * Sidebar Route Service
 *
 * Figyeli a route változásokat és automatikusan kibontja
 * a megfelelő szekciót, ha egy child route-ra navigálunk.
 *
 * Pl. ha /samples-ra megyünk, kibontja a "tablo" szekciót.
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarRouteService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly menuConfig = inject(MenuConfigService);

  constructor() {
    this.watchRouteChanges();
  }

  /**
   * Route változások figyelése
   */
  private watchRouteChanges(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event) => {
      const currentRoute = event.urlAfterRedirects;
      this.expandParentSection(currentRoute);
    });
  }

  /**
   * Kibontja a szülő szekciót, ha a route egy gyermek elemé
   */
  private expandParentSection(route: string): void {
    // Eltávolítjuk a query params-ot
    const cleanRoute = route.split('?')[0];

    const parent = this.menuConfig.findParentByRoute(cleanRoute);

    if (parent) {
      // Auto-expand parent section when navigating to child route
      this.sidebarState.expandSection(parent.id);
    }
  }

  /**
   * Manuális szinkronizálás az aktuális route-tal
   * (pl. app init-nél)
   */
  syncWithCurrentRoute(): void {
    const currentRoute = this.router.url;
    this.expandParentSection(currentRoute);
  }
}
