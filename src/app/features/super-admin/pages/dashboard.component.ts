import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  DashboardWrapperComponent,
  DASHBOARD_SERVICE,
  DASHBOARD_ROUTE_PREFIX,
  DASHBOARD_SUBTITLE,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_QUICK_ACTIONS,
  StatCardConfig,
  QuickActionConfig,
} from '../../../shared/components/dashboard';
import { SuperAdminService } from '../services/super-admin.service';

const STAT_CARDS: StatCardConfig[] = [
  { icon: 'users', valueKey: 'totalPartners', label: 'Partnerek', clickable: true },
  { icon: 'folder-open', valueKey: 'totalProjects', label: 'Projektek', clickable: false },
];

const QUICK_ACTIONS: QuickActionConfig[] = [
  { icon: 'users', label: 'Partnerek kezelése', route: '/partners', primary: true },
  { icon: 'settings', label: 'Beállítások', route: '/settings', primary: false },
];

/**
 * Super Admin Dashboard - Irányítópult statisztikákkal és gyors műveletekkel.
 */
@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [DashboardWrapperComponent],
  providers: [
    { provide: DASHBOARD_SERVICE, useExisting: SuperAdminService },
    { provide: DASHBOARD_ROUTE_PREFIX, useValue: '/super-admin' },
    { provide: DASHBOARD_SUBTITLE, useValue: 'Rendszer adminisztrációs felület' },
    { provide: DASHBOARD_STAT_CARDS, useValue: STAT_CARDS },
    { provide: DASHBOARD_QUICK_ACTIONS, useValue: QUICK_ACTIONS },
  ],
  template: `<app-dashboard-wrapper />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminDashboardComponent {}
