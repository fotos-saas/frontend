import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { StorageUsage } from '../../services/storage.service';

const STORAGE_WARNING_DISMISSED_KEY = 'storage_warning_dismissed_at';
const DISMISS_DURATION_HOURS = 24;

/**
 * StorageWarningPopupComponent
 *
 * Tárhely figyelmeztetés popup 80%+ használat esetén.
 * 24 órára megjegyzi ha a felhasználó elutasította.
 */
@Component({
  selector: 'app-storage-warning-popup',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe],
  template: `
    @if (isVisible()) {
      <div class="popup-overlay" (click)="handleDismiss()">
        <div class="popup" (click)="$event.stopPropagation()">
          <!-- Ikon -->
          <div class="popup__icon" [class.popup__icon--danger]="usage().usage_percent >= 95">
            <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="32" />
          </div>

          <!-- Tartalom -->
          <div class="popup__content">
            <h3 class="popup__title">
              @if (usage().usage_percent >= 95) {
                A tárhelyed majdnem megtelt!
              } @else {
                A tárhelyed hamarosan betelik
              }
            </h3>
            <p class="popup__text">
              Jelenlegi használat: <strong>{{ usage().used_gb | number:'1.1-2' }} GB</strong>
              a <strong>{{ usage().total_limit_gb }} GB</strong>-ból
              ({{ usage().usage_percent | number:'1.0-0' }}%)
            </p>
            <p class="popup__hint">
              Bővítsd a tárhelyedet, hogy zavartalanul folytathass!
            </p>
          </div>

          <!-- Gombok -->
          <div class="popup__actions">
            <button class="btn btn--secondary" (click)="handleDismiss()">
              Később
            </button>
            <button class="btn btn--primary" (click)="handleExpand()">
              <lucide-icon [name]="ICONS.PLUS" [size]="18" />
              Tárhely bővítése
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .popup-overlay {
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

    .popup {
      background: white;
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

    /* ============ Icon ============ */
    .popup__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning, #f59e0b);
      border-radius: 50%;
    }

    .popup__icon--danger {
      background: var(--color-danger-light, #fee2e2);
      color: var(--color-danger, #dc2626);
    }

    /* ============ Content ============ */
    .popup__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .popup__title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .popup__text {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
      line-height: 1.5;
    }

    .popup__hint {
      font-size: 0.8125rem;
      color: var(--text-tertiary, #94a3b8);
      margin: 0;
    }

    /* ============ Actions ============ */
    .popup__actions {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 8px;
    }

    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
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

    .btn--primary {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .btn--primary:hover {
      background: var(--color-primary-dark, #2563eb);
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .popup-overlay,
      .popup,
      .btn {
        animation: none;
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageWarningPopupComponent implements OnInit {
  readonly ICONS = ICONS;

  /** Tárhely használat adatok */
  usage = input.required<StorageUsage>();

  /** Bővítés gomb kattintás */
  expand = output<void>();

  /** Popup láthatóság */
  isVisible = signal(false);

  ngOnInit(): void {
    this.checkVisibility();
  }

  /**
   * Ellenőrzi, hogy megjelenjen-e a popup
   */
  private checkVisibility(): void {
    // Csak 80%+ esetén jelenik meg
    if (!this.usage().is_near_limit) {
      this.isVisible.set(false);
      return;
    }

    // Ellenőrizzük, hogy nem lett-e elutasítva 24 órán belül
    const dismissedAt = localStorage.getItem(STORAGE_WARNING_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hoursSinceDismiss = (now - dismissedTime) / (1000 * 60 * 60);

      if (hoursSinceDismiss < DISMISS_DURATION_HOURS) {
        this.isVisible.set(false);
        return;
      }
    }

    this.isVisible.set(true);
  }

  /**
   * Popup elutasítása - 24 órára megjegyzi
   */
  handleDismiss(): void {
    localStorage.setItem(STORAGE_WARNING_DISMISSED_KEY, Date.now().toString());
    this.isVisible.set(false);
  }

  /**
   * Bővítés gomb - emit és bezárás
   */
  handleExpand(): void {
    this.isVisible.set(false);
    this.expand.emit();
  }
}
