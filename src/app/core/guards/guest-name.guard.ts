import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { GuestService } from '../services/guest.service';

/**
 * Guest Name Guard
 *
 * Ellenőrzi, hogy vendég (share token) felhasználó megadta-e a nevét.
 * Ha nem, a komponens fogja megjeleníteni az OnboardingDialog-ot.
 *
 * A guard NEM blokkol, hanem egy flag-et állít be a route data-ban,
 * amit a komponens használhat a dialógus megjelenítéséhez.
 *
 * Használat:
 * ```typescript
 * {
 *   path: 'voting',
 *   component: VotingListComponent,
 *   canActivate: [AuthGuard, GuestNameGuard]
 * }
 * ```
 *
 * A komponensben:
 * ```typescript
 * ngOnInit() {
 *   if (this.guestNameGuard.needsOnboarding()) {
 *     this.showOnboardingDialog = true;
 *   }
 *   if (this.guestNameGuard.isPendingVerification()) {
 *     this.showPendingScreen = true;
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class GuestNameGuard implements CanActivate {
  private authService = inject(AuthService);
  private guestService = inject(GuestService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // Nem vendég token - nincs szükség guest session-re
    if (!this.authService.isGuest()) {
      return true;
    }

    // Ha már van guest session és verified, engedélyezzük
    if (this.guestService.hasRegisteredSession() && !this.guestService.isSessionPending()) {
      return true;
    }

    // Vendég, de még nincs session, vagy pending státuszú
    // Guard-ban nem blokkolunk, hanem beengedjük és a komponens kezeli
    // Ez azért kell, mert a guard nem tud dialógust megjeleníteni
    return true;
  }

  /**
   * Ellenőrzi, hogy szükséges-e onboarding (új vendég regisztráció)
   * Ezt a komponensek hívják ngOnInit-ben
   * Csak 'share' session esetén szükséges - a 'code' session kapcsolattartóként működik
   */
  needsOnboarding(): boolean {
    return this.authService.isGuest() && !this.guestService.hasRegisteredSession();
  }

  /**
   * Ellenőrzi, hogy szükséges-e guest név bekérése
   * @deprecated Használd a needsOnboarding() metódust helyette
   */
  needsGuestName(): boolean {
    return this.needsOnboarding();
  }

  /**
   * Ellenőrzi, hogy a session pending státuszú-e (ütközés miatt vár)
   * Ha igen, a PendingVerificationComponent-et kell megjeleníteni
   */
  isPendingVerification(): boolean {
    return this.authService.isGuest() &&
           this.guestService.hasRegisteredSession() &&
           this.guestService.isSessionPending();
  }

  /**
   * Ellenőrzi, hogy a session verified státuszú-e
   */
  isVerified(): boolean {
    return !this.needsOnboarding() && !this.isPendingVerification();
  }
}
