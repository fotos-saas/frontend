import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService, SubscriptionInfo } from '../../services/subscription.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Subscription Overview Page
 *
 * Előfizetés áttekintés:
 * - Jelenlegi csomag információk
 * - Tárhely használat
 * - Státusz (aktív, trial, szüneteltetett, stb.)
 * - Stripe portal link
 */
@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="subscription-overview page-card">
      <h1 class="page-title">
        <lucide-icon [name]="ICONS.PACKAGE" [size]="24" />
        Előfizetés áttekintés
      </h1>

      @if (loading()) {
        <div class="loading-state">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      } @else if (subscription()) {
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
              <span class="billing-cycle">
                {{ subscription()!.billing_cycle === 'monthly' ? 'Havi' : 'Éves' }} számlázás
              </span>
            </div>

            @if (subscription()!.is_modified) {
              <div class="modification-badge">
                <lucide-icon [name]="ICONS.PLUS_CIRCLE" [size]="16" />
                Módosított csomag
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
              <lucide-icon [name]="ICONS.HARD_DRIVE" [size]="20" />
            </div>

            <div class="storage-info">
              <div class="storage-bar">
                <div
                  class="storage-used"
                  [style.width.%]="getStoragePercent()"
                  [class.storage-used--warning]="getStoragePercent() > 80"
                  [class.storage-used--danger]="getStoragePercent() > 95"
                ></div>
              </div>
              <div class="storage-text">
                <span class="storage-current">{{ formatStorage(0) }}</span>
                <span class="storage-separator">/</span>
                <span class="storage-limit">{{ formatStorage(subscription()!.limits.storage_gb) }} GB</span>
              </div>
            </div>

            @if (subscription()!.has_extra_storage) {
              <div class="extra-storage-badge">
                <lucide-icon [name]="ICONS.PLUS" [size]="14" />
                +{{ subscription()!.extra_storage_gb }} GB extra tárhely
              </div>
            }
          </div>

          <!-- Limitek kártya -->
          <div class="info-card limits-card">
            <div class="card-header">
              <h2 class="card-title">Limitek</h2>
              <lucide-icon [name]="ICONS.FILTER" [size]="20" />
            </div>

            <div class="limits-list">
              <div class="limit-item">
                <lucide-icon [name]="ICONS.FOLDER" [size]="18" />
                <span class="limit-label">Max osztályok:</span>
                <span class="limit-value">
                  {{ subscription()!.limits.max_classes ?? 'Korlátlan' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Funkciók kártya -->
          <div class="info-card features-card">
            <div class="card-header">
              <h2 class="card-title">Funkciók</h2>
              <lucide-icon [name]="ICONS.SPARKLES" [size]="20" />
            </div>

            <div class="features-list">
              @for (feature of subscription()!.features; track feature) {
                <div class="feature-item">
                  <lucide-icon [name]="ICONS.CHECK" [size]="16" class="feature-check" />
                  <span>{{ getFeatureName(feature) }}</span>
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
          <button class="btn btn--secondary" (click)="loadSubscription()">
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

    /* Plan Card */
    .plan-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    }

    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .billing-cycle {
      font-size: 0.875rem;
      color: #64748b;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge--active {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge--trial {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-badge--paused {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge--canceling,
    .status-badge--canceled {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge--pending {
      background: #f1f5f9;
      color: #64748b;
    }

    .modification-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f0fdf4;
      color: #16a34a;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .card-actions {
      margin-top: 8px;
    }

    /* Storage Card */
    .storage-info {
      margin-bottom: 12px;
    }

    .storage-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .storage-used {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .storage-used--warning {
      background: #f59e0b;
    }

    .storage-used--danger {
      background: #ef4444;
    }

    .storage-text {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 0.875rem;
    }

    .storage-current {
      font-weight: 600;
      color: #1e293b;
    }

    .storage-separator {
      color: #94a3b8;
    }

    .storage-limit {
      color: #64748b;
    }

    .extra-storage-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #ede9fe;
      color: #7c3aed;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Limits Card */
    .limits-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .limit-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #475569;
    }

    .limit-label {
      flex: 1;
    }

    .limit-value {
      font-weight: 600;
      color: #1e293b;
    }

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

    .feature-check {
      color: #22c55e;
    }

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

    .addon-icon {
      color: #7c3aed;
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
      gap: 20px;
    }

    .skeleton-card {
      height: 200px;
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
      .spin {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionOverviewComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  protected readonly ICONS = ICONS;

  subscription = signal<SubscriptionInfo | null>(null);
  loading = signal(true);
  portalLoading = signal(false);

  ngOnInit(): void {
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.loading.set(true);
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => {
        this.subscription.set(info);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load subscription:', err);
        this.loading.set(false);
      }
    });
  }

  openPortal(): void {
    this.portalLoading.set(true);
    this.subscriptionService.openPortal().subscribe({
      next: (res) => {
        window.location.href = res.portal_url;
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

  getStoragePercent(): number {
    // TODO: Igazi tárhely használat a backendről
    return 35;
  }

  formatStorage(gb: number): string {
    return gb.toFixed(1);
  }

  getFeatureName(feature: string): string {
    const names: Record<string, string> = {
      online_selection: 'Online képválasztás',
      templates: 'Sablonok',
      qr_sharing: 'QR kódos megosztás',
      email_support: 'Email támogatás',
      subdomain: 'Saját aldomain',
      stripe_payments: 'Stripe fizetések',
      sms_notifications: 'SMS értesítések',
      priority_support: 'Prioritásos támogatás',
      forum: 'Fórum',
      polls: 'Szavazás',
      custom_domain: 'Saját domain',
      white_label: 'White label',
      api_access: 'API hozzáférés',
      dedicated_support: 'Dedikált támogatás',
    };
    return names[feature] ?? feature;
  }

  getAddonName(addon: string): string {
    const names: Record<string, string> = {
      community_pack: 'Közösségi csomag (Fórum + Szavazás)',
    };
    return names[addon] ?? addon;
  }
}
