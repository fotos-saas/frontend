import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SuperAdminService, SubscriberDetail, AuditLogEntry, DiscountInfo } from '../services/super-admin.service';
import { ICONS } from '../../../shared/constants/icons.constants';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ChargeSubscriberDialogComponent } from '../components/charge-subscriber-dialog.component';
import { ChangePlanDialogComponent } from '../components/change-plan-dialog.component';
import { DiscountDialogComponent } from '../components/discount-dialog.component';

/**
 * Előfizető részletek oldal - Super Admin felületen.
 * Partner adatok megjelenítése, műveletek és audit log.
 */
@Component({
  selector: 'app-subscriber-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    ChargeSubscriberDialogComponent,
    ChangePlanDialogComponent,
    DiscountDialogComponent
  ],
  templateUrl: './subscriber-detail.component.html',
  styleUrl: './subscriber-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriberDetailComponent implements OnInit {
  private readonly service = inject(SuperAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // Subscriber adatok
  subscriber = signal<SubscriberDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Audit logok
  auditLogs = signal<AuditLogEntry[]>([]);
  auditLogsLoading = signal(false);
  auditPage = signal(1);
  auditTotalPages = signal(1);
  auditTotal = signal(0);

  // Audit log filter state
  auditSearch = signal('');
  auditActionFilter = signal('');
  auditSortDir = signal<'asc' | 'desc'>('desc');
  auditShowViews = signal(false); // Megtekintések alapból rejtve

  // Dialógusok
  showChargeDialog = signal(false);
  showChangePlanDialog = signal(false);
  showCancelDialog = signal(false);
  showDiscountDialog = signal(false);
  showRemoveDiscountDialog = signal(false);
  cancelImmediate = signal(false);
  isSubmitting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSubscriber(id);
      this.loadAuditLogs(id);
    } else {
      this.error.set('Érvénytelen azonosító.');
      this.loading.set(false);
    }
  }

  loadSubscriber(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getSubscriber(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.subscriber.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Hiba történt az adatok betöltésekor.');
          this.loading.set(false);
        }
      });
  }

  loadAuditLogs(id: number): void {
    this.auditLogsLoading.set(true);

    this.service.getAuditLogs(id, {
      page: this.auditPage(),
      per_page: 10,
      search: this.auditSearch() || undefined,
      action: this.auditActionFilter() || undefined,
      sort_dir: this.auditSortDir(),
      show_views: this.auditShowViews()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.auditLogs.set(response.data);
          this.auditTotalPages.set(response.last_page);
          this.auditTotal.set(response.total);
          this.auditLogsLoading.set(false);
        },
        error: () => {
          this.auditLogsLoading.set(false);
        }
      });
  }

  // Audit log filter kezelők
  setAuditSearch(value: string): void {
    this.auditSearch.set(value);
    this.auditPage.set(1); // Reset to first page on search
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  setAuditActionFilter(value: string): void {
    this.auditActionFilter.set(value);
    this.auditPage.set(1); // Reset to first page on filter
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  clearAuditSearch(): void {
    this.setAuditSearch('');
  }

  toggleAuditSort(): void {
    this.auditSortDir.set(this.auditSortDir() === 'desc' ? 'asc' : 'desc');
    this.auditPage.set(1); // Reset to first page on sort change
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  goToAuditPage(page: number): void {
    if (page < 1 || page > this.auditTotalPages()) return;
    this.auditPage.set(page);
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  toggleShowViews(): void {
    this.auditShowViews.update(v => !v);
    this.auditPage.set(1); // Reset to first page
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  // Stripe linkek
  getStripeCustomerUrl(): string {
    const sub = this.subscriber();
    if (!sub?.stripeCustomerId) return '';
    return `https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`;
  }

  getStripeSubscriptionUrl(): string {
    const sub = this.subscriber();
    if (!sub?.stripeSubscriptionId) return '';
    return `https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`;
  }

  // Formázások
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(price: number, cycle: string): string {
    const formatted = new Intl.NumberFormat('hu-HU').format(price);
    const suffix = cycle === 'yearly' ? '/év' : '/hó';
    return `${formatted} Ft${suffix}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Aktív',
      trial: 'Próba',
      paused: 'Szünetel',
      canceling: 'Lemondva',
      canceled: 'Törölve',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'status-badge--green',
      trial: 'status-badge--blue',
      paused: 'status-badge--yellow',
      canceling: 'status-badge--red',
      canceled: 'status-badge--gray',
    };
    return classes[status] || '';
  }

  getPlanClass(plan: string): string {
    const classes: Record<string, string> = {
      alap: 'plan-badge--gray',
      iskola: 'plan-badge--blue',
      studio: 'plan-badge--purple',
    };
    return classes[plan] || '';
  }

  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      view: 'audit-badge--view',
      charge: 'audit-badge--charge',
      change_plan: 'audit-badge--change_plan',
      set_discount: 'audit-badge--discount',
      remove_discount: 'audit-badge--discount-remove',
      cancel_subscription: 'audit-badge--cancel',
    };
    return classes[action] || 'audit-badge--view';
  }

  // Dialógus események
  openChargeDialog(): void {
    this.showChargeDialog.set(true);
  }

  closeChargeDialog(): void {
    this.showChargeDialog.set(false);
  }

  onChargeComplete(): void {
    this.showChargeDialog.set(false);
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  openChangePlanDialog(): void {
    this.showChangePlanDialog.set(true);
  }

  closeChangePlanDialog(): void {
    this.showChangePlanDialog.set(false);
  }

  onPlanChangeComplete(): void {
    this.showChangePlanDialog.set(false);
    const sub = this.subscriber();
    if (sub) {
      this.loadSubscriber(sub.id);
      this.loadAuditLogs(sub.id);
    }
  }

  openCancelDialog(immediate: boolean): void {
    this.cancelImmediate.set(immediate);
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    this.showCancelDialog.set(false);
  }

  onCancelConfirm(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action !== 'confirm') {
      this.closeCancelDialog();
      return;
    }

    const sub = this.subscriber();
    if (!sub) return;

    this.isSubmitting.set(true);

    this.service.cancelSubscription(sub.id, this.cancelImmediate())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeCancelDialog();
          this.loadSubscriber(sub.id);
          this.loadAuditLogs(sub.id);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/super-admin/subscribers']);
  }

  retryLoad(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSubscriber(id);
      this.loadAuditLogs(id);
    }
  }

  // Kedvezmény dialógus események
  openDiscountDialog(): void {
    this.showDiscountDialog.set(true);
  }

  closeDiscountDialog(): void {
    this.showDiscountDialog.set(false);
  }

  onDiscountSaved(discount: DiscountInfo): void {
    this.showDiscountDialog.set(false);
    const sub = this.subscriber();
    if (sub) {
      // Frissítjük a kedvezmény adatokat
      this.subscriber.set({
        ...sub,
        activeDiscount: discount
      });
      this.loadAuditLogs(sub.id);
    }
  }

  openRemoveDiscountDialog(): void {
    this.showRemoveDiscountDialog.set(true);
  }

  closeRemoveDiscountDialog(): void {
    this.showRemoveDiscountDialog.set(false);
  }

  onRemoveDiscountConfirm(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action !== 'confirm') {
      this.closeRemoveDiscountDialog();
      return;
    }

    const sub = this.subscriber();
    if (!sub) return;

    this.isSubmitting.set(true);

    this.service.removeDiscount(sub.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeRemoveDiscountDialog();
          // Frissítjük a subscriber adatokat
          this.subscriber.set({
            ...sub,
            activeDiscount: null
          });
          this.loadAuditLogs(sub.id);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }

  // Kedvezmény formázás
  formatDiscountedPrice(sub: SubscriberDetail): string {
    if (!sub.activeDiscount) return '';
    const discountedPrice = Math.round(sub.price * (1 - sub.activeDiscount.percent / 100));
    const formatted = new Intl.NumberFormat('hu-HU').format(discountedPrice);
    const suffix = sub.billingCycle === 'yearly' ? '/év' : '/hó';
    return `${formatted} Ft${suffix}`;
  }
}
