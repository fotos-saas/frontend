import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ButtonDisplay } from '../index';

@Component({
  selector: 'app-reply-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="reply-button"
      [disabled]="disabled()"
      (click)="clicked.emit()"
    >
      @if (display() !== 'text-only') {
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
      }
      @if (display() !== 'icon-only') {
        <span>{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './reply-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReplyButtonComponent {
  readonly display = input<ButtonDisplay>('icon-text');
  readonly label = input<string>('Válasz');
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();
}
