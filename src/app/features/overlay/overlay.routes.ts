import { Routes } from '@angular/router';

export const OVERLAY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./overlay.component').then(m => m.OverlayComponent),
  },
];
