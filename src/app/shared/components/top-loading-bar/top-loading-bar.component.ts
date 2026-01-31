import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationLoadingService } from '../../../core/services/navigation-loading.service';

/**
 * TopLoadingBar Component
 *
 * Vékony progress bar a képernyő tetején, ami navigáció közben jelenik meg.
 * Animált gradient effekt jelzi a betöltést.
 *
 * Features:
 * - Automatikus megjelenés navigáció közben
 * - Animált gradient shimmer
 * - prefers-reduced-motion támogatás
 * - Fixed pozíció, mindig látható
 */
@Component({
  selector: 'app-top-loading-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div
        class="top-loading-bar"
        role="progressbar"
        aria-label="Oldal betöltése"
        aria-valuetext="Betöltés folyamatban"
      >
        <div class="top-loading-bar__progress"></div>
      </div>
    }
  `,
  styles: [`
    .top-loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: var(--z-toast, 70000);
      background: rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .top-loading-bar__progress {
      height: 100%;
      width: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        #6366f1 20%,
        #a855f7 40%,
        #ec4899 60%,
        #6366f1 80%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: loadingShimmer 1.5s ease-in-out infinite;
    }

    @keyframes loadingShimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* prefers-reduced-motion - statikus progress bar */
    @media (prefers-reduced-motion: reduce) {
      .top-loading-bar__progress {
        animation: none;
        background: linear-gradient(
          90deg,
          #6366f1 0%,
          #a855f7 50%,
          #ec4899 100%
        );
        background-size: 100% 100%;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .top-loading-bar {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopLoadingBarComponent {
  private readonly navigationLoading = inject(NavigationLoadingService);

  /** Látható-e a loading bar */
  readonly isVisible = computed(() => this.navigationLoading.isNavigating());
}
