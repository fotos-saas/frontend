import { Component, output, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { LoggerService } from '../../../core/services/logger.service';

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
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-finalization-reminder-dialog',
  standalone: true,
  imports: [],
  templateUrl: './finalization-reminder-dialog.component.html',
  styleUrls: ['./finalization-reminder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinalizationReminderDialogComponent extends BaseDialogComponent implements AfterViewInit {
  /** Signal-based outputs */
  readonly resultEvent = output<FinalizationReminderResult>();

  private readonly logger = inject(LoggerService);

  /** Engedélyezett snooze napok */
  private readonly allowedSnoozeDays = [7, 14];

  /** ViewChild referencia a focus management-hez */
  @ViewChild('primaryButton') primaryButton?: ElementRef<HTMLButtonElement>;

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus a primary action gombra
    setTimeout(() => {
      this.primaryButton?.nativeElement.focus();
    }, 100);
  }

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
    this.navigateToFinalization();
  }

  protected onClose(): void {
    // X gomb vagy ESC: cooldown aktív
    this.resultEvent.emit({ action: 'close' });
  }
}
