import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactData } from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';

/**
 * Contact Step Component (Step 1)
 * Kapcsolattartó adatok form
 *
 * @description
 * - Input signal: data (ContactData)
 * - Output: dataChange (ContactData változás)
 * - Saját validációs hibaüzenetek
 * - ARIA akadálymentesség
 */
@Component({
  selector: 'app-contact-step',
  templateUrl: './contact-step.component.html',
  styleUrls: ['./contact-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule]
})
export class ContactStepComponent {
  private readonly validationService = inject(OrderValidationService);

  /** Input: Kapcsolattartó adatok */
  data = input.required<ContactData>();

  /** Output: Adatok változása */
  dataChange = output<ContactData>();

  /** Validációs hibák (computed) */
  errors = computed<ValidationError[]>(() => {
    const result = this.validationService.validateContactData(this.data());
    return result.errors;
  });

  /** Mező szerkesztve (touched) állapot */
  touched = {
    name: false,
    email: false,
    phone: false
  };

  /**
   * Mező frissítése
   * @param field - Mező neve
   * @param value - Új érték
   */
  updateField<K extends keyof ContactData>(field: K, value: ContactData[K]): void {
    this.touched[field] = true;
    this.dataChange.emit({ ...this.data(), [field]: value });
  }

  /**
   * Mező hibaüzenetének lekérése
   * @param field - Mező neve
   * @returns Hibaüzenet vagy null
   */
  getFieldError(field: string): string | null {
    if (!this.touched[field as keyof typeof this.touched]) return null;
    return this.validationService.getFieldError(this.errors(), field);
  }

  /**
   * Mező hibás-e (touched + error)
   * @param field - Mező neve
   * @returns true ha hibás
   */
  hasError(field: string): boolean {
    return !!this.getFieldError(field);
  }
}
