import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { CalendarResponse } from '../../../models/booking.models';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { BookingCalendarStateService } from '../../../services/booking-calendar-state.service';
import { DailyViewComponent } from './views/daily-view.component';
import { WeeklyViewComponent } from './views/weekly-view.component';
import { MonthlyViewComponent } from './views/monthly-view.component';

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    DailyViewComponent,
    WeeklyViewComponent,
    MonthlyViewComponent,
  ],
  template: `
    <div class="booking-calendar page-card page-card--full">
      <!-- Eszköztár -->
      <div class="calendar-toolbar">
        <div class="toolbar-left">
          <button class="btn btn--outline btn--sm" (click)="calendarState.goPrev()">
            <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" />
          </button>
          <button class="btn btn--outline btn--sm btn--today" (click)="calendarState.goToToday()">
            Ma
          </button>
          <button class="btn btn--outline btn--sm" (click)="calendarState.goNext()">
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
          </button>
          <h2 class="calendar-title">{{ calendarState.title() }}</h2>
        </div>

        <div class="toolbar-right">
          <div class="view-switcher">
            <button
              class="switch-btn"
              [class.active]="calendarState.currentView() === 'daily'"
              (click)="calendarState.setView('daily')"
            >Napi</button>
            <button
              class="switch-btn"
              [class.active]="calendarState.currentView() === 'weekly'"
              (click)="calendarState.setView('weekly')"
            >Heti</button>
            <button
              class="switch-btn"
              [class.active]="calendarState.currentView() === 'monthly'"
              (click)="calendarState.setView('monthly')"
            >Havi</button>
          </div>
        </div>
      </div>

      <!-- Betöltés jelző -->
      @if (loading()) {
        <div class="loading-bar">
          <div class="loading-bar-inner"></div>
        </div>
      }

      <!-- Nézet váltás -->
      @switch (calendarState.currentView()) {
        @case ('daily') {
          <app-daily-view
            [data]="calendarData()"
            (bookingClick)="onBookingClick($event)"
          />
        }
        @case ('weekly') {
          <app-weekly-view
            [data]="calendarData()"
            (bookingClick)="onBookingClick($event)"
          />
        }
        @case ('monthly') {
          <app-monthly-view
            [data]="calendarData()"
            (dayClick)="onDayClick($event)"
          />
        }
      }
    </div>
  `,
  styles: [`
    .booking-calendar { padding: 16px; }
    .calendar-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      row-gap: 8px;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
    }
    .toolbar-left .btn { margin-right: 4px; }
    .btn--today { font-weight: 500; }
    .calendar-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0 12px;
    }
    .toolbar-right { display: flex; align-items: center; }
    .view-switcher {
      display: flex;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 2px;
    }
    .switch-btn {
      padding: 6px 14px;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .switch-btn:hover { color: #374151; }
    .switch-btn.active {
      background: #fff;
      color: #6366f1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .loading-bar {
      height: 3px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .loading-bar-inner {
      height: 100%;
      width: 40%;
      background: #6366f1;
      border-radius: 2px;
      animation: loading-slide 1.2s ease-in-out infinite;
    }
    @keyframes loading-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
})
export class BookingCalendarComponent {
  readonly ICONS = ICONS;
  readonly calendarState = inject(BookingCalendarStateService);
  readonly calendarData = signal<CalendarResponse | null>(null);
  readonly loading = signal(false);

  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Dátum tartomány változáskor automatikus betöltés
    effect(() => {
      const range = this.calendarState.dateRange();
      this.loadCalendar(range.start, range.end);
    });
  }

  onBookingClick(bookingId: number): void {
    // TODO: foglalás részletek megnyitása (Sprint 5)
    console.log('Foglalás kiválasztva:', bookingId);
  }

  onDayClick(date: Date): void {
    this.calendarState.goToDate(date);
    this.calendarState.setView('daily');
  }

  private loadCalendar(start: string, end: string): void {
    this.loading.set(true);
    this.bookingService
      .getCalendar(start, end, this.calendarState.currentView())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.calendarData.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
