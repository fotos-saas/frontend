import { Component, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';

/**
 * Dialog eredmény típus
 *
 * - navigate: Navigálás a véglegesítés oldalra
 * - snooze: Halasztás (7 vagy 14 nap)
 * - close: X gomb vagy ESC - cooldown aktív
 * - backdrop: Backdrop kattintás - NEM aktivál cooldown-t
 */
export type FinalizationReminderResult =
  | { action: 'navigate' }
  | { action: 'snooze'; days: number }
  | { action: 'close' }
  | { action: 'backdrop' };

/**
 * Finalization Reminder Dialog
 *
 * Emlékeztető dialógus a tervkészítés véglegesítéséhez.
 */
@Component({
  selector: 'app-finalization-reminder-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './finalization-reminder-dialog.component.html',
  styleUrls: ['./finalization-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinalizationReminderDialogComponent {
  readonly ICONS = ICONS;

  /** Signal-based outputs */
  readonly resultEvent = output<FinalizationReminderResult>();

  private readonly logger = inject(LoggerService);

  /** Engedélyezett snooze napok */
  private readonly allowedSnoozeDays = [7, 14];

  /**
   * Navigálás a véglegesítés oldalra
   */
  navigateToFinalization(): void {
    this.resultEvent.emit({ action: 'navigate' });
  }

  /**
   * Halasztás (1 vagy 2 hét)
   */
  snooze(days: number): void {
    if (!this.allowedSnoozeDays.includes(days)) {
      this.logger.warn('Invalid snooze days', days);
      return;
    }
    this.resultEvent.emit({ action: 'snooze', days });
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
