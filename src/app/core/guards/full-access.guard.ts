import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route Guard: csak teljes jogú felhasználók számára.
 */
export const fullAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasFullAccess()) {
    router.navigate(['/samples']);
    return false;
  }

  return true;
};
