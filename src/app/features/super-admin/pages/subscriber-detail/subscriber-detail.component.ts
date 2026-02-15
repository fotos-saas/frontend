import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { SubscriberDetail, DiscountInfo } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants';
import { PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ChargeSubscriberDialogComponent } from '../../components/charge-subscriber-dialog/charge-subscriber-dialog.component';
import { ChangePlanDialogComponent } from '../../components/change-plan-dialog/change-plan-dialog.component';
import { DiscountDialogComponent } from '../../components/discount-dialog/discount-dialog.component';
import { SubscriberDetailStateService } from './subscriber-detail-state.service';

/**
 * Előfizető részletek oldal - Super Admin felületen.
 * Partner adatok megjelenítése, műveletek és audit log.
 */
@Component({
  selector: 'app-subscriber-detail',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    ChargeSubscriberDialogComponent,
    ChangePlanDialogComponent,
    DiscountDialogComponent,
    NgClass,
    PsSelectComponent,
  ],
  providers: [SubscriberDetailStateService],
  templateUrl: './subscriber-detail.component.html',
  styleUrl: './subscriber-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriberDetailComponent implements OnInit {
  private readonly state = inject(SubscriberDetailStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly ICONS = ICONS;

  readonly auditActionOptions: PsSelectOption[] = [
    { id: 'view', label: 'Megtekintés' },
    { id: 'charge', label: 'Terhelés' },
    { id: 'change_plan', label: 'Csomagváltás' },
    { id: 'set_discount', label: 'Kedvezmény beállítás' },
    { id: 'remove_discount', label: 'Kedvezmény törlés' },
    { id: 'cancel_subscription', label: 'Törlés' },
  ];

  // --- Signal delegálások (template binding) ---
  readonly subscriber = this.state.subscriber;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly auditLogs = this.state.auditLogs;
  readonly auditLogsLoading = this.state.auditLogsLoading;
  readonly auditPage = this.state.auditPage;
  readonly auditTotalPages = this.state.auditTotalPages;
  readonly auditTotal = this.state.auditTotal;
  readonly auditSearch = this.state.auditSearch;
  readonly auditActionFilter = this.state.auditActionFilter;
  readonly auditSortDir = this.state.auditSortDir;
  readonly auditShowViews = this.state.auditShowViews;
  readonly isSubmitting = this.state.isSubmitting;

  // --- Dialógus állapotok ---
  readonly showChargeDialog = signal(false);
  readonly showChangePlanDialog = signal(false);
  readonly showCancelDialog = signal(false);
  readonly showDiscountDialog = signal(false);
  readonly showRemoveDiscountDialog = signal(false);
  readonly cancelImmediate = signal(false);

  // ==================== Életciklus ====================

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadSubscriber(id);
      this.state.loadAuditLogs(id);
    } else {
      this.state.error.set('Érvénytelen azonosító.');
      this.state.loading.set(false);
    }
  }

  // ==================== Navigáció ====================

  goBack(): void {
    this.router.navigate(['/super-admin/subscribers']);
  }

  retryLoad(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadSubscriber(id);
      this.state.loadAuditLogs(id);
    }
  }

  // ==================== Audit log delegálások ====================

  setAuditSearch(value: string): void { this.state.setAuditSearch(value); }
  setAuditActionFilter(value: string): void { this.state.setAuditActionFilter(value); }
  clearAuditSearch(): void { this.state.clearAuditSearch(); }
  toggleAuditSort(): void { this.state.toggleAuditSort(); }
  goToAuditPage(page: number): void { this.state.goToAuditPage(page); }
  toggleShowViews(): void { this.state.toggleShowViews(); }

  // ==================== Formázás delegálások ====================

  getStripeCustomerUrl(): string { return this.state.getStripeCustomerUrl(); }
  getStripeSubscriptionUrl(): string { return this.state.getStripeSubscriptionUrl(); }
  formatDate(dateStr: string | null): string { return this.state.formatDate(dateStr); }
  formatDateTime(dateStr: string | null): string { return this.state.formatDateTime(dateStr); }
  formatPrice(price: number, cycle: string): string { return this.state.formatPrice(price, cycle); }
  formatDiscountedPrice(sub: SubscriberDetail): string { return this.state.formatDiscountedPrice(sub); }
  getStatusLabel(status: string): string { return this.state.getStatusLabel(status); }
  getStatusClass(status: string): string { return this.state.getStatusClass(status); }
  getPlanClass(plan: string): string { return this.state.getPlanClass(plan); }
  getActionClass(action: string): string { return this.state.getActionClass(action); }

  // ==================== Dialógus kezelők ====================

  openChargeDialog(): void { this.showChargeDialog.set(true); }
  closeChargeDialog(): void { this.showChargeDialog.set(false); }

  onChargeComplete(): void {
    this.showChargeDialog.set(false);
    this.state.reloadAuditAfterCharge();
  }

  openChangePlanDialog(): void { this.showChangePlanDialog.set(true); }
  closeChangePlanDialog(): void { this.showChangePlanDialog.set(false); }

  onPlanChangeComplete(): void {
    this.showChangePlanDialog.set(false);
    this.state.reloadAfterPlanChange();
  }

  openCancelDialog(immediate: boolean): void {
    this.cancelImmediate.set(immediate);
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void { this.showCancelDialog.set(false); }

  onCancelConfirm(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action !== 'confirm') {
      this.closeCancelDialog();
      return;
    }
    this.state.cancelSubscription(this.cancelImmediate(), () => this.closeCancelDialog());
  }

  openDiscountDialog(): void { this.showDiscountDialog.set(true); }
  closeDiscountDialog(): void { this.showDiscountDialog.set(false); }

  onDiscountSaved(discount: DiscountInfo): void {
    this.showDiscountDialog.set(false);
    this.state.updateDiscountLocally(discount);
  }

  openRemoveDiscountDialog(): void { this.showRemoveDiscountDialog.set(true); }
  closeRemoveDiscountDialog(): void { this.showRemoveDiscountDialog.set(false); }

  onRemoveDiscountConfirm(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action !== 'confirm') {
      this.closeRemoveDiscountDialog();
      return;
    }
    this.state.removeDiscount(() => this.closeRemoveDiscountDialog());
  }
}
