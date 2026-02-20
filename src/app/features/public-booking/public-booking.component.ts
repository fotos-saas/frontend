import {
  Component, signal, computed, inject, OnInit,
  ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PublicBookingService } from './services/public-booking.service';
import { TypeSelectorComponent } from './components/type-selector.component';
import { DatePickerComponent } from './components/date-picker.component';
import { TimeSlotPickerComponent } from './components/time-slot-picker.component';
import { BookingFormComponent } from './components/booking-form.component';
import { BookingConfirmationComponent } from './components/booking-confirmation.component';
import {
  PublicBookingPartner, SessionType, TimeSlot, PublicBookingConfirmation,
} from '../partner/models/booking.models';

@Component({
  selector: 'app-public-booking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule, TypeSelectorComponent, DatePickerComponent,
    TimeSlotPickerComponent, BookingFormComponent, BookingConfirmationComponent,
  ],
  template: `
    <div class="public-booking" [style.--primary-color]="primaryColor()">
      <div class="booking-header">
        @if (partner()?.page_settings?.logo_url) {
          <img [src]="partner()!.page_settings!.logo_url" alt="Logo" class="partner-logo" />
        }
        <h1>{{ partner()?.name }}</h1>
        @if (partner()?.page_settings?.welcome_text) {
          <p class="welcome-text">{{ partner()!.page_settings!.welcome_text }}</p>
        }
      </div>

      <div class="booking-progress">
        @for (s of steps; track s) {
          <div class="progress-dot" [class.active]="step() >= s" [class.current]="step() === s"></div>
        }
      </div>

      <div class="booking-content">
        @switch (step()) {
          @case (1) {
            <app-type-selector [types]="sessionTypes()" (select)="onTypeSelect($event)" />
          }
          @case (2) {
            <app-date-picker
              [slug]="slug()"
              [sessionTypeId]="selectedType()!.id"
              (select)="onDateSelect($event)"
              (back)="step.set(1)" />
          }
          @case (3) {
            <app-time-slot-picker
              [slots]="availableSlots()"
              [loading]="slotsLoading()"
              (select)="onTimeSelect($event)"
              (back)="step.set(2)" />
          }
          @case (4) {
            <app-booking-form
              [sessionType]="selectedType()!"
              [questionnaire]="selectedType()!.questionnaire_fields ?? []"
              (submitForm)="onFormSubmit($event)"
              (back)="step.set(3)" />
          }
          @case (5) {
            <app-booking-confirmation [confirmation]="confirmation()!" [slug]="slug()" />
          }
        }
      </div>

      @if (partner()?.page_settings?.footer_text) {
        <div class="booking-footer">{{ partner()!.page_settings!.footer_text }}</div>
      }

      @if (error()) {
        <div class="booking-error">
          <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="18" />
          <span>{{ error() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%); }
    .public-booking {
      max-width: 600px; margin: 0 auto; padding: 32px 16px;
      --primary-color: #7c3aed;
    }
    .booking-header { text-align: center; margin-bottom: 32px; }
    .partner-logo { max-height: 64px; margin-bottom: 16px; object-fit: contain; }
    .booking-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .welcome-text { color: #64748b; font-size: 15px; margin: 0; }
    .booking-progress {
      display: flex; justify-content: center; margin-bottom: 32px;
      /* gap polyfill */ margin-left: -6px;
    }
    .booking-progress .progress-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #e2e8f0; transition: all 0.3s ease;
      margin-left: 6px;
    }
    .progress-dot.active { background: var(--primary-color); }
    .progress-dot.current { transform: scale(1.3); box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15); }
    .booking-content {
      background: #fff; border-radius: 16px; padding: 28px 24px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      min-height: 280px;
    }
    .booking-footer { text-align: center; margin-top: 24px; color: #94a3b8; font-size: 13px; }
    .booking-error {
      display: flex; align-items: center; justify-content: center;
      margin-top: 16px; padding: 12px 16px; border-radius: 8px;
      background: #fef2f2; color: #dc2626; font-size: 14px;
      /* gap polyfill */ margin-left: -6px;
    }
    .booking-error > * { margin-left: 6px; }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class PublicBookingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(PublicBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly steps = [1, 2, 3, 4, 5];

  readonly step = signal(1);
  readonly slug = signal('');
  readonly partner = signal<PublicBookingPartner | null>(null);
  readonly sessionTypes = signal<SessionType[]>([]);
  readonly selectedType = signal<SessionType | null>(null);
  readonly selectedDate = signal('');
  readonly availableSlots = signal<TimeSlot[]>([]);
  readonly slotsLoading = signal(false);
  readonly confirmation = signal<PublicBookingConfirmation | null>(null);
  readonly error = signal('');

  readonly primaryColor = computed(() => this.partner()?.page_settings?.primary_color ?? '#7c3aed');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(slug);
    this.loadPartner(slug);
  }

  private loadPartner(slug: string): void {
    this.bookingService.getPartner(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.partner.set(res.data.partner);
          this.sessionTypes.set(res.data.session_types);
        },
        error: () => this.error.set('Nem sikerult betolteni az adatokat. Probalja ujra kesobb.'),
      });
  }

  onTypeSelect(type: SessionType): void {
    this.selectedType.set(type);
    this.step.set(2);
  }

  onDateSelect(date: string): void {
    this.selectedDate.set(date);
    this.slotsLoading.set(true);
    this.bookingService.getAvailableSlots(this.slug(), this.selectedType()!.id, date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.availableSlots.set(res.data); this.slotsLoading.set(false); this.step.set(3); },
        error: () => { this.slotsLoading.set(false); this.error.set('Hiba tortent az idopontok betoltesekor.'); },
      });
  }

  onTimeSelect(slot: TimeSlot): void {
    this.step.set(4);
  }

  onFormSubmit(formData: Record<string, unknown>): void {
    const payload = {
      ...formData,
      session_type_id: this.selectedType()!.id,
      date: this.selectedDate(),
      start_time: this.availableSlots().find(s => s.start_time === (formData as any)['start_time'])?.start_time
        ?? this.availableSlots()[0]?.start_time,
    };
    this.bookingService.book(this.slug(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.confirmation.set(res.data); this.step.set(5); },
        error: () => this.error.set('Hiba tortent a foglalas soran. Probalja ujra.'),
      });
  }
}
