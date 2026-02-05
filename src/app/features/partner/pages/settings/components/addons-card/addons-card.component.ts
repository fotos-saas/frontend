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
  templateUrl: './addons-card.component.html',
  styleUrls: ['./addons-card.component.scss'],
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
