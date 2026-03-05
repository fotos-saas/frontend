import {
  Component, input, output, signal, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { SessionType, QuestionnaireField } from '../../partner/models/booking.models';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss',
})
export class BookingFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly sessionType = input.required<SessionType>();
  readonly questionnaire = input<QuestionnaireField[]>([]);
  readonly submitForm = output<Record<string, unknown>>();
  readonly back = output<void>();
  readonly ICONS = ICONS;
  readonly submitting = signal(false);

  readonly form: FormGroup = this.fb.group({
    contact_name: ['', Validators.required],
    contact_email: ['', [Validators.required, Validators.email]],
    contact_phone: [''],
    school_name: [''],
    class_name: [''],
    student_count: [null as number | null],
    notes: [''],
  });

  constructor() {
    // Dinamikus kérdőív mezők hozzáadása effect-tel nem működik constructor-ban,
    // ezért az ngOnInit-ben kezeljük
  }

  ngOnInit(): void {
    const fields = this.questionnaire();
    for (const field of fields) {
      const validators = field.is_required ? [Validators.required] : [];
      const defaultValue = field.field_type === 'checkbox' ? false : '';
      this.form.addControl('q_' + field.field_key, new FormControl(defaultValue, validators));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const questionnaireAnswers: Record<string, unknown> = {};
    for (const field of this.questionnaire()) {
      questionnaireAnswers[field.field_key] = raw['q_' + field.field_key];
    }
    this.submitForm.emit({
      contact_name: raw.contact_name,
      contact_email: raw.contact_email,
      contact_phone: raw.contact_phone || undefined,
      school_name: raw.school_name || undefined,
      class_name: raw.class_name || undefined,
      student_count: raw.student_count || undefined,
      notes: raw.notes || undefined,
      questionnaire_answers: questionnaireAnswers,
    });
  }
}
