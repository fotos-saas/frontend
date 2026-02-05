import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
/**
 * Contact Badge Component
 *
 * Megjeleníti a kapcsolattartó nevét (code token esetén).
 * Kattintható badge, ami a ContactEditDialog megnyitását triggeri.
 */
@Component({
  selector: 'app-contact-badge',
  standalone: true,
  imports: [],
  templateUrl: './contact-badge.component.html',
  styleUrls: ['./contact-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactBadgeComponent {
  /** Signal-based inputs */
  readonly contactName = input<string | null>(null);

  /** Signal-based outputs */
  readonly editEvent = output<void>();

  /**
   * Szerkesztés indítása
   */
  onEdit(): void {
    this.editEvent.emit();
  }
}
