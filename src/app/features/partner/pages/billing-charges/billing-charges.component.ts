import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBillingService, PartnerCharge } from '../../services/partner-billing.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CreateChargeDialogComponent } from './create-charge-dialog.component';

@Component({
  selector: 'app-billing-charges',
  standalone: true,
  imports: [DecimalPipe, DatePipe, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, CreateChargeDialogComponent],
  templateUrl: './billing-charges.component.html',
  styleUrl: './billing-charges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingChargesComponent implements OnInit {
  readonly billingService = inject(PartnerBillingService);
  readonly ICONS = ICONS;

  readonly showCreateDialog = signal(false);
  readonly showCancelConfirm = signal(false);
  readonly cancelTarget = signal<PartnerCharge | null>(null);

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
    this.cancelTarget.set(charge);
    this.showCancelConfirm.set(true);
  }

  onCancelConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm' && this.cancelTarget()) {
      this.billingService.cancelCharge(this.cancelTarget()!.id);
    }
    this.showCancelConfirm.set(false);
    this.cancelTarget.set(null);
  }
}
