import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

/**
 * NavigationLoadingService
 *
 * Navigációs állapot tracking szolgáltatás.
 * Figyeli a Router eseményeket és signal-eken keresztül
 * jelzi a navigáció állapotát.
 *
 * Használat:
 * - Top loading bar megjelenítése navigáció közben
 * - Sidebar menüpont pending state
 * - Dupla kattintás megelőzése
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationLoadingService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Navigáció folyamatban van-e */
  readonly isNavigating = signal<boolean>(false);

  /** Melyik route-ra navigálunk (URL path) */
  readonly pendingRoute = signal<string | null>(null);

  /** Navigáció indulásának időpontja (progress számításhoz) */
  readonly navigationStartTime = signal<number>(0);

  /** Computed: Van pending navigáció az adott route-ra? */
  isPendingRoute(route: string): boolean {
    const pending = this.pendingRoute();
    if (!pending) return false;
    // Normalizáljuk mindkét route-ot (/ nélkül az elején, ha kell)
    const normalizedPending = pending.startsWith('/') ? pending.slice(1) : pending;
    const normalizedRoute = route.startsWith('/') ? route.slice(1) : route;
    return normalizedPending === normalizedRoute || normalizedPending.startsWith(normalizedRoute + '/');
  }

  constructor() {
    this.initRouterSubscription();
  }

  /**
   * Router események figyelése
   */
  private initRouterSubscription(): void {
    // NavigationStart - navigáció indítása
    this.router.events.pipe(
      filter((event): event is NavigationStart => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      this.isNavigating.set(true);
      this.pendingRoute.set(event.url);
      this.navigationStartTime.set(Date.now());
    });

    // NavigationEnd, Cancel, Error - navigáció vége
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isNavigating.set(false);
      this.pendingRoute.set(null);
      this.navigationStartTime.set(0);
    });
  }
}
