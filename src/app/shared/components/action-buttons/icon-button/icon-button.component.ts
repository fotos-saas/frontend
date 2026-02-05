import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { ButtonDisplay } from '../index';

/**
 * Button variánsok (szín séma)
 */
export type ButtonVariant = 'default' | 'danger' | 'primary' | 'success';

/**
 * Generikus IconButton komponens
 *
 * Használat:
 * <app-icon-button
 *   icon="trash-2"
 *   label="Törlés"
 *   variant="danger"
 *   (clicked)="onDelete()"
 * />
 *
 * Kiváltja a következő komponenseket:
 * - DeleteButtonComponent (icon="trash-2", variant="danger")
 * - EditButtonComponent (icon="pencil", variant="default")
 * - ReplyButtonComponent (icon="reply", variant="primary")
 * - CommentButtonComponent (icon="message-circle", variant="default")
 * - AddButtonComponent (icon="plus", variant="primary")
 */
@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      class="icon-button"
      [class.icon-button--danger]="variant() === 'danger'"
      [class.icon-button--primary]="variant() === 'primary'"
      [class.icon-button--success]="variant() === 'success'"
      [disabled]="disabled()"
      (click)="clicked.emit()"
    >
      @if (display() !== 'text-only') {
        <lucide-icon [name]="icon()" [size]="size()" />
      }
      @if (display() !== 'icon-only' && label()) {
        <span>{{ label() }}</span>
      }
    </button>
  `,
  styles: [`
    .icon-button {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      background: none;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        color: #111827;
        background: #f3f4f6;
      }

      // Danger variant (delete, remove)
      &--danger:hover:not(:disabled) {
        color: #ef4444;
        background: #fef2f2;
      }

      // Primary variant (reply, add)
      &--primary:hover:not(:disabled) {
        color: #3b82f6;
        background: #eff6ff;
      }

      // Success variant (confirm, save)
      &--success:hover:not(:disabled) {
        color: #10b981;
        background: #ecfdf5;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconButtonComponent {
  /** Lucide ikon neve */
  readonly icon = input.required<string>();

  /** Gomb felirata */
  readonly label = input<string>('');

  /** Megjelenítési mód */
  readonly display = input<ButtonDisplay>('icon-only');

  /** Szín variáns */
  readonly variant = input<ButtonVariant>('default');

  /** Ikon mérete pixelben */
  readonly size = input<number>(14);

  /** Letiltott állapot */
  readonly disabled = input<boolean>(false);

  /** Kattintás esemény */
  readonly clicked = output<void>();
}
