import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard a nyomdai felületre való belépéshez.
 * Csak print_shop role-lal rendelkező felhasználók férhetnek hozzá.
 */
export const printShopGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user?.roles?.includes('print_shop')) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
