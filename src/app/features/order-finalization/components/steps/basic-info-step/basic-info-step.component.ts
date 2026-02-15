import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsInputComponent, PsTextareaComponent } from '@shared/components/form';
import { BasicInfoData } from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';

/**
 * Basic Info Step Component (Step 2)
 * Iskola és osztály adatok form
 *
 * @description
 * - Input signal: data (BasicInfoData)
 * - Output: dataChange (BasicInfoData változás)
 * - Saját validációs hibaüzenetek
 * - ARIA akadálymentesség
 */
@Component({
  selector: 'app-basic-info-step',
  templateUrl: './basic-info-step.component.html',
  styleUrls: ['./basic-info-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, PsInputComponent, PsTextareaComponent]
})
export class BasicInfoStepComponent {
  private readonly validationService = inject(OrderValidationService);

  /** Input: Alap adatok */
  data = input.required<BasicInfoData>();

  /** Output: Adatok változása */
  dataChange = output<BasicInfoData>();

  /** Validációs hibák (computed) */
  errors = computed<ValidationError[]>(() => {
    const result = this.validationService.validateBasicInfo(this.data());
    return result.errors;
  });

  /** Mező szerkesztve (touched) állapot */
  touched: Record<keyof BasicInfoData, boolean> = {
    schoolName: false,
    city: false,
    className: false,
    classYear: false,
    quote: false
  };

  /**
   * Mező frissítése
   * @param field - Mező neve
   * @param value - Új érték
   */
  updateField<K extends keyof BasicInfoData>(field: K, value: BasicInfoData[K]): void {
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
