import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard a marketinges/ügyintéző felületre való belépéshez.
 * Csak marketer role-lal rendelkező felhasználók férhetnek hozzá.
 */
export const marketerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Próbáljuk inicializálni a marketer session-t (page reload esetén)
  const user = authService.getCurrentUser();

  if (user?.roles?.includes('marketer')) {
    return true;
  }

  // Nincs jogosultság, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
