import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard a fotós/partner felületre való belépéshez.
 * Csak partner role-lal rendelkező felhasználók férhetnek hozzá.
 */
export const partnerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Próbáljuk inicializálni a partner session-t (page reload esetén)
  const user = authService.getCurrentUser();

  if (user?.roles?.includes('partner')) {
    return true;
  }

  // Nincs jogosultság, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
