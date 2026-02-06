import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SubscriptionService, SubscriptionInfo } from '../../../services/subscription.service';
import { StorageService, StorageUsage } from '../../../services/storage.service';
import { PlansService } from '../../../../../shared/services/plans.service';
import { ICONS, getSubscriptionStatusLabel } from '../../../../../shared/constants';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, MatTooltipModule],
  templateUrl: './subscription-overview.component.html',
  styleUrl: './subscription-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionOverviewComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly storageService = inject(StorageService);
  private readonly plansService = inject(PlansService);
  private readonly destroyRef = inject(DestroyRef);
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
      storage: this.storageService.getUsage().pipe(catchError(() => of(null))),
      prices: this.plansService.getPlanPrices().pipe(catchError(() => of({}))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ subscription, storage, prices }) => {
        this.subscription.set(subscription);
        this.storageUsage.set(storage);
        this.planPrices.set(prices as Record<string, { monthly: number; yearly: number }>);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openPortal(): void {
    this.portalLoading.set(true);
    this.subscriptionService.openPortal().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  // Központi konstansból
  getStatusLabel = getSubscriptionStatusLabel;

  formatStorage(gb: number): string {
    return gb.toFixed(2);
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

  getLimitPercent(type: 'schools' | 'classes' | 'templates'): number {
    const sub = this.subscription();
    if (!sub) return 0;

    const usage = sub.usage?.[type] ?? 0;
    const limitKey = type === 'schools' ? 'max_schools' : type === 'classes' ? 'max_classes' : 'max_templates';
    const limit = sub.limits?.[limitKey];

    // Ha nincs limit (korlátlan), 0%-ot mutatunk
    if (!limit) return 0;

    return Math.min(100, Math.round((usage / limit) * 100));
  }
}
