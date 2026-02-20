import {
  Component, signal, inject, OnInit, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PublicBookingService } from './services/public-booking.service';
import { DatePickerComponent } from './components/date-picker.component';
import { TimeSlotPickerComponent } from './components/time-slot-picker.component';
import {
  PublicBookingPartner, SessionType, TimeSlot,
} from '../partner/models/booking.models';

type RescheduleStep = 'date' | 'time' | 'done';

@Component({
  selector: 'app-public-booking-reschedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, DatePickerComponent, TimeSlotPickerComponent],
  template: `
    <div class="reschedule-page">
      <div class="reschedule-card">
        <div class="card-header">
          <lucide-icon [name]="ICONS.CALENDAR" [size]="28" />
          <h1>Foglalas athelyezese</h1>
        </div>

        @if (error()) {
          <div class="error-box">
            <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="18" />
            <span>{{ error() }}</span>
          </div>
        }

        @switch (step()) {
          @case ('date') {
            <p class="info-text">Valasszon uj datumot a foglalashoz.</p>
            @if (partner() && sessionTypeId()) {
              <app-date-picker
                [slug]="slug()"
                [sessionTypeId]="sessionTypeId()"
                (select)="onDateSelect($event)"
                (back)="onBackToInfo()" />
            }
          }
          @case ('time') {
            <app-time-slot-picker
              [slots]="availableSlots()"
              [loading]="slotsLoading()"
              (select)="onTimeSelect($event)"
              (back)="step.set('date')" />
          }
          @case ('done') {
            <div class="success-state">
              <div class="success-icon">
                <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="48" />
              </div>
              <h2>Foglalas sikeresen athelyezve!</h2>
              <p>Az uj idopont: {{ selectedDate() }}, {{ selectedSlot()?.start_time }} - {{ selectedSlot()?.end_time }}</p>
              <p class="note">Az uj idopontrol emailben is ertesitjuk.</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%); }
    .reschedule-page { max-width: 600px; margin: 0 auto; padding: 48px 16px; }
    .reschedule-card {
      background: #fff; border-radius: 16px; padding: 32px 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .card-header {
      display: flex; align-items: center; margin-bottom: 20px;
    }
    .card-header lucide-icon { color: var(--primary-color, #7c3aed); margin-right: 12px; }
    .card-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
    .info-text { color: #64748b; font-size: 15px; margin: 0 0 20px; }
    .error-box {
      display: flex; align-items: center; padding: 12px 16px; border-radius: 8px;
      background: #fef2f2; color: #dc2626; font-size: 14px; margin-bottom: 16px;
    }
    .error-box lucide-icon { margin-right: 8px; flex-shrink: 0; }
    .success-state { text-align: center; padding: 16px 0; }
    .success-icon { color: #16a34a; margin-bottom: 16px; animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.3); }
      to { opacity: 1; transform: scale(1); }
    }
    .success-state h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .success-state p { color: #475569; font-size: 15px; margin: 0 0 4px; }
    .success-state .note { color: #94a3b8; font-size: 13px; }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class PublicBookingRescheduleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PublicBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly slug = signal('');
  readonly bookingUuid = signal('');
  readonly partner = signal<PublicBookingPartner | null>(null);
  readonly sessionTypeId = signal(0);
  readonly step = signal<RescheduleStep>('date');
  readonly selectedDate = signal('');
  readonly selectedSlot = signal<TimeSlot | null>(null);
  readonly availableSlots = signal<TimeSlot[]>([]);
  readonly slotsLoading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const uuid = this.route.snapshot.paramMap.get('bookingUuid') ?? '';
    this.slug.set(slug);
    this.bookingUuid.set(uuid);

    this.service.getPartner(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.partner.set(res.data.partner);
          if (res.data.session_types.length > 0) {
            this.sessionTypeId.set(res.data.session_types[0].id);
          }
        },
        error: () => this.error.set('Nem sikerult betolteni az adatokat.'),
      });
  }

  onBackToInfo(): void {
    // A date picker back gomb - nincs hova menni, maradunk
  }

  onDateSelect(date: string): void {
    this.selectedDate.set(date);
    this.slotsLoading.set(true);
    this.service.getAvailableSlots(this.slug(), this.sessionTypeId(), date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.availableSlots.set(res.data); this.slotsLoading.set(false); this.step.set('time'); },
        error: () => { this.slotsLoading.set(false); this.error.set('Hiba az idopontok betoltesekor.'); },
      });
  }

  onTimeSelect(slot: TimeSlot): void {
    this.selectedSlot.set(slot);
    this.service.reschedule(this.slug(), this.bookingUuid(), {
      date: this.selectedDate(),
      start_time: slot.start_time,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.step.set('done'),
        error: () => this.error.set('Nem sikerult athelyezni a foglalast. Kerem, problja ujra.'),
      });
  }
}
