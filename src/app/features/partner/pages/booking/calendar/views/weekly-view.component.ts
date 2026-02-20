import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { CalendarResponse, Booking, DailyStat } from '../../../../models/booking.models';
import { BookingCalendarStateService } from '../../../../services/booking-calendar-state.service';
import { TimeColumnComponent } from '../components/time-column.component';
import { BookingSlotComponent } from '../components/booking-slot.component';
import { CapacityBarComponent } from '../components/capacity-bar.component';
import { viewSwitchAnimation } from '../../animations/booking.animations';

const DAY_NAMES = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  bookings: Booking[];
  stat: DailyStat | null;
}

@Component({
  selector: 'app-weekly-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimeColumnComponent, BookingSlotComponent, CapacityBarComponent],
  animations: [viewSwitchAnimation],
  template: `
    <div class="weekly-view" @viewSwitch>
      <!-- Fejléc -->
      <div class="week-header">
        <div class="time-gutter-header"></div>
        @for (day of weekDays(); track day.date) {
          <div class="day-header" [class.today]="day.isToday">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-date" [class.today-badge]="day.isToday">
              {{ day.dayNumber }}
            </span>
          </div>
        }
      </div>

      <!-- Kapacitás sor -->
      <div class="capacity-row">
        <div class="time-gutter-header"></div>
        @for (day of weekDays(); track day.date) {
          <div class="capacity-cell">
            @if (day.stat) {
              <app-capacity-bar [count]="day.stat.count" [max]="day.stat.max" />
            }
          </div>
        }
      </div>

      <!-- Naptár rács -->
      <div class="week-body">
        <app-time-column [startHour]="startHour" [endHour]="endHour" />

        <div class="week-grid">
          @for (day of weekDays(); track day.date) {
            <div class="day-column" [class.today]="day.isToday">
              <!-- Óra rácsok -->
              @for (hour of hours; track hour) {
                <div class="hour-line" [style.top.px]="(hour - startHour) * 60"></div>
              }

              <!-- Blokkolt napok -->
              @if (isDayBlocked(day.date)) {
                <div class="blocked-overlay"></div>
              }

              <!-- Google események -->
              @for (event of getGoogleEvents(day.date); track event.title) {
                <div
                  class="google-event"
                  [style.top.px]="timeToPixel(event.start_time)"
                  [style.height.px]="getEventHeight(event.start_time, event.end_time)"
                >
                  <span class="google-label">{{ event.title }}</span>
                </div>
              }

              <!-- Foglalások -->
              @for (booking of day.bookings; track booking.id) {
                <app-booking-slot
                  [booking]="booking"
                  [style.top.px]="timeToPixel(booking.start_time)"
                  [style.height.px]="getEventHeight(booking.start_time, booking.end_time)"
                  (click)="bookingClick.emit(booking.id)"
                />
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .weekly-view { display: flex; flex-direction: column; overflow: auto; }
    .week-header {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 20;
    }
    .time-gutter-header { width: 60px; min-width: 60px; }
    .day-header {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 4px;
      border-left: 1px solid #f3f4f6;
    }
    .day-header.today { background: rgba(99, 102, 241, 0.05); }
    .day-name { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .day-date { font-size: 18px; font-weight: 600; color: #374151; margin-top: 2px; }
    .today-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #6366f1;
      color: #fff;
    }
    .capacity-row {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;
    }
    .capacity-cell { flex: 1; border-left: 1px solid #f3f4f6; }
    .week-body { display: flex; position: relative; }
    .week-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .day-column {
      position: relative;
      border-left: 1px solid #f3f4f6;
      min-height: 720px; /* 12 hours * 60px */
    }
    .day-column.today { background: rgba(99, 102, 241, 0.03); }
    .hour-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: #f3f4f6;
    }
    .blocked-overlay {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        45deg,
        rgba(156, 163, 175, 0.08),
        rgba(156, 163, 175, 0.08) 4px,
        rgba(156, 163, 175, 0.16) 4px,
        rgba(156, 163, 175, 0.16) 8px
      );
      z-index: 1;
    }
    .google-event {
      position: absolute;
      left: 2px;
      right: 2px;
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
      padding: 2px 6px;
      font-size: 10px;
      color: #4285f4;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class WeeklyViewComponent {
  readonly data = input<CalendarResponse | null>(null);
  readonly bookingClick = output<number>();

  private readonly calendarState = inject(BookingCalendarStateService);

  readonly startHour = 8;
  readonly endHour = 20;
  readonly hours = Array.from({ length: 13 }, (_, i) => i + 8);

  readonly weekDays = computed((): WeekDay[] => {
    const range = this.calendarState.dateRange();
    const d = this.data();
    const today = new Date().toISOString().split('T')[0];
    const days: WeekDay[] = [];
    const startDate = new Date(range.start);

    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayName: DAY_NAMES[i],
        dayNumber: current.getDate(),
        isToday: dateStr === today,
        bookings: d?.bookings.filter(b => b.date === dateStr) ?? [],
        stat: d?.daily_stats[dateStr] ?? null,
      });
    }

    return days;
  });

  isDayBlocked(date: string): boolean {
    const d = this.data();
    if (!d) return false;
    return d.blocked_dates.some(b => date >= b.start_date && date <= b.end_date);
  }

  getGoogleEvents(date: string) {
    const d = this.data();
    if (!d) return [];
    return d.google_events.filter(e => e.date === date);
  }

  timeToPixel(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h - this.startHour) * 60 + m;
  }

  getEventHeight(startTime: string, endTime: string): number {
    return Math.max(20, this.timeToPixel(endTime) - this.timeToPixel(startTime));
  }
}
