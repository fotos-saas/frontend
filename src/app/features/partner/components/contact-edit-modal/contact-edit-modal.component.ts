import { Component, input, output, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { PartnerService, ContactListItem, ProjectAutocompleteItem } from '../../services/partner.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { formatHungarianPhone, validatePhone } from '../../../../shared/utils/phone-formatter.util';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Contact Edit Modal - Kapcsolattartó létrehozása/szerkesztése.
 * Tartalmaz projekt autocomplete dropdown-t is.
 */
@Component({
  selector: 'app-contact-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './contact-edit-modal.component.html',
  styleUrl: './contact-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditModalComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contact = input<ContactListItem | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly close = output<void>();
  readonly saved = output<ContactListItem>();

  readonly ICONS = ICONS;

  // Form fields
  name = '';
  email = '';
  phone = '';
  note = '';
  projectSearch = '';

  // State
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  phoneError = signal<string | null>(null);

  // Project autocomplete
  selectedProject = signal<ProjectAutocompleteItem | null>(null);
  projectOptions = signal<ProjectAutocompleteItem[]>([]);
  showProjectDropdown = signal(false);
  loadingProjects = signal(false);

  private searchSubject = new Subject<string>();

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    // Populate form if editing
    const contact = this.contact();
    if (contact && this.mode() === 'edit') {
      this.name = contact.name;
      this.email = contact.email ?? '';
      this.phone = contact.phone ?? '';
      this.note = contact.note ?? '';

      // Set selected project
      if (contact.projectId) {
        this.selectedProject.set({
          id: contact.projectId,
          name: contact.projectName ?? 'Projekt',
          schoolName: contact.schoolName ?? null
        });
        this.projectSearch = contact.projectName ?? '';
      }
    }

    // Setup project search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search.trim()) {
          return of([]);
        }
        this.loadingProjects.set(true);
        return this.partnerService.getProjectsAutocomplete(search);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (projects) => {
        this.projectOptions.set(projects);
        this.loadingProjects.set(false);
      },
      error: () => {
        this.loadingProjects.set(false);
      }
    });
  }

  canSave(): boolean {
    // Projekt választás már nem kötelező
    return this.name.trim().length > 0 && !this.phoneError();
  }

  /** Telefon formázás és validáció */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatHungarianPhone(input.value);

    this.phone = formatted;
    input.value = formatted;

    const result = validatePhone(formatted);
    this.phoneError.set(result.error ?? null);
  }

  onProjectInputFocus(): void {
    this.showProjectDropdown.set(true);
    if (!this.projectSearch.trim()) {
      // Load initial projects
      this.loadingProjects.set(true);
      this.partnerService.getProjectsAutocomplete('')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (projects) => {
            this.projectOptions.set(projects);
            this.loadingProjects.set(false);
          },
          error: () => {
            this.loadingProjects.set(false);
          }
        });
    }
  }

  onProjectSearch(): void {
    this.showProjectDropdown.set(true);
    this.searchSubject.next(this.projectSearch);
  }

  selectProject(project: ProjectAutocompleteItem): void {
    this.selectedProject.set(project);
    this.projectSearch = project.name;
    this.showProjectDropdown.set(false);
  }

  clearProject(): void {
    this.selectedProject.set(null);
    this.projectSearch = '';
    this.projectOptions.set([]);
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const data: {
      name: string;
      email: string | null;
      phone: string | null;
      note: string | null;
      project_id?: number | null;
    } = {
      name: this.name.trim(),
      email: this.email.trim() || null,
      phone: this.phone.trim() || null,
      note: this.note.trim() || null,
    };

    // Projekt már opcionális
    if (this.selectedProject()) {
      data.project_id = this.selectedProject()!.id;
    }

    const request$ = this.mode() === 'create'
      ? this.partnerService.createStandaloneContact(data)
      : this.partnerService.updateStandaloneContact(this.contact()!.id, data);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saved.emit(response.data);
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
