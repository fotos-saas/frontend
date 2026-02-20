import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-time-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="time-column">
      @for (hour of hourLabels(); track hour) {
        <div class="hour-label">{{ hour }}:00</div>
      }
      @if (currentTimeTop() >= 0) {
        <div class="current-time-line" [style.top.px]="currentTimeTop()">
          <span class="time-dot"></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .time-column {
      position: relative;
      width: 60px;
      min-width: 60px;
      border-right: 1px solid #e5e7eb;
    }
    .hour-label {
      height: 60px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: 11px;
      color: #6b7280;
      transform: translateY(-8px);
    }
    .current-time-line {
      position: absolute;
      left: 0;
      right: -1px;
      height: 2px;
      background: #ef4444;
      z-index: 10;
    }
    .time-dot {
      position: absolute;
      left: -4px;
      top: -4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ef4444;
    }
  `],
})
export class TimeColumnComponent {
  readonly startHour = input(8);
  readonly endHour = input(20);

  readonly hourLabels = computed(() => {
    const hours: number[] = [];
    for (let h = this.startHour(); h <= this.endHour(); h++) {
      hours.push(h);
    }
    return hours;
  });

  readonly currentTimeTop = computed(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const start = this.startHour();
    const end = this.endHour();
    if (h < start || h > end) return -1;
    return (h - start) * 60 + m;
  });
}
