import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { SubscriptionInfo } from '../../../../services/subscription.service';
import { ICONS } from '../../../../../../shared/constants/icons.constants';

/**
 * Subscription Actions Component
 *
 * Előfizetés műveletek: szüneteltetés, lemondás, folytatás.
 */
@Component({
  selector: 'app-subscription-actions',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="subscription-actions">
      @switch (info().status) {
        @case ('active') {
          <div class="action-group">
            <button
              class="btn btn--warning"
              (click)="onPause.emit()"
              [disabled]="isActionLoading()"
            >
              <lucide-icon [name]="ICONS.PAUSE_CIRCLE" [size]="18" />
              Szüneteltetés
            </button>
            <p class="action-hint">
              Szüneteltetés alatt csökkentett árat fizetsz, de nem tudsz új projekteket létrehozni.
            </p>
          </div>

          <div class="action-group">
            <button
              class="btn btn--outline-danger"
              (click)="onCancel.emit()"
              [disabled]="isActionLoading()"
            >
              <lucide-icon [name]="ICONS.X_CIRCLE" [size]="18" />
              Előfizetés lemondása
            </button>
            <p class="action-hint">
              Az előfizetés a jelenlegi időszak végéig aktív marad.
            </p>
          </div>
        }

        @case ('paused') {
          <div class="action-group">
            <button
              class="btn btn--primary"
              (click)="onUnpause.emit()"
              [disabled]="isActionLoading()"
            >
              <lucide-icon [name]="ICONS.PLAY_CIRCLE" [size]="18" />
              Szüneteltetés feloldása
            </button>
            <p class="action-hint">
              Az előfizetésed újra teljes funkcionalitással fog működni.
            </p>
          </div>

          <div class="action-group">
            <button
              class="btn btn--outline-danger"
              (click)="onCancel.emit()"
              [disabled]="isActionLoading()"
            >
              <lucide-icon [name]="ICONS.X_CIRCLE" [size]="18" />
              Előfizetés lemondása
            </button>
          </div>
        }

        @case ('canceling') {
          <div class="action-group">
            <div class="info-box info-box--warning">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="20" />
              <div>
                <strong>Előfizetés lemondva</strong>
                <p>Az előfizetésed a jelenlegi időszak végén lejár.</p>
              </div>
            </div>
            <button
              class="btn btn--primary"
              (click)="onResume.emit()"
              [disabled]="isActionLoading()"
            >
              <lucide-icon [name]="ICONS.REFRESH" [size]="18" />
              Lemondás visszavonása
            </button>
          </div>
        }

        @case ('trial') {
          <div class="action-group">
            <div class="info-box info-box--info">
              <lucide-icon [name]="ICONS.INFO" [size]="20" />
              <div>
                <strong>Próbaidőszak</strong>
                <p>A próbaidőszak végén automatikusan aktiválódik az előfizetésed.</p>
              </div>
            </div>
          </div>
        }

        @case ('canceled') {
          <div class="action-group">
            <div class="info-box info-box--danger">
              <lucide-icon [name]="ICONS.X_CIRCLE" [size]="20" />
              <div>
                <strong>Előfizetés lejárt</strong>
                <p>Az előfizetésed lejárt. Új csomag aktiválásához kattints az alábbi gombra.</p>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .subscription-actions {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .action-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-hint {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    /* ============ Buttons ============ */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      width: fit-content;
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

    .btn--warning {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
      border: 1px solid var(--color-warning, #f59e0b);
    }

    .btn--warning:hover:not(:disabled) {
      background: var(--color-warning, #f59e0b);
      color: white;
    }

    .btn--outline-danger {
      background: transparent;
      color: var(--color-danger, #dc2626);
      border: 1px solid var(--color-danger, #dc2626);
    }

    .btn--outline-danger:hover:not(:disabled) {
      background: var(--color-danger, #dc2626);
      color: white;
    }

    /* ============ Info Box ============ */
    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
    }

    .info-box strong {
      display: block;
      margin-bottom: 4px;
    }

    .info-box p {
      margin: 0;
      font-size: 0.875rem;
    }

    .info-box--warning {
      background: var(--color-warning-light, #fef3c7);
      color: var(--color-warning-dark, #92400e);
    }

    .info-box--info {
      background: var(--color-info-light, #dbeafe);
      color: var(--color-info-dark, #1e40af);
    }

    .info-box--danger {
      background: var(--color-danger-light, #fee2e2);
      color: var(--color-danger-dark, #991b1b);
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .btn {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionActionsComponent {
  info = input.required<SubscriptionInfo>();
  isActionLoading = input<boolean>(false);

  onPause = output<void>();
  onUnpause = output<void>();
  onCancel = output<void>();
  onResume = output<void>();

  protected readonly ICONS = ICONS;
}
