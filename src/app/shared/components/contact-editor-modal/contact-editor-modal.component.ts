import { Component, input, output, signal, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PROJECT_DETAIL_SERVICE } from '../project-detail/project-detail.tokens';
import { ProjectContact } from '../project-detail/project-detail.types';
import { formatHungarianPhone, validatePhone } from '../../utils/phone-formatter.util';

/**
 * Shared Contact Editor Modal - Partner és Marketer által egyaránt használt.
 * A save logikát a PROJECT_DETAIL_SERVICE injection tokenből kapja.
 */
@Component({
  selector: 'app-contact-editor-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  templateUrl: './contact-editor-modal.component.html',
  styleUrl: './contact-editor-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditorModalComponent implements OnInit {
  private readonly projectService = inject(PROJECT_DETAIL_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly contact = input<ProjectContact | null>(null);
  readonly close = output<void>();
  readonly saved = output<ProjectContact>();

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  phoneError = signal<string | null>(null);

  formData = {
    name: '',
    email: '',
    phone: '',
    isPrimary: false
  };

  get isEditing(): boolean {
    const contact = this.contact();
    return contact !== null && contact.id !== undefined;
  }

  ngOnInit(): void {
    const contact = this.contact();
    if (contact) {
      this.formData = {
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        isPrimary: contact.isPrimary ?? false
      };
    }
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatHungarianPhone(input.value);
    this.formData.phone = formatted;
    input.value = formatted;
    const result = validatePhone(this.formData.phone);
    this.phoneError.set(result.error ?? null);
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      this.errorMessage.set('A név megadása kötelező');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const contactData = {
      name: this.formData.name.trim(),
      email: this.formData.email.trim() || null,
      phone: this.formData.phone.trim() || null,
      isPrimary: this.formData.isPrimary
    };

    const contact = this.contact();
    const obs$ = this.isEditing && contact?.id
      ? this.projectService.updateContact(this.projectId(), contact.id, contactData)
      : this.projectService.addContact(this.projectId(), contactData);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.saved.emit(response.data);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Hiba történt a mentés során');
      }
    });
  }
}
