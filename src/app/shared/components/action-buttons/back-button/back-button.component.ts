import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ButtonDisplay } from '../index';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="back-button"
      [disabled]="disabled()"
      (click)="clicked.emit()"
    >
      @if (display() !== 'text-only') {
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      }
      @if (display() !== 'icon-only') {
        <span>{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './back-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackButtonComponent {
  readonly display = input<ButtonDisplay>('icon-text');
  readonly label = input<string>('Vissza');
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();
}
