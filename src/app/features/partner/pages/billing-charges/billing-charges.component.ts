import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBillingService, PartnerCharge } from '../../services/partner-billing.service';
import { CreateChargeDialogComponent } from './create-charge-dialog.component';

@Component({
  selector: 'app-billing-charges',
  standalone: true,
  imports: [DecimalPipe, DatePipe, LucideAngularModule, CreateChargeDialogComponent],
  templateUrl: './billing-charges.component.html',
  styleUrl: './billing-charges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingChargesComponent implements OnInit {
  readonly billingService = inject(PartnerBillingService);
  readonly ICONS = ICONS;

  readonly showCreateDialog = signal(false);

  readonly filters = [
    { label: 'Összes', value: 'all' },
    { label: 'Fizetésre vár', value: 'pending' },
    { label: 'Kifizetve', value: 'paid' },
    { label: 'Törölve', value: 'cancelled' },
  ];

  readonly STATUS_LABELS: Record<string, string> = {
    pending: 'Fizetésre vár',
    paid: 'Kifizetve',
    cancelled: 'Törölve',
    refunded: 'Visszatérítve',
  };

  readonly STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    paid: '#22c55e',
    cancelled: '#94a3b8',
    refunded: '#8b5cf6',
  };

  ngOnInit(): void {
    this.billingService.loadCharges();
    this.billingService.loadSummary();
  }

  setFilter(value: string): void {
    this.billingService.activeFilter.set(value);
  }

  openCreate(): void {
    this.showCreateDialog.set(true);
  }

  closeCreate(): void {
    this.showCreateDialog.set(false);
  }

  onChargeCreated(): void {
    this.showCreateDialog.set(false);
    this.billingService.loadSummary();
  }

  cancelCharge(charge: PartnerCharge): void {
    this.billingService.cancelCharge(charge.id);
  }
}
