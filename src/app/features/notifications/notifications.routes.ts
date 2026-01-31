import { Routes } from '@angular/router';
import { NotificationsListComponent } from './notifications-list/notifications-list.component';

/**
 * Notifications Routes
 *
 * /notifications - Értesítések lista
 */
export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    component: NotificationsListComponent
  }
];
