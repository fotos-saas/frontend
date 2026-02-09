import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ErrorBoundaryService } from '../../../core/services/error-boundary.service';
import { SentryService } from '../../../core/services/sentry.service';
import { HeroDialogWrapperComponent } from '../hero-dialog-wrapper/hero-dialog-wrapper.component';

/**
 * ErrorFeedbackDialogComponent
 *
 * Felhasználóbarát hiba dialógus ami 5xx hibáknál jelenik meg.
 * Megjeleníti a Sentry event ID-t és lehetőséget ad feedback küldésére.
 */
@Component({
  selector: 'app-error-feedback-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, HeroDialogWrapperComponent],
  templateUrl: './error-feedback-dialog.component.html',
  styleUrls: ['./error-feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorFeedbackDialogComponent {
  readonly ICONS = ICONS;

  private readonly logger = inject(LoggerService);
  private errorBoundary = inject(ErrorBoundaryService);
  private sentryService = inject(SentryService);

  // Signals from service
  readonly showDialog = this.errorBoundary.showDialog;
  readonly errorInfo = this.errorBoundary.errorInfo;
  readonly shortEventId = this.errorBoundary.shortEventId;

  // Local state
  readonly feedbackText = signal('');
  readonly feedbackSent = signal(false);
  readonly copiedEventId = signal(false);

  dismiss(): void {
    this.errorBoundary.dismiss();
    this.feedbackText.set('');
    this.feedbackSent.set(false);
  }

  retry(): void {
    this.sendFeedbackIfNeeded();
    this.errorBoundary.retry();
  }

  goHome(): void {
    this.sendFeedbackIfNeeded();
    this.errorBoundary.goHome();
  }

  async copyEventId(): Promise<void> {
    const eventId = this.errorInfo()?.eventId;
    if (!eventId) return;

    try {
      await navigator.clipboard.writeText(eventId);
      this.copiedEventId.set(true);
      setTimeout(() => this.copiedEventId.set(false), 2000);
    } catch {
      this.logger.warn('Clipboard API not available');
    }
  }

  private sendFeedbackIfNeeded(): void {
    const feedback = this.feedbackText().trim();
    const eventId = this.errorInfo()?.eventId;

    if (feedback && eventId && !this.feedbackSent()) {
      this.sentryService.captureMessage(
        `User feedback for error ${eventId}: ${feedback}`,
        'info',
        {
          originalEventId: eventId,
          userFeedback: feedback,
          errorUrl: this.errorInfo()?.url
        }
      );
      this.feedbackSent.set(true);
    }
  }
}
