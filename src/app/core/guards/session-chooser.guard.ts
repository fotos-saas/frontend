import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TabloStorageService } from '../services/tablo-storage.service';
import { AuthService } from '../services/auth.service';

/**
 * Session Chooser Guard
 *
 * Ellenőrzi, hogy szükséges-e a session chooser megjelenítése:
 * - Ha van marketer/partner/print_shop session → átirányítás a megfelelő dashboard-ra
 * - Ha több tárolt tablo session van és nincs aktív → session chooser
 * - Ha egy tablo session van és nincs aktív → automatikus aktiválás, skip chooser
 * - Ha van aktív tablo session → skip chooser, folytatás
 * - Ha nincs session → login
 *
 * Ez a guard a protected route-ok előtt fut.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionChooserGuard implements CanActivate {
  private readonly storage = inject(TabloStorageService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  canActivate(): boolean {
    const activeSession = this.storage.getActiveSession();

    // Ha van aktív tablo session, továbbengedjük
    if (activeSession) {
      this.storage.updateSessionLastUsed(activeSession.projectId, activeSession.sessionType);
      return true;
    }

    // Ha van marketer/partner session, irányítsuk a megfelelő dashboard-ra
    const redirectUrl = this.getMarketerRedirectUrl();
    if (redirectUrl) {
      this.router.navigate([redirectUrl]);
      return false;
    }

    // Tablo session keresés
    const sessions = this.storage.getStoredSessions();

    if (sessions.length === 0) {
      this.router.navigate(['/login']);
      return false;
    }

    if (sessions.length === 1) {
      this.storage.setActiveSession(sessions[0].projectId, sessions[0].sessionType);
      this.storage.updateSessionLastUsed(sessions[0].projectId, sessions[0].sessionType);
      return true;
    }

    this.router.navigate(['/choose-session']);
    return false;
  }

  /**
   * Marketer/partner/print_shop user átirányítási URL-je (ha van aktív session)
   */
  private getMarketerRedirectUrl(): string | null {
    const user = this.authService.getCurrentUser();
    if (!user?.roles) return null;

    if (user.roles.includes('print_shop')) return '/print-shop/dashboard';
    if (user.roles.includes('partner')) return '/partner/dashboard';
    if (user.roles.includes('designer')) return '/designer/dashboard';
    if (user.roles.includes('marketer')) return '/marketer/dashboard';
    if (user.roles.includes('printer')) return '/printer/dashboard';
    if (user.roles.includes('assistant')) return '/assistant/dashboard';
    if (user.roles.includes('super_admin')) return '/admin/dashboard';
    return null;
  }
}
