import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { WizardStep } from '../wizard.types';

/**
 * Wizard footer - navigációs gombok.
 */
@Component({
  selector: 'app-wizard-footer',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="wizard-footer">
      <button
        type="button"
        class="btn btn--secondary"
        [disabled]="processing()"
        (click)="back.emit()"
      >
        <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
        {{ backLabel() }}
      </button>

      <div class="footer-spacer"></div>

      @if (showContinue()) {
        <button
          type="button"
          class="btn btn--primary"
          [disabled]="!canContinue() || processing()"
          (click)="continue.emit()"
        >
          @if (processing()) {
            <span class="spinner"></span>
          }
          {{ continueLabel() }}
          @if (!processing() && showArrow()) {
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .wizard-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0 0 16px 16px;
    }

    .footer-spacer {
      flex: 1;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn--primary {
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #152a45);
    }

    .btn--secondary {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .btn--secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .wizard-footer {
        padding: 12px 16px;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn {
        padding: 8px 12px;
        font-size: 0.8125rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardFooterComponent {
  readonly ICONS = ICONS;

  readonly backLabel = input<string>('Vissza');
  readonly continueLabel = input<string>('Tovább');
  readonly showContinue = input<boolean>(true);
  readonly showArrow = input<boolean>(true);
  readonly canContinue = input<boolean>(true);
  readonly processing = input<boolean>(false);

  readonly back = output<void>();
  readonly continue = output<void>();
}
