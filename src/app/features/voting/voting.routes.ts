import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { GuestNameGuard } from '../../core/guards/guest-name.guard';

export const VOTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./voting-list/voting-list.component')
      .then(m => m.VotingListComponent),
    canActivate: [AuthGuard, GuestNameGuard]
  },
  {
    path: ':id/results',
    loadComponent: () => import('./voting-results/voting-results.component')
      .then(m => m.VotingResultsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./voting-detail/voting-detail.component')
      .then(m => m.VotingDetailComponent),
    canActivate: [AuthGuard, GuestNameGuard]
  }
];

export default VOTING_ROUTES;
