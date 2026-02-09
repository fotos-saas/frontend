import { Component, output, ChangeDetectionStrategy, viewChild, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Dialog eredmény típus
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
 * DialogWrapperComponent kezeli a shell-t.
 */
@Component({
  selector: 'app-schedule-reminder-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './schedule-reminder-dialog.component.html',
  styleUrls: ['./schedule-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleReminderDialogComponent {
  readonly ICONS = ICONS;

  /** Signal-based outputs */
  readonly resultEvent = output<ScheduleReminderResult>();

  private readonly logger = inject(LoggerService);

  /** Dátumválasztó megnyitva */
  isDatePickerOpen = false;

  /** ViewChild referenciák */
  readonly dateInput = viewChild<ElementRef<HTMLInputElement>>('dateInput');

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
    this.dateInput()?.nativeElement.showPicker();
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
   * Halasztás
   */
  snooze(days: number): void {
    if (!this.allowedSnoozeDays.includes(days)) {
      this.logger.warn('Invalid snooze days', days);
      return;
    }
    this.resultEvent.emit({ action: 'snooze', days });
  }

  /**
   * Formázott dátum megjelenítés (hosszú formátum)
   */
  get formattedDate(): string {
    if (!this.selectedDate) return '';
    const date = new Date(this.selectedDate);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formázott dátum megjelenítés (rövid magyar formátum)
   */
  get formattedDateShort(): string {
    if (!this.selectedDate) return '';
    const date = new Date(this.selectedDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
  }

  onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  onBackdropClicked(): void {
    this.resultEvent.emit({ action: 'backdrop' });
  }
}
