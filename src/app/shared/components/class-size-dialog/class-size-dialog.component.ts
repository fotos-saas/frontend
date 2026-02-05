import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { validateNumberRange } from '../../utils/validators.util';

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
 * Megjelenik az első szavazás létrehozásakor.
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-class-size-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './class-size-dialog.component.html',
  styleUrls: ['./class-size-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassSizeDialogComponent extends BaseDialogComponent implements AfterViewInit {
  /** Signal-based inputs (external) - different names to not conflict with base class */
  readonly externalIsSubmitting = input<boolean>(false, { alias: 'isSubmitting' });
  readonly externalErrorMessage = input<string | null>(null, { alias: 'errorMessage' });
  readonly currentValue = input<number | null>(null);

  /** Signal-based outputs */
  readonly resultEvent = output<ClassSizeResult>();

  /** Computed signals for template compatibility */
  readonly isBusy = computed(() => this.externalIsSubmitting() || this._isSubmitting());
  readonly apiError = computed(() => this.externalErrorMessage() || this._errorMessage());

  /** Form adat */
  classSize: number | null = null;

  /** Validációs hiba */
  error: string | null = null;

  /** Limit értékek */
  readonly MIN_SIZE = 5;
  readonly MAX_SIZE = 500;

  /** ViewChild referencia */
  @ViewChild('sizeInput') sizeInput?: ElementRef<HTMLInputElement>;

  override ngAfterViewInit(): void {
    // Current value beállítása ha van
    const current = this.currentValue();
    if (current) {
      this.classSize = current;
    }

    super.ngAfterViewInit();

    // Focus az input mezőre
    setTimeout(() => {
      this.sizeInput?.nativeElement.focus();
      this.sizeInput?.nativeElement.select();
    }, 100);
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

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    if (this.isBusy()) return;

    if (this.validate() && this.classSize !== null) {
      this.resultEvent.emit({
        action: 'submit',
        classSize: this.classSize
      });
    }
  }

  protected onClose(): void {
    this.cancel();
  }
}
