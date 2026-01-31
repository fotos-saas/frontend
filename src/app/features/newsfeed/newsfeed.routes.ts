import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { GuestNameGuard } from '../../core/guards/guest-name.guard';

export const NEWSFEED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./newsfeed-list/newsfeed-list.component')
      .then(m => m.NewsfeedListComponent),
    canActivate: [AuthGuard, GuestNameGuard]
  },
  // Régi detail route redirect a listára
  {
    path: ':id',
    redirectTo: '',
    pathMatch: 'full'
  }
];

export default NEWSFEED_ROUTES;
