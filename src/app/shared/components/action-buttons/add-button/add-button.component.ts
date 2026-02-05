import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import type { ButtonDisplay } from '../index';

/**
 * Add/Plus button komponens.
 * Egységes "Új" / "Hozzáadás" gomb az egész alkalmazásban.
 *
 * @example
 * <app-add-button
 *   [label]="'Új projekt'"
 *   [variant]="'primary'"
 *   (clicked)="createProject()"
 * />
 */
@Component({
  selector: 'app-add-button',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      class="add-button"
      [class.add-button--primary]="variant() === 'primary'"
      [class.add-button--compact]="variant() === 'compact'"
      [class.add-button--ghost]="variant() === 'ghost'"
      [disabled]="disabled()"
      (click)="clicked.emit()"
    >
      <lucide-icon [name]="ICONS.PLUS" [size]="size()" />
      @if (display() !== 'icon-only') {
        <span>{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './add-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddButtonComponent {
  readonly ICONS = ICONS;

  /** Gomb megjelenés: primary (kitöltött), compact (kisebb), ghost (áttetsző) */
  readonly variant = input<'primary' | 'compact' | 'ghost'>('primary');

  /** Ikon méret pixelben */
  readonly size = input(18);

  /** Gomb szöveg */
  readonly label = input('Új');

  /** Szöveg megjelenítés módja */
  readonly display = input<ButtonDisplay>('icon-text');

  /** Letiltott állapot */
  readonly disabled = input(false);

  /** Kattintás esemény */
  readonly clicked = output<void>();
}
