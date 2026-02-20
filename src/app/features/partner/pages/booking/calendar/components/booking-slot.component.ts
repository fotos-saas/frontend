import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Booking, BOOKING_STATUS_CONFIG } from '../../../../models/booking.models';
import { slotEnterAnimation } from '../../animations/booking.animations';

@Component({
  selector: 'app-booking-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule],
  animations: [slotEnterAnimation],
  template: `
    <div
      class="booking-slot"
      [style.background]="bgColor()"
      [style.border-left-color]="statusColor()"
      [matTooltip]="tooltipText()"
      matTooltipPosition="above"
      @slotEnter
    >
      <span class="slot-type">{{ booking().session_type.name }}</span>
      <span class="slot-contact">{{ booking().contact_name }}</span>
      @if (booking().school_name) {
        <span class="slot-school">{{ booking().school_name }}</span>
      }
      <span class="slot-time">
        {{ booking().start_time.slice(0, 5) }} - {{ booking().end_time.slice(0, 5) }}
      </span>
    </div>
  `,
  styles: [`
    .booking-slot {
      position: absolute;
      left: 2px;
      right: 2px;
      border-left: 3px solid #6366f1;
      border-radius: 4px;
      padding: 4px 6px;
      cursor: pointer;
      overflow: hidden;
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      z-index: 5;
    }
    .booking-slot:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: scale(1.02);
      z-index: 10;
    }
    .slot-type {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slot-contact {
      display: block;
      font-size: 10px;
      color: rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slot-school {
      display: block;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slot-time {
      display: block;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 2px;
    }
  `],
})
export class BookingSlotComponent {
  readonly booking = input.required<Booking>();

  readonly bgColor = computed(() => {
    const color = this.booking().session_type.color || '#6366f1';
    return color + '30'; // 30 = ~19% opacity hex
  });

  readonly statusColor = computed(() => {
    const status = this.booking().status;
    const config = BOOKING_STATUS_CONFIG[status];
    const colorMap: Record<string, string> = {
      amber: '#f59e0b',
      green: '#22c55e',
      blue: '#3b82f6',
      gray: '#9ca3af',
      red: '#ef4444',
    };
    return colorMap[config.color] || '#6366f1';
  });

  readonly tooltipText = computed(() => {
    const b = this.booking();
    const status = BOOKING_STATUS_CONFIG[b.status].label;
    const parts = [
      `${b.session_type.name}`,
      `${b.contact_name}`,
      `${b.start_time.slice(0, 5)} - ${b.end_time.slice(0, 5)}`,
      `Státusz: ${status}`,
    ];
    if (b.school_name) parts.splice(2, 0, b.school_name);
    if (b.location) parts.push(`Helyszín: ${b.location}`);
    return parts.join('\n');
  });
}
