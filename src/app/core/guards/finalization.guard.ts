import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Finalization Guard - Véglegesítés oldal elérésének ellenőrzése
 *
 * Működés:
 * 1. Ellenőrzi, hogy van-e token
 * 2. Validálja a szerveren
 * 3. Ellenőrzi, hogy kódos belépéssel lépett-e be (canFinalize === true)
 * 4. Ha share/preview tokennel: átirányít /samples-ra
 */
@Injectable({
  providedIn: 'root'
})
export class FinalizationGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // Ha nincs token, egyből átirányítunk
    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Ha van token, validáljuk a szerveren és ellenőrizzük a jogosultságot
    return this.authService.validateSession().pipe(
      map(response => {
        if (!response.valid) {
          this.router.navigate(['/login']);
          return false;
        }

        // Ellenőrizzük, hogy véglegesíthet-e
        if (response.canFinalize !== true) {
          // Share/preview token - nincs jogosultság
          this.toastService.error(
            'Nincs jogosultság',
            'A véglegesítés csak belépési kóddal érhető el.'
          );
          this.router.navigate(['/home']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        // Hiba esetén átirányítás login-ra
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
