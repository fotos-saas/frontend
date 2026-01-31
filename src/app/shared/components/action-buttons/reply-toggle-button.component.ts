import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * ReplyToggleButtonComponent
 *
 * Válaszok megjelenítése/elrejtése gomb.
 * Ugyanolyan stílusú mint a CommentButtonComponent.
 */
@Component({
  selector: 'app-reply-toggle-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="reply-toggle-button"
      [class.reply-toggle-button--active]="expanded()"
      (click)="clicked.emit()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
      <span>{{ count() }} válasz</span>
    </button>
  `,
  styleUrl: './reply-toggle-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReplyToggleButtonComponent {
  /** Válaszok száma */
  readonly count = input.required<number>();

  /** Kinyitva van-e */
  readonly expanded = input<boolean>(false);

  /** Kattintás event */
  readonly clicked = output<void>();
}
