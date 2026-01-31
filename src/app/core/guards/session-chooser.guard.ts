import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TabloStorageService } from '../services/tablo-storage.service';

/**
 * Session Chooser Guard
 *
 * Ellenőrzi, hogy szükséges-e a session chooser megjelenítése:
 * - Ha több tárolt session van és nincs aktív → session chooser
 * - Ha egy session van és nincs aktív → automatikus aktiválás, skip chooser
 * - Ha van aktív session → skip chooser, folytatás
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

  canActivate(): boolean {
    const sessions = this.storage.getStoredSessions();
    const activeSession = this.storage.getActiveSession();

    // Ha van aktív session, továbbengedjük
    if (activeSession) {
      // Frissítsük a lastUsed-et
      this.storage.updateSessionLastUsed(activeSession.projectId, activeSession.sessionType);
      return true;
    }

    // Ha nincs session, login-ra
    if (sessions.length === 0) {
      this.router.navigate(['/login']);
      return false;
    }

    // Ha egy session van, automatikusan aktiváljuk és továbbengedjük
    if (sessions.length === 1) {
      this.storage.setActiveSession(sessions[0].projectId, sessions[0].sessionType);
      this.storage.updateSessionLastUsed(sessions[0].projectId, sessions[0].sessionType);
      return true;
    }

    // Ha több session van, session chooser-re irányítunk
    this.router.navigate(['/choose-session']);
    return false;
  }
}
