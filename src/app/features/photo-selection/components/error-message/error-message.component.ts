import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';

/**
 * Error Message Component
 *
 * Hibaüzenet megjelenítése bezárás gombbal.
 */
@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [],
  template: `
    <div class="photo-selection__error" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span>{{ message() }}</span>
      <button
        type="button"
        class="photo-selection__error-close"
        (click)="closeEvent.emit()"
        aria-label="Bezárás"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorMessageComponent {
  /** Hibaüzenet szövege */
  readonly message = input.required<string>();

  /** Bezárás event */
  readonly closeEvent = output<void>();
}
