import {
  Component,
  ChangeDetectionStrategy,
  output,
  input,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
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
import { PartnerFinalizationApiService } from '../../services/partner-finalization-api.service';
import { UploadQueueService } from '../../../../shared/services/upload-queue.service';
import { ProjectDetailData } from '@shared/components/project-detail/project-detail.types';
import { AddSchoolModalComponent } from '../add-school-modal/add-school-modal.component';

interface WizardContact {
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

interface ExistingFile {
  path: string;
  filename: string;
  deleting?: boolean;
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
export class CreateProjectWizardDialogComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly finalizationApi = inject(PartnerFinalizationApiService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadQueue = inject(UploadQueueService);

  /** Ha meg van adva, edit módban működik */
  readonly project = input<ProjectDetailData | null>(null);

  readonly close = output<void>();
  readonly projectCreated = output<PartnerProjectListItem>();
  readonly saved = output<void>();

  readonly ICONS = ICONS;

  readonly isEditMode = computed(() => !!this.project());
  readonly dialogTitle = computed(() => this.isEditMode() ? 'Projekt szerkesztése' : 'Új projekt létrehozása');
  readonly dialogDescription = computed(() => this.isEditMode() ? 'Módosítsd a projekt adatait' : 'Projekt adatok kitöltése');
  readonly dialogIcon = computed(() => this.isEditMode() ? ICONS.EDIT : ICONS.PLUS);
  readonly submitLabel = computed(() => this.isEditMode() ? 'Mentés' : 'Projekt létrehozása');
  readonly submittingLabel = computed(() => this.isEditMode() ? 'Mentés...' : 'Létrehozás...');
  readonly dialogVariant = computed(() => this.isEditMode() ? 'edit' as const : 'create' as const);

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
  readonly existingFiles = signal<ExistingFile[]>([]);
  readonly uploading = computed(() => this.uploadQueue.hasActive());

  /** Queue elemek ehhez a projekthez (feltöltés alatt / várakozó) */
  readonly queueItems = computed(() => {
    const proj = this.project();
    if (!proj) return [];
    return this.uploadQueue.items().filter(i => i.projectId === proj.id && i.status !== 'done');
  });

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

  readonly totalFileCount = computed(() => this.existingFiles().length);
  readonly canAddMoreFiles = computed(() => this.totalFileCount() < 10);

  ngOnInit(): void {
    const proj = this.project();
    if (proj) {
      this.initFromProject(proj);
      this.loadExistingFiles(proj.id);
    }
  }

  private initFromProject(proj: ProjectDetailData): void {
    if (proj.contacts && proj.contacts.length > 0) {
      this.contacts.set(proj.contacts.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        isPrimary: c.isPrimary ?? false,
      })));
    } else if (proj.contact) {
      this.contacts.set([{
        name: proj.contact.name,
        email: proj.contact.email,
        phone: proj.contact.phone,
        isPrimary: true,
      }]);
    }

    if (proj.school) {
      this.schoolName.set(proj.school.name);
    }

    this.className = proj.className ?? '';
    this.classYear = proj.classYear ?? '';
  }

  private loadExistingFiles(projectId: number): void {
    this.finalizationApi.getFinalizationData(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.otherFiles) {
            this.existingFiles.set(
              response.data.otherFiles.map(f => ({
                path: f.path,
                filename: f.filename ?? f.path.split('/').pop() ?? 'ismeretlen',
              }))
            );
          }
        },
      });
  }

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

  // --- Csatolmány kezelés ---

  onNewFilesSelected(files: File[] | null): void {
    if (!files?.length) return;
    const proj = this.project();
    if (!proj) return;

    for (const file of files) {
      this.uploadFile(proj.id, file);
    }
  }

  private uploadFile(projectId: number, file: File): void {
    this.uploadQueue.enqueue({
      file,
      projectId,
      type: 'attachment',
      uploadFn: (f: File) => this.finalizationApi.uploadFile(projectId, f, 'attachment'),
      onSuccess: (response) => {
        if (response.success) {
          this.existingFiles.update(list => [
            ...list,
            { path: response.fileId, filename: response.filename },
          ]);
        } else {
          this.toast.error('Hiba', response.message || 'Fájl feltöltés sikertelen.');
        }
      },
    });
  }

  deleteExistingFile(index: number): void {
    const proj = this.project();
    const file = this.existingFiles()[index];
    if (!proj || !file) return;

    this.existingFiles.update(list =>
      list.map((f, i) => i === index ? { ...f, deleting: true } : f)
    );

    this.finalizationApi.deleteFile(proj.id, file.path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.existingFiles.update(list => list.filter((_, i) => i !== index));
        },
        error: () => {
          this.existingFiles.update(list =>
            list.map((f, i) => i === index ? { ...f, deleting: false } : f)
          );
          this.toast.error('Hiba', 'Nem sikerült törölni a fájlt.');
        },
      });
  }

  // --- Submit ---

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;

    if (this.isEditMode()) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
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

  private submitUpdate(): void {
    const proj = this.project();
    if (!proj) return;

    this.submitting.set(true);
    const validContacts = this.contacts().filter(c => c.name.trim());

    this.partnerService.updateProjectWithWizard(proj.id, {
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
            this.toast.success('Siker', 'Projekt sikeresen módosítva!');
            this.saved.emit();
            this.close.emit();
          } else {
            this.submitting.set(false);
            this.toast.error('Hiba', response.message || 'Hiba történt a projekt módosítása során.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = err.error?.message || 'Hiba történt a projekt módosítása során.';
          this.toast.error('Hiba', msg);
          this.logger.error('Partner project update failed', err);
        },
      });
  }
}
