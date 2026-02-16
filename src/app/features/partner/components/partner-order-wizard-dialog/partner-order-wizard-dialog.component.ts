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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PartnerFinalizationApiService } from '../../services/partner-finalization-api.service';
import { PartnerFileUploadService } from '../../services/partner-file-upload.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { ContactStepComponent } from '../../../order-finalization/components/steps/contact-step/contact-step.component';
import { BasicInfoStepComponent } from '../../../order-finalization/components/steps/basic-info-step/basic-info-step.component';
import { DesignStepComponent } from '../../../order-finalization/components/steps/design-step/design-step.component';
import { RosterStepComponent } from '../../../order-finalization/components/steps/roster-step/roster-step.component';
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
    ContactStepComponent,
    BasicInfoStepComponent,
    DesignStepComponent,
    RosterStepComponent,
  ],
})
export class PartnerOrderWizardDialogComponent implements OnInit {
  private readonly api = inject(PartnerFinalizationApiService);
  private readonly fileUpload = inject(PartnerFileUploadService);
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

  currentStep = signal(0);
  loading = signal(true);
  submitting = signal(false);
  formData = signal<OrderFinalizationData>({ ...EMPTY_ORDER_FINALIZATION_DATA });

  backgroundFileName = signal<string | null>(null);
  attachmentFileNames = signal<string[]>([]);

  private readonly draftSave$ = new Subject<void>();

  backdropHandler = createBackdropHandler(() => this.close.emit());

  isStepValid = computed(() => {
    const data = this.formData();
    const step = this.currentStep();
    switch (step) {
      case 0: return this.validation.isContactDataValid(data.contact);
      case 1: return this.validation.isBasicInfoValidForPartner(data.basicInfo);
      case 2: return this.validation.isDesignDataValid(data.design);
      case 3: return this.validation.isRosterDataValidForPartner(data.roster);
      default: return false;
    }
  });

  canFinalize = computed(() => {
    const data = this.formData();
    return this.validation.isContactDataValid(data.contact)
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
      switchMap(() =>
        this.api.autoSaveDraft(this.projectId(), this.formData()).pipe(
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

  onBackgroundFileNameChange(name: string | null): void {
    this.backgroundFileName.set(name);
  }

  onAttachmentFileNamesChange(names: string[]): void {
    this.attachmentFileNames.set(names);
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(0, s - 1));
  }

  nextStep(): void {
    if (this.isStepValid()) {
      this.currentStep.update(s => Math.min(this.steps.length - 1, s + 1));
    }
  }

  goToStep(index: number): void {
    if (index <= this.currentStep()) {
      this.currentStep.set(index);
    }
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
            this.toast.success('Siker', response.message || 'Megrendelés sikeresen véglegesítve!');
            this.saved.emit();
            this.close.emit();
          } else {
            this.toast.error('Hiba', response.message || 'Hiba történt a mentés során.');
          }
        },
        error: () => {
          this.submitting.set(false);
          this.toast.error('Hiba', 'Hiba történt a mentés során.');
        }
      });
  }
}
