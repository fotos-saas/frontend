import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CalendarResponse, Booking } from '../../../../models/booking.models';
import { TimeColumnComponent } from '../components/time-column.component';
import { BookingSlotComponent } from '../components/booking-slot.component';
import { viewSwitchAnimation } from '../../animations/booking.animations';

interface DayBookingPosition {
  booking: Booking;
  top: number;
  height: number;
}

@Component({
  selector: 'app-daily-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimeColumnComponent, BookingSlotComponent],
  animations: [viewSwitchAnimation],
  template: `
    <div class="daily-view" @viewSwitch>
      <div class="daily-header">
        <div class="time-gutter-header"></div>
        <div class="day-title">
          {{ dayTitle() }}
        </div>
      </div>

      <div class="daily-body">
        <app-time-column [startHour]="startHour" [endHour]="endHour" />

        <div class="day-content">
          <!-- Blokkolt idősávok -->
          @for (blocked of blockedSlots(); track blocked.start) {
            <div
              class="blocked-overlay"
              [style.top.px]="blocked.top"
              [style.height.px]="blocked.height"
            >
              <span class="blocked-label">
                {{ blocked.reason || 'Blokkolt' }}
              </span>
            </div>
          }

          <!-- Google események -->
          @for (event of googleSlots(); track event.title + event.start) {
            <div
              class="google-overlay"
              [style.top.px]="event.top"
              [style.height.px]="event.height"
            >
              <span class="google-label">{{ event.title }}</span>
            </div>
          }

          <!-- Foglalások -->
          @for (pos of bookingPositions(); track pos.booking.id) {
            <app-booking-slot
              [booking]="pos.booking"
              [style.top.px]="pos.top"
              [style.height.px]="pos.height"
              (click)="bookingClick.emit(pos.booking.id)"
            />
          }

          <!-- Jelenlegi idő vonal -->
          @if (currentTimeTop() >= 0) {
            <div class="current-time-indicator" [style.top.px]="currentTimeTop()">
              <span class="time-now-label">{{ currentTimeLabel() }}</span>
            </div>
          }

          <!-- Óra rácsok -->
          @for (hour of hours; track hour) {
            <div class="hour-grid-line" [style.top.px]="(hour - startHour) * 60"></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .daily-view {
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    .daily-header {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      padding: 8px 0;
    }
    .time-gutter-header { width: 60px; min-width: 60px; }
    .day-title {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      padding-left: 12px;
    }
    .daily-body {
      display: flex;
      position: relative;
    }
    .day-content {
      flex: 1;
      position: relative;
      min-height: calc(var(--total-hours) * 60px);
      padding-top: 8px;
    }
    .hour-grid-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: #f3f4f6;
    }
    .blocked-overlay {
      position: absolute;
      left: 0;
      right: 0;
      background: repeating-linear-gradient(
        45deg,
        rgba(156, 163, 175, 0.1),
        rgba(156, 163, 175, 0.1) 4px,
        rgba(156, 163, 175, 0.2) 4px,
        rgba(156, 163, 175, 0.2) 8px
      );
      border-radius: 4px;
      z-index: 2;
    }
    .blocked-label {
      display: block;
      padding: 4px 8px;
      font-size: 11px;
      color: #6b7280;
      font-style: italic;
    }
    .google-overlay {
      position: absolute;
      left: 0;
      right: 0;
      background: repeating-linear-gradient(
        -45deg,
        rgba(66, 133, 244, 0.08),
        rgba(66, 133, 244, 0.08) 4px,
        rgba(66, 133, 244, 0.16) 4px,
        rgba(66, 133, 244, 0.16) 8px
      );
      border-left: 3px solid #4285f4;
      border-radius: 4px;
      z-index: 3;
    }
    .google-label {
      display: block;
      padding: 4px 8px;
      font-size: 11px;
      color: #4285f4;
      font-weight: 500;
    }
    .current-time-indicator {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: #ef4444;
      z-index: 15;
    }
    .time-now-label {
      position: absolute;
      left: 4px;
      top: -8px;
      font-size: 10px;
      color: #ef4444;
      font-weight: 600;
      background: #fff;
      padding: 0 4px;
      border-radius: 2px;
    }
  `],
})
export class DailyViewComponent {
  readonly data = input<CalendarResponse | null>(null);
  readonly bookingClick = output<number>();

  readonly startHour = 8;
  readonly endHour = 20;
  readonly hours = Array.from({ length: 13 }, (_, i) => i + 8);

  readonly dayTitle = computed(() => {
    const d = this.data();
    if (!d || !d.bookings.length) return 'Nincs foglalás';
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const date = new Date(d.bookings[0].date);
    return `${days[date.getDay()]} - ${d.bookings.length} foglalás`;
  });

  readonly bookingPositions = computed((): DayBookingPosition[] => {
    const d = this.data();
    if (!d) return [];
    return d.bookings.map(b => ({
      booking: b,
      top: this.timeToPixel(b.start_time),
      height: Math.max(20, this.timeToPixel(b.end_time) - this.timeToPixel(b.start_time)),
    }));
  });

  readonly blockedSlots = computed(() => {
    const d = this.data();
    if (!d) return [];
    return d.blocked_dates.map(b => ({
      start: b.start_date,
      reason: b.reason,
      top: 0,
      height: (this.endHour - this.startHour) * 60,
    }));
  });

  readonly googleSlots = computed(() => {
    const d = this.data();
    if (!d) return [];
    return d.google_events.map(e => ({
      title: e.title,
      start: e.start_time,
      top: this.timeToPixel(e.start_time),
      height: Math.max(20, this.timeToPixel(e.end_time) - this.timeToPixel(e.start_time)),
    }));
  });

  readonly currentTimeTop = computed(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < this.startHour || h > this.endHour) return -1;
    return (h - this.startHour) * 60 + now.getMinutes();
  });

  readonly currentTimeLabel = computed(() => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  private timeToPixel(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h - this.startHour) * 60 + m;
  }
}
