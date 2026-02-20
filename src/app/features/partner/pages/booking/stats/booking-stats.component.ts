import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { DecimalPipe } from '@angular/common';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { BookingStats } from '../../../models/booking.models';

interface PeriodOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-booking-stats',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="booking-stats page-card">
      <div class="page-header">
        <h1>Foglalasi statisztikak</h1>
        <select (change)="onPeriodChange($event)">
          @for (opt of periodOptions; track opt.value) {
            <option [value]="opt.value" [selected]="opt.value === selectedDays()">{{ opt.label }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"><lucide-icon [name]="ICONS.CALENDAR" [size]="20" /></div>
            <div class="stat-value">{{ stats()!.totals.bookings }}</div>
            <div class="stat-label">Osszes foglalas</div>
          </div>
          <div class="stat-card stat-card--green">
            <div class="stat-icon"><lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="20" /></div>
            <div class="stat-value">{{ stats()!.totals.confirmed }}</div>
            <div class="stat-label">Visszaigazolt</div>
          </div>
          <div class="stat-card stat-card--blue">
            <div class="stat-icon"><lucide-icon [name]="ICONS.CHECK" [size]="20" /></div>
            <div class="stat-value">{{ stats()!.totals.completed }}</div>
            <div class="stat-label">Teljesitett</div>
          </div>
          <div class="stat-card stat-card--red">
            <div class="stat-icon"><lucide-icon [name]="ICONS.X_CIRCLE" [size]="20" /></div>
            <div class="stat-value">{{ stats()!.totals.canceled }}</div>
            <div class="stat-label">Lemondott</div>
          </div>
          <div class="stat-card stat-card--amber">
            <div class="stat-icon"><lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="20" /></div>
            <div class="stat-value">{{ stats()!.no_show_rate | number:'1.0-1' }}%</div>
            <div class="stat-label">Nem jelent meg</div>
          </div>
        </div>

        <!-- Kapacitas -->
        <div class="section-block">
          <h2>Kapacitas</h2>
          <div class="capacity-row">
            <div class="capacity-info">
              <span class="cap-used">{{ stats()!.capacity.used_slots }}</span>
              <span class="cap-sep">/</span>
              <span class="cap-total">{{ stats()!.capacity.total_slots }} slot</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill" [style.width.%]="stats()!.capacity.percentage"></div>
            </div>
            <span class="cap-pct">{{ stats()!.capacity.percentage | number:'1.0-0' }}%</span>
          </div>
        </div>

        <!-- Bevetel -->
        <div class="section-block">
          <h2>Bevetel</h2>
          <div class="revenue-row">
            <div class="revenue-item">
              <span class="revenue-label">Visszaigazolt</span>
              <span class="revenue-value">{{ stats()!.revenue.confirmed | number:'1.0-0' }} Ft</span>
            </div>
            <div class="revenue-item">
              <span class="revenue-label">Elorejelzes</span>
              <span class="revenue-value revenue-value--forecast">{{ stats()!.revenue.forecast | number:'1.0-0' }} Ft</span>
            </div>
          </div>
        </div>

        <!-- Top fotoszasi tipusok -->
        @if (stats()!.by_session_type.length) {
          <div class="section-block">
            <h2>Nepszeru tipusok</h2>
            <div class="session-type-list">
              @for (st of stats()!.by_session_type; track st.key) {
                <div class="session-type-row">
                  <span class="st-name">{{ st.name }}</span>
                  <span class="st-count">{{ st.count }} db</span>
                  <span class="st-revenue">{{ st.revenue | number:'1.0-0' }} Ft</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Napi bontasu mini chart -->
        @if (stats()!.daily_breakdown.length) {
          <div class="section-block">
            <h2>Napi bontas</h2>
            <div class="daily-chart">
              @for (day of stats()!.daily_breakdown; track day.date) {
                <div class="day-bar-wrapper">
                  <div class="day-bar" [style.height.%]="day.percentage || 2"></div>
                  <span class="day-label">{{ formatDayLabel(day.date) }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Egyeb mutatoszamok -->
        <div class="section-block">
          <h2>Egyeb mutatoszamok</h2>
          <div class="kpi-grid">
            <div class="kpi-item">
              <span class="kpi-label">Atlagos elorejeles (nap)</span>
              <span class="kpi-value">{{ stats()!.avg_lead_time_days | number:'1.0-1' }}</span>
            </div>
            <div class="kpi-item">
              <span class="kpi-label">Konverzios rata</span>
              <span class="kpi-value">{{ stats()!.conversion_rate | number:'1.0-1' }}%</span>
            </div>
            <div class="kpi-item">
              <span class="kpi-label">Legnepszerubb nap</span>
              <span class="kpi-value">{{ stats()!.busiest_day }}</span>
            </div>
            <div class="kpi-item">
              <span class="kpi-label">Diakok osszesen</span>
              <span class="kpi-value">{{ stats()!.totals.students_total }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { font-size: 1.5rem; font-weight: 600; margin: 0; }
    .page-header select { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .skeleton-card { height: 100px; border-radius: 12px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-icon { margin-bottom: 8px; color: #6b7280; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: #111827; }
    .stat-label { font-size: 0.8rem; color: #6b7280; margin-top: 4px; }
    .stat-card--green .stat-value { color: #059669; }
    .stat-card--blue .stat-value { color: #2563eb; }
    .stat-card--red .stat-value { color: #dc2626; }
    .stat-card--amber .stat-value { color: #d97706; }
    .section-block { margin-bottom: 28px; }
    .section-block h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 12px; }
    .capacity-row { display: flex; align-items: center; gap: 12px; }
    .capacity-info { font-size: 0.9rem; white-space: nowrap; }
    .cap-used { font-weight: 700; }
    .cap-sep { color: #9ca3af; }
    .cap-total { color: #6b7280; }
    .capacity-bar { flex: 1; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
    .capacity-fill { height: 100%; background: #7c3aed; border-radius: 5px; transition: width 0.4s ease; }
    .cap-pct { font-weight: 600; font-size: 0.9rem; }
    .revenue-row { display: flex; gap: 24px; }
    .revenue-item { display: flex; flex-direction: column; }
    .revenue-label { font-size: 0.8rem; color: #6b7280; }
    .revenue-value { font-size: 1.25rem; font-weight: 700; color: #059669; }
    .revenue-value--forecast { color: #6b7280; }
    .session-type-list { display: flex; flex-direction: column; gap: 8px; }
    .session-type-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f9fafb; border-radius: 8px; }
    .st-name { font-weight: 500; }
    .st-count { color: #6b7280; font-size: 0.85rem; }
    .st-revenue { font-weight: 600; font-size: 0.9rem; }
    .daily-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; padding-top: 8px; }
    .day-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .day-bar { width: 100%; max-width: 28px; background: #7c3aed; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.3s ease; }
    .day-label { font-size: 0.65rem; color: #9ca3af; margin-top: 4px; white-space: nowrap; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .kpi-item { padding: 12px 16px; background: #f9fafb; border-radius: 8px; display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.8rem; color: #6b7280; }
    .kpi-value { font-size: 1.1rem; font-weight: 600; margin-top: 4px; }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `],
})
export class BookingStatsComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  stats = signal<BookingStats | null>(null);
  selectedDays = signal(30);

  readonly periodOptions: PeriodOption[] = [
    { value: 7, label: 'Elmult 7 nap' },
    { value: 30, label: 'Elmult 30 nap' },
    { value: 90, label: 'Elmult 90 nap' },
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  onPeriodChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.selectedDays.set(value);
    this.loadStats();
  }

  formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  }

  private loadStats(): void {
    this.loading.set(true);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - this.selectedDays());
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    this.bookingService.getStats(fmt(start), fmt(end))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.stats.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }
}
