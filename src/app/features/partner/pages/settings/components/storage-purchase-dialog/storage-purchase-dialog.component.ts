import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../shared/utils/dialog.util';
import { StorageUsage } from '../../../../services/storage.service';

/**
 * StoragePurchaseDialogComponent
 *
 * Extra tárhely vásárlás dialógus.
 * Slider-rel választható GB mennyiség, ár kalkulátor.
 */
@Component({
  selector: 'app-storage-purchase-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DecimalPipe],
  templateUrl: './storage-purchase-dialog.component.html',
  styleUrls: ['./storage-purchase-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoragePurchaseDialogComponent implements OnInit {
  readonly ICONS = ICONS;

  /** Tárhely használat adatok */
  usage = input.required<StorageUsage>();

  /** Feldolgozás folyamatban */
  isSubmitting = input<boolean>(false);

  /** Dialógus bezárása */
  close = output<void>();

  /** Megerősítés (GB értékkel) */
  confirm = output<number>();

  /** Kiválasztott GB mennyiség */
  selectedGb = signal(0);

  /** Backdrop click handler */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  /** Éves előfizetés-e */
  isYearly = computed(() => this.usage().billing_cycle === 'yearly');

  /** Teljes tárhely vásárlás után */
  totalAfterPurchase = computed(() => this.usage().plan_limit_gb + this.selectedGb());

  /** Változott-e az érték */
  hasChanged = computed(() => this.selectedGb() !== this.usage().additional_gb);

  /** Teljes ár számítás */
  totalPrice = computed(() => {
    const gb = this.selectedGb();
    if (gb === 0) return 0;

    return this.isYearly()
      ? gb * this.usage().addon_price_yearly
      : gb * this.usage().addon_price_monthly;
  });

  /** Havi ekvivalens (éves esetén) */
  monthlyEquivalent = computed(() => {
    const gb = this.selectedGb();
    if (gb === 0 || !this.isYearly()) return 0;

    return Math.round((gb * this.usage().addon_price_yearly) / 12);
  });

  ngOnInit(): void {
    // Kezdőérték beállítása a jelenlegi extra tárhelyre
    this.selectedGb.set(this.usage().additional_gb);
  }

  handleConfirm(): void {
    this.confirm.emit(this.selectedGb());
  }
}
