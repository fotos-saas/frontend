import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import type { ButtonDisplay } from '../index';

/**
 * QR Code button komponens.
 * Egységes QR kód gomb az egész alkalmazásban.
 *
 * @example
 * <app-qr-button
 *   [isActive]="project.hasActiveQrCode"
 *   [variant]="'icon-only'"
 *   (clicked)="openQrModal()"
 * />
 */
@Component({
  selector: 'app-qr-button',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      class="qr-button"
      [class.qr-button--primary]="variant() === 'primary'"
      [class.qr-button--ghost]="variant() === 'ghost'"
      [class.qr-button--icon-only]="variant() === 'icon-only'"
      [class.qr-button--active]="isActive()"
      [disabled]="disabled()"
      (click)="clicked.emit()"
      [title]="isActive() ? 'QR kód megtekintése' : 'QR kód generálása'"
    >
      <lucide-icon [name]="ICONS.QR_CODE" [size]="size()" />
      @if (variant() !== 'icon-only' && display() !== 'icon-only') {
        <span>{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './qr-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrButtonComponent {
  readonly ICONS = ICONS;

  /** Van-e aktív QR kód a projekthez */
  readonly isActive = input(false);

  /** Gomb megjelenés: primary (kitöltött), ghost (áttetsző), icon-only (csak ikon) */
  readonly variant = input<'primary' | 'ghost' | 'icon-only'>('icon-only');

  /** Ikon méret pixelben */
  readonly size = input(18);

  /** Gomb szöveg (ha display nem 'icon-only') */
  readonly label = input('QR Kód');

  /** Szöveg megjelenítés módja */
  readonly display = input<ButtonDisplay>('icon-text');

  /** Letiltott állapot */
  readonly disabled = input(false);

  /** Kattintás esemény */
  readonly clicked = output<void>();
}
