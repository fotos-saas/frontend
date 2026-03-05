import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, switchMap, filter, catchError, of, tap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ERROR_MESSAGES } from '@shared/constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PartnerFinalizationApiService } from '../../services/partner-finalization-api.service';
import { PartnerFileUploadService } from '../../services/partner-file-upload.service';
import { PartnerService, SchoolItem } from '../../services/partner.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { PsSelectOption } from '@shared/components/form/form.types';
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
  selector: 'app-partner-order-wizard-dialog',
  templateUrl: './partner-order-wizard-dialog.component.html',
  styleUrls: ['./partner-order-wizard-dialog.component.scss'],
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
export class PartnerOrderWizardDialogComponent implements OnInit {
  private readonly api = inject(PartnerFinalizationApiService);
  private readonly fileUpload = inject(PartnerFileUploadService);
  private readonly partnerService = inject(PartnerService);
  private readonly validation = inject(OrderValidationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<number>();
  readonly projectName = input<string>('');
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly ICONS = ICONS;
  readonly steps = STEPPER_STEPS;

  private readonly wizardContent = viewChild<ElementRef<HTMLElement>>('wizardContent');

  currentStep = signal(0);
  loading = signal(true);
  submitting = signal(false);
  isEditMode = signal(false);
  formData = signal<OrderFinalizationData>({ ...EMPTY_ORDER_FINALIZATION_DATA });

  backgroundFileName = signal<string | null>(null);
  attachmentFileNames = signal<string[]>([]);

  // Iskola autocomplete
  schoolSuggestions = signal<PsSelectOption[]>([]);
  schoolLoading = signal(false);
  showAddSchoolModal = signal(false);

  private readonly draftSave$ = new Subject<void>();
  private lastSavedSnapshot = '';

  dialogTitle = computed(() => 'Megrendelés leadása');
  dialogDescription = computed(() => this.projectName() || '');

  isStepValid = computed(() => {
    const data = this.formData();
    const step = this.currentStep();
    switch (step) {
      case 0: return this.validation.isContactDataValidForPartner(data.contact);
      case 1: return this.validation.isBasicInfoValidForPartner(data.basicInfo);
      case 2: return this.validation.isDesignDataValid(data.design);
      case 3: return this.validation.isRosterDataValidForPartner(data.roster);
      default: return false;
    }
  });

  canFinalize = computed(() => {
    const data = this.formData();
    return this.validation.isContactDataValidForPartner(data.contact)
      && this.validation.isBasicInfoValidForPartner(data.basicInfo)
      && this.validation.isDesignDataValid(data.design)
      && this.validation.isRosterDataValidForPartner(data.roster);
  });

  /** Upload callback-ek a DesignStep számára */
  uploadBackgroundFn = (file: File): Observable<FileUploadResponse> =>
    this.fileUpload.uploadBackgroundImage(file);

  uploadAttachmentFn = (file: File): Observable<FileUploadResponse> =>
    this.fileUpload.uploadAttachment(file);

  deleteFileFn = (fileId: string): Observable<{ success: boolean }> =>
    this.fileUpload.deleteFile(fileId);

  ngOnInit(): void {
    this.fileUpload.setProjectId(this.projectId());
    this.loadExistingData();
    this.setupAutoSave();
  }

  private loadExistingData(): void {
    this.api.getFinalizationData(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = this.api.mapResponseToFormData(response);
          this.formData.set(data);

          // Fájlnevek beállítása a meglévő feltöltésekből
          if (response.data?.backgroundFileName) {
            this.backgroundFileName.set(response.data.backgroundFileName);
          }
          if (response.data?.otherFiles?.length) {
            this.attachmentFileNames.set(response.data.otherFiles.map(f => f.filename));
          }

          // Ha van meglévő adat, szerkesztés módban vagyunk
          if (response.data?.isFinalized) {
            this.isEditMode.set(true);
          }

          this.lastSavedSnapshot = JSON.stringify(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private setupAutoSave(): void {
    this.draftSave$.pipe(
      debounceTime(2000),
      filter(() => {
        const current = JSON.stringify(this.formData());
        return current !== this.lastSavedSnapshot;
      }),
      switchMap(() =>
        this.api.autoSaveDraft(this.projectId(), this.formData()).pipe(
          tap(() => {
            this.lastSavedSnapshot = JSON.stringify(this.formData());
          }),
          catchError(err => {
            this.logger.error('Draft auto-save failed', err);
            return of({ success: false });
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onContactChange(data: ContactData): void {
    this.formData.update(fd => ({ ...fd, contact: data }));
    this.draftSave$.next();
  }

  onBasicInfoChange(data: BasicInfoData): void {
    this.formData.update(fd => ({ ...fd, basicInfo: data }));
    this.draftSave$.next();
  }

  onDesignChange(data: DesignData): void {
    this.formData.update(fd => ({ ...fd, design: data }));
    this.draftSave$.next();
  }

  onRosterChange(data: RosterData): void {
    this.formData.update(fd => ({ ...fd, roster: data }));
    this.draftSave$.next();
  }

  // Iskola keresés
  onSchoolSearch(query: string): void {
    this.schoolLoading.set(true);
    this.partnerService.getAllSchools(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schools) => {
          this.schoolSuggestions.set(
            schools.map(s => ({ id: s.id, label: s.name, sublabel: s.city || undefined }))
          );
          this.schoolLoading.set(false);
        },
        error: () => {
          this.schoolSuggestions.set([]);
          this.schoolLoading.set(false);
        },
      });
  }

  onSchoolSelected(option: PsSelectOption): void {
    this.formData.update(fd => ({
      ...fd,
      basicInfo: { ...fd.basicInfo, schoolName: option.label, city: option.sublabel || fd.basicInfo.city }
    }));
    this.draftSave$.next();
  }

  onSchoolCreated(school: SchoolItem): void {
    this.showAddSchoolModal.set(false);
    this.formData.update(fd => ({
      ...fd,
      basicInfo: { ...fd.basicInfo, schoolName: school.name, city: school.city || fd.basicInfo.city }
    }));
    this.draftSave$.next();
  }

  onBackgroundFileNameChange(name: string | null): void {
    this.backgroundFileName.set(name);
  }

  onAttachmentFileNamesChange(names: string[]): void {
    this.attachmentFileNames.set(names);
  }

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

  finalize(): void {
    if (!this.canFinalize() || this.submitting()) return;

    this.submitting.set(true);
    this.api.finalizeOrder(this.projectId(), this.formData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          if (response.success) {
            this.toast.success('Siker', 'Megrendelés véglegesítve! A névsor feldolgozása háttérben folyamatban — a személyek hamarosan megjelennek.');
            this.saved.emit();
            this.close.emit();
          } else {
            this.toast.error('Hiba', response.message || ERROR_MESSAGES.SAVE_DOT);
          }
        },
        error: () => {
          this.submitting.set(false);
          this.toast.error('Hiba', ERROR_MESSAGES.SAVE_DOT);
        }
      });
  }
}
