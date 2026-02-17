import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { TableHeaderComponent, TableColumn } from '../../../../shared/components/table-header';
import { PartnerBillingService, PartnerCharge } from '../../services/partner-billing.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CreateChargeDialogComponent } from './create-charge-dialog.component';
import { STATUS_LABELS, STATUS_COLORS } from '../../../billing/models/billing.models';

@Component({
  selector: 'app-billing-charges',
  standalone: true,
  imports: [DecimalPipe, DatePipe, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, CreateChargeDialogComponent, TableHeaderComponent],
  templateUrl: './billing-charges.component.html',
  styleUrl: './billing-charges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingChargesComponent implements OnInit {
  readonly billingService = inject(PartnerBillingService);
  readonly ICONS = ICONS;

  readonly tableCols: TableColumn[] = [
    { key: 'person', label: 'Diák' },
    { key: 'service', label: 'Szolgáltatás' },
    { key: 'amount', label: 'Összeg', width: '120px', align: 'right' },
    { key: 'status', label: 'Státusz', width: '110px', align: 'center' },
    { key: 'date', label: 'Dátum', width: '110px', align: 'center' },
    { key: 'actions', label: 'Műveletek', width: '100px', align: 'center' },
  ];
  readonly gridTemplate = computed(() => this.tableCols.map(c => c.width ?? '1fr').join(' '));

  readonly showCreateDialog = signal(false);
  readonly showCancelConfirm = signal(false);
  readonly cancelTarget = signal<PartnerCharge | null>(null);

  readonly filters = [
    { label: 'Összes', value: 'all' },
    { label: 'Fizetésre vár', value: 'pending' },
    { label: 'Kifizetve', value: 'paid' },
    { label: 'Törölve', value: 'cancelled' },
  ];

  readonly STATUS_LABELS: Record<string, string> = STATUS_LABELS;
  readonly STATUS_COLORS: Record<string, string> = STATUS_COLORS;

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
