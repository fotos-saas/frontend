import {
  Component, inject, input, output, OnInit, signal,
  DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import {
  SessionType, SessionTypeForm, LocationType,
  QuestionnaireFieldForm, LOCATION_TYPE_LABELS,
} from '../../../models/booking.models';

const COLORS = ['#8b5cf6','#3b82f6','#22c55e','#ef4444','#f59e0b','#ec4899','#06b6d4','#f97316'];

@Component({
  selector: 'app-session-type-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-type-form.component.html',
  styleUrl: './session-type-form.component.scss',
})
export class SessionTypeFormComponent implements OnInit {
  readonly type = input<SessionType | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;
  readonly COLORS = COLORS;
  readonly locationOptions = Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  name = '';
  key = '';
  description = '';
  durationMinutes = 45;
  bufferAfterMinutes = 15;
  color = COLORS[0];
  price: number | null = null;
  locationType: LocationType = 'on_site';
  defaultLocation = '';
  maxParticipants: number | null = null;
  requiresApproval = false;
  autoConfirm = true;
  isPublic = true;
  minNoticeHours: number | null = 24;
  maxAdvanceDays: number | null = 90;
  prepGuide = '';
  questionnaireFields: QuestionnaireFieldForm[] = [];
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    const t = this.type();
    if (t) {
      this.name = t.name; this.key = t.key; this.description = t.description ?? '';
      this.durationMinutes = t.duration_minutes; this.bufferAfterMinutes = t.buffer_after_minutes;
      this.color = t.color; this.price = t.price; this.locationType = t.location_type;
      this.defaultLocation = t.default_location ?? ''; this.maxParticipants = t.max_participants;
      this.requiresApproval = t.requires_approval; this.autoConfirm = t.auto_confirm;
      this.isPublic = t.is_public; this.minNoticeHours = t.min_notice_hours;
      this.maxAdvanceDays = t.max_advance_days; this.prepGuide = t.prep_guide ?? '';
      this.questionnaireFields = (t.questionnaire_fields ?? []).map(f => ({
        field_key: f.field_key, field_type: f.field_type, label: f.label,
        placeholder: f.placeholder ?? undefined, is_required: f.is_required,
        options: f.options ?? undefined, sort_order: f.sort_order,
      }));
    }
  }

  generateKey(): void {
    if (!this.type()) {
      this.key = this.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
  }

  isValid(): boolean {
    return this.name.trim().length > 0 && this.key.trim().length > 0 && this.durationMinutes > 0;
  }

  addField(): void {
    this.questionnaireFields.push({
      field_key: `field_${this.questionnaireFields.length + 1}`,
      field_type: 'text', label: '', is_required: false, sort_order: this.questionnaireFields.length,
    });
  }

  removeField(index: number): void { this.questionnaireFields.splice(index, 1); }

  onSave(): void {
    if (!this.isValid()) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    const fields = this.questionnaireFields.map((f, i) => ({ ...f, field_key: f.field_key || `field_${i + 1}`, sort_order: i }));
    const payload: SessionTypeForm = {
      name: this.name.trim(), key: this.key.trim(), description: this.description.trim() || undefined,
      duration_minutes: this.durationMinutes, buffer_after_minutes: this.bufferAfterMinutes,
      color: this.color, price: this.price ?? undefined, location_type: this.locationType,
      default_location: this.defaultLocation.trim() || undefined, max_participants: this.maxParticipants ?? undefined,
      requires_approval: this.requiresApproval, auto_confirm: this.autoConfirm, is_public: this.isPublic,
      min_notice_hours: this.minNoticeHours ?? undefined, max_advance_days: this.maxAdvanceDays ?? undefined,
      prep_guide: this.prepGuide.trim() || undefined, questionnaire_fields: fields.length ? fields : undefined,
    };
    const obs = this.type()
      ? this.bookingService.updateSessionType(this.type()!.id, payload)
      : this.bookingService.createSessionType(payload);
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: (err) => { this.saving.set(false); this.errorMsg.set(err.error?.message ?? 'Hiba történt a mentés során.'); },
    });
  }
}
