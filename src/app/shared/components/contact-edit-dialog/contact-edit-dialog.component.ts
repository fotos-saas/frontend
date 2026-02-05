import { Component, input, output, ChangeDetectionStrategy, OnInit, viewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { isValidEmail, isValidPhone } from '../../utils/validators.util';

/**
 * Contact data interface
 */
export interface ContactData {
  name: string;
  email: string;
  phone: string;
}

/**
 * Dialog eredmény típus
 */
export type ContactEditResult =
  | { action: 'save'; data: ContactData }
  | { action: 'close' };

/**
 * Contact Edit Dialog
 *
 * Dialog a kapcsolattartó adatok szerkesztéséhez.
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-contact-edit-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact-edit-dialog.component.html',
  styleUrls: ['./contact-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditDialogComponent extends BaseDialogComponent implements OnInit, AfterViewInit {
  /** Signal-based inputs */
  readonly initialData = input<ContactData>({ name: '', email: '', phone: '' });
  readonly isSaving = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<ContactEditResult>();

  /** Form adatok */
  formData: ContactData = { name: '', email: '', phone: '' };

  /** Validációs hibák */
  errors: { name?: string; email?: string; phone?: string } = {};

  /** ViewChild referenciák a focus management-hez */
  readonly firstInput = viewChild<ElementRef<HTMLInputElement>>('firstInput');

  ngOnInit(): void {
    // Bemásoljuk a kezdeti adatokat
    this.formData = { ...this.initialData() };
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus az első input mezőre
    setTimeout(() => {
      this.firstInput()?.nativeElement.focus();
    }, 100);
  }

  /**
   * Input change handler
   */
  onInputChange(): void {
    // Töröljük az esetleges hibát, ha a user gépel
    this.errors = {};
  }

  /**
   * Validáció központi validatorokkal
   */
  private validate(): boolean {
    this.errors = {};

    if (!this.formData.name?.trim()) {
      this.errors.name = 'A név megadása kötelező';
    }

    if (!this.formData.email?.trim()) {
      this.errors.email = 'Az email cím megadása kötelező';
    } else if (!isValidEmail(this.formData.email)) {
      this.errors.email = 'Érvénytelen email cím';
    }

    if (!this.formData.phone?.trim()) {
      this.errors.phone = 'A telefonszám megadása kötelező';
    } else if (!isValidPhone(this.formData.phone)) {
      this.errors.phone = 'Érvénytelen telefonszám formátum';
    }

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Mentés
   */
  save(): void {
    if (this.isSaving()) return;

    if (this.validate()) {
      this.resultEvent.emit({
        action: 'save',
        data: {
          name: this.formData.name.trim(),
          email: this.formData.email.trim(),
          phone: this.formData.phone.trim()
        }
      });
    }
  }

  /**
   * Form érvényes-e (mentés gombhoz)
   */
  get isFormValid(): boolean {
    return !!(
      this.formData.name?.trim() &&
      this.formData.email?.trim() &&
      this.formData.phone?.trim()
    );
  }

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    this.save();
  }

  protected onClose(): void {
    if (!this.isSaving()) {
      this.resultEvent.emit({ action: 'close' });
    }
  }
}
