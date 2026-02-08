import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
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
  ],
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingListComponent implements OnInit {
  readonly billingService = inject(BillingService);
  readonly ICONS = ICONS;
  readonly SERVICE_TYPE_ICONS = SERVICE_TYPE_ICONS;

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
