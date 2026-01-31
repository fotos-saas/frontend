import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { GuestNameGuard } from '../../core/guards/guest-name.guard';

export const FORUM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./forum-list/forum-list.component')
      .then(m => m.ForumListComponent),
    canActivate: [AuthGuard, GuestNameGuard]
  },
  {
    path: ':slug',
    loadComponent: () => import('./forum-detail/forum-detail.component')
      .then(m => m.ForumDetailComponent),
    canActivate: [AuthGuard, GuestNameGuard]
  }
];

export default FORUM_ROUTES;
