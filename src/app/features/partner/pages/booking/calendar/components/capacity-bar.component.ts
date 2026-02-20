import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-capacity-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="capacity-bar" [attr.aria-label]="ariaLabel()">
      <div class="bar-track">
        <div
          class="bar-fill"
          [style.width.%]="percentage()"
          [style.background]="barColor()"
        ></div>
      </div>
      <span class="bar-label">{{ count() }}/{{ max() }}</span>
    </div>
  `,
  styles: [`
    .capacity-bar {
      display: flex;
      align-items: center;
      padding: 4px 6px;
    }
    .bar-track {
      flex: 1;
      height: 6px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .bar-label {
      margin-left: 6px;
      font-size: 11px;
      color: #6b7280;
      white-space: nowrap;
    }
  `],
})
export class CapacityBarComponent {
  readonly count = input(0);
  readonly max = input(1);

  readonly percentage = computed(() => {
    const m = this.max();
    if (m <= 0) return 0;
    return Math.min(100, Math.round((this.count() / m) * 100));
  });

  readonly barColor = computed(() => {
    const p = this.percentage();
    if (p < 50) return '#22c55e';
    if (p < 80) return '#eab308';
    return '#ef4444';
  });

  readonly ariaLabel = computed(() =>
    `Kapacitás: ${this.count()} / ${this.max()} (${this.percentage()}%)`,
  );
}
