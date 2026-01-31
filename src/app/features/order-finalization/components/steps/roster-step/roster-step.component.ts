import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RosterData, SortType, SORT_TYPE_OPTIONS } from '../../../models/order-finalization.models';
import { OrderValidationService, ValidationError } from '../../../services/order-validation.service';

/**
 * Roster Step Component (Step 4)
 * Névsor megadása form
 *
 * @description
 * - Diákok és tanárok névsora
 * - Sorrend típus választó
 * - ÁSZF elfogadás checkbox
 * - ARIA akadálymentesség
 */
@Component({
  selector: 'app-roster-step',
  templateUrl: './roster-step.component.html',
  styleUrls: ['./roster-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule]
})
export class RosterStepComponent {
  private readonly validationService = inject(OrderValidationService);

  /** Input: Névsor adatok */
  data = input.required<RosterData>();

  /** Output: Adatok változása */
  dataChange = output<RosterData>();

  /** Sorrend típus opciók */
  readonly sortTypeOptions = SORT_TYPE_OPTIONS;

  /** Validációs hibák */
  errors = computed<ValidationError[]>(() => {
    const result = this.validationService.validateRosterData(this.data());
    return result.errors;
  });

  /** Touched állapot */
  touched: Record<string, boolean> = {
    studentRoster: false,
    teacherRoster: false,
    sortType: false,
    acceptTerms: false
  };

  /**
   * Mező frissítése
   */
  updateField<K extends keyof RosterData>(field: K, value: RosterData[K]): void {
    this.touched[field as string] = true;
    this.dataChange.emit({ ...this.data(), [field]: value });
  }

  /**
   * Sorrend típus frissítése
   */
  updateSortType(value: string): void {
    this.touched['sortType'] = true;
    this.dataChange.emit({ ...this.data(), sortType: value as SortType });
  }

  /**
   * ÁSZF checkbox frissítése
   */
  updateAcceptTerms(value: boolean): void {
    this.touched['acceptTerms'] = true;
    this.dataChange.emit({ ...this.data(), acceptTerms: value });
  }

  /**
   * Mező hibaüzenetének lekérése
   */
  getFieldError(field: string): string | null {
    if (!this.touched[field]) return null;
    return this.validationService.getFieldError(this.errors(), field);
  }

  /**
   * Mező hibás-e
   */
  hasError(field: string): boolean {
    return !!this.getFieldError(field);
  }

  /**
   * Diákok számának kiszámítása (sorok alapján)
   */
  studentCount = computed<number>(() => {
    const roster = this.data().studentRoster;
    if (!roster || !roster.trim()) return 0;
    return roster.split('\n').filter(line => line.trim()).length;
  });

  /**
   * Tanárok számának kiszámítása
   */
  teacherCount = computed<number>(() => {
    const roster = this.data().teacherRoster;
    if (!roster || !roster.trim()) return 0;
    return roster.split('\n').filter(line => line.trim()).length;
  });
}
