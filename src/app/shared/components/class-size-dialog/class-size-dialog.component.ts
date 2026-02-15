import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  computed,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { validateNumberRange } from '../../utils/validators.util';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '@shared/components/form';

/**
 * Dialog eredmény típus
 */
export type ClassSizeResult =
  | { action: 'submit'; classSize: number }
  | { action: 'cancel' };

/**
 * Class Size Dialog
 *
 * Osztálylétszám bekérés popup.
 * DialogWrapperComponent kezeli a shell-t.
 */
@Component({
  selector: 'app-class-size-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsInputComponent],
  templateUrl: './class-size-dialog.component.html',
  styleUrls: ['./class-size-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassSizeDialogComponent {
  readonly ICONS = ICONS;

  /** Signal-based inputs */
  readonly externalIsSubmitting = input<boolean>(false, { alias: 'isSubmitting' });
  readonly externalErrorMessage = input<string | null>(null, { alias: 'errorMessage' });
  readonly currentValue = input<number | null>(null);

  /** Signal-based outputs */
  readonly resultEvent = output<ClassSizeResult>();

  /** Computed signals for template compatibility */
  readonly isBusy = computed(() => this.externalIsSubmitting());
  readonly apiError = computed(() => this.externalErrorMessage());

  /** Form adat */
  classSize: number | null = null;

  /** Validációs hiba */
  error: string | null = null;

  /** Limit értékek */
  readonly MIN_SIZE = 5;
  readonly MAX_SIZE = 500;

  private initialized = false;

  ngAfterViewInit(): void {
    if (!this.initialized) {
      this.initialized = true;
      const current = this.currentValue();
      if (current) {
        this.classSize = current;
      }
    }
  }

  /**
   * Input change - töröljük a hibát
   */
  onInputChange(): void {
    this.error = null;
  }

  /**
   * Validáció központi validator használatával
   */
  private validate(): boolean {
    const result = validateNumberRange(
      this.classSize,
      this.MIN_SIZE,
      this.MAX_SIZE,
      true // csak egész szám
    );

    if (!result.valid) {
      this.error = result.error || 'Érvénytelen érték';
      return false;
    }

    this.error = null;
    return true;
  }

  /**
   * Mégse
   */
  cancel(): void {
    if (!this.isBusy()) {
      this.resultEvent.emit({ action: 'cancel' });
    }
  }

  /**
   * Form érvényes-e
   */
  get isFormValid(): boolean {
    return this.classSize !== null &&
           Number.isInteger(this.classSize) &&
           this.classSize >= this.MIN_SIZE &&
           this.classSize <= this.MAX_SIZE;
  }

  /**
   * Submit
   */
  submit(): void {
    if (this.isBusy()) return;

    if (this.validate() && this.classSize !== null) {
      this.resultEvent.emit({
        action: 'submit',
        classSize: this.classSize
      });
    }
  }
}
