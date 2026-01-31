import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TabloStorageService } from '../services/tablo-storage.service';

/**
 * NoAuth Guard - Login oldal védelem bejelentkezett felhasználók ellen
 *
 * Ha a felhasználó már be van jelentkezve (van token), átirányítja a /home oldalra.
 * Ez megakadályozza a login oldal "bevillanását" navigáció közben.
 *
 * Kivétel: Ha ?newLogin=true query param van, akkor engedélyezi a login oldalt
 * és törli az aktív session-t (de a tárolt session-ök megmaradnak).
 */
@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storage = inject(TabloStorageService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Ha ?newLogin=true, engedélyezzük a login oldalt új belépéshez
    const newLogin = route.queryParamMap.get('newLogin') === 'true';

    if (newLogin) {
      // Töröljük az aktív session-t, de a tárolt session-ök megmaradnak
      this.storage.clearActiveSession();
      this.authService.clearAuthState();
      return true;
    }

    // Normál működés: ha van token, átirányítás home-ra
    if (this.authService.hasToken()) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
