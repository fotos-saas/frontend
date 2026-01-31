import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Toast Component
 *
 * Globális toast értesítések megjelenítése.
 * Az AppComponent-be kell beilleszteni.
 *
 * MEGJEGYZÉS: OnPush + Signal használata automatikusan kezeli a change detection-t.
 * NINCS szükség ApplicationRef.tick() hívásra - az infinite loop-ot okozott (NG0101)!
 */
@Component({
    selector: 'app-toast',
    imports: [CommonModule],
    template: `
    @if (toast(); as t) {
      <div
        class="toast"
        [class.toast--visible]="t.visible"
        [class.toast--success]="t.type === 'success'"
        [class.toast--error]="t.type === 'error'"
        [class.toast--info]="t.type === 'info'"
        [class.toast--warning]="t.type === 'warning'"
        (click)="hide()"
        role="alert"
        aria-live="polite"
      >
        <div class="toast__icon">
          @if (t.type === 'success') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
          @if (t.type === 'error') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          @if (t.type === 'info') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" />
              <path stroke-linecap="round" d="M12 16v-4M12 8h.01" />
            </svg>
          }
          @if (t.type === 'warning') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        </div>
        <div class="toast__content">
          <div class="toast__title">{{ t.title }}</div>
          <div class="toast__message">{{ t.message }}</div>
        </div>
        <button class="toast__close" aria-label="Bezárás">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }
  `,
    styles: [`
    .toast {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: var(--z-toast);
      display: flex;
      align-items: flex-start;
      // Safari-safe: margin instead of gap
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      min-width: 280px;
      max-width: 380px;
      cursor: pointer;
      transform: translateY(120%);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
      border: 1px solid #e5e7eb;
    }

    .toast--visible {
      transform: translateY(0);
      opacity: 1;
    }

    .toast__icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-right: 0.75rem;

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .toast--success .toast__icon {
      background: #d1fae5;
      color: #059669;
    }

    .toast--error .toast__icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .toast--info .toast__icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .toast--warning .toast__icon {
      background: #fef3c7;
      color: #d97706;
    }

    .toast__content {
      flex: 1;
      min-width: 0;
      margin-right: 0.5rem;
    }

    .toast__title {
      font-weight: 600;
      font-size: 0.9375rem;
      color: #1f2937;
      margin-bottom: 0.125rem;
    }

    .toast__message {
      font-size: 0.8125rem;
      color: #6b7280;
      word-break: break-all;
    }

    .toast__close {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
      padding: 0;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: #f3f4f6;
        color: #6b7280;
      }
    }

    /* Mobile */
    @media (max-width: 480px) {
      .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        min-width: 0;
        max-width: none;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);

  /** Toast signal - közvetlenül a service-ből */
  readonly toast = this.toastService.toast;

  /** Toast elrejtése */
  hide(): void {
    this.toastService.hide();
  }
}
