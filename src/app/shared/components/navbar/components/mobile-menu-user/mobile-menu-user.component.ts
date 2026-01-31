import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Mobile Menu User Component
 *
 * Megjeleníti a felhasználó/kapcsolattartó információkat a mobile menüben.
 * Kétféle mód: guest (share token) vagy contact (code token).
 */
@Component({
  selector: 'app-mobile-menu-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-menu-user.component.html',
  styleUrls: ['./mobile-menu-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileMenuUserComponent {
  /** Signal-based inputs */
  readonly displayName = input<string | null>(null);
  readonly mode = input<'guest' | 'contact'>('guest');

  /** Signal-based outputs */
  readonly editEvent = output<void>();
  readonly closeMenuEvent = output<void>();

  /** Computed signals */
  readonly labelText = computed(() =>
    this.mode() === 'contact' ? 'Kapcsolattartó' : 'Bejelentkezve'
  );

  readonly ariaLabel = computed(() =>
    this.mode() === 'contact'
      ? 'Kapcsolattartó adatok szerkesztése'
      : 'Adatok szerkesztése'
  );

  /**
   * Szerkesztés indítása és menü bezárása
   */
  onEdit(): void {
    this.editEvent.emit();
    this.closeMenuEvent.emit();
  }
}
