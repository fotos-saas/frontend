import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SuperAdminService, SubscriberDetail, AuditLogEntry, DiscountInfo } from '../../services/super-admin.service';
import { getSubscriptionStatusLabel } from '../../../../shared/constants';

/**
 * Subscriber Detail oldal state management service.
 * Adatlekerdezesek, admin muveletek, audit log kezeles.
 */
@Injectable()
export class SubscriberDetailStateService {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Subscriber adatok ---
  readonly subscriber = signal<SubscriberDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // --- Audit log ---
  readonly auditLogs = signal<AuditLogEntry[]>([]);
  readonly auditLogsLoading = signal(false);
  readonly auditPage = signal(1);
  readonly auditTotalPages = signal(1);
  readonly auditTotal = signal(0);

  // --- Audit log filterek ---
  readonly auditSearch = signal('');
  readonly auditActionFilter = signal('');
  readonly auditSortDir = signal<'asc' | 'desc'>('desc');
  readonly auditShowViews = signal(false);

  // --- Muveleti allapot ---
  readonly isSubmitting = signal(false);

  // ==================== Adatlekeresek ====================

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

  // ==================== Audit log filterek ====================

  setAuditSearch(value: string): void {
    this.auditSearch.set(value);
    this.auditPage.set(1);
    this.reloadAuditLogs();
  }

  setAuditActionFilter(value: string): void {
    this.auditActionFilter.set(value);
    this.auditPage.set(1);
    this.reloadAuditLogs();
  }

  clearAuditSearch(): void {
    this.setAuditSearch('');
  }

  toggleAuditSort(): void {
    this.auditSortDir.set(this.auditSortDir() === 'desc' ? 'asc' : 'desc');
    this.auditPage.set(1);
    this.reloadAuditLogs();
  }

  goToAuditPage(page: number): void {
    if (page < 1 || page > this.auditTotalPages()) return;
    this.auditPage.set(page);
    this.reloadAuditLogs();
  }

  toggleShowViews(): void {
    this.auditShowViews.update(v => !v);
    this.auditPage.set(1);
    this.reloadAuditLogs();
  }

  // ==================== Admin muveletek ====================

  cancelSubscription(immediate: boolean, onComplete: () => void): void {
    const sub = this.subscriber();
    if (!sub) return;

    this.isSubmitting.set(true);

    this.service.cancelSubscription(sub.id, immediate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          onComplete();
          this.loadSubscriber(sub.id);
          this.loadAuditLogs(sub.id);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }

  removeDiscount(onComplete: () => void): void {
    const sub = this.subscriber();
    if (!sub) return;

    this.isSubmitting.set(true);

    this.service.removeDiscount(sub.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          onComplete();
          this.subscriber.set({ ...sub, activeDiscount: null });
          this.loadAuditLogs(sub.id);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }

  updateDiscountLocally(discount: DiscountInfo): void {
    const sub = this.subscriber();
    if (!sub) return;
    this.subscriber.set({ ...sub, activeDiscount: discount });
    this.loadAuditLogs(sub.id);
  }

  reloadAfterPlanChange(): void {
    const sub = this.subscriber();
    if (sub) {
      this.loadSubscriber(sub.id);
      this.loadAuditLogs(sub.id);
    }
  }

  reloadAuditAfterCharge(): void {
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }

  // ==================== Stripe URL-ek ====================

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

  // ==================== Formazasok ====================

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

  formatDiscountedPrice(sub: SubscriberDetail): string {
    if (!sub.activeDiscount) return '';
    const discountedPrice = Math.round(sub.price * (1 - sub.activeDiscount.percent / 100));
    const formatted = new Intl.NumberFormat('hu-HU').format(discountedPrice);
    const suffix = sub.billingCycle === 'yearly' ? '/év' : '/hó';
    return `${formatted} Ft${suffix}`;
  }

  // ==================== CSS osztalyok ====================

  getStatusLabel(status: string): string {
    return getSubscriptionStatusLabel(status, true);
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

  // ==================== Privat segitok ====================

  private reloadAuditLogs(): void {
    const sub = this.subscriber();
    if (sub) {
      this.loadAuditLogs(sub.id);
    }
  }
}
