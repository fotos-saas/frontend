import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { CalendarResponse } from '../../../../models/booking.models';
import { BookingCalendarStateService } from '../../../../services/booking-calendar-state.service';
import { HeatmapCellComponent } from '../components/heatmap-cell.component';
import { staggerListAnimation, viewSwitchAnimation } from '../../animations/booking.animations';

const DAY_HEADERS = ['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'];

interface MonthCell {
  date: string;
  count: number;
  max: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeatmapCellComponent],
  animations: [staggerListAnimation, viewSwitchAnimation],
  template: `
    <div class="monthly-view" @viewSwitch>
      <!-- Nap fejlécek -->
      <div class="month-header">
        @for (name of dayHeaders; track name) {
          <div class="header-cell">{{ name }}</div>
        }
      </div>

      <!-- Naptár rács -->
      <div class="month-grid" @staggerList>
        @for (cell of cells(); track cell.date) {
          <app-heatmap-cell
            [date]="cell.date"
            [count]="cell.count"
            [max]="cell.max"
            [isToday]="cell.isToday"
            [isCurrentMonth]="cell.isCurrentMonth"
            (click)="onCellClick(cell.date)"
          />
        }
      </div>

      <!-- Összesítés -->
      <div class="month-summary">
        <span class="summary-item">
          Összes foglalás: <strong>{{ totalBookings() }}</strong>
        </span>
        <span class="summary-item">
          Átlagos napi: <strong>{{ avgDaily() }}</strong>
        </span>
        <span class="summary-legend">
          <span class="legend-dot" style="background:#86efac"></span> Alacsony
          <span class="legend-dot" style="background:#22c55e"></span> Közepes
          <span class="legend-dot" style="background:#f59e0b"></span> Magas
          <span class="legend-dot" style="background:#ef4444"></span> Telt
        </span>
      </div>
    </div>
  `,
  styles: [`
    .monthly-view { padding: 8px 0; }
    .month-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 4px;
    }
    .header-cell {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      padding: 4px 0;
      text-transform: uppercase;
    }
    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .month-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 8px;
      margin-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
    }
    .summary-item { margin-right: 16px; }
    .summary-item strong { color: #374151; }
    .summary-legend {
      display: flex;
      align-items: center;
      font-size: 11px;
    }
    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      margin: 0 3px 0 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
})
export class MonthlyViewComponent {
  readonly data = input<CalendarResponse | null>(null);
  readonly dayClick = output<Date>();

  private readonly calendarState = inject(BookingCalendarStateService);
  readonly dayHeaders = DAY_HEADERS;

  readonly cells = computed((): MonthCell[] => {
    const currentDate = this.calendarState.currentDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const d = this.data();
    const today = new Date().toISOString().split('T')[0];

    // Max kapacitás a havi statisztikából
    const stats = d?.daily_stats ?? {};
    const maxDaily = Object.values(stats).reduce(
      (max, s) => Math.max(max, s.max), 10,
    );

    // Hónap első napja (hétfőtől)
    const firstDay = new Date(year, month, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Vasárnap

    // Hónap utolsó napja
    const lastDay = new Date(year, month + 1, 0);

    const cells: MonthCell[] = [];

    // Előző hónap napjai
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats[dateStr];
      cells.push({
        date: dateStr,
        count: stat?.count ?? 0,
        max: maxDaily,
        isToday: dateStr === today,
        isCurrentMonth: false,
      });
    }

    // Aktuális hónap napjai
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats[dateStr];
      cells.push({
        date: dateStr,
        count: stat?.count ?? 0,
        max: maxDaily,
        isToday: dateStr === today,
        isCurrentMonth: true,
      });
    }

    // Következő hónap napjai (6 soros rácshoz)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats[dateStr];
      cells.push({
        date: dateStr,
        count: stat?.count ?? 0,
        max: maxDaily,
        isToday: dateStr === today,
        isCurrentMonth: false,
      });
    }

    return cells;
  });

  readonly totalBookings = computed(() => {
    const d = this.data();
    return d?.bookings.length ?? 0;
  });

  readonly avgDaily = computed(() => {
    const d = this.data();
    if (!d) return '0';
    const stats = Object.values(d.daily_stats);
    if (stats.length === 0) return '0';
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return (total / stats.length).toFixed(1);
  });

  onCellClick(dateStr: string): void {
    this.dayClick.emit(new Date(dateStr));
  }
}
