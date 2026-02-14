import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Role-alapú preloading strategy.
 *
 * A PreloadAllModules MINDEN lazy chunk-ot betölti — felesleges,
 * mert egy partner user sosem megy super-admin/client/marketer route-okra.
 *
 * Ez a strategy:
 * 1. Csak a felhasználó role-jának megfelelő route-okat tölti elő
 * 2. Publikus route-okat mindig előtölti (login, share, shop)
 * 3. 2 mp késleltetéssel indul, hogy az initial load ne lassuljon
 */
@Injectable({ providedIn: 'root' })
export class RoleBasedPreloadingStrategy implements PreloadingStrategy {
  private readonly auth = inject(AuthService);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Ha nincs data.preload flag, és nem egy protected route, ne töltsük elő
    if (route.data?.['preload'] === false) {
      return of(null);
    }

    const path = route.path ?? '';

    // Publikus route-ok: mindig előtöltjük (gyors navigáció)
    if (this.isPublicRoute(path)) {
      return this.delayedLoad(load, 2000);
    }

    // Protected route-ok: csak ha van user és a role egyezik
    const user = this.auth.getCurrentUser();
    if (!user) {
      return of(null);
    }

    const roles = user.roles ?? [];
    if (this.shouldPreloadForRoles(path, roles)) {
      return this.delayedLoad(load, 3000);
    }

    return of(null);
  }

  private isPublicRoute(path: string): boolean {
    const publicPaths = ['login', 'share', 'preview', 'register', 'forgot-password', 'reset-password', 'shop'];
    return publicPaths.some(p => path.startsWith(p));
  }

  private shouldPreloadForRoles(path: string, roles: string[]): boolean {
    // Partner/designer/marketer/printer/assistant → partner routes
    const partnerRoles = ['partner', 'designer', 'marketer', 'printer', 'assistant'];
    if (path === 'partner' || path === 'designer') {
      return roles.some(r => partnerRoles.includes(r));
    }

    // Marketer role → marketer routes
    if (path === 'marketer') {
      return roles.includes('marketer');
    }

    // Super admin → super-admin routes
    if (path === 'super-admin') {
      return roles.includes('super_admin');
    }

    // Client → client routes
    if (path === 'client') {
      return roles.includes('client');
    }

    // Tablo (AppShell) routes — default protected, mindig előtöltjük auth user-nek
    if (path === '' || path === 'home' || path === 'voting' || path === 'forum' ||
        path === 'newsfeed' || path === 'photo-selection' || path === 'persons' ||
        path === 'template-chooser' || path === 'order-finalization' || path === 'samples' ||
        path === 'poke' || path === 'billing' || path === 'notifications' || path === 'order-data') {
      return true;
    }

    return false;
  }

  private delayedLoad(load: () => Observable<unknown>, delayMs: number): Observable<unknown> {
    return timer(delayMs).pipe(switchMap(() => load()));
  }
}
