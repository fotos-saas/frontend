import {
  Component, input, output, ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { TimeSlot } from '../../partner/models/booking.models';

@Component({
  selector: 'app-time-slot-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="slot-header">
      <button class="back-btn" (click)="back.emit()">
        <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="18" />
        Vissza
      </button>
      <h2 class="section-title">Valasszon idopontot</h2>
    </div>

    @if (loading()) {
      <div class="slot-loading">
        <lucide-icon [name]="ICONS.LOADER" [size]="24" class="spin" />
        <span>Idopontok betoltese...</span>
      </div>
    } @else {
      <div class="slot-list">
        @for (slot of slots(); track slot.start_time; let i = $index) {
          <button
            class="slot-item"
            [style.animation-delay]="i * 0.04 + 's'"
            (click)="select.emit(slot)">
            <lucide-icon [name]="ICONS.CLOCK" [size]="18" />
            <span class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</span>
            <lucide-icon class="slot-arrow" [name]="ICONS.CHEVRON_RIGHT" [size]="18" />
          </button>
        } @empty {
          <div class="empty-state">
            <lucide-icon [name]="ICONS.CALENDAR" [size]="32" />
            <p>Ezen a napon nincs elerheto idopont.</p>
            <button class="back-link" (click)="back.emit()">Valasszon masik napot</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .slot-header { margin-bottom: 20px; }
    .back-btn {
      display: inline-flex; align-items: center; background: none; border: none;
      color: #64748b; font-size: 14px; cursor: pointer; padding: 4px 0; margin-bottom: 12px;
    }
    .back-btn lucide-icon { margin-right: 6px; }
    .back-btn:hover { color: #1e293b; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .slot-loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 0; color: #64748b; font-size: 14px;
    }
    .slot-loading lucide-icon { margin-bottom: 8px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .slot-list { display: flex; flex-direction: column; }
    .slot-list > * { margin-bottom: 8px; }
    .slot-list > *:last-child { margin-bottom: 0; }
    .slot-item {
      display: flex; align-items: center; width: 100%; padding: 14px 16px;
      border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
      cursor: pointer; transition: all 0.2s ease; font-size: 15px; color: #334155;
      animation: fadeSlideUp 0.25s ease both;
    }
    .slot-item:hover {
      border-color: var(--primary-color, #7c3aed);
      background: #faf5ff; transform: translateX(4px);
    }
    .slot-item lucide-icon:first-child { color: var(--primary-color, #7c3aed); margin-right: 12px; }
    .slot-time { flex: 1; font-weight: 500; }
    .slot-arrow { color: #cbd5e1; }
    .slot-item:hover .slot-arrow { color: var(--primary-color, #7c3aed); }
    .empty-state {
      text-align: center; padding: 32px 0; color: #94a3b8;
    }
    .empty-state lucide-icon { margin-bottom: 12px; }
    .empty-state p { font-size: 15px; margin: 0 0 12px; }
    .back-link {
      background: none; border: none; color: var(--primary-color, #7c3aed);
      cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: underline;
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class TimeSlotPickerComponent {
  readonly slots = input.required<TimeSlot[]>();
  readonly loading = input(false);
  readonly select = output<TimeSlot>();
  readonly back = output<void>();
  readonly ICONS = ICONS;
}
