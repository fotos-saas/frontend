import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

/**
 * Guard a partner ügyfél felületre való belépéshez.
 * Ellenőrzi, hogy van-e érvényes client token a localStorage-ban.
 */
export const clientGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('client_token');
  const clientInfo = localStorage.getItem('client_info');

  if (token && clientInfo) {
    return true;
  }

  // Nincs érvényes token, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
