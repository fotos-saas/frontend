import {
  Component, input, computed, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchImportRow, Booking } from '../../../models/booking.models';

interface CalendarSlot {
  time: string;
  existing: Booking[];
  imported: BatchImportRow[];
  hasConflict: boolean;
}

interface CalendarDayColumn {
  date: string;
  label: string;
  dayName: string;
  slots: CalendarSlot[];
}

@Component({
  selector: 'app-batch-calendar-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="calendar-preview">
      <div class="preview-header">
        <h3>
          <lucide-icon [name]="ICONS.CALENDAR" [size]="18" />
          Naptar elonezet
        </h3>
        <div class="nav-btns">
          <button class="nav-btn" (click)="prevWeek()">
            <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="18" />
          </button>
          <span class="week-label">{{ weekLabel() }}</span>
          <button class="nav-btn" (click)="nextWeek()">
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="18" />
          </button>
        </div>
      </div>

      <div class="week-grid">
        @for (day of weekDays(); track day.date) {
          <div class="day-col">
            <div class="day-header">
              <span class="day-name">{{ day.dayName }}</span>
              <span class="day-date">{{ day.label }}</span>
            </div>
            <div class="day-slots">
              @for (slot of day.slots; track slot.time) {
                <div class="slot" [class.has-conflict]="slot.hasConflict">
                  <span class="slot-time">{{ slot.time }}</span>
                  @for (b of slot.existing; track b.id) {
                    <div class="slot-booking existing">
                      {{ b.contact_name }}
                    </div>
                  }
                  @for (r of slot.imported; track r.row_number) {
                    <div class="slot-booking imported" [class.conflict]="slot.hasConflict">
                      {{ r.data.class_name || r.data.contact_name }}
                    </div>
                  }
                </div>
              } @empty {
                <div class="slot-empty">-</div>
              }
            </div>
          </div>
        }
      </div>

      <div class="legend">
        <span class="legend-item">
          <span class="legend-dot existing"></span> Meglevo
        </span>
        <span class="legend-item">
          <span class="legend-dot imported"></span> Uj import
        </span>
        <span class="legend-item">
          <span class="legend-dot conflict"></span> Utkozes
        </span>
      </div>
    </div>
  `,
  styles: [`
    .calendar-preview { margin-bottom: 8px; }
    .preview-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .preview-header h3 {
      display: flex; align-items: center; font-size: 16px; font-weight: 600; color: #1e293b; margin: 0;
    }
    .preview-header h3 lucide-icon { margin-right: 8px; color: #7c3aed; }
    .nav-btns { display: flex; align-items: center; }
    .nav-btn {
      width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #475569;
    }
    .nav-btn:hover { background: #f1f5f9; }
    .week-label { font-size: 13px; font-weight: 600; color: #475569; margin: 0 10px; white-space: nowrap; }
    .week-grid {
      display: grid; grid-template-columns: repeat(5, 1fr);
      border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
    }
    .day-col { border-right: 1px solid #f1f5f9; }
    .day-col:last-child { border-right: none; }
    .day-header {
      padding: 8px; text-align: center; background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .day-name { display: block; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .day-date { display: block; font-size: 11px; color: #94a3b8; }
    .day-slots { min-height: 120px; }
    .slot { padding: 4px 6px; border-bottom: 1px solid #f8fafc; }
    .slot.has-conflict { background: #fef2f2; }
    .slot-time { font-size: 10px; color: #94a3b8; font-weight: 600; }
    .slot-booking {
      padding: 3px 6px; border-radius: 4px; font-size: 11px; margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .slot-booking.existing { background: #e0e7ff; color: #3730a3; }
    .slot-booking.imported {
      background: transparent; color: #7c3aed; font-weight: 600;
      border: 2px dashed #7c3aed;
    }
    .slot-booking.conflict {
      border-color: #dc2626; color: #dc2626;
    }
    .slot-empty { padding: 8px; text-align: center; color: #e2e8f0; font-size: 12px; }
    .legend {
      display: flex; margin-top: 12px; margin-left: -14px;
    }
    .legend-item { display: flex; align-items: center; font-size: 12px; color: #64748b; margin-left: 14px; }
    .legend-dot {
      width: 12px; height: 12px; border-radius: 3px; margin-right: 5px;
    }
    .legend-dot.existing { background: #e0e7ff; }
    .legend-dot.imported { border: 2px dashed #7c3aed; background: transparent; }
    .legend-dot.conflict { border: 2px dashed #dc2626; background: #fef2f2; }
    @media (max-width: 640px) { .week-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class BatchCalendarPreviewComponent {
  readonly rows = input.required<BatchImportRow[]>();
  readonly existingBookings = input<Booking[]>([]);
  readonly ICONS = ICONS;

  private readonly DAY_NAMES = ['Vasarnap', 'Hetfo', 'Kedd', 'Szerda', 'Csutortok', 'Pentek', 'Szombat'];
  readonly weekOffset = signal(0);

  readonly weekStart = computed(() => {
    const allDates = this.rows().map(r => r.data.date).sort();
    const first = allDates[0] ? new Date(allDates[0] + 'T00:00:00') : new Date();
    // Hetfo-re igazitas
    const day = first.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    first.setDate(first.getDate() + diff + this.weekOffset() * 7);
    return first;
  });

  readonly weekLabel = computed(() => {
    const start = this.weekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    const fmt = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}.`;
    return `${start.getFullYear()}. ${fmt(start)} - ${fmt(end)}`;
  });

  readonly weekDays = computed((): CalendarDayColumn[] => {
    const start = this.weekStart();
    const importedRows = this.rows();
    const existing = this.existingBookings();
    const cols: CalendarDayColumn[] = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = this.fmt(d);
      const dayImported = importedRows.filter(r => r.data.date === dateStr);
      const dayExisting = existing.filter(b => b.date === dateStr);

      // Idopontok osszegyujtese
      const times = new Set<string>();
      dayExisting.forEach(b => times.add(b.start_time));
      dayImported.forEach(r => times.add(r.data.start_time));
      const sortedTimes = [...times].sort();

      const slots: CalendarSlot[] = sortedTimes.map(time => {
        const ex = dayExisting.filter(b => b.start_time === time);
        const im = dayImported.filter(r => r.data.start_time === time);
        return { time, existing: ex, imported: im, hasConflict: ex.length > 0 && im.length > 0 };
      });

      cols.push({
        date: dateStr,
        label: `${d.getMonth() + 1}.${d.getDate()}.`,
        dayName: this.DAY_NAMES[d.getDay()],
        slots,
      });
    }
    return cols;
  });

  prevWeek(): void { this.weekOffset.update(v => v - 1); }
  nextWeek(): void { this.weekOffset.update(v => v + 1); }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
