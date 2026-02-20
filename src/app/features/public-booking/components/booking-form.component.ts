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
  template: `
    <div class="form-header">
      <button class="back-btn" (click)="back.emit()">
        <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="18" />
        Vissza
      </button>
      <h2 class="section-title">Kapcsolattarto adatai</h2>
      <p class="section-desc">Kerjuk, adja meg adatait a foglalas veglegesitesehez.</p>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="booking-form">
      <div class="form-group">
        <label for="contact_name">Nev *</label>
        <input id="contact_name" type="text" formControlName="contact_name"
               placeholder="Teljes nev" class="form-input" />
        @if (form.get('contact_name')?.touched && form.get('contact_name')?.hasError('required')) {
          <span class="field-error">A nev megadasa kotelezo.</span>
        }
      </div>

      <div class="form-group">
        <label for="contact_email">Email *</label>
        <input id="contact_email" type="email" formControlName="contact_email"
               placeholder="pelda@email.com" class="form-input" />
        @if (form.get('contact_email')?.touched && form.get('contact_email')?.hasError('required')) {
          <span class="field-error">Az email cim megadasa kotelezo.</span>
        }
        @if (form.get('contact_email')?.touched && form.get('contact_email')?.hasError('email')) {
          <span class="field-error">Ervenytelen email cim.</span>
        }
      </div>

      <div class="form-group">
        <label for="contact_phone">Telefon</label>
        <input id="contact_phone" type="tel" formControlName="contact_phone"
               placeholder="+36 30 123 4567" class="form-input" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="school_name">Iskola neve</label>
          <input id="school_name" type="text" formControlName="school_name"
                 placeholder="Iskola" class="form-input" />
        </div>
        <div class="form-group">
          <label for="class_name">Osztaly</label>
          <input id="class_name" type="text" formControlName="class_name"
                 placeholder="pl. 12.A" class="form-input" />
        </div>
      </div>

      <div class="form-group">
        <label for="student_count">Letszam</label>
        <input id="student_count" type="number" formControlName="student_count"
               placeholder="Diakok szama" class="form-input" min="1" />
      </div>

      <!-- Dinamikus kerdoiv mezok -->
      @for (field of questionnaire(); track field.field_key) {
        <div class="form-group">
          <label [for]="'q_' + field.field_key">
            {{ field.label }}
            @if (field.is_required) { <span>*</span> }
          </label>

          @switch (field.field_type) {
            @case ('text') {
              <input [id]="'q_' + field.field_key" type="text"
                     [formControlName]="'q_' + field.field_key"
                     [placeholder]="field.placeholder ?? ''" class="form-input" />
            }
            @case ('number') {
              <input [id]="'q_' + field.field_key" type="number"
                     [formControlName]="'q_' + field.field_key"
                     [placeholder]="field.placeholder ?? ''" class="form-input" />
            }
            @case ('textarea') {
              <textarea [id]="'q_' + field.field_key"
                        [formControlName]="'q_' + field.field_key"
                        [placeholder]="field.placeholder ?? ''" class="form-input form-textarea"
                        rows="3"></textarea>
            }
            @case ('select') {
              <select [id]="'q_' + field.field_key"
                      [formControlName]="'q_' + field.field_key" class="form-input">
                <option value="">Valasszon...</option>
                @for (opt of field.options ?? []; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            }
            @case ('checkbox') {
              <label class="checkbox-label">
                <input type="checkbox" [formControlName]="'q_' + field.field_key" />
                {{ field.placeholder ?? field.label }}
              </label>
            }
          }
        </div>
      }

      <div class="form-group">
        <label for="notes">Megjegyzes</label>
        <textarea id="notes" formControlName="notes"
                  placeholder="Egyeb megjegyzes, kerdes..." class="form-input form-textarea"
                  rows="3"></textarea>
      </div>

      <button type="submit" class="submit-btn" [disabled]="form.invalid || submitting()">
        @if (submitting()) {
          <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
          Foglalas folyamatban...
        } @else {
          <lucide-icon [name]="ICONS.CHECK" [size]="18" />
          Foglalas veglegesitese
        }
      </button>
    </form>
  `,
  styles: [`
    .form-header { margin-bottom: 20px; }
    .back-btn {
      display: inline-flex; align-items: center; background: none; border: none;
      color: #64748b; font-size: 14px; cursor: pointer; padding: 4px 0; margin-bottom: 12px;
    }
    .back-btn lucide-icon { margin-right: 6px; }
    .back-btn:hover { color: #1e293b; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
    .section-desc { color: #64748b; font-size: 14px; margin: 0; }
    .booking-form { display: flex; flex-direction: column; }
    .booking-form > * { margin-bottom: 16px; }
    .booking-form > *:last-child { margin-bottom: 0; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label {
      font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;
    }
    .form-group label span { color: #dc2626; }
    .form-input {
      padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 14px; color: #1e293b; transition: border-color 0.15s;
      background: #fff; width: 100%; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: var(--primary-color, #7c3aed); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .form-textarea { resize: vertical; font-family: inherit; }
    .form-row { display: flex; margin-left: -8px; }
    .form-row > .form-group { flex: 1; margin-left: 8px; }
    .checkbox-label {
      display: flex; align-items: center; font-size: 14px; color: #475569; cursor: pointer;
    }
    .checkbox-label input { margin-right: 8px; }
    .field-error { color: #dc2626; font-size: 12px; margin-top: 4px; }
    .submit-btn {
      display: flex; align-items: center; justify-content: center;
      padding: 12px 24px; border: none; border-radius: 10px;
      background: var(--primary-color, #7c3aed); color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      margin-top: 8px;
    }
    .submit-btn lucide-icon { margin-right: 8px; }
    .submit-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (max-width: 480px) { .form-row { flex-direction: column; margin-left: 0; } .form-row > .form-group { margin-left: 0; } }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
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
    // Dinamikus kerdoiv mezok hozzaadasa effect-tel nem mukodik constructor-ban,
    // ezert az ngOnInit-ben kezeljuk
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
