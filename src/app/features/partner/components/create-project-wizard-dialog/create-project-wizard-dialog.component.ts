import {
  Component,
  ChangeDetectionStrategy,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PsInputComponent, PsTextareaComponent, PsAutocompleteComponent, PsFileUploadComponent } from '@shared/components/form';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PartnerService, PartnerProjectListItem, SchoolItem } from '../../services/partner.service';
import { ProjectContact } from '../../models/partner.models';
import { AddSchoolModalComponent } from '../add-school-modal/add-school-modal.component';

interface WizardContact {
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

@Component({
  selector: 'app-create-project-wizard-dialog',
  templateUrl: './create-project-wizard-dialog.component.html',
  styleUrls: ['./create-project-wizard-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    DialogWrapperComponent,
    PsInputComponent,
    PsTextareaComponent,
    PsAutocompleteComponent,
    PsFileUploadComponent,
    AddSchoolModalComponent,
  ],
})
export class CreateProjectWizardDialogComponent {
  private readonly partnerService = inject(PartnerService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = output<void>();
  readonly projectCreated = output<PartnerProjectListItem>();

  readonly ICONS = ICONS;

  // --- Kapcsolattartók ---
  readonly contacts = signal<WizardContact[]>([
    { name: '', email: null, phone: null, isPrimary: true },
  ]);

  // --- Iskola ---
  readonly schoolName = signal('');
  readonly schoolSuggestions = signal<PsSelectOption[]>([]);
  readonly schoolLoading = signal(false);
  readonly showAddSchoolModal = signal(false);
  private schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  // --- Osztály ---
  className = '';
  classYear = '';

  // --- Csatolmányok ---
  attachmentFiles: File[] = [];

  // --- Megjegyzés ---
  description = '';

  // --- Állapot ---
  readonly submitting = signal(false);

  readonly canSubmit = computed(() => {
    const c = this.contacts();
    const hasValidContact = c.length > 0 && c.some(ct => ct.name.trim().length > 0);
    return hasValidContact
      && this.schoolName().trim().length > 0
      && this.className.trim().length > 0
      && this.classYear.trim().length > 0;
  });

  // --- Kapcsolattartó kezelés ---

  addContact(): void {
    this.contacts.update(list => [
      ...list,
      { name: '', email: null, phone: null, isPrimary: false },
    ]);
  }

  removeContact(index: number): void {
    this.contacts.update(list => {
      const updated = list.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(c => c.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  }

  setPrimaryContact(index: number): void {
    this.contacts.update(list =>
      list.map((c, i) => ({ ...c, isPrimary: i === index }))
    );
  }

  updateContact(index: number, field: keyof WizardContact, value: string): void {
    this.contacts.update(list =>
      list.map((c, i) => i === index ? { ...c, [field]: value || null } : c)
    );
  }

  // --- Iskola keresés ---

  onSchoolNameChange(value: string): void {
    this.schoolName.set(value);
  }

  onSchoolSearch(query: string): void {
    if (this.schoolSearchTimeout) clearTimeout(this.schoolSearchTimeout);
    this.schoolLoading.set(true);
    this.schoolSearchTimeout = setTimeout(() => this.loadSchools(query), 300);
  }

  onSchoolSelected(option: PsSelectOption): void {
    this.schoolName.set(option.label);
  }

  openAddSchoolModal(): void {
    this.showAddSchoolModal.set(true);
  }

  closeAddSchoolModal(): void {
    this.showAddSchoolModal.set(false);
  }

  onSchoolCreated(school: SchoolItem): void {
    this.closeAddSchoolModal();
    this.schoolName.set(school.name);
    this.toast.success('Siker', `"${school.name}" iskola hozzáadva!`);
  }

  private loadSchools(query: string): void {
    this.partnerService.getAllSchools(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schools) => {
          this.schoolSuggestions.set(
            schools.map(s => ({
              id: s.id,
              label: s.name,
              sublabel: s.city || undefined,
            }))
          );
          this.schoolLoading.set(false);
        },
        error: () => {
          this.schoolSuggestions.set([]);
          this.schoolLoading.set(false);
        },
      });
  }

  // --- Submit ---

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;

    this.submitting.set(true);
    const validContacts = this.contacts().filter(c => c.name.trim());

    this.partnerService.createProjectWithWizard({
      contacts: validContacts.map(c => ({
        name: c.name.trim(),
        email: c.email?.trim() || undefined,
        phone: c.phone?.trim() || undefined,
        is_primary: c.isPrimary,
      })),
      school_name: this.schoolName().trim(),
      class_name: this.className.trim(),
      class_year: this.classYear.trim(),
      description: this.description.trim() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Siker', 'Projekt sikeresen létrehozva!');
            this.projectCreated.emit(response.data);
            this.close.emit();
          } else {
            this.submitting.set(false);
            this.toast.error('Hiba', response.message || 'Hiba történt a projekt létrehozása során.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = err.error?.message || 'Hiba történt a projekt létrehozása során.';
          this.toast.error('Hiba', msg);
          this.logger.error('Partner project creation failed', err);
        },
      });
  }
}
