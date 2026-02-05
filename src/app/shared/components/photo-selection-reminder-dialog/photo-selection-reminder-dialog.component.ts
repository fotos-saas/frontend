import { Component, output, input, computed, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { ReminderWorkflowStep, STEP_REMINDER_MESSAGES, StepReminderMessage } from '../../../core/services/photo-selection-reminder.service';

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
  imports: [],
  templateUrl: './photo-selection-reminder-dialog.component.html',
  styleUrls: ['./photo-selection-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoSelectionReminderDialogComponent extends BaseDialogComponent implements AfterViewInit {
  /** Aktuális workflow lépés */
  readonly currentStep = input<ReminderWorkflowStep>('claiming');

  /** Signal-based outputs */
  readonly resultEvent = output<PhotoSelectionReminderResult>();

  /** ViewChild referencia a focus management-hez */
  @ViewChild('primaryButton') primaryButton?: ElementRef<HTMLButtonElement>;

  /** Dinamikus üzenet a step alapján */
  readonly message = computed<StepReminderMessage>(() => {
    const step = this.currentStep();

    if (step === 'completed' || !(step in STEP_REMINDER_MESSAGES)) {
      // Fallback claiming üzenethez
      return STEP_REMINDER_MESSAGES.claiming;
    }

    return STEP_REMINDER_MESSAGES[step as Exclude<ReminderWorkflowStep, 'completed'>];
  });

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus a primary action gombra
    setTimeout(() => {
      this.primaryButton?.nativeElement.focus();
    }, 100);
  }

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

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    this.navigateToPhotoSelection();
  }

  protected onClose(): void {
    // X gomb vagy ESC: cooldown aktív
    this.resultEvent.emit({ action: 'close' });
  }
}
