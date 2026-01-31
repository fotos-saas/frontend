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
import { ProjectModeService } from '../services/project-mode.service';
import { ToastService } from '../services/toast.service';

/**
 * Samples Guard - Minták oldal elérésének ellenőrzése
 *
 * Működés:
 * 1. Ellenőrzi, hogy van-e token
 * 2. Validálja a szerveren
 * 3. Ellenőrzi, hogy van-e aktív minta (samplesCount > 0)
 * 4. Ha nincs minta: átirányít /home-ra
 */
@Injectable({
  providedIn: 'root'
})
export class SamplesGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private projectModeService: ProjectModeService,
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

    // Ha van token, validáljuk a szerveren és ellenőrizzük a mintákat
    return this.authService.validateSession().pipe(
      map(response => {
        if (!response.valid) {
          this.router.navigate(['/login']);
          return false;
        }

        // Ellenőrizzük, hogy van-e minta
        const project = this.authService.getProject();
        if (!this.projectModeService.showSamples(project)) {
          // Nincs minta - átirányítás home-ra
          this.toastService.error(
            'Nincs minta',
            'Még nincsenek mintaképek ehhez a projekthez.'
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
