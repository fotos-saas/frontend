import {
  Component, input, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PublicBookingConfirmation } from '../../partner/models/booking.models';
import { PublicBookingService } from '../services/public-booking.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="confirmation">
      <div class="success-icon">
        <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="56" />
      </div>

      <h2 class="confirm-title">Foglalas sikeres!</h2>
      <p class="confirm-subtitle">{{ confirmation().message }}</p>

      <div class="details-card">
        <div class="detail-row">
          <lucide-icon [name]="ICONS.TAG" [size]="16" />
          <span class="detail-label">Foglalasi szam:</span>
          <span class="detail-value">{{ confirmation().booking.booking_number }}</span>
        </div>
        <div class="detail-row">
          <lucide-icon [name]="ICONS.CALENDAR" [size]="16" />
          <span class="detail-label">Datum:</span>
          <span class="detail-value">{{ formatDate(confirmation().booking.date) }}</span>
        </div>
        <div class="detail-row">
          <lucide-icon [name]="ICONS.CLOCK" [size]="16" />
          <span class="detail-label">Idopont:</span>
          <span class="detail-value">{{ confirmation().booking.start_time }} - {{ confirmation().booking.end_time }}</span>
        </div>
        <div class="detail-row">
          <lucide-icon [name]="ICONS.BRIEFCASE" [size]="16" />
          <span class="detail-label">Tipus:</span>
          <span class="detail-value">{{ confirmation().booking.session_type_name }}</span>
        </div>
        <div class="detail-row">
          <lucide-icon [name]="ICONS.USER" [size]="16" />
          <span class="detail-label">Nev:</span>
          <span class="detail-value">{{ confirmation().booking.contact_name }}</span>
        </div>
      </div>

      <div class="calendar-actions">
        <p class="actions-label">Hozzaadas a naptarhoz:</p>
        <div class="actions-row">
          <a class="cal-btn google" [href]="confirmation().calendar_links.google"
             target="_blank" rel="noopener noreferrer">
            <lucide-icon [name]="ICONS.CALENDAR" [size]="16" />
            Google Naptar
          </a>
          <button class="cal-btn ics" (click)="downloadIcs()">
            <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" />
            ICS letoltes
          </button>
        </div>
      </div>

      <div class="email-notice">
        <lucide-icon [name]="ICONS.MAIL_CHECK" [size]="18" />
        <span>A foglalas reszleteit elkuldtuk emailben.</span>
      </div>
    </div>
  `,
  styles: [`
    .confirmation { text-align: center; padding: 12px 0; }
    .success-icon { color: #16a34a; margin-bottom: 16px; animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.3); }
      to { opacity: 1; transform: scale(1); }
    }
    .confirm-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .confirm-subtitle { color: #64748b; font-size: 15px; margin: 0 0 24px; }
    .details-card {
      background: #f8fafc; border-radius: 12px; padding: 20px;
      text-align: left; margin-bottom: 24px;
    }
    .detail-row {
      display: flex; align-items: center; padding: 8px 0;
      border-bottom: 1px solid #f1f5f9; font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-row lucide-icon { color: #94a3b8; flex-shrink: 0; }
    .detail-label { color: #64748b; margin-left: 10px; margin-right: 8px; white-space: nowrap; }
    .detail-value { color: #1e293b; font-weight: 600; }
    .calendar-actions { margin-bottom: 24px; }
    .actions-label { color: #64748b; font-size: 13px; margin: 0 0 10px; }
    .actions-row {
      display: flex; justify-content: center;
      margin-left: -8px;
    }
    .actions-row > * { margin-left: 8px; }
    .cal-btn {
      display: inline-flex; align-items: center; padding: 10px 16px;
      border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.15s; text-decoration: none; border: none;
    }
    .cal-btn lucide-icon { margin-right: 6px; }
    .cal-btn.google { background: #eef2ff; color: #4338ca; }
    .cal-btn.google:hover { background: #e0e7ff; }
    .cal-btn.ics { background: #f0fdf4; color: #16a34a; }
    .cal-btn.ics:hover { background: #dcfce7; }
    .email-notice {
      display: flex; align-items: center; justify-content: center;
      padding: 14px; border-radius: 10px; background: #f0fdf4;
      color: #16a34a; font-size: 14px;
    }
    .email-notice lucide-icon { margin-right: 8px; flex-shrink: 0; }
    @media (max-width: 400px) { .actions-row { flex-direction: column; margin-left: 0; } .actions-row > * { margin-left: 0; margin-bottom: 8px; } }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class BookingConfirmationComponent {
  readonly confirmation = input.required<PublicBookingConfirmation>();
  readonly slug = input.required<string>();
  readonly ICONS = ICONS;

  private readonly service = inject(PublicBookingService);
  private readonly destroyRef = inject(DestroyRef);

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Vasarnap', 'Hetfo', 'Kedd', 'Szerda', 'Csutortok', 'Pentek', 'Szombat'];
    const months = [
      'jan.', 'feb.', 'mar.', 'apr.', 'maj.', 'jun.',
      'jul.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
    ];
    return `${d.getFullYear()}. ${months[d.getMonth()]} ${d.getDate()}. (${days[d.getDay()]})`;
  }

  downloadIcs(): void {
    const uuid = this.confirmation().booking.uuid;
    this.service.downloadIcs(this.slug(), uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `foglalas-${this.confirmation().booking.booking_number}.ics`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
