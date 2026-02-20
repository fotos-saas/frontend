import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { heatmapFillAnimation } from '../../animations/booking.animations';

@Component({
  selector: 'app-heatmap-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [heatmapFillAnimation],
  template: `
    <div
      class="heatmap-cell"
      [class.today]="isToday()"
      [class.other-month]="!isCurrentMonth()"
      @heatmapFill
    >
      <span class="cell-date" [class.today-badge]="isToday()">
        {{ dayNumber() }}
      </span>
      @if (count() > 0) {
        <div class="cell-count" [style.background]="heatColor()">
          {{ count() }} foglalás
        </div>
      }
      @if (count() === 0 && isCurrentMonth()) {
        <span class="cell-empty">-</span>
      }
    </div>
  `,
  styles: [`
    .heatmap-cell {
      position: relative;
      min-height: 80px;
      padding: 6px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      background: #fff;
    }
    .heatmap-cell:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    .heatmap-cell.other-month {
      opacity: 0.4;
      background: #f9fafb;
    }
    .heatmap-cell.today {
      border-color: #6366f1;
      box-shadow: 0 0 0 1px #6366f1;
    }
    .cell-date {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .today-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6366f1;
      color: #fff;
      font-size: 12px;
    }
    .cell-count {
      margin-top: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      color: #fff;
      text-align: center;
    }
    .cell-empty {
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: #d1d5db;
      text-align: center;
    }
  `],
})
export class HeatmapCellComponent {
  readonly date = input('');
  readonly count = input(0);
  readonly max = input(1);
  readonly isToday = input(false);
  readonly isCurrentMonth = input(true);

  readonly dayNumber = computed(() => {
    const d = this.date();
    if (!d) return '';
    return new Date(d).getDate().toString();
  });

  readonly heatColor = computed(() => {
    const m = this.max();
    const ratio = m > 0 ? this.count() / m : 0;
    if (ratio < 0.25) return '#86efac';
    if (ratio < 0.5) return '#22c55e';
    if (ratio < 0.75) return '#f59e0b';
    return '#ef4444';
  });
}
