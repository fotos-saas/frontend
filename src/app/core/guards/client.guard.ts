import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

/**
 * Guard a partner ügyfél felületre való belépéshez.
 * Ellenőrzi, hogy van-e érvényes client token a sessionStorage-ban.
 *
 * SECURITY: sessionStorage XSS mitigation - tab-izolált tárolás
 */
export const clientGuard: CanActivateFn = () => {
  const router = inject(Router);

  // SECURITY: sessionStorage használata localStorage helyett
  const token = sessionStorage.getItem('client_token');
  const clientInfo = sessionStorage.getItem('client_info');

  if (token && clientInfo) {
    return true;
  }

  // Nincs érvényes token, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
