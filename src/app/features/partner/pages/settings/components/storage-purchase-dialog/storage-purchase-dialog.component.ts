import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
  imports: [CommonModule, FormsModule, LucideAngularModule, DecimalPipe],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel dialog-panel--md">
        <!-- Header -->
        <div class="dialog-header">
          <h2 class="dialog-title">
            <lucide-icon [name]="ICONS.HARD_DRIVE" [size]="20" />
            Tárhely bővítése
          </h2>
          <button class="dialog-close" (click)="close.emit()" [disabled]="isSubmitting()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- Slider -->
          <div class="slider-section">
            <label class="slider-label">
              Extra tárhely mennyisége
            </label>
            <div class="slider-container">
              <input
                type="range"
                class="slider"
                [min]="0"
                [max]="100"
                [step]="5"
                [(ngModel)]="selectedGb"
              />
              <div class="slider-value">
                <span class="slider-value__number">{{ selectedGb() }}</span>
                <span class="slider-value__unit">GB</span>
              </div>
            </div>
            <div class="slider-marks">
              <span>0 GB</span>
              <span>50 GB</span>
              <span>100 GB</span>
            </div>
          </div>

          <!-- Összegzés -->
          <div class="summary">
            <div class="summary__row">
              <span>Jelenlegi extra tárhely:</span>
              <span>{{ usage().additional_gb }} GB</span>
            </div>
            <div class="summary__row summary__row--highlight">
              <span>Új extra tárhely:</span>
              <span>{{ selectedGb() }} GB</span>
            </div>
            <div class="summary__row">
              <span>Teljes tárhely:</span>
              <span>{{ totalAfterPurchase() }} GB</span>
            </div>
          </div>

          <!-- Ár -->
          <div class="price-box">
            <div class="price-box__main">
              <span class="price-box__label">
                {{ isYearly() ? 'Éves díj' : 'Havi díj' }}:
              </span>
              <span class="price-box__value">
                {{ totalPrice() | number:'1.0-0' }} Ft
              </span>
            </div>
            @if (isYearly()) {
              <div class="price-box__hint">
                ({{ monthlyEquivalent() | number:'1.0-0' }} Ft/hó - 10% kedvezmény)
              </div>
            }
            @if (!isYearly() && selectedGb() > 0) {
              <div class="price-box__hint">
                Éves előfizetéssel 10% kedvezmény!
              </div>
            }
          </div>

          <!-- Változás jelző -->
          @if (hasChanged()) {
            <div class="change-indicator" [class.change-indicator--increase]="selectedGb() > usage().additional_gb" [class.change-indicator--decrease]="selectedGb() < usage().additional_gb">
              @if (selectedGb() > usage().additional_gb) {
                <lucide-icon [name]="ICONS.ARROW_UP" [size]="16" />
                <span>+{{ selectedGb() - usage().additional_gb }} GB bővítés</span>
              } @else if (selectedGb() < usage().additional_gb) {
                <lucide-icon [name]="ICONS.ARROW_DOWN" [size]="16" />
                <span>-{{ usage().additional_gb - selectedGb() }} GB csökkentés</span>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button class="btn btn--secondary" (click)="close.emit()" [disabled]="isSubmitting()">
            Mégse
          </button>
          <button
            class="btn btn--primary"
            (click)="handleConfirm()"
            [disabled]="isSubmitting() || !hasChanged()"
          >
            @if (isSubmitting()) {
              <lucide-icon [name]="ICONS.LOADER" [size]="18" class="animate-spin" />
              Feldolgozás...
            } @else if (selectedGb() === 0 && usage().additional_gb > 0) {
              Extra tárhely eltávolítása
            } @else {
              Módosítás mentése
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ============ Backdrop & Panel ============ */
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }

    .dialog-panel {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 480px;
      max-height: calc(100vh - 32px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ============ Header ============ */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-gray-200, #e2e8f0);
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .dialog-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      transition: all 0.2s ease;
    }

    .dialog-close:hover:not(:disabled) {
      background: var(--color-gray-100, #f1f5f9);
      color: var(--text-primary, #1e293b);
    }

    .dialog-close:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ============ Content ============ */
    .dialog-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      overflow-y: auto;
    }

    /* ============ Slider ============ */
    .slider-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slider-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .slider {
      flex: 1;
      height: 8px;
      appearance: none;
      background: var(--color-gray-200, #e2e8f0);
      border-radius: 4px;
      cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
      appearance: none;
      width: 24px;
      height: 24px;
      background: var(--color-primary, #3b82f6);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
      transition: transform 0.2s ease;
    }

    .slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background: var(--color-primary, #3b82f6);
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }

    .slider-value {
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 70px;
      text-align: right;
    }

    .slider-value__number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary, #3b82f6);
    }

    .slider-value__unit {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .slider-marks {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-tertiary, #94a3b8);
    }

    /* ============ Summary ============ */
    .summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--color-gray-50, #f8fafc);
      border-radius: 12px;
    }

    .summary__row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .summary__row--highlight {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
    }

    /* ============ Price Box ============ */
    .price-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid var(--color-primary-light, #93c5fd);
      border-radius: 12px;
    }

    .price-box__main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price-box__label {
      font-size: 0.875rem;
      color: var(--color-primary-dark, #1d4ed8);
    }

    .price-box__value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary-dark, #1d4ed8);
    }

    .price-box__hint {
      font-size: 0.75rem;
      color: var(--color-primary, #3b82f6);
    }

    /* ============ Change Indicator ============ */
    .change-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .change-indicator--increase {
      background: var(--color-success-light, #dcfce7);
      color: var(--color-success-dark, #166534);
    }

    .change-indicator--decrease {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #b45309);
    }

    /* ============ Footer ============ */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-gray-200, #e2e8f0);
    }

    /* ============ Buttons ============ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
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

    .btn--secondary {
      background: var(--color-gray-100, #f1f5f9);
      color: var(--text-primary, #1e293b);
      border: 1px solid var(--color-gray-300, #cbd5e1);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--color-gray-200, #e2e8f0);
    }

    .btn--primary {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #2563eb);
    }

    /* ============ Animations ============ */
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .dialog-backdrop,
      .dialog-panel,
      .btn,
      .slider::-webkit-slider-thumb,
      .animate-spin {
        animation: none;
        transition: none;
      }
    }
  `],
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
