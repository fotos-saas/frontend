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
  templateUrl: './addons.component.html',
  styleUrls: ['./addons.component.scss'],
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
