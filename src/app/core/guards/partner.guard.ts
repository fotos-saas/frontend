import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard a fotós/partner felületre való belépéshez.
 * Partner tulajdonosok és csapattagok (designer, marketer, printer, assistant) férhetnek hozzá.
 */
export const partnerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Próbáljuk inicializálni a partner session-t (page reload esetén)
  const user = authService.getCurrentUser();

  // Partner tulajdonos VAGY csapattag role-ok
  const partnerRoles = ['partner', 'designer', 'marketer', 'printer', 'assistant'];
  const hasAccess = partnerRoles.some(role => user?.roles?.includes(role));

  if (hasAccess) {
    return true;
  }

  // Nincs jogosultság, átirányítás login oldalra
  router.navigate(['/login']);
  return false;
};
