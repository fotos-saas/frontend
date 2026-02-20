import {
  Component, inject, input, output, signal,
  DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { Booking, BOOKING_STATUS_CONFIG, LOCATION_TYPE_LABELS } from '../../../models/booking.models';
import { CancelDialogComponent } from './cancel-dialog.component';
import { RescheduleDialogComponent } from './reschedule-dialog.component';

@Component({
  selector: 'app-booking-detail-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CancelDialogComponent, RescheduleDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-detail-panel.component.html',
  styleUrl: './booking-detail-panel.component.scss',
})
export class BookingDetailPanelComponent {
  readonly booking = input.required<Booking>();
  readonly close = output<void>();
  readonly updated = output<void>();

  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;
  readonly STATUS_CONFIG = BOOKING_STATUS_CONFIG;
  readonly LOCATION_TYPE_LABELS = LOCATION_TYPE_LABELS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit(), 'dialog-backdrop');

  showCancel = signal(false);
  showReschedule = signal(false);

  confirm(): void {
    this.bookingService.confirmBooking(this.booking().id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.updated.emit() });
  }

  complete(): void {
    this.bookingService.completeBooking(this.booking().id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.updated.emit() });
  }

  markNoShow(): void {
    this.bookingService.markNoShow(this.booking().id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.updated.emit() });
  }

  onCancel(reason: string): void {
    this.showCancel.set(false);
    this.bookingService.cancelBooking(this.booking().id, reason)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.updated.emit() });
  }

  onReschedule(data: { date: string; start_time: string }): void {
    this.showReschedule.set(false);
    this.bookingService.rescheduleBooking(this.booking().id, data)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.updated.emit() });
  }
}
