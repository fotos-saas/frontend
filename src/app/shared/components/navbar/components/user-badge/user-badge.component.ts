import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * User Badge Component
 *
 * Megjeleníti a regisztrált vendég nevét (share token esetén).
 * Kattintható badge, ami a GuestNameDialog megnyitását triggeri.
 */
@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-badge.component.html',
  styleUrls: ['./user-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserBadgeComponent {
  /** Signal-based inputs */
  readonly displayName = input<string | null>(null);

  /** Signal-based outputs */
  readonly editEvent = output<void>();

  /**
   * Szerkesztés indítása
   */
  onEdit(): void {
    this.editEvent.emit();
  }
}
