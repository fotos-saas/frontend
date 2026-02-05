import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
/**
 * Schedule Card Component
 * Fotózás időpontja kártya - BEM naming convention
 *
 * Támogatott állapotok:
 * - Success (kitöltött): zöld háttér, checkmark ikon
 * - Warning (üres): sárga háttér, naptár ikon
 * - Loading: pulse animáció
 * - Disabled: szürke, inaktív
 */

export interface ScheduleCardState {
  isSuccess: boolean;
  value: string | null;
  isLoading: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-schedule-card',
  standalone: true,
  imports: [],
  templateUrl: './schedule-card.component.html',
  styleUrl: './schedule-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCardComponent {
  /** Signal-based inputs */
  readonly value = input<string | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly isDisabled = input<boolean>(false);
  readonly label = input<string>('Fotózás időpontja');
  readonly customStatusText = input<string | null>(null);

  /** Signal-based outputs */
  readonly editClickEvent = output<void>();
  readonly cardClickEvent = output<void>();

  /** Computed: success state - true ha van érték */
  readonly isSuccess = computed(() => !!this.value());

  /** Computed: status szöveg - Automatikus vagy custom */
  readonly statusText = computed(() => {
    const custom = this.customStatusText();
    if (custom) return custom;
    return this.isSuccess() ? 'Rögzítve' : 'Kötelező kitölteni';
  });

  /** Computed: display érték - 'Még nincs időpont' ha üres */
  readonly displayValue = computed(() => this.value() || 'Még nincs időpont');

  /** Computed: BEM modifier classes */
  readonly bemModifier = computed(() => {
    if (this.isLoading()) return '--loading';
    if (this.isDisabled()) return '--disabled';
    if (this.isSuccess()) return '--success';
    return '--warning';
  });

  /**
   * Event: Edit button kattintás
   */
  onEditClick(event: Event): void {
    event.stopPropagation();
    if (!this.isDisabled()) {
      this.editClickEvent.emit();
    }
  }

  /**
   * Event: Card kattintás
   */
  onCardClick(): void {
    if (!this.isDisabled()) {
      this.cardClickEvent.emit();
      this.onEditClick(new Event('click'));
    }
  }
}
