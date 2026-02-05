import { Component, inject, signal, OnInit, ChangeDetectionStrategy, output, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddonService, Addon, AddonListResponse } from '../../../../services/addon.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Addons Card Component
 *
 * Partner addon kezelés kártya:
 * - Elérhető addonok listázása
 * - Addon aktiválása (Stripe előfizetés bővítése)
 * - Addon lemondása
 */
@Component({
  selector: 'app-addons-card',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="addons-card">
      @if (isLoading()) {
        <div class="loading-state">
          <div class="skeleton-addon"></div>
        </div>
      } @else if (addons().length > 0) {
        <div class="addons-list">
          @for (addon of addons(); track addon.key) {
            <div class="addon-item" [class.addon-item--active]="addon.isActive">
              <div class="addon-header">
                <div class="addon-info">
                  <h3 class="addon-name">{{ addon.name }}</h3>
                  <p class="addon-description">{{ addon.description }}</p>
                </div>
                <div class="addon-status">
                  @if (addon.isIncludedInPlan) {
                    <span class="status-badge status-badge--included">
                      <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="14" />
                      Csomagban
                    </span>
                  } @else if (addon.isActive) {
                    <span class="status-badge status-badge--active">
                      <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="14" />
                      Aktív
                    </span>
                  }
                </div>
              </div>

              <div class="addon-features">
                @for (feature of addon.includes; track feature) {
                  <div class="feature-badge">
                    <lucide-icon [name]="getFeatureIcon(feature)" [size]="14" />
                    {{ getFeatureName(feature) }}
                  </div>
                }
              </div>

              <div class="addon-footer">
                <div class="addon-price">
                  @if (!addon.isIncludedInPlan) {
                    <span class="price-value">{{ formatPrice(billingCycle() === 'yearly' ? addon.yearlyPrice : addon.monthlyPrice) }}</span>
                    <span class="price-period">/ {{ billingCycle() === 'yearly' ? 'év' : 'hó' }}</span>
                  }
                </div>
                <div class="addon-actions">
                  @if (addon.isIncludedInPlan) {
                    <span class="included-text">A csomagod tartalmazza</span>
                  } @else if (addon.isActive) {
                    <button
                      class="btn btn--outline btn--danger"
                      (click)="openCancelDialog(addon)"
                      [disabled]="isSubmitting()"
                      matTooltip="Addon lemondása"
                    >
                      <lucide-icon [name]="ICONS.X" [size]="16" />
                      Lemondás
                    </button>
                  } @else if (addon.canPurchase) {
                    <button
                      class="btn btn--primary"
                      (click)="handleSubscribe(addon)"
                      [disabled]="isSubmitting()"
                      matTooltip="Addon aktiválása"
                    >
                      @if (isSubmitting() && processingAddon() === addon.key) {
                        <span class="btn-spinner"></span>
                      } @else {
                        <lucide-icon [name]="ICONS.PLUS" [size]="16" />
                      }
                      Aktiválás
                    </button>
                  } @else {
                    <span class="upgrade-hint">Csak Alap csomagban vásárolható</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <lucide-icon [name]="ICONS.PACKAGE" [size]="32" />
          <p>Nincs elérhető addon.</p>
        </div>
      }
    </div>

    <!-- Cancel Confirm Dialog -->
    @if (showCancelDialog()) {
      <app-confirm-dialog
        title="Addon lemondása"
        [message]="'Biztosan lemondod a ' + cancellingAddon()?.name + ' addont? A funkciók azonnal elérhetetlenné válnak.'"
        confirmText="Lemondás"
        cancelText="Mégsem"
        confirmType="danger"
        [isSubmitting]="isSubmitting()"
        (resultEvent)="handleDialogResult($event)"
      />
    }
  `,
  styles: [`
    .addons-card {
      background: white;
      border-radius: 12px;
    }

    .addons-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ============ Addon Item ============ */
    .addon-item {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
    }

    .addon-item:hover {
      border-color: var(--color-primary-light, #bfdbfe);
    }

    .addon-item--active {
      border-color: var(--color-success, #22c55e);
      background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
    }

    .addon-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .addon-info {
      flex: 1;
    }

    .addon-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0 0 4px 0;
    }

    .addon-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    /* ============ Status Badge ============ */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge--active {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success-dark, #166534);
    }

    .status-badge--included {
      background: var(--color-primary-light, #dbeafe);
      color: var(--color-primary-dark, #1e40af);
    }

    /* ============ Features ============ */
    .addon-features {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .feature-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--bg-secondary, #f8fafc);
      border-radius: 8px;
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }

    /* ============ Footer ============ */
    .addon-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }

    .addon-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .price-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
    }

    .price-period {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .included-text,
    .upgrade-hint {
      font-size: 0.8125rem;
      color: var(--text-tertiary, #94a3b8);
      font-style: italic;
    }

    /* ============ Buttons ============ */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--primary {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #2563eb);
    }

    .btn--outline {
      background: transparent;
      border: 1px solid var(--border-color, #e2e8f0);
      color: var(--text-secondary, #64748b);
    }

    .btn--outline:hover:not(:disabled) {
      background: var(--bg-secondary, #f8fafc);
    }

    .btn--danger {
      border-color: var(--color-danger-light, #fecaca);
      color: var(--color-danger, #dc2626);
    }

    .btn--danger:hover:not(:disabled) {
      background: var(--color-danger-light, #fef2f2);
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============ Loading ============ */
    .loading-state {
      padding: 20px 0;
    }

    .skeleton-addon {
      height: 160px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ============ Empty State ============ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: var(--text-tertiary, #94a3b8);
      text-align: center;
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .btn,
      .addon-item,
      .skeleton-addon,
      .btn-spinner {
        transition: none;
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddonsCardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly addonService = inject(AddonService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  protected readonly ICONS = ICONS;

  // State
  addons = signal<Addon[]>([]);
  plan = signal<string>('');
  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  isLoading = signal(true);
  isSubmitting = signal(false);
  processingAddon = signal<string | null>(null);
  showCancelDialog = signal(false);
  cancellingAddon = signal<Addon | null>(null);

  // Output for parent component
  addonChanged = output<void>();

  ngOnInit(): void {
    this.loadAddons();
  }

  private loadAddons(): void {
    this.isLoading.set(true);
    this.addonService.getAddons()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.addons.set(response.addons);
          this.plan.set(response.plan);
          this.billingCycle.set(response.billing_cycle);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load addons:', err);
          this.isLoading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült betölteni az addonokat.');
        }
      });
  }

  handleSubscribe(addon: Addon): void {
    this.isSubmitting.set(true);
    this.processingAddon.set(addon.key);

    this.addonService.subscribe(addon.key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Siker', `${addon.name} sikeresen aktiválva!`);
          this.loadAddons();
          this.isSubmitting.set(false);
          this.processingAddon.set(null);
          this.addonChanged.emit();
        },
        error: (err) => {
          this.logger.error('Failed to subscribe to addon:', err);
          const message = err.error?.message || 'Nem sikerült aktiválni az addont.';
          this.toastService.error('Hiba', message);
          this.isSubmitting.set(false);
          this.processingAddon.set(null);
        }
      });
  }

  openCancelDialog(addon: Addon): void {
    this.cancellingAddon.set(addon);
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    this.showCancelDialog.set(false);
    this.cancellingAddon.set(null);
  }

  handleDialogResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.handleCancel();
    } else {
      this.closeCancelDialog();
    }
  }

  handleCancel(): void {
    const addon = this.cancellingAddon();
    if (!addon) return;

    this.isSubmitting.set(true);

    this.addonService.cancel(addon.key)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Siker', `${addon.name} sikeresen lemondva.`);
          this.closeCancelDialog();
          this.loadAddons();
          this.isSubmitting.set(false);
          this.addonChanged.emit();
        },
        error: (err) => {
          this.logger.error('Failed to cancel addon:', err);
          const message = err.error?.message || 'Nem sikerült lemondani az addont.';
          this.toastService.error('Hiba', message);
          this.isSubmitting.set(false);
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
