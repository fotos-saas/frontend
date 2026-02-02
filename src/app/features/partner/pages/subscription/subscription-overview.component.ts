import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, SubscriptionInfo } from '../../services/subscription.service';
import { StorageService, StorageUsage } from '../../services/storage.service';
import { PlansService } from '../../../../shared/services/plans.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="subscription-overview page-card">
      <h1 class="page-title">
        <lucide-icon [name]="ICONS.PACKAGE" [size]="24" />
        Előfizetés áttekintés
      </h1>

      @if (loading()) {
        <div class="loading-state">
          <div class="skeleton-card"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
      } @else if (subscription()) {
        <!-- Költség összesítő banner -->
        <div class="billing-summary">
          <div class="billing-main">
            <span class="billing-label">Havi költség</span>
            <span class="billing-amount">{{ formatPrice(totalMonthlyCost()) }}</span>
          </div>
          @if (hasExtras()) {
            <div class="billing-breakdown">
              <div class="breakdown-item">
                <span>{{ subscription()!.plan_name }} csomag</span>
                <span>{{ formatPrice(basePlanPrice()) }}</span>
              </div>
              @if (storageUsage()?.additional_gb && storageUsage()!.additional_gb > 0) {
                <div class="breakdown-item extra">
                  <span>+{{ storageUsage()!.additional_gb }} GB extra tárhely</span>
                  <span>+{{ formatPrice(extraStoragePrice()) }}</span>
                </div>
              }
              @if (subscription()!.has_addons && subscription()!.active_addons.length > 0) {
                @for (addon of subscription()!.active_addons; track addon) {
                  <div class="breakdown-item extra">
                    <span>{{ getAddonName(addon) }}</span>
                    <span>+{{ formatPrice(getAddonPrice(addon)) }}</span>
                  </div>
                }
              }
            </div>
          }
          <div class="billing-cycle-info">
            <lucide-icon [name]="ICONS.CALENDAR" [size]="14" />
            {{ subscription()!.billing_cycle === 'yearly' ? 'Éves számlázás' : 'Havi számlázás' }}
            @if (subscription()!.current_period_end) {
              · Következő fizetés: {{ formatDate(subscription()!.current_period_end!) }}
            }
          </div>
        </div>

        <div class="subscription-grid">
          <!-- Jelenlegi csomag kártya -->
          <div class="info-card plan-card">
            <div class="card-header">
              <h2 class="card-title">Jelenlegi csomag</h2>
              <span
                class="status-badge"
                [class]="'status-badge--' + subscription()!.status"
              >
                {{ getStatusLabel(subscription()!.status) }}
              </span>
            </div>

            <div class="plan-info">
              <span class="plan-name">{{ subscription()!.plan_name }}</span>
            </div>

            @if (subscription()!.is_modified) {
              <div class="modification-badges">
                @if (subscription()!.has_extra_storage) {
                  <div class="mod-badge mod-badge--storage">
                    <lucide-icon [name]="ICONS.HARD_DRIVE" [size]="14" />
                    +{{ subscription()!.extra_storage_gb }} GB
                  </div>
                }
                @if (subscription()!.has_addons) {
                  <div class="mod-badge mod-badge--addon">
                    <lucide-icon [name]="ICONS.PUZZLE" [size]="14" />
                    {{ subscription()!.active_addons.length }} kiegészítő
                  </div>
                }
              </div>
            }

            <div class="card-actions">
              <button
                class="btn btn--primary"
                (click)="openPortal()"
                [disabled]="portalLoading()"
              >
                @if (portalLoading()) {
                  <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
                } @else {
                  <lucide-icon [name]="ICONS.EXTERNAL_LINK" [size]="18" />
                }
                Előfizetés kezelése
              </button>
            </div>
          </div>

          <!-- Tárhely kártya -->
          <div class="info-card storage-card">
            <div class="card-header">
              <h2 class="card-title">Tárhely</h2>
              <a routerLink="/partner/subscription/addons" class="card-link">
                Bővítés
                <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
              </a>
            </div>

            <div class="storage-info">
              <div class="storage-bar">
                <div
                  class="storage-used"
                  [style.width.%]="storagePercent()"
                  [class.storage-used--warning]="storagePercent() > 80"
                  [class.storage-used--danger]="storagePercent() > 95"
                ></div>
              </div>
              <div class="storage-text">
                <span class="storage-current">{{ formatStorage(storageUsage()?.used_gb ?? 0) }} GB</span>
                <span class="storage-separator">/</span>
                <span class="storage-limit">{{ formatStorage(storageUsage()?.total_limit_gb ?? subscription()!.limits.storage_gb) }} GB</span>
              </div>
              @if (storageUsage()?.additional_gb) {
                <div class="storage-detail">
                  <span class="detail-label">Alap:</span>
                  <span>{{ storageUsage()!.plan_limit_gb }} GB</span>
                  <span class="detail-plus">+</span>
                  <span class="detail-extra">{{ storageUsage()!.additional_gb }} GB extra</span>
                </div>
              }
            </div>
          </div>

          <!-- Funkciók kártya -->
          <div class="info-card features-card">
            <div class="card-header">
              <h2 class="card-title">Funkciók</h2>
              <a routerLink="/partner/subscription/addons" class="card-link">
                Kiegészítők
                <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
              </a>
            </div>

            <div class="features-list">
              @for (feature of subscription()!.features; track feature) {
                <div class="feature-item">
                  <lucide-icon [name]="ICONS.CHECK" [size]="16" class="feature-check" />
                  <span>{{ feature }}</span>
                </div>
              }
            </div>

            @if (subscription()!.has_addons && subscription()!.active_addons.length > 0) {
              <div class="addons-section">
                <h3 class="addons-title">Aktív kiegészítők</h3>
                @for (addon of subscription()!.active_addons; track addon) {
                  <div class="addon-item">
                    <lucide-icon [name]="ICONS.PLUS_CIRCLE" [size]="16" class="addon-icon" />
                    <span>{{ getAddonName(addon) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="error-state">
          <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="48" />
          <p>Nem sikerült betölteni az előfizetés adatokat.</p>
          <button class="btn btn--secondary" (click)="loadData()">
            <lucide-icon [name]="ICONS.REFRESH" [size]="18" />
            Újrapróbálás
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .subscription-overview {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 24px;
    }

    /* Billing Summary */
    .billing-summary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      color: white;
    }

    .billing-main {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
    }

    .billing-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .billing-amount {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .billing-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 12px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .breakdown-item.extra {
      color: #93c5fd;
    }

    .billing-cycle-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      opacity: 0.8;
    }

    /* Grid */
    .subscription-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 768px) {
      .subscription-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Info Card */
    .info-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .card-link {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .card-link:hover {
      text-decoration: underline;
    }

    /* Plan Card */
    .plan-info {
      margin-bottom: 12px;
    }

    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge--active { background: #dcfce7; color: #16a34a; }
    .status-badge--trial { background: #dbeafe; color: #2563eb; }
    .status-badge--paused { background: #fef3c7; color: #d97706; }
    .status-badge--canceling,
    .status-badge--canceled { background: #fee2e2; color: #dc2626; }
    .status-badge--pending { background: #f1f5f9; color: #64748b; }

    .modification-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .mod-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .mod-badge--storage {
      background: #ede9fe;
      color: #7c3aed;
    }

    .mod-badge--addon {
      background: #fef3c7;
      color: #d97706;
    }

    .card-actions {
      margin-top: 8px;
    }

    /* Storage Card */
    .storage-info {
      margin-bottom: 8px;
    }

    .storage-bar {
      height: 10px;
      background: #e2e8f0;
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .storage-used {
      height: 100%;
      background: #3b82f6;
      border-radius: 5px;
      transition: width 0.3s ease;
    }

    .storage-used--warning { background: #f59e0b; }
    .storage-used--danger { background: #ef4444; }

    .storage-text {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 0.9375rem;
      margin-bottom: 8px;
    }

    .storage-current {
      font-weight: 700;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .storage-separator { color: #94a3b8; }
    .storage-limit { color: #64748b; }

    .storage-detail {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: #64748b;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .detail-label { font-weight: 500; }
    .detail-plus { color: #94a3b8; }
    .detail-extra { color: #7c3aed; font-weight: 500; }

    /* Features Card */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-size: 0.875rem;
    }

    .feature-check { color: #22c55e; }

    .addons-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .addons-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin: 0 0 8px 0;
    }

    .addon-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #7c3aed;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .addon-icon { color: #7c3aed; }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--primary {
      background: #3b82f6;
      color: white;
    }

    .btn--primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn--secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn--secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    /* Loading & Error */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .skeleton-card {
      height: 140px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 16px;
    }

    .skeleton-row {
      height: 160px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      color: #64748b;
      text-align: center;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-card,
      .skeleton-row,
      .spin {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionOverviewComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly storageService = inject(StorageService);
  private readonly plansService = inject(PlansService);
  protected readonly ICONS = ICONS;

  subscription = signal<SubscriptionInfo | null>(null);
  storageUsage = signal<StorageUsage | null>(null);
  planPrices = signal<Record<string, { monthly: number; yearly: number }>>({});
  loading = signal(true);
  portalLoading = signal(false);

  // Computed values
  storagePercent = computed(() => this.storageUsage()?.usage_percent ?? 0);

  hasExtras = computed(() => {
    const sub = this.subscription();
    const storage = this.storageUsage();
    // Ellenőrizzük a storage additional_gb-t is, mert lehet hogy a backend flag nincs szinkronban
    const hasExtraStorage = sub?.has_extra_storage || (storage?.additional_gb && storage.additional_gb > 0);
    return hasExtraStorage || (sub?.has_addons && sub.active_addons.length > 0);
  });

  basePlanPrice = computed(() => {
    const sub = this.subscription();
    if (!sub) return 0;

    // Backend-ből jövő árak (prioritás)
    if (sub.prices) {
      const price = sub.billing_cycle === 'yearly' ? sub.prices.plan_yearly : sub.prices.plan_monthly;
      return sub.billing_cycle === 'yearly' ? Math.round(price / 12) : price;
    }

    // Fallback - PlansService-ből
    const prices = this.planPrices()[sub.plan];
    if (prices) {
      return sub.billing_cycle === 'yearly' ? Math.round(prices.yearly / 12) : prices.monthly;
    }

    return 0;
  });

  extraStoragePrice = computed(() => {
    const usage = this.storageUsage();
    const sub = this.subscription();
    if (!usage || !sub || !usage.additional_gb) return 0;

    // Backend-ből jövő árak (prioritás)
    let pricePerGb: number;
    if (sub.prices) {
      pricePerGb = sub.billing_cycle === 'yearly'
        ? Math.round(sub.prices.storage_yearly / 12)
        : sub.prices.storage_monthly;
    } else {
      // Fallback a storage service-ből
      pricePerGb = sub.billing_cycle === 'yearly'
        ? Math.round(usage.addon_price_yearly / 12)
        : usage.addon_price_monthly;
    }

    return usage.additional_gb * pricePerGb;
  });

  totalMonthlyCost = computed(() => {
    const sub = this.subscription();
    // Ha van Stripe-ból költség, azt használjuk (ez a pontos)
    if (sub?.monthly_cost) {
      return sub.monthly_cost;
    }

    // Fallback: számoljuk manuálisan (lehet pontatlan)
    let total = this.basePlanPrice();
    total += this.extraStoragePrice();

    if (sub?.has_addons) {
      for (const addon of sub.active_addons) {
        total += this.getAddonPrice(addon);
      }
    }

    return total;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    forkJoin({
      subscription: this.subscriptionService.getSubscription(),
      storage: this.storageService.getUsage(),
      prices: this.plansService.getPlanPrices(),
    }).subscribe({
      next: ({ subscription, storage, prices }) => {
        this.subscription.set(subscription);
        this.storageUsage.set(storage);
        this.planPrices.set(prices);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.loading.set(false);
      }
    });
  }

  openPortal(): void {
    this.portalLoading.set(true);
    this.subscriptionService.openPortal().subscribe({
      next: (res) => {
        window.open(res.portal_url, '_blank');
        this.portalLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to open portal:', err);
        this.portalLoading.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Aktív',
      trial: 'Próbaidőszak',
      paused: 'Szüneteltetve',
      canceling: 'Lemondva',
      canceled: 'Lejárt',
      pending: 'Függőben'
    };
    return labels[status] ?? status;
  }

  formatStorage(gb: number): string {
    return gb.toFixed(1);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getAddonName(addon: string): string {
    const names: Record<string, string> = {
      community_pack: 'Közösségi csomag',
    };
    return names[addon] ?? addon;
  }

  getAddonPrice(addon: string): number {
    const sub = this.subscription();
    if (!sub) return 0;

    // Backend-ből jövő árak (prioritás)
    if (sub.prices?.addons?.[addon]) {
      const addonPrices = sub.prices.addons[addon];
      return sub.billing_cycle === 'yearly'
        ? Math.round(addonPrices.yearly / 12)
        : addonPrices.monthly;
    }

    // Fallback
    const fallbackPrices: Record<string, { monthly: number; yearly: number }> = {
      community_pack: { monthly: 1490, yearly: 14900 },
    };

    const addonPrices = fallbackPrices[addon];
    if (!addonPrices) return 0;

    return sub.billing_cycle === 'yearly'
      ? Math.round(addonPrices.yearly / 12)
      : addonPrices.monthly;
  }
}
