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
} from '../../../../shared/components/dashboard';
import { MarketerService } from '../../services/marketer.service';

const STAT_CARDS: StatCardConfig[] = [
  { icon: 'folder-open', valueKey: 'totalProjects', label: 'Összes projekt', clickable: true },
  { icon: 'qr-code', valueKey: 'activeQrCodes', label: 'Aktív QR kód', clickable: false },
];

const QUICK_ACTIONS: QuickActionConfig[] = [
  { icon: 'plus', label: 'Új projekt létrehozása', route: '/projects/new', primary: true },
  { icon: 'folder-open', label: 'Projektek listázása', route: '/projects', primary: false },
];

/**
 * Marketer Dashboard - Irányítópult statisztikákkal és gyors műveletekkel.
 */
@Component({
  selector: 'app-marketer-dashboard',
  standalone: true,
  imports: [DashboardWrapperComponent],
  providers: [
    { provide: DASHBOARD_SERVICE, useExisting: MarketerService },
    { provide: DASHBOARD_ROUTE_PREFIX, useValue: '/marketer' },
    { provide: DASHBOARD_SUBTITLE, useValue: 'Üdvözöljük a Tablókirály marketinges felületén!' },
    { provide: DASHBOARD_STAT_CARDS, useValue: STAT_CARDS },
    { provide: DASHBOARD_QUICK_ACTIONS, useValue: QUICK_ACTIONS },
  ],
  template: `<app-dashboard-wrapper />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
