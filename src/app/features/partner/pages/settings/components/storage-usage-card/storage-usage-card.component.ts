import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { StorageUsage } from '../../../../services/storage.service';

/**
 * StorageUsageCardComponent
 *
 * Tárhely használat megjelenítése progress bar-ral és statisztikákkal.
 * A Settings oldalon jelenik meg.
 */
@Component({
  selector: 'app-storage-usage-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DecimalPipe],
  template: `
    <div class="storage-card">
      <!-- Progress bar -->
      <div class="storage-bar">
        <div
          class="storage-bar__fill"
          [style.width.%]="usage().usage_percent"
          [class.storage-bar__fill--warning]="usage().usage_percent >= 80 && usage().usage_percent < 95"
          [class.storage-bar__fill--danger]="usage().usage_percent >= 95"
        ></div>
      </div>

      <!-- Használat infó -->
      <div class="storage-info">
        <div class="storage-info__usage">
          <span class="storage-info__value">{{ usage().used_gb | number:'1.1-2' }} GB</span>
          <span class="storage-info__separator">/</span>
          <span class="storage-info__limit">{{ usage().total_limit_gb }} GB</span>
        </div>
        <span class="storage-info__percent" [class.storage-info__percent--warning]="usage().usage_percent >= 80">
          {{ usage().usage_percent | number:'1.0-0' }}%
        </span>
      </div>

      <!-- Részletek -->
      <div class="storage-details">
        <div class="storage-details__row">
          <span class="storage-details__label">Csomag tárhely:</span>
          <span class="storage-details__value">{{ usage().plan_limit_gb }} GB</span>
        </div>
        @if (usage().additional_gb > 0) {
          <div class="storage-details__row storage-details__row--addon">
            <span class="storage-details__label">
              <lucide-icon [name]="ICONS.PLUS" [size]="14" />
              Extra tárhely:
            </span>
            <span class="storage-details__value">{{ usage().additional_gb }} GB</span>
          </div>
        }
      </div>

      <!-- Figyelmeztetés 80%+ esetén -->
      @if (usage().is_near_limit) {
        <div class="storage-warning">
          <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="16" />
          <span>A tárhelyed hamarosan betelik. Bővítsd az extra tárhelyet!</span>
        </div>
      }

      <!-- Bővítés gomb -->
      <button class="btn btn--secondary" (click)="openPurchase.emit()">
        <lucide-icon [name]="ICONS.PLUS" [size]="18" />
        Tárhely bővítése
      </button>
    </div>
  `,
  styles: [`
    .storage-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ============ Progress Bar ============ */
    .storage-bar {
      height: 12px;
      background: var(--color-gray-200, #e2e8f0);
      border-radius: 6px;
      overflow: hidden;
    }

    .storage-bar__fill {
      height: 100%;
      background: var(--color-primary, #3b82f6);
      border-radius: 6px;
      transition: width 0.5s ease, background 0.3s ease;
    }

    .storage-bar__fill--warning {
      background: var(--color-warning, #f59e0b);
    }

    .storage-bar__fill--danger {
      background: var(--color-danger, #dc2626);
    }

    /* ============ Usage Info ============ */
    .storage-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .storage-info__usage {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .storage-info__value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
    }

    .storage-info__separator {
      color: var(--text-tertiary, #94a3b8);
    }

    .storage-info__limit {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .storage-info__percent {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #64748b);
      padding: 4px 8px;
      background: var(--color-gray-100, #f1f5f9);
      border-radius: 4px;
    }

    .storage-info__percent--warning {
      color: var(--color-warning-dark, #b45309);
      background: var(--color-warning-light, #fef3c7);
    }

    /* ============ Details ============ */
    .storage-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--color-gray-50, #f8fafc);
      border-radius: 8px;
    }

    .storage-details__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .storage-details__label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary, #64748b);
    }

    .storage-details__value {
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .storage-details__row--addon .storage-details__label {
      color: var(--color-primary, #3b82f6);
    }

    .storage-details__row--addon .storage-details__value {
      color: var(--color-primary, #3b82f6);
    }

    /* ============ Warning ============ */
    .storage-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--color-warning-light, #fef3c7);
      border: 1px solid var(--color-warning, #f59e0b);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--color-warning-dark, #b45309);
    }

    /* ============ Button ============ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn--secondary {
      background: var(--color-gray-100, #f1f5f9);
      color: var(--text-primary, #1e293b);
      border: 1px solid var(--color-gray-300, #cbd5e1);
    }

    .btn--secondary:hover {
      background: var(--color-gray-200, #e2e8f0);
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .storage-bar__fill,
      .btn {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageUsageCardComponent {
  readonly ICONS = ICONS;

  /** Tárhely használat adatok */
  usage = input.required<StorageUsage>();

  /** Vásárlás dialógus megnyitása */
  openPurchase = output<void>();
}
