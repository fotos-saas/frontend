import { Component, Output, EventEmitter, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, PartnerProjectListItem, SchoolItem, ProjectContact, CreateProjectRequest } from '../../services/partner.service';
import { AddSchoolModalComponent } from '../add-school-modal/add-school-modal.component';
import { AddContactModalComponent } from '../add-contact-modal/add-contact-modal.component';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { SearchableDropdownComponent, DropdownOption } from './components/searchable-dropdown.component';

/**
 * Create Project Modal - Új projekt létrehozása.
 */
@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    AddSchoolModalComponent,
    AddContactModalComponent,
    SearchableDropdownComponent
  ],
  templateUrl: './create-project-modal.component.html',
  styleUrl: './create-project-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProjectModalComponent {
  readonly ICONS = ICONS;
  backdropHandler = createBackdropHandler(() => this.close.emit());

  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<PartnerProjectListItem>();

  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly schools = signal<SchoolItem[]>([]);
  readonly contacts = signal<ProjectContact[]>([]);
  readonly schoolsLoading = signal(false);
  readonly contactsLoading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly showAddSchoolModal = signal(false);
  readonly showAddContactModal = signal(false);

  // Selected items
  readonly selectedSchool = signal<SchoolItem | null>(null);
  readonly selectedContact = signal<ProjectContact | null>(null);

  // Computed options for dropdown
  readonly schoolOptions = computed<DropdownOption[]>(() =>
    this.schools().map(s => ({
      id: s.id,
      name: s.name,
      subtitle: s.city || undefined
    }))
  );

  readonly contactOptions = computed<DropdownOption[]>(() =>
    this.contacts()
      .filter(c => c.id !== undefined)
      .map(c => ({
        id: c.id!,
        name: c.name,
        subtitle: [c.email, c.phone].filter(Boolean).join(' · ') || undefined
      }))
  );

  readonly selectedSchoolOption = computed<DropdownOption | null>(() => {
    const school = this.selectedSchool();
    return school?.id ? { id: school.id, name: school.name, subtitle: school.city || undefined } : null;
  });

  readonly selectedContactOption = computed<DropdownOption | null>(() => {
    const contact = this.selectedContact();
    return contact?.id ? { id: contact.id, name: contact.name, subtitle: contact.email || undefined } : null;
  });

  formData: CreateProjectRequest = {
    school_id: null,
    class_name: null,
    class_year: null,
    photo_date: null,
    deadline: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
  };

  private schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  private contactSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  // School handlers
  onSchoolSearch(search: string): void {
    if (this.schoolSearchTimeout) {
      clearTimeout(this.schoolSearchTimeout);
    }
    this.schoolSearchTimeout = setTimeout(() => this.loadSchools(search), 300);
  }

  onSchoolSelected(option: DropdownOption): void {
    const school = this.schools().find(s => s.id === option.id);
    if (school) {
      this.selectedSchool.set(school);
      this.formData.school_id = school.id;
    }
  }

  clearSchool(): void {
    this.selectedSchool.set(null);
    this.formData.school_id = null;
  }

  openAddSchoolModal(): void {
    this.showAddSchoolModal.set(true);
  }

  closeAddSchoolModal(): void {
    this.showAddSchoolModal.set(false);
  }

  onSchoolCreated(school: SchoolItem): void {
    this.closeAddSchoolModal();
    this.selectedSchool.set(school);
    this.formData.school_id = school.id;
  }

  // Contact handlers
  onContactSearch(search: string): void {
    if (this.contactSearchTimeout) {
      clearTimeout(this.contactSearchTimeout);
    }
    this.contactSearchTimeout = setTimeout(() => this.loadContacts(search), 300);
  }

  onContactSelected(option: DropdownOption): void {
    const contact = this.contacts().find(c => c.id === option.id);
    if (contact) {
      this.selectedContact.set(contact);
      this.formData.contact_name = contact.name;
      this.formData.contact_email = contact.email;
      this.formData.contact_phone = contact.phone;
    }
  }

  clearContact(): void {
    this.selectedContact.set(null);
    this.formData.contact_name = null;
    this.formData.contact_email = null;
    this.formData.contact_phone = null;
  }

  openAddContactModal(): void {
    this.showAddContactModal.set(true);
  }

  closeAddContactModal(): void {
    this.showAddContactModal.set(false);
  }

  onContactCreated(contact: ProjectContact): void {
    this.closeAddContactModal();
    this.selectedContact.set(contact);
    this.formData.contact_name = contact.name;
    this.formData.contact_email = contact.email;
    this.formData.contact_phone = contact.phone;
  }

  // Data loading
  private loadSchools(search?: string): void {
    this.schoolsLoading.set(true);
    this.partnerService.getAllSchools(search || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schools) => {
          this.schools.set(schools);
          this.schoolsLoading.set(false);
        },
        error: () => {
          this.schools.set([]);
          this.schoolsLoading.set(false);
        }
      });
  }

  private loadContacts(search?: string): void {
    this.contactsLoading.set(true);
    this.partnerService.getAllContacts(search || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contacts) => {
          this.contacts.set(contacts);
          this.contactsLoading.set(false);
        },
        error: () => {
          this.contacts.set([]);
          this.contactsLoading.set(false);
        }
      });
  }

  onSubmit(): void {
    this.error.set(null);
    this.submitting.set(true);

    this.partnerService.createProject(this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.projectCreated.emit(response.data);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message ?? 'Hiba történt a projekt létrehozása során');
        }
      });
  }
}
