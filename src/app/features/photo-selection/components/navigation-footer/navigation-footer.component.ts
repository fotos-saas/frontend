import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';

import { WorkflowStep } from '../../models/workflow.models';

/**
 * Navigation Footer Component
 *
 * A workflow footer navigációs gombok:
 * - Vissza gomb (ha lehet visszalépni)
 * - Tovább/Véglegesítés gomb
 * - Validációs hibaüzenetek
 * - Loading állapot
 */
@Component({
  selector: 'app-navigation-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="photo-selection__footer">
      @if (showReturnButton()) {
        <!-- Readonly mód - visszatérés gomb -->
        <div class="photo-selection__nav photo-selection__nav--readonly">
          <button
            type="button"
            class="photo-selection__btn photo-selection__btn--primary"
            (click)="returnToCompleted.emit()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Vissza az összesítőhöz
          </button>
        </div>
      } @else {
        <!-- Validation message -->
        @if (validationError()) {
          <div class="photo-selection__validation" role="alert" aria-live="polite">
            {{ validationError() }}
          </div>
        }

        <!-- Navigation buttons -->
        <div class="photo-selection__nav">
          @if (canGoBack()) {
            <button
              type="button"
              class="photo-selection__btn photo-selection__btn--secondary"
              [disabled]="isSaving()"
              (click)="previousStep.emit()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
              Vissza
            </button>
          }

          <button
            type="button"
            class="photo-selection__btn photo-selection__btn--primary"
            [disabled]="!canProceed()"
            [class.photo-selection__btn--loading]="isSaving()"
            (click)="nextStep.emit()"
          >
            @if (isSaving()) {
              <span class="photo-selection__spinner"></span>
              Mentés...
            } @else if (currentStep() === 'tablo') {
              Véglegesítés
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            } @else {
              Tovább
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            }
          </button>
        </div>
      }
    </footer>
  `,
  styles: [`
    // Variables - globális CSS változók használata dark mode-hoz
    $color-primary: var(--color-primary, #3b82f6);
    $color-primary-dark: #2563eb;
    $color-error: var(--color-error, #ef4444);

    // Footer - Fixed pozícionálás, mindig a viewport alján látható
    // Ez biztosítja, hogy a "Tovább" gomb mindig elérhető legyen,
    // függetlenül a képek számától
    .photo-selection__footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      // Sidebar margó figyelembevétele
      margin-left: 0;

      @media (min-width: 768px) {
        margin-left: 60px; // md:ml-[60px] az app-shell-ben
      }

      @media (min-width: 1024px) {
        margin-left: 240px; // lg:ml-[240px] az app-shell-ben
      }

      // Page-card alsó részének gradientje - pontosan illeszkedik
      background: linear-gradient(135deg,
        rgba(248, 250, 252, 0.98) 0%,
        rgba(248, 250, 252, 0.98) 100%
      );
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 16px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); // iPhone notch
      z-index: 10;

      // Felső border a vizuális elválasztáshoz görgetéskor
      border-top: 1px solid rgba(226, 232, 240, 0.5);

      // Árnyék felfelé a vizuális elválasztáshoz
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
    }

    // Dark mode - page-card dark gradientjéhez igazítva
    @media (prefers-color-scheme: dark) {
      .photo-selection__footer {
        background: linear-gradient(135deg,
          rgba(15, 23, 42, 0.98) 0%,
          rgba(15, 23, 42, 0.98) 100%
        );
        border-top: 1px solid rgba(71, 85, 105, 0.4);
      }
    }

    // Validation message
    .photo-selection__validation {
      text-align: center;
      font-size: 13px;
      color: $color-error;
      margin-bottom: 12px;
      animation: shake 0.3s ease;
    }

    // Navigation buttons
    .photo-selection__nav {
      display: flex;
      justify-content: center;
      // Safari: margin helyett gap
      > * {
        margin: 0 6px;
      }
      > *:first-child {
        margin-left: 0;
      }
      > *:last-child {
        margin-right: 0;
      }

      &--readonly {
        justify-content: center;
      }
    }

    .photo-selection__btn {
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

      svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &--primary {
        background: $color-primary;
        color: white;

        // Ikon a szöveg UTÁN (jobbra) → margin-left
        svg {
          margin-left: 8px;
        }

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

        // Ikon a szöveg ELŐTT (balra) → margin-right
        svg {
          margin-right: 6px;
        }

        &:hover:not(:disabled) {
          background: var(--bg-secondary, #e2e8f0);
        }
      }

      &--loading {
        pointer-events: none;
      }
    }

    // Loading spinner
    .photo-selection__spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    // Reduced motion
    @media (prefers-reduced-motion: reduce) {
      .photo-selection__validation {
        animation: none;
      }
      .photo-selection__spinner {
        animation-duration: 1.5s;
      }
      .photo-selection__btn {
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationFooterComponent {
  /** Aktuális lépés */
  readonly currentStep = input.required<WorkflowStep>();

  /** Lehet-e visszalépni */
  readonly canGoBack = input.required<boolean>();

  /** Lehet-e továbblépni */
  readonly canProceed = input.required<boolean>();

  /** Mentés folyamatban */
  readonly isSaving = input.required<boolean>();

  /** Validációs hibaüzenet */
  readonly validationError = input<string | null>(null);

  /** Visszatérés gomb megjelenítése (finalized + viewing step) */
  readonly showReturnButton = input<boolean>(false);

  /** Előző lépés event */
  readonly previousStep = output<void>();

  /** Következő lépés event */
  readonly nextStep = output<void>();

  /** Visszatérés az összesítőhöz event */
  readonly returnToCompleted = output<void>();
}
