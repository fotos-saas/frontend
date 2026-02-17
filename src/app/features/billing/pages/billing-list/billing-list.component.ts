import { Component, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { BillingService } from '../../services/billing.service';
import { BillingStatusBadgeComponent } from '../../components/billing-status-badge.component';
import { BillingSummaryCardComponent } from '../../components/billing-summary-card.component';
import { BillingChargeStatus, SERVICE_TYPE_ICONS } from '../../models/billing.models';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    LucideAngularModule,
    BillingStatusBadgeComponent,
    BillingSummaryCardComponent,
    TableHeaderComponent,
  ],
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingListComponent implements OnInit {
  readonly billingService = inject(BillingService);
  readonly ICONS = ICONS;
  readonly SERVICE_TYPE_ICONS = SERVICE_TYPE_ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'type', label: 'Típus', width: '140px' },
    { key: 'description', label: 'Leírás' },
    { key: 'amount', label: 'Összeg', width: '120px', align: 'right' },
    { key: 'status', label: 'Státusz', width: '120px', align: 'center' },
    { key: 'actions', label: 'Művelet', width: '130px', align: 'center' },
    { key: 'date', label: 'Dátum', width: '120px', align: 'right' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly filters: { label: string; value: BillingChargeStatus | 'all' }[] = [
    { label: 'Összes', value: 'all' },
    { label: 'Fizetésre vár', value: 'pending' },
    { label: 'Kifizetve', value: 'paid' },
    { label: 'Törölve', value: 'cancelled' },
  ];

  ngOnInit(): void {
    this.billingService.handlePaymentReturn();
    this.billingService.loadCharges();
    this.billingService.loadSummary();
  }

  startPayment(chargeId: number): void {
    this.billingService.startPayment(chargeId);
  }

  downloadInvoice(url: string): void {
    this.billingService.downloadInvoice(url);
  }

  setFilter(value: BillingChargeStatus | 'all'): void {
    this.billingService.activeFilter.set(value);
  }

}
