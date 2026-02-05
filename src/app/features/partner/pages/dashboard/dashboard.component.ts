import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import {
  DashboardWrapperComponent,
  DASHBOARD_SERVICE,
  DASHBOARD_ROUTE_PREFIX,
  DASHBOARD_SUBTITLE,
  DASHBOARD_STAT_CARDS,
  DASHBOARD_QUICK_ACTIONS,
  StatCardConfig,
  QuickActionConfig,
} from '../../../../shared/components/dashboard';
import { PartnerService } from '../../services/partner.service';
import { AuthService } from '../../../../core/services/auth.service';

const STAT_CARDS: StatCardConfig[] = [
  { icon: 'folder-open', valueKey: 'totalProjects', label: 'Összes projekt', clickable: true },
  { icon: 'qr-code', valueKey: 'activeQrCodes', label: 'Aktív QR kód', clickable: false },
];

const QUICK_ACTIONS: QuickActionConfig[] = [
  { icon: 'plus', label: 'Új projekt létrehozása', route: '/projects/new', primary: true },
  { icon: 'folder-open', label: 'Projektek listázása', route: '/projects', primary: false },
];

/**
 * Partner Dashboard - Irányítópult statisztikákkal és gyors műveletekkel.
 */
@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [DashboardWrapperComponent],
  providers: [
    { provide: DASHBOARD_SERVICE, useExisting: PartnerService },
    { provide: DASHBOARD_ROUTE_PREFIX, useValue: '/partner' },
    {
      provide: DASHBOARD_SUBTITLE,
      useFactory: (authService: AuthService) => {
        const user = authService.getCurrentUser();
        const name = user?.name ?? '';
        return name
          ? `Üdvözöljük a Tablókirály fotós felületén, ${name}!`
          : 'Üdvözöljük a Tablókirály fotós felületén!';
      },
      deps: [AuthService],
    },
    { provide: DASHBOARD_STAT_CARDS, useValue: STAT_CARDS },
    { provide: DASHBOARD_QUICK_ACTIONS, useValue: QUICK_ACTIONS },
  ],
  template: `<app-dashboard-wrapper />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerDashboardComponent {}
