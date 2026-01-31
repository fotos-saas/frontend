import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

/**
 * Sticky Footer Component
 *
 * Újrafelhasználható sticky footer mentés/véglegesítés gombokkal.
 * Használható a photo-selection és client modulokban is.
 */
@Component({
  selector: 'app-sticky-footer',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <footer class="sticky-footer" [class.sticky-footer--with-sidebar]="withSidebar()">
      <div class="sticky-footer__content">
        <!-- Másodlagos gomb (Mentés) -->
        @if (showSecondaryButton()) {
          <button
            type="button"
            class="sticky-footer__btn sticky-footer__btn--secondary"
            [disabled]="isSaving() || secondaryDisabled()"
            (click)="secondaryClick.emit()"
          >
            @if (isSaving()) {
              <span class="sticky-footer__spinner"></span>
            } @else {
              <lucide-icon [name]="ICONS.SAVE" [size]="18"></lucide-icon>
            }
            {{ secondaryLabel() }}
          </button>
        }

        <!-- Elsődleges gomb (Véglegesítés) -->
        <button
          type="button"
          class="sticky-footer__btn sticky-footer__btn--primary"
          [disabled]="isSaving() || primaryDisabled()"
          (click)="primaryClick.emit()"
        >
          @if (isSaving() && !showSecondaryButton()) {
            <span class="sticky-footer__spinner"></span>
            Mentés...
          } @else {
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="18"></lucide-icon>
            {{ primaryLabel() }}
          }
        </button>
      </div>
    </footer>
  `,
  styles: [`
    $color-primary: var(--color-primary, #3b82f6);
    $color-primary-dark: #2563eb;

    .sticky-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;

      background: linear-gradient(135deg,
        rgba(248, 250, 252, 0.98) 0%,
        rgba(248, 250, 252, 0.98) 100%
      );
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 16px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      z-index: 10;

      border-top: 1px solid rgba(226, 232, 240, 0.5);
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);

      // Sidebar margó ha kell
      &--with-sidebar {
        @media (min-width: 768px) {
          margin-left: 60px;
        }

        @media (min-width: 1024px) {
          margin-left: 240px;
        }
      }
    }

    // Dark mode
    @media (prefers-color-scheme: dark) {
      .sticky-footer {
        background: linear-gradient(135deg,
          rgba(15, 23, 42, 0.98) 0%,
          rgba(15, 23, 42, 0.98) 100%
        );
        border-top: 1px solid rgba(71, 85, 105, 0.4);
      }
    }

    .sticky-footer__content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      // Safari: gap helyett margin
      > * {
        margin: 0 6px;
      }
      > *:first-child {
        margin-left: 0;
      }
      > *:last-child {
        margin-right: 0;
      }
    }

    .sticky-footer__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 120px;

      lucide-icon {
        margin-right: 8px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &--primary {
        background: $color-primary;
        color: white;

        &:hover:not(:disabled) {
          background: $color-primary-dark;
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      }

      &--secondary {
        background: var(--bg-tertiary, #f1f5f9);
        color: var(--text-secondary, #475569);

        &:hover:not(:disabled) {
          background: var(--bg-secondary, #e2e8f0);
        }
      }
    }

    .sticky-footer__spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    // Secondary spinner más színnel
    .sticky-footer__btn--secondary .sticky-footer__spinner {
      border-color: rgba(71, 85, 105, 0.3);
      border-top-color: var(--text-secondary, #475569);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .sticky-footer__spinner {
        animation-duration: 1.5s;
      }
      .sticky-footer__btn {
        transition-duration: 0.01ms !important;
      }
    }

    // Mobile
    @media (max-width: 640px) {
      .sticky-footer__content {
        flex-direction: column;
        > * {
          margin: 4px 0;
        }
      }

      .sticky-footer__btn {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyFooterComponent {
  protected readonly ICONS = ICONS;

  /** Sidebar figyelembevétele (partner modul) */
  readonly withSidebar = input<boolean>(false);

  /** Mentés folyamatban */
  readonly isSaving = input<boolean>(false);

  /** Elsődleges gomb szöveg */
  readonly primaryLabel = input<string>('Véglegesítés');

  /** Elsődleges gomb letiltva */
  readonly primaryDisabled = input<boolean>(false);

  /** Másodlagos gomb megjelenítése */
  readonly showSecondaryButton = input<boolean>(true);

  /** Másodlagos gomb szöveg */
  readonly secondaryLabel = input<string>('Mentés');

  /** Másodlagos gomb letiltva */
  readonly secondaryDisabled = input<boolean>(false);

  /** Elsődleges gomb kattintás */
  readonly primaryClick = output<void>();

  /** Másodlagos gomb kattintás */
  readonly secondaryClick = output<void>();
}
