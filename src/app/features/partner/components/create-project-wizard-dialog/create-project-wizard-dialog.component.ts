import {
  Component,
  ChangeDetectionStrategy,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsSelectOption } from '@shared/components/form/form.types';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PartnerService, PartnerProjectListItem, SchoolItem } from '../../services/partner.service';
import { PartnerFileUploadService } from '../../services/partner-file-upload.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { ContactStepComponent } from '../../../order-finalization/components/steps/contact-step/contact-step.component';
import { BasicInfoStepComponent } from '../../../order-finalization/components/steps/basic-info-step/basic-info-step.component';
import { DesignStepComponent } from '../../../order-finalization/components/steps/design-step/design-step.component';
import { RosterStepComponent } from '../../../order-finalization/components/steps/roster-step/roster-step.component';
import { AddSchoolModalComponent } from '../add-school-modal/add-school-modal.component';
import {
  OrderFinalizationData,
  EMPTY_ORDER_FINALIZATION_DATA,
  STEPPER_STEPS,
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData,
  FileUploadResponse,
} from '../../../order-finalization/models/order-finalization.models';

@Component({
  selector: 'app-create-project-wizard-dialog',
  templateUrl: './create-project-wizard-dialog.component.html',
  styleUrls: ['./create-project-wizard-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    LucideAngularModule,
    DialogWrapperComponent,
    ContactStepComponent,
    BasicInfoStepComponent,
    DesignStepComponent,
    RosterStepComponent,
    AddSchoolModalComponent,
  ],
})
export class CreateProjectWizardDialogComponent {
  private readonly partnerService = inject(PartnerService);
  private readonly fileUpload = inject(PartnerFileUploadService);
  private readonly validation = inject(OrderValidationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = output<void>();
  readonly projectCreated = output<PartnerProjectListItem>();

  readonly ICONS = ICONS;
  readonly steps = STEPPER_STEPS;

  private readonly wizardContent = viewChild<ElementRef<HTMLElement>>('wizardContent');

  currentStep = signal(0);
  submitting = signal(false);
  formData = signal<OrderFinalizationData>({ ...EMPTY_ORDER_FINALIZATION_DATA });

  backgroundFileName = signal<string | null>(null);
  attachmentFileNames = signal<string[]>([]);

  /** Iskola autocomplete */
  schoolSuggestions = signal<PsSelectOption[]>([]);
  schoolLoading = signal(false);
  showAddSchoolModal = signal(false);

  /** A létrehozott projekt ID-ja (design step fájlfeltöltéshez kell) */
  private createdProjectId = signal<number | null>(null);
  private schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  isStepValid = computed(() => {
    const data = this.formData();
    const step = this.currentStep();
    switch (step) {
      case 0: return this.validation.isContactDataValidForPartner(data.contact);
      case 1: return this.validation.isBasicInfoValidForPartner(data.basicInfo);
      case 2: return true;
      case 3: return this.validation.isRosterDataValidForPartner(data.roster);
      default: return false;
    }
  });

  canFinalize = computed(() => {
    const data = this.formData();
    return this.validation.isContactDataValidForPartner(data.contact)
      && this.validation.isBasicInfoValidForPartner(data.basicInfo)
      && this.validation.isRosterDataValidForPartner(data.roster);
  });

  /** Upload callback-ek */
  uploadBackgroundFn = (file: File): Observable<FileUploadResponse> => {
    const projectId = this.createdProjectId();
    if (!projectId) {
      return of({ success: false, fileId: '', filename: '', url: '', message: 'Először hozd létre a projektet' });
    }
    return this.fileUpload.uploadBackgroundImage(file);
  };

  uploadAttachmentFn = (file: File): Observable<FileUploadResponse> => {
    const projectId = this.createdProjectId();
    if (!projectId) {
      return of({ success: false, fileId: '', filename: '', url: '', message: 'Először hozd létre a projektet' });
    }
    return this.fileUpload.uploadAttachment(file);
  };

  deleteFileFn = (fileId: string): Observable<{ success: boolean }> =>
    this.fileUpload.deleteFile(fileId);

  // --- Step data change handlers ---

  onContactChange(data: ContactData): void {
    this.formData.update(fd => ({ ...fd, contact: data }));
  }

  onBasicInfoChange(data: BasicInfoData): void {
    this.formData.update(fd => ({ ...fd, basicInfo: data }));
  }

  onDesignChange(data: DesignData): void {
    this.formData.update(fd => ({ ...fd, design: data }));
  }

  onRosterChange(data: RosterData): void {
    this.formData.update(fd => ({ ...fd, roster: data }));
  }

  onBackgroundFileNameChange(name: string | null): void {
    this.backgroundFileName.set(name);
  }

  onAttachmentFileNamesChange(names: string[]): void {
    this.attachmentFileNames.set(names);
  }

  // --- Iskola keresés ---

  onSchoolSearch(query: string): void {
    if (this.schoolSearchTimeout) clearTimeout(this.schoolSearchTimeout);
    this.schoolLoading.set(true);
    this.schoolSearchTimeout = setTimeout(() => this.loadSchools(query), 300);
  }

  onSchoolSelected(option: PsSelectOption): void {
    // Város kitöltése ha van sublabel (city)
    if (option.sublabel) {
      this.formData.update(fd => ({
        ...fd,
        basicInfo: { ...fd.basicInfo, schoolName: option.label, city: option.sublabel! }
      }));
    }
  }

  openAddSchoolModal(): void {
    this.showAddSchoolModal.set(true);
  }

  closeAddSchoolModal(): void {
    this.showAddSchoolModal.set(false);
  }

  onSchoolCreated(school: SchoolItem): void {
    this.closeAddSchoolModal();
    // Auto-kitöltés a létrehozott iskolával
    this.formData.update(fd => ({
      ...fd,
      basicInfo: {
        ...fd.basicInfo,
        schoolName: school.name,
        city: school.city || fd.basicInfo.city,
      }
    }));
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
        }
      });
  }

  // --- Navigation ---

  prevStep(): void {
    this.currentStep.update(s => Math.max(0, s - 1));
    this.scrollContentToTop();
  }

  nextStep(): void {
    if (this.isStepValid()) {
      this.currentStep.update(s => Math.min(this.steps.length - 1, s + 1));
      this.scrollContentToTop();
    }
  }

  goToStep(index: number): void {
    if (index <= this.currentStep()) {
      this.currentStep.set(index);
      this.scrollContentToTop();
    }
  }

  private scrollContentToTop(): void {
    this.wizardContent()?.nativeElement.scrollTo({ top: 0 });
  }

  // --- Submit ---

  submit(): void {
    if (!this.canFinalize() || this.submitting()) return;

    this.submitting.set(true);
    const fd = this.formData();

    this.partnerService.createProjectWithWizard({
      contact_name: fd.contact.name,
      contact_email: fd.contact.email,
      contact_phone: fd.contact.phone || undefined,
      school_name: fd.basicInfo.schoolName,
      city: fd.basicInfo.city || undefined,
      class_name: fd.basicInfo.className,
      class_year: fd.basicInfo.classYear,
      quote: fd.basicInfo.quote || undefined,
      font_family: fd.design.fontFamily || undefined,
      font_color: fd.design.fontColor || undefined,
      description: fd.design.description || undefined,
      sort_type: fd.roster.sortType || undefined,
      student_roster: fd.roster.studentRoster || undefined,
      teacher_roster: fd.roster.teacherRoster || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.createdProjectId.set(response.data.id);
            this.fileUpload.setProjectId(response.data.id);
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
          this.logger.error('Wizard project creation failed', err);
        }
      });
  }
}
