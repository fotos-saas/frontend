import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddonService, Addon, AddonListResponse } from '../../services/addon.service';
import { SubscriptionService, SubscriptionInfo } from '../../services/subscription.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Addons Page
 *
 * Kiegészítők kezelése:
 * - Elérhető addonok listázása
 * - Addon aktiválása (Stripe)
 * - Aktív addonok lemondása
 */
@Component({
  selector: 'app-addons',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="addons-page page-card">
      <h1 class="page-title">
        <lucide-icon [name]="ICONS.SPARKLE" [size]="24" />
        Kiegészítők
      </h1>

      @if (subscription()?.plan !== 'alap') {
        <div class="info-banner">
          <lucide-icon [name]="ICONS.INFO" [size]="20" />
          <div class="banner-content">
            <strong>{{ subscription()?.plan_name }} csomag</strong>
            <p>A jelenlegi csomagodban minden kiegészítő funkció automatikusan elérhető.</p>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="skeleton-card"></div>
        </div>
      } @else {
        <div class="addons-grid">
          @for (addon of addons(); track addon.key) {
            <div class="addon-card" [class.addon-card--active]="addon.isActive" [class.addon-card--included]="addon.isIncludedInPlan">
              <div class="addon-header">
                <div class="addon-icon">
                  <lucide-icon [name]="ICONS.SPARKLES" [size]="24" />
                </div>
                <div class="addon-status">
                  @if (addon.isIncludedInPlan) {
                    <span class="status-tag status-tag--included">Csomagban</span>
                  } @else if (addon.isActive) {
                    <span class="status-tag status-tag--active">Aktív</span>
                  }
                </div>
              </div>

              <h2 class="addon-name">{{ addon.name }}</h2>
              <p class="addon-description">{{ addon.description }}</p>

              <div class="addon-features">
                <h3 class="features-title">Tartalmazza:</h3>
                @for (feature of addon.includes; track feature) {
                  <div class="feature-item">
                    <lucide-icon [name]="getFeatureIcon(feature)" [size]="16" />
                    <span>{{ getFeatureName(feature) }}</span>
                  </div>
                }
              </div>

              @if (!addon.isIncludedInPlan) {
                <div class="addon-pricing">
                  <div class="price-row">
                    <span class="price-label">Havi:</span>
                    <span class="price-value">{{ formatPrice(addon.monthlyPrice) }}/hó</span>
                  </div>
                  <div class="price-row">
                    <span class="price-label">Éves:</span>
                    <span class="price-value">{{ formatPrice(addon.yearlyPrice) }}/év</span>
                    <span class="price-discount">~17% kedvezmény</span>
                  </div>
                </div>

                <div class="addon-actions">
                  @if (addon.isActive) {
                    <button
                      class="btn btn--danger-outline"
                      (click)="cancelAddon(addon.key)"
                      [disabled]="actionLoading() === addon.key"
                    >
                      @if (actionLoading() === addon.key) {
                        <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
                      } @else {
                        <lucide-icon [name]="ICONS.X_CIRCLE" [size]="18" />
                      }
                      Lemondás
                    </button>
                  } @else if (addon.canPurchase) {
                    <button
                      class="btn btn--primary"
                      (click)="subscribeAddon(addon.key)"
                      [disabled]="actionLoading() === addon.key"
                    >
                      @if (actionLoading() === addon.key) {
                        <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
                      } @else {
                        <lucide-icon [name]="ICONS.PLUS" [size]="18" />
                      }
                      Aktiválás
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (addons().length === 0) {
          <div class="empty-state">
            <lucide-icon [name]="ICONS.SPARKLE" [size]="48" />
            <h2>Nincsenek elérhető kiegészítők</h2>
            <p>Jelenleg nincs aktiválható kiegészítő a csomagodhoz.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .addons-page {
      max-width: 800px;
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

    /* Info Banner */
    .info-banner {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #dbeafe;
      border: 1px solid #93c5fd;
      border-radius: 8px;
      margin-bottom: 24px;
      color: #1e40af;
    }

    .banner-content strong {
      display: block;
      margin-bottom: 4px;
    }

    .banner-content p {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    /* Addons Grid */
    .addons-grid {
      display: grid;
      gap: 20px;
    }

    /* Addon Card */
    .addon-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      transition: all 0.2s ease;
    }

    .addon-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .addon-card--active {
      border-color: #22c55e;
      background: linear-gradient(to bottom right, white, #f0fdf4);
    }

    .addon-card--included {
      border-color: #3b82f6;
      background: linear-gradient(to bottom right, white, #eff6ff);
    }

    .addon-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .addon-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border-radius: 12px;
    }

    .status-tag {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-tag--active {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-tag--included {
      background: #dbeafe;
      color: #2563eb;
    }

    .addon-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .addon-description {
      color: #64748b;
      font-size: 0.9375rem;
      margin: 0 0 16px 0;
    }

    /* Features */
    .addon-features {
      margin-bottom: 20px;
    }

    .features-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      color: #475569;
      font-size: 0.9375rem;
    }

    .feature-item lucide-icon {
      color: #22c55e;
    }

    /* Pricing */
    .addon-pricing {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .price-label {
      color: #64748b;
      font-size: 0.875rem;
      min-width: 50px;
    }

    .price-value {
      font-weight: 600;
      color: #1e293b;
    }

    .price-discount {
      font-size: 0.75rem;
      color: #16a34a;
      background: #dcfce7;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Actions */
    .addon-actions {
      display: flex;
      gap: 12px;
    }

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

    .btn--danger-outline {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
    }

    .btn--danger-outline:hover:not(:disabled) {
      background: #fef2f2;
    }

    /* Loading & Empty */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .skeleton-card {
      height: 300px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background: #f8fafc;
      border-radius: 12px;
      color: #64748b;
      text-align: center;
    }

    .empty-state h2 {
      margin: 16px 0 8px;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
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
      .spin {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddonsComponent implements OnInit {
  private readonly addonService = inject(AddonService);
  private readonly subscriptionService = inject(SubscriptionService);
  protected readonly ICONS = ICONS;

  addons = signal<Addon[]>([]);
  subscription = signal<SubscriptionInfo | null>(null);
  loading = signal(true);
  actionLoading = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load subscription first
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => {
        this.subscription.set(info);
        this.loadAddons();
      },
      error: (err) => {
        console.error('Failed to load subscription:', err);
        this.loadAddons();
      }
    });
  }

  loadAddons(): void {
    this.addonService.getAddons().subscribe({
      next: (response: AddonListResponse) => {
        this.addons.set(response.addons);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load addons:', err);
        this.loading.set(false);
      }
    });
  }

  subscribeAddon(key: string): void {
    this.actionLoading.set(key);
    this.addonService.subscribe(key).subscribe({
      next: () => {
        this.loadAddons();
        this.actionLoading.set(null);
      },
      error: (err) => {
        console.error('Failed to subscribe addon:', err);
        this.actionLoading.set(null);
      }
    });
  }

  cancelAddon(key: string): void {
    if (!confirm('Biztosan lemondod ezt a kiegészítőt? A szolgáltatás a számlázási időszak végéig aktív marad.')) {
      return;
    }

    this.actionLoading.set(key);
    this.addonService.cancel(key).subscribe({
      next: () => {
        this.loadAddons();
        this.actionLoading.set(null);
      },
      error: (err) => {
        console.error('Failed to cancel addon:', err);
        this.actionLoading.set(null);
      }
    });
  }

  formatPrice(price: number): string {
    return this.addonService.formatPrice(price);
  }

  getFeatureIcon(feature: string): string {
    return this.addonService.getFeatureIcon(feature);
  }

  getFeatureName(feature: string): string {
    return this.addonService.getFeatureName(feature);
  }
}
