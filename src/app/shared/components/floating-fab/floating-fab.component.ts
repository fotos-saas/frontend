import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  HostListener,
  ElementRef,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Floating FAB Component
 *
 * Újrafelhasználható FAB (Floating Action Button) gomb,
 * ami kattintásra kinyit egy panelt.
 *
 * Használat:
 * ```html
 * <app-floating-fab icon="info" color="purple">
 *   <div class="my-content">...</div>
 * </app-floating-fab>
 * ```
 */
@Component({
  selector: 'app-floating-fab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FAB gomb -->
    <button
      type="button"
      (click)="toggle(); $event.stopPropagation()"
      class="fab-button"
      [class.is-open]="isOpen()"
      [class.fab-button--purple]="color() === 'purple'"
      [class.fab-button--blue]="color() === 'blue'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-label]="ariaLabel()"
      aria-haspopup="dialog"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="fab-icon"
        [class.rotate]="isOpen()"
      >
        @if (isOpen()) {
          <!-- X ikon -->
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        } @else {
          @switch (icon()) {
            @case ('info') {
              <!-- Info ikon -->
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            }
            @case ('question') {
              <!-- Kérdőjel ikon -->
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            }
            @default {
              <!-- Info ikon (default) -->
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            }
          }
        }
      </svg>
    </button>

    <!-- Panel -->
    @if (isOpen()) {
      <div
        class="fab-panel"
        [class.fab-panel--wide]="panelWidth() === 'wide'"
        role="dialog"
        [attr.aria-label]="ariaLabel()"
      >
        <ng-content></ng-content>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 120px;
      right: 24px;
      z-index: 50;
    }

    /* FAB gomb */
    .fab-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &--purple {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        box-shadow:
          0 4px 14px rgba(124, 58, 237, 0.4),
          0 2px 6px rgba(0, 0, 0, 0.15);

        &:hover {
          box-shadow:
            0 6px 20px rgba(124, 58, 237, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.2);
        }
      }

      &--blue {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        box-shadow:
          0 4px 14px rgba(59, 130, 246, 0.4),
          0 2px 6px rgba(0, 0, 0, 0.15);

        &:hover {
          box-shadow:
            0 6px 20px rgba(59, 130, 246, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.2);
        }
      }

      &:hover {
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.98);
      }

      &:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
      }

      &.is-open {
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        box-shadow:
          0 4px 14px rgba(100, 116, 139, 0.4),
          0 2px 6px rgba(0, 0, 0, 0.15);
      }
    }

    .fab-icon {
      transition: transform 0.3s ease;

      &.rotate {
        transform: rotate(90deg);
      }
    }

    /* Panel */
    .fab-panel {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow:
        0 10px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 16px;
      animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      /* Glassmorphism */
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);

      &--wide {
        width: 320px;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Mobil */
    @media (max-width: 640px) {
      :host {
        bottom: 140px; /* Feljebb a sticky footer miatt */
        right: 16px;
      }

      .fab-button {
        width: 48px;
        height: 48px;
      }

      .fab-panel {
        width: calc(100vw - 32px);
        max-width: 320px;
        bottom: 60px;
      }
    }

    /* A11y - Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .fab-button,
      .fab-icon,
      .fab-panel {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingFabComponent {
  private readonly elementRef = inject(ElementRef);

  /** Ikon típusa */
  readonly icon = input<'info' | 'question'>('info');

  /** Szín */
  readonly color = input<'purple' | 'blue'>('blue');

  /** Panel szélesség */
  readonly panelWidth = input<'normal' | 'wide'>('normal');

  /** Aria label */
  readonly ariaLabel = input<string>('Információ');

  /** Panel nyitva/zárva */
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
