import {
  Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy, output, input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { SessionType, TimeSlot, BookingConflict, BookingForm } from '../../../models/booking.models';

@Component({
  selector: 'app-new-booking-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-booking-dialog.component.html',
  styleUrl: './new-booking-dialog.component.scss',
})
export class NewBookingDialogComponent implements OnInit {
  readonly initialDate = input<string>('');
  readonly initialTime = input<string>('');
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit(), 'dialog-backdrop');

  sessionTypes = signal<SessionType[]>([]);
  availableSlots = signal<TimeSlot[]>([]);
  conflicts = signal<BookingConflict[]>([]);
  loadingSlots = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  sessionTypeId: number | null = null;
  date = '';
  startTime = '';
  contactName = '';
  contactEmail = '';
  contactPhone = '';
  schoolName = '';
  className = '';
  studentCount: number | null = null;
  notes = '';
  internalNotes = '';

  ngOnInit(): void {
    const prefillDate = this.initialDate();
    const prefillTime = this.initialTime();

    if (prefillDate) {
      this.date = prefillDate;
      this.startTime = prefillTime;
    }

    this.bookingService.getSessionTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const types = res.data?.session_types ?? res.data ?? [];
        const active = types.filter((t: any) => t.is_active);
        this.sessionTypes.set(active);

        // Ha van prefill dátum, auto-select első típus + slot betöltés
        if (prefillDate && active.length > 0 && !this.sessionTypeId) {
          this.sessionTypeId = active[0].id;
          this.loadSlots();
        }
      },
    });
  }

  onTypeChange(): void {
    this.startTime = '';
    this.availableSlots.set([]);
    if (this.date && this.sessionTypeId) this.loadSlots();
  }

  loadSlots(): void {
    if (!this.date || !this.sessionTypeId) return;
    this.loadingSlots.set(true);
    this.bookingService.getAvailableSlots(this.date, this.sessionTypeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.availableSlots.set(res.data); this.loadingSlots.set(false); },
        error: () => { this.availableSlots.set([]); this.loadingSlots.set(false); },
      });
  }

  isValid(): boolean {
    return !!this.sessionTypeId && !!this.date && !!this.startTime
      && this.contactName.trim().length > 0 && this.contactEmail.trim().length > 0;
  }

  onSave(): void {
    if (!this.isValid()) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    this.conflicts.set([]);
    const payload: BookingForm = {
      session_type_id: this.sessionTypeId!, date: this.date, start_time: this.startTime,
      contact_name: this.contactName.trim(), contact_email: this.contactEmail.trim(),
      contact_phone: this.contactPhone.trim() || undefined,
      school_name: this.schoolName.trim() || undefined, class_name: this.className.trim() || undefined,
      student_count: this.studentCount ?? undefined,
      notes: this.notes.trim() || undefined, internal_notes: this.internalNotes.trim() || undefined,
      send_confirmation: true,
    };
    this.bookingService.createBooking(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.conflicts?.length) this.conflicts.set(res.conflicts);
        this.saved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        if (err.error?.conflicts) this.conflicts.set(err.error.conflicts);
        this.errorMsg.set(err.error?.message ?? 'Hiba történt a foglalás létrehozása során.');
      },
    });
  }
}
