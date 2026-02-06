import { inject } from '@angular/core';
import { Router, type CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Csapattag role → URL prefix mapping
 */
const TEAM_MEMBER_URL_PREFIX: Record<string, string> = {
  designer: '/designer',
  marketer: '/marketer',
  printer: '/printer',
  assistant: '/assistant',
};

/**
 * Guard a fotós/partner felületre való belépéshez.
 * Partner tulajdonosok és csapattagok (designer, marketer, printer, assistant) férhetnek hozzá.
 *
 * Ha csapattag /partner/* URL-re megy, átirányítja a saját URL prefixére.
 * Ha a felhasználónak nincs Partner rekordja (árva user), kijelentkezteti.
 */
export const partnerGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  // Partner tulajdonos VAGY csapattag role-ok
  const partnerRoles = ['partner', 'designer', 'marketer', 'printer', 'assistant'];
  const hasAccess = partnerRoles.some(role => user?.roles?.includes(role));

  if (!hasAccess) {
    router.navigate(['/login']);
    return false;
  }

  // Ha csapattag /partner/* URL-re próbál menni, irányítsuk át a saját prefixére
  const currentUrl = state.url;
  if (currentUrl.startsWith('/partner/')) {
    // Keressük meg a csapattag role-ját
    for (const [role, prefix] of Object.entries(TEAM_MEMBER_URL_PREFIX)) {
      if (user?.roles?.includes(role)) {
        // Cseréljük le /partner/ -> /designer/ (vagy más)
        const newUrl = currentUrl.replace('/partner/', `${prefix}/`);
        router.navigateByUrl(newUrl);
        return false;
      }
    }
  }

  return true;
};
