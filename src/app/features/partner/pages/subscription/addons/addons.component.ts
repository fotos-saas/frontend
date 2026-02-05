import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddonService, Addon, AddonListResponse } from '../../../services/addon.service';
import { SubscriptionService, SubscriptionInfo } from '../../../services/subscription.service';
import { StorageService, StorageUsage } from '../../../services/storage.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { StorageUsageCardComponent } from '../../settings/components/storage-usage-card/storage-usage-card.component';
import { StoragePurchaseDialogComponent } from '../../settings/components/storage-purchase-dialog/storage-purchase-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../../../shared/constants/icons.constants';

/**
 * Addons Page
 *
 * Kiegészítők kezelése:
 * - Elérhető addonok listázása
 * - Addon aktiválása (Stripe)
 * - Aktív addonok lemondása
 * - Extra tárhely vásárlás (slider dialógus)
 */
@Component({
  selector: 'app-addons',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    StorageUsageCardComponent,
    StoragePurchaseDialogComponent,
    ConfirmDialogComponent,
  ],
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
          <div class="skeleton-card skeleton-card--small"></div>
        </div>
      } @else {
        <!-- Extra tárhely szekció -->
        <section class="section">
          <div class="section-header">
            <lucide-icon [name]="ICONS.HARD_DRIVE" [size]="20" />
            <h2 class="section-title">Tárhely</h2>
          </div>

          @if (storageUsage()) {
            <app-storage-usage-card
              [usage]="storageUsage()!"
              (openPurchase)="showStorageDialog.set(true)"
            />
          } @else {
            <div class="storage-loading">
              <div class="skeleton-bar"></div>
            </div>
          }
        </section>

        <!-- Funkció addonok szekció -->
        <section class="section">
          <div class="section-header">
            <lucide-icon [name]="ICONS.SPARKLES" [size]="20" />
            <h2 class="section-title">Funkció kiegészítők</h2>
          </div>

          <div class="addons-grid">
            @for (addon of addons(); track addon.key) {
              <div class="addon-card" [class.addon-card--active]="addon.isActive" [class.addon-card--included]="addon.isIncludedInPlan">
                <div class="addon-main">
                  <div class="addon-icon">
                    <lucide-icon [name]="ICONS.SPARKLES" [size]="18" />
                  </div>
                  <div class="addon-info">
                    <div class="addon-title-row">
                      <h3 class="addon-name">{{ addon.name }}</h3>
                      @if (addon.isIncludedInPlan) {
                        <span class="status-tag status-tag--included">Csomagban</span>
                      } @else if (addon.isActive) {
                        <span class="status-tag status-tag--active">Aktív</span>
                      }
                    </div>
                    <p class="addon-description">{{ addon.description }}</p>
                    <div class="addon-features-inline">
                      @for (feature of addon.includes; track feature; let last = $last) {
                        <span class="feature-tag">{{ getFeatureName(feature) }}</span>
                        @if (!last) {<span class="feature-sep">+</span>}
                      }
                    </div>
                  </div>
                </div>

                @if (!addon.isIncludedInPlan) {
                  <div class="addon-footer">
                    <div class="addon-pricing-inline">
                      @if (subscription()?.billing_cycle === 'yearly') {
                        <span class="price-main">{{ formatPrice(addon.yearlyPrice) }}/év</span>
                      } @else {
                        <span class="price-main">{{ formatPrice(addon.monthlyPrice) }}/hó</span>
                      }
                    </div>
                    @if (addon.isActive) {
                      <button
                        class="btn btn--sm btn--danger-outline"
                        (click)="cancelAddon(addon.key)"
                        [disabled]="actionLoading() === addon.key"
                      >
                        @if (actionLoading() === addon.key) {
                          <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
                        }
                        Lemondás
                      </button>
                    } @else if (addon.canPurchase) {
                      <button
                        class="btn btn--sm btn--primary"
                        (click)="subscribeAddon(addon.key)"
                        [disabled]="actionLoading() === addon.key"
                      >
                        @if (actionLoading() === addon.key) {
                          <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
                        } @else {
                          <lucide-icon [name]="ICONS.PLUS" [size]="16" />
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
              <h3>Nincsenek elérhető kiegészítők</h3>
              <p>Jelenleg nincs aktiválható kiegészítő a csomagodhoz.</p>
            </div>
          }
        </section>
      }
    </div>

    <!-- Storage Purchase Dialog -->
    @if (showStorageDialog() && storageUsage()) {
      <app-storage-purchase-dialog
        [usage]="storageUsage()!"
        [isSubmitting]="storageSubmitting()"
        (close)="showStorageDialog.set(false)"
        (confirm)="handleStoragePurchase($event)"
      />
    }

    <!-- Cancel Addon Confirm Dialog -->
    @if (showCancelDialog()) {
      <app-confirm-dialog
        title="Addon lemondása"
        [message]="'Biztosan lemondod ezt a kiegészítőt? A szolgáltatás a számlázási időszak végéig aktív marad.'"
        confirmText="Lemondás"
        cancelText="Mégsem"
        confirmType="danger"
        [isSubmitting]="cancelSubmitting()"
        (resultEvent)="handleCancelDialogResult($event)"
      />
    }
  `,
  styles: [`
    .addons-page {
      max-width: 800px;
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

    /* Sections */
    .section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #64748b;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      color: #64748b;
    }

    /* Addons Grid */
    .addons-grid {
      display: grid;
      gap: 20px;
    }

    /* Addon Card - Compact */
    .addon-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .addon-card:hover {
      border-color: #cbd5e1;
    }

    .addon-card--active {
      border-color: #22c55e;
      background: #fafff9;
    }

    .addon-card--included {
      border-color: #3b82f6;
      background: #fafbff;
    }

    .addon-main {
      display: flex;
      gap: 12px;
    }

    .addon-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .addon-info {
      flex: 1;
      min-width: 0;
    }

    .addon-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }

    .addon-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .status-tag {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.6875rem;
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

    .addon-description {
      color: #64748b;
      font-size: 0.8125rem;
      margin: 0 0 6px 0;
    }

    /* Features inline */
    .addon-features-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .feature-tag {
      font-size: 0.75rem;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .feature-sep {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    /* Footer with pricing & action */
    .addon-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }

    .addon-pricing-inline {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price-main {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .price-alt {
      color: #64748b;
      font-size: 0.8125rem;
    }

    .price-discount {
      font-size: 0.6875rem;
      color: #16a34a;
      background: #dcfce7;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.8125rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn--sm {
      padding: 6px 12px;
      font-size: 0.75rem;
      border-radius: 6px;
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
      height: 200px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    .skeleton-card--small {
      height: 150px;
    }

    .skeleton-bar {
      height: 12px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .storage-loading {
      padding: 20px 0;
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

    .empty-state h3 {
      margin: 16px 0 8px;
      font-size: 1rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
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
      .skeleton-bar,
      .spin {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddonsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly addonService = inject(AddonService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly storageService = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  protected readonly ICONS = ICONS;

  addons = signal<Addon[]>([]);
  subscription = signal<SubscriptionInfo | null>(null);
  storageUsage = signal<StorageUsage | null>(null);
  loading = signal(true);
  actionLoading = signal<string | null>(null);

  // Storage dialog
  showStorageDialog = signal(false);
  storageSubmitting = signal(false);

  // Cancel addon dialog
  showCancelDialog = signal(false);
  cancellingAddonKey = signal<string | null>(null);
  cancelSubmitting = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load subscription first
    this.subscriptionService.getSubscription()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info) => {
          this.subscription.set(info);
          this.loadAddons();
          this.loadStorageUsage();
        },
        error: (err) => {
          this.logger.error('Failed to load subscription:', err);
          this.loadAddons();
          this.loadStorageUsage();
        }
      });
  }

  loadAddons(): void {
    this.addonService.getAddons()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: AddonListResponse) => {
          this.addons.set(response.addons);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load addons:', err);
          this.loading.set(false);
        }
      });
  }

  loadStorageUsage(): void {
    this.storageService.getUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usage) => this.storageUsage.set(usage),
        error: (err) => this.logger.error('Failed to load storage usage:', err)
      });
  }

  subscribeAddon(key: string): void {
    this.actionLoading.set(key);
    this.addonService.subscribe(key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Siker', 'Addon sikeresen aktiválva!');
          this.loadAddons();
          this.actionLoading.set(null);
        },
        error: (err) => {
          this.logger.error('Failed to subscribe addon:', err);
          this.toastService.error('Hiba', 'Nem sikerült aktiválni az addont.');
          this.actionLoading.set(null);
        }
      });
  }

  cancelAddon(key: string): void {
    this.cancellingAddonKey.set(key);
    this.showCancelDialog.set(true);
  }

  handleCancelDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.performCancelAddon();
    } else {
      this.closeCancelDialog();
    }
  }

  private performCancelAddon(): void {
    const key = this.cancellingAddonKey();
    if (!key) return;

    this.cancelSubmitting.set(true);
    this.addonService.cancel(key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Siker', 'Addon sikeresen lemondva.');
          this.loadAddons();
          this.closeCancelDialog();
        },
        error: (err) => {
          this.logger.error('Failed to cancel addon:', err);
          this.toastService.error('Hiba', 'Nem sikerült lemondani az addont.');
          this.cancelSubmitting.set(false);
        }
      });
  }

  private closeCancelDialog(): void {
    this.showCancelDialog.set(false);
    this.cancellingAddonKey.set(null);
    this.cancelSubmitting.set(false);
  }

  handleStoragePurchase(gb: number): void {
    this.storageSubmitting.set(true);
    this.storageService.setAddon(gb)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Siker', 'Tárhely sikeresen módosítva!');
          this.showStorageDialog.set(false);
          this.storageSubmitting.set(false);
          this.loadStorageUsage();
        },
        error: (err) => {
          this.logger.error('Failed to update storage:', err);
          this.toastService.error('Hiba', 'Nem sikerült módosítani a tárhelyet.');
          this.storageSubmitting.set(false);
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
