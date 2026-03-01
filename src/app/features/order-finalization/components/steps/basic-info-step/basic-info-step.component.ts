import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent, PsTextareaComponent, PsAutocompleteComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ICONS } from '@shared/constants/icons.constants';
import { BasicInfoData } from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';

/**
 * Basic Info Step Component (Step 2)
 * Iskola és osztály adatok form
 *
 * Partner módban: iskola autocomplete + "Új iskola" gomb
 * Guest módban: sima szöveges input
 */
@Component({
  selector: 'app-basic-info-step',
  templateUrl: './basic-info-step.component.html',
  styleUrls: ['./basic-info-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, MatTooltipModule, LucideAngularModule, PsInputComponent, PsTextareaComponent, PsAutocompleteComponent]
})
export class BasicInfoStepComponent {
  private readonly validationService = inject(OrderValidationService);

  readonly ICONS = ICONS;

  /** Input: Alap adatok */
  data = input.required<BasicInfoData>();

  /** Input: Partner mód (város nem kötelező, iskola autocomplete) */
  partnerMode = input<boolean>(false);

  /** Input: Iskola autocomplete javaslatok (partner mód) */
  schoolSuggestions = input<PsSelectOption[]>([]);

  /** Input: Iskola keresés loading (partner mód) */
  schoolLoading = input(false);

  /** Output: Adatok változása */
  dataChange = output<BasicInfoData>();

  /** Output: Iskola keresés (partner mód autocomplete) */
  schoolSearch = output<string>();

  /** Output: Iskola kiválasztva az autocomplete-ből (id, label, sublabel=city) */
  schoolSelected = output<PsSelectOption>();

  /** Output: "Új iskola" gomb kattintás */
  addSchool = output<void>();

  /** Validációs hibák (computed) */
  errors = computed<ValidationError[]>(() => {
    const result = this.partnerMode()
      ? this.validationService.validateBasicInfoPartner(this.data())
      : this.validationService.validateBasicInfo(this.data());
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
   */
  updateField<K extends keyof BasicInfoData>(field: K, value: BasicInfoData[K]): void {
    this.touched[field] = true;
    this.dataChange.emit({ ...this.data(), [field]: value });
  }

  /**
   * Iskola keresés (autocomplete search event)
   */
  onSchoolSearch(query: string): void {
    this.schoolSearch.emit(query);
  }

  /**
   * Iskola kiválasztva az autocomplete-ből
   * Frissíti a schoolName + city mezőket
   */
  onSchoolSelected(option: PsSelectOption): void {
    this.touched.schoolName = true;
    const updatedData = {
      ...this.data(),
      schoolName: option.label,
      city: option.sublabel || this.data().city,
    };
    this.dataChange.emit(updatedData);
    this.schoolSelected.emit(option);
  }

  /**
   * Mező hibaüzenetének lekérése
   */
  getFieldError(field: string): string | null {
    if (!this.touched[field as keyof typeof this.touched]) return null;
    return this.validationService.getFieldError(this.errors(), field);
  }

  /**
   * Mező hibás-e (touched + error)
   */
  hasError(field: string): boolean {
    return !!this.getFieldError(field);
  }
}
