import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ButtonDisplay } from '../index';

@Component({
  selector: 'app-expand-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="expand-button"
      [disabled]="disabled()"
      [attr.aria-expanded]="expanded()"
      (click)="clicked.emit()"
    >
      @if (display() !== 'text-only') {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          [class.expand-button__icon--rotated]="expanded()"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      }
      @if (display() !== 'icon-only') {
        <span>{{ currentLabel() }}</span>
      }
    </button>
  `,
  styleUrl: './expand-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandButtonComponent {
  readonly display = input<ButtonDisplay>('icon-text');
  readonly expanded = input<boolean>(false);
  readonly expandLabel = input<string>('Tovább olvasom');
  readonly collapseLabel = input<string>('Kevesebb');
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();

  readonly currentLabel = computed(() =>
    this.expanded() ? this.collapseLabel() : this.expandLabel()
  );
}
