import {
  Component, input, output, signal, computed, inject, OnInit,
  ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PublicBookingService } from '../services/public-booking.service';
import { PublicAvailableDate } from '../../partner/models/booking.models';

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  available: boolean;
  slotsCount: number;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="date-picker-header">
      <button class="back-btn" (click)="back.emit()">
        <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="18" />
        Vissza
      </button>
      <h2 class="section-title">Valasszon datumot</h2>
    </div>

    <div class="calendar">
      <div class="cal-nav">
        <button class="nav-btn" (click)="prevMonth()" [disabled]="!canGoPrev()">
          <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="20" />
        </button>
        <span class="cal-month">{{ monthLabel() }}</span>
        <button class="nav-btn" (click)="nextMonth()">
          <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="20" />
        </button>
      </div>

      <div class="cal-weekdays">
        @for (d of weekDays; track d) {
          <span class="weekday">{{ d }}</span>
        }
      </div>

      <div class="cal-grid">
        @for (day of calendarDays(); track day.date) {
          <button
            class="cal-day"
            [class.other-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            [class.available]="day.available && day.isCurrentMonth"
            [class.unavailable]="!day.available || !day.isCurrentMonth"
            [disabled]="!day.available || !day.isCurrentMonth"
            (click)="onDayClick(day)">
            {{ day.day }}
            @if (day.available && day.isCurrentMonth && day.slotsCount > 0) {
              <span class="slot-count">{{ day.slotsCount }}</span>
            }
          </button>
        }
      </div>

      @if (loading()) {
        <div class="cal-loading">
          <lucide-icon [name]="ICONS.LOADER" [size]="24" class="spin" />
          <span>Datumok betoltese...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .date-picker-header { margin-bottom: 20px; }
    .back-btn {
      display: inline-flex; align-items: center; background: none; border: none;
      color: #64748b; font-size: 14px; cursor: pointer; padding: 4px 0; margin-bottom: 12px;
    }
    .back-btn lucide-icon { margin-right: 6px; }
    .back-btn:hover { color: #1e293b; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .calendar { position: relative; }
    .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .cal-month { font-size: 16px; font-weight: 600; color: #1e293b; }
    .nav-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #475569; transition: all 0.15s;
    }
    .nav-btn:hover:not(:disabled) { background: #f1f5f9; }
    .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
    .weekday {
      text-align: center; font-size: 12px; font-weight: 600;
      color: #94a3b8; padding: 4px 0; text-transform: uppercase;
    }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-grid > * { margin: 2px; }
    .cal-day {
      aspect-ratio: 1; border: none; border-radius: 8px; background: transparent;
      font-size: 14px; font-weight: 500; cursor: pointer; position: relative;
      display: flex; align-items: center; justify-content: center; flex-direction: column;
      transition: all 0.15s; color: #334155;
    }
    .cal-day.other-month { color: #cbd5e1; }
    .cal-day.today { font-weight: 700; box-shadow: inset 0 0 0 2px var(--primary-color, #7c3aed); }
    .cal-day.available { background: #f0fdf4; color: #166534; }
    .cal-day.available:hover { background: #bbf7d0; transform: scale(1.08); }
    .cal-day.unavailable { color: #cbd5e1; cursor: not-allowed; }
    .slot-count {
      position: absolute; bottom: 2px; font-size: 9px;
      color: #16a34a; font-weight: 700;
    }
    .cal-loading {
      position: absolute; inset: 0; background: rgba(255,255,255,0.85);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border-radius: 8px; color: #64748b; font-size: 14px;
    }
    .cal-loading lucide-icon { margin-bottom: 8px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class DatePickerComponent implements OnInit {
  readonly slug = input.required<string>();
  readonly sessionTypeId = input.required<number>();
  readonly select = output<string>();
  readonly back = output<void>();

  readonly ICONS = ICONS;
  readonly weekDays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

  private readonly service = inject(PublicBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth());
  readonly availableDates = signal<PublicAvailableDate[]>([]);
  readonly loading = signal(false);

  readonly monthLabel = computed(() => {
    const months = [
      'Januar', 'Februar', 'Marcius', 'Aprilis', 'Majus', 'Junius',
      'Julius', 'Augusztus', 'Szeptember', 'Oktober', 'November', 'December',
    ];
    return `${this.currentYear()}. ${months[this.currentMonth()]}`;
  });

  readonly canGoPrev = computed(() => {
    const now = new Date();
    return this.currentYear() > now.getFullYear() ||
      (this.currentYear() === now.getFullYear() && this.currentMonth() > now.getMonth());
  });

  readonly calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // Monday-start
    const today = new Date();
    const todayStr = this.formatDate(today);
    const available = this.availableDates();
    const availableMap = new Map(available.map(d => [d.date, d]));
    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthEnd - i;
      const date = this.formatDate(new Date(year, month - 1, d));
      days.push({ date, day: d, isCurrentMonth: false, isToday: false, available: false, slotsCount: 0 });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = this.formatDate(new Date(year, month, d));
      const info = availableMap.get(date);
      days.push({
        date, day: d, isCurrentMonth: true,
        isToday: date === todayStr,
        available: !!info?.available,
        slotsCount: info?.slots_count ?? 0,
      });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = this.formatDate(new Date(year, month + 1, d));
      days.push({ date, day: d, isCurrentMonth: false, isToday: false, available: false, slotsCount: 0 });
    }
    return days;
  });

  ngOnInit(): void { this.loadAvailableDates(); }

  prevMonth(): void {
    if (this.currentMonth() === 0) { this.currentYear.update(y => y - 1); this.currentMonth.set(11); }
    else { this.currentMonth.update(m => m - 1); }
    this.loadAvailableDates();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) { this.currentYear.update(y => y + 1); this.currentMonth.set(0); }
    else { this.currentMonth.update(m => m + 1); }
    this.loadAvailableDates();
  }

  onDayClick(day: CalendarDay): void {
    if (day.available && day.isCurrentMonth) { this.select.emit(day.date); }
  }

  private loadAvailableDates(): void {
    const month = `${this.currentYear()}-${String(this.currentMonth() + 1).padStart(2, '0')}`;
    this.loading.set(true);
    this.service.getAvailableDates(this.slug(), this.sessionTypeId(), month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.availableDates.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
