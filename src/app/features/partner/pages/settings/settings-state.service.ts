import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { SubscriptionService, SubscriptionInfo } from '../../services/subscription.service';
import { StorageService, StorageUsage } from '../../services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Settings State Service
 *
 * A Partner beállítások oldal teljes állapotkezelése:
 * - Előfizetés betöltés, szüneteltetés, lemondás, folytatás
 * - Tárhely betöltés, bővítés
 * - Fiók törlés
 *
 * Komponens-szintű provider (providedIn: null)
 */
@Injectable()
export class SettingsStateService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly storageService = inject(StorageService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  // === Subscription state ===
  readonly subscriptionInfo = signal<SubscriptionInfo | null>(null);
  readonly isLoading = signal(true);
  readonly isActionLoading = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly isDeleting = signal(false);

  // === Storage state ===
  readonly storageUsage = signal<StorageUsage | null>(null);
  readonly isStorageLoading = signal(true);
  readonly showStoragePurchaseDialog = signal(false);
  readonly isStorageSubmitting = signal(false);

  // ============================================
  // INICIALIZÁLÁS
  // ============================================

  init(): void {
    this.loadSubscriptionInfo();
    this.loadStorageUsage();
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  loadSubscriptionInfo(): void {
    this.isLoading.set(true);
    this.subscriptionService.getSubscription()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info) => {
          this.subscriptionInfo.set(info);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load subscription:', err);
          this.isLoading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült betölteni az előfizetési adatokat.');
        }
      });
  }

  openPortal(): void {
    this.isActionLoading.set(true);
    this.subscriptionService.openPortal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          window.open(response.portal_url, '_blank');
          this.isActionLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to open portal:', err);
          this.toastService.error('Hiba', 'Nem sikerült megnyitni a fiókkezelőt.');
          this.isActionLoading.set(false);
        }
      });
  }

  pause(): void {
    this.performSubscriptionAction(
      () => this.subscriptionService.pause(),
      'Nem sikerült szüneteltetni az előfizetést.'
    );
  }

  unpause(): void {
    this.performSubscriptionAction(
      () => this.subscriptionService.unpause(),
      'Nem sikerült feloldani a szüneteltetést.'
    );
  }

  cancel(): void {
    this.performSubscriptionAction(
      () => this.subscriptionService.cancel(),
      'Nem sikerült lemondani az előfizetést.'
    );
  }

  resume(): void {
    this.performSubscriptionAction(
      () => this.subscriptionService.resume(),
      'Nem sikerült folytatni az előfizetést.'
    );
  }

  // ============================================
  // FIÓK TÖRLÉS
  // ============================================

  openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  deleteAccount(): void {
    this.isDeleting.set(true);
    this.subscriptionService.deleteAccount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.toastService.success('Fiók törölve', response.message);
          this.closeDeleteDialog();
          this.isDeleting.set(false);
          // Kijelentkezés törlés után
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        },
        error: (err) => {
          this.logger.error('Failed to delete account:', err);
          this.toastService.error('Hiba', 'Nem sikerült törölni a fiókot.');
          this.isDeleting.set(false);
        }
      });
  }

  // ============================================
  // TÁRHELY
  // ============================================

  loadStorageUsage(): void {
    this.isStorageLoading.set(true);
    this.storageService.getUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usage) => {
          this.storageUsage.set(usage);
          this.isStorageLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to load storage usage:', err);
          this.isStorageLoading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült betölteni a tárhely adatokat.');
        }
      });
  }

  openStoragePurchaseDialog(): void {
    this.showStoragePurchaseDialog.set(true);
  }

  closeStoragePurchaseDialog(): void {
    this.showStoragePurchaseDialog.set(false);
  }

  purchaseStorage(gb: number): void {
    this.isStorageSubmitting.set(true);
    this.storageService.setAddon(gb)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.toastService.success('Siker', response.message);
          this.loadStorageUsage();
          this.closeStoragePurchaseDialog();
          this.isStorageSubmitting.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to update storage addon:', err);
          const message = err.error?.message || 'Nem sikerült módosítani az extra tárhelyet.';
          this.toastService.error('Hiba', message);
          this.isStorageSubmitting.set(false);
        }
      });
  }

  // ============================================
  // ADDON
  // ============================================

  onAddonChanged(): void {
    this.loadSubscriptionInfo();
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Közös minta: subscription művelet végrehajtása loading + toast + reload-dal
   */
  private performSubscriptionAction(
    action: () => Observable<{ message: string }>,
    errorMessage: string
  ): void {
    this.isActionLoading.set(true);
    action()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.toastService.success('Siker', response.message);
          this.loadSubscriptionInfo();
          this.isActionLoading.set(false);
        },
        error: (err) => {
          this.logger.error('Subscription action failed:', err);
          this.toastService.error('Hiba', errorMessage);
          this.isActionLoading.set(false);
        }
      });
  }
}
