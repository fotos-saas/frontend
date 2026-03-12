import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Védett oldalak (tablo AppShell) elérésének ellenőrzése
 *
 * Működés:
 * 1. Ha marketer/partner session van → átirányítás a megfelelő dashboard-ra
 *    (NEM hívjuk a tablo validate-session-t, mert az 401-et adna!)
 * 2. Ellenőrzi, hogy van-e tablo token
 * 3. Ha van, validálja a szerveren (/tablo-frontend/validate-session)
 * 4. Ha érvényes, beengedi
 * 5. Ha nem, átirányít a login oldalra
 *
 * Modern functional guard (Angular 21+)
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Partner/marketer/admin session NEM tablo session — NE validáljuk tablo endpoint-tal!
  // Ez megakadályozza, hogy több tab nyitásakor a tablo validate-session 401-et adjon
  // marketer token-nel, ami kijelentkeztetné az összes tabot.
  if (authService.getMarketerToken()) {
    const user = authService.getCurrentUser();
    if (user?.roles?.includes('super_admin')) {
      router.navigate(['/super-admin/dashboard']);
    } else if (user?.roles?.includes('print_shop')) {
      router.navigate(['/print-shop/dashboard']);
    } else if (user?.roles?.includes('designer')) {
      router.navigate(['/designer/dashboard']);
    } else {
      router.navigate(['/partner/dashboard']);
    }
    return false;
  }

  // Ha nincs tablo token, egyből átirányítunk
  if (!authService.hasToken()) {
    router.navigate(['/login']);
    return false;
  }

  // Tablo token validálás a szerveren
  return authService.validateSession().pipe(
    map(response => {
      if (response.valid) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      // Hiba esetén átirányítás login-ra
      router.navigate(['/login']);
      return of(false);
    })
  );
};

/**
 * @deprecated Use authGuard functional guard instead
 * Kept for backward compatibility during migration
 */
export { authGuard as AuthGuard };
