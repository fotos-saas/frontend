import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard a super admin felületre való belépéshez.
 * Csak super_admin role-lal rendelkező felhasználók férhetnek hozzá.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user?.roles?.includes('super_admin')) {
    return true;
  }

  // Nincs jogosultság, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
