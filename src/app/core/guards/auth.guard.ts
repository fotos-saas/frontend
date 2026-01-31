import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Védett oldalak elérésének ellenőrzése
 *
 * Működés:
 * 1. Ellenőrzi, hogy van-e token
 * 2. Ha van, validálja a szerveren
 * 3. Ha érvényes, beengedi
 * 4. Ha nem, átirányít a login oldalra
 *
 * Modern functional guard (Angular 21+)
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ha nincs token, egyből átirányítunk
  if (!authService.hasToken()) {
    router.navigate(['/login']);
    return false;
  }

  // Ha van token, validáljuk a szerveren
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
