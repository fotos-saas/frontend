import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { GuestNameGuard } from '../../core/guards/guest-name.guard';

/**
 * Photo Selection Routes
 *
 * Lazy-loaded routes a tabló fotóválasztási workflow-hoz.
 * Guard-ok: AuthGuard (bejelentkezve), GuestNameGuard (onboarding kész)
 */
export const PHOTO_SELECTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./photo-selection.component')
      .then(m => m.PhotoSelectionComponent),
    canActivate: [AuthGuard, GuestNameGuard],
  },
];
