import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
/**
 * Zoom controls component for lightbox
 *
 * Displays zoom buttons (+, -, reset) with percentage indicator.
 * Glassmorphism design to match lightbox meta bar.
 */
@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [],
  template: `
    <div class="zoom-controls" role="toolbar" aria-label="Képnagyítás vezérlők">
      <!-- Zoom out -->
      <button
        type="button"
        class="zoom-controls__btn"
        [class.zoom-controls__btn--disabled]="isZoomOutDisabled()"
        [disabled]="isZoomOutDisabled()"
        (click)="zoomOutEvent.emit()"
        aria-label="Kicsinyítés"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <!-- Percentage -->
      <span class="zoom-controls__percentage" role="status" aria-live="polite">
        {{ zoomPercentage() }}%
      </span>

      <!-- Zoom in -->
      <button
        type="button"
        class="zoom-controls__btn"
        [class.zoom-controls__btn--disabled]="isZoomInDisabled()"
        [disabled]="isZoomInDisabled()"
        (click)="zoomInEvent.emit()"
        aria-label="Nagyítás"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <!-- Reset -->
      <button
        type="button"
        class="zoom-controls__reset"
        [class.zoom-controls__reset--disabled]="isResetDisabled()"
        [disabled]="isResetDisabled()"
        (click)="resetZoomEvent.emit()"
        aria-label="Eredeti méret"
      >
        1:1
      </button>
    </div>
  `,
  styles: [`
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(17, 24, 39, 0.75);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 0.35rem 0.5rem;
    }

    .zoom-controls__btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      transition: background 0.15s;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
      }

      &--disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .zoom-controls__percentage {
      min-width: 42px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      user-select: none;
    }

    .zoom-controls__reset {
      padding: 0.25rem 0.5rem;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 6px;
      color: rgba(147, 197, 253, 1);
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      margin-left: 0.25rem;

      &:hover:not(:disabled) {
        background: rgba(59, 130, 246, 0.3);
      }

      &--disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZoomControlsComponent {
  /** Signal-based inputs */
  readonly currentZoom = input<number>(1);
  readonly minZoom = input<number>(1);
  readonly maxZoom = input<number>(3);

  /** Signal-based outputs */
  readonly zoomInEvent = output<void>();
  readonly zoomOutEvent = output<void>();
  readonly resetZoomEvent = output<void>();

  /** Computed signals */
  readonly zoomPercentage = computed(() => Math.round(this.currentZoom() * 100));
  readonly isZoomInDisabled = computed(() => this.currentZoom() >= this.maxZoom());
  readonly isZoomOutDisabled = computed(() => this.currentZoom() <= this.minZoom());
  readonly isResetDisabled = computed(() => this.currentZoom() === 1);
}
