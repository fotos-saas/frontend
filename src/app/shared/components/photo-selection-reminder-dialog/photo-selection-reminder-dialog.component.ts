import { Component, output, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ReminderWorkflowStep, STEP_REMINDER_MESSAGES, StepReminderMessage } from '../../../core/services/photo-selection-reminder.service';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';

/**
 * Dialog eredmény típus
 *
 * - navigate: Navigálás a képválasztás oldalra
 * - snooze: Halasztás (12 óra)
 * - close: X gomb vagy ESC - cooldown aktív
 * - backdrop: Backdrop kattintás - NEM aktivál cooldown-t
 */
export type PhotoSelectionReminderResult =
  | { action: 'navigate' }
  | { action: 'snooze' }
  | { action: 'close' }
  | { action: 'backdrop' };

/**
 * Photo Selection Reminder Dialog
 *
 * Emlékeztető dialógus a képválasztáshoz.
 * Lépésenként más üzenetet jelenít meg:
 * - claiming: "Hahó! Ess neki a képválasztásnak!"
 * - retouch: "Ne felejtsd el a retusálást!"
 * - tablo: "Válaszd ki a tablóképed!"
 *
 * 12 órára elhalasztható.
 */
@Component({
  selector: 'app-photo-selection-reminder-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './photo-selection-reminder-dialog.component.html',
  styleUrls: ['./photo-selection-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoSelectionReminderDialogComponent {
  readonly ICONS = ICONS;

  /** Aktuális workflow lépés */
  readonly currentStep = input<ReminderWorkflowStep>('claiming');

  /** Signal-based outputs */
  readonly resultEvent = output<PhotoSelectionReminderResult>();

  /** Dinamikus üzenet a step alapján */
  readonly message = computed<StepReminderMessage>(() => {
    const step = this.currentStep();

    if (step === 'completed' || !(step in STEP_REMINDER_MESSAGES)) {
      // Fallback claiming üzenethez
      return STEP_REMINDER_MESSAGES.claiming;
    }

    return STEP_REMINDER_MESSAGES[step as Exclude<ReminderWorkflowStep, 'completed'>];
  });

  /**
   * Navigálás a képválasztás oldalra
   */
  navigateToPhotoSelection(): void {
    this.resultEvent.emit({ action: 'navigate' });
  }

  /**
   * Halasztás (12 óra)
   */
  snooze(): void {
    this.resultEvent.emit({ action: 'snooze' });
  }

  /**
   * X gomb vagy ESC - cooldown aktív
   */
  dismiss(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  /**
   * Backdrop kattintás - NEM aktivál cooldown-t
   */
  onBackdropClicked(): void {
    this.resultEvent.emit({ action: 'backdrop' });
  }
}
