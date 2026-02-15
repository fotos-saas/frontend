import { Component, input, output, ChangeDetectionStrategy, OnInit, viewChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { isValidEmail, isValidPhone } from '../../utils/validators.util';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '@shared/components/form';

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
 * DialogWrapperComponent kezeli a shell-t.
 */
@Component({
  selector: 'app-contact-edit-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent, PsInputComponent],
  templateUrl: './contact-edit-dialog.component.html',
  styleUrls: ['./contact-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditDialogComponent implements OnInit {
  readonly ICONS = ICONS;

  /** Signal-based inputs */
  readonly initialData = input<ContactData>({ name: '', email: '', phone: '' });
  readonly isSaving = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<ContactEditResult>();

  /** Form adatok */
  formData: ContactData = { name: '', email: '', phone: '' };

  /** Validációs hibák */
  errors: { name?: string; email?: string; phone?: string } = {};

  ngOnInit(): void {
    this.formData = { ...this.initialData() };
  }

  /**
   * Input change handler
   */
  onInputChange(): void {
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

  onClose(): void {
    if (!this.isSaving()) {
      this.resultEvent.emit({ action: 'close' });
    }
  }
}
