import { Component, output, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Dialog eredmény típus
 *
 * - save: Dátum mentése
 * - snooze: Halasztás (7 vagy 21 nap)
 * - close: X gomb vagy ESC - cooldown aktív
 * - backdrop: Backdrop kattintás - NEM aktivál cooldown-t
 */
export type ScheduleReminderResult =
  | { action: 'save'; date: string }
  | { action: 'snooze'; days: number }
  | { action: 'close' }
  | { action: 'backdrop' };

/**
 * Schedule Reminder Dialog
 *
 * Emlékeztető dialógus a fotózás időpontjának megadásához.
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-schedule-reminder-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-reminder-dialog.component.html',
  styleUrls: ['./schedule-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleReminderDialogComponent extends BaseDialogComponent implements AfterViewInit {
  /** Signal-based outputs */
  readonly resultEvent = output<ScheduleReminderResult>();

  private readonly logger = inject(LoggerService);

  /** Dátumválasztó megnyitva */
  isDatePickerOpen = false;

  /** ViewChild referencia a focus management-hez */
  @ViewChild('dateToggleButton') dateToggleButton?: ElementRef<HTMLButtonElement>;

  /** ViewChild referencia a date input-hoz */
  @ViewChild('dateInput') dateInput?: ElementRef<HTMLInputElement>;

  /** Kiválasztott dátum */
  selectedDate: string = '';

  /** Minimum dátum (ma) */
  minDate: string = new Date().toISOString().split('T')[0];

  /** Maximum dátum (1 év múlva) */
  maxDate: string = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString().split('T')[0];

  /** Mentés folyamatban */
  isSaving = false;

  /** Engedélyezett snooze napok */
  private readonly allowedSnoozeDays = [7, 21];

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus a dátum választó gombra
    setTimeout(() => {
      this.dateToggleButton?.nativeElement.focus();
    }, 100);
  }

  /**
   * Dátumválasztó toggle
   */
  toggleDatePicker(): void {
    this.isDatePickerOpen = !this.isDatePickerOpen;
  }

  /**
   * Dátumválasztó megnyitása (natív picker)
   */
  openDatePicker(): void {
    this.dateInput?.nativeElement.showPicker();
  }

  /**
   * Dátum mentése
   */
  saveDate(): void {
    if (this.selectedDate && !this.isSaving) {
      this.isSaving = true;
      this.resultEvent.emit({ action: 'save', date: this.selectedDate });
    }
  }

  /**
   * Halasztás (2 hét vagy 1 hónap)
   */
  snooze(days: number): void {
    if (!this.allowedSnoozeDays.includes(days)) {
      this.logger.warn('Invalid snooze days', days);
      return;
    }
    this.resultEvent.emit({ action: 'snooze', days });
  }

  /**
   * Formázott dátum megjelenítés (hosszú formátum a toggle gombhoz)
   */
  get formattedDate(): string {
    if (!this.selectedDate) {
      return '';
    }
    const date = new Date(this.selectedDate);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formázott dátum megjelenítés (rövid magyar formátum: ÉÉÉÉ.HH.NN.)
   */
  get formattedDateShort(): string {
    if (!this.selectedDate) {
      return '';
    }
    const date = new Date(this.selectedDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
  }

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    this.saveDate();
  }

  protected onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  /**
   * Backdrop kattintás - NEM aktivál cooldown-t
   * Override a BaseDialogComponent-ből
   */
  override onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isBackdrop = target.classList.contains('dialog-backdrop') ||
                       target.classList.contains('dialog-overlay');

    if (!this._isSubmitting() && isBackdrop) {
      // Backdrop kattintás: külön action, nincs cooldown
      this.resultEvent.emit({ action: 'backdrop' });
    }
  }
}
