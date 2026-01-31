import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { OrderFinalizationService } from './services/order-finalization.service';
import { OrderValidationService } from './services/order-validation.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { AuthService } from '../../core/services/auth.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';
import { isSecureUrl, openSecureUrl } from '../../core/utils/url-validator.util';
import {
  OrderFinalizationData,
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData,
  STEPPER_STEPS,
  EMPTY_ORDER_FINALIZATION_DATA
} from './models/order-finalization.models';

// Child komponensek
import { ContactStepComponent } from './components/steps/contact-step/contact-step.component';
import { BasicInfoStepComponent } from './components/steps/basic-info-step/basic-info-step.component';
import { DesignStepComponent } from './components/steps/design-step/design-step.component';
import { RosterStepComponent } from './components/steps/roster-step/roster-step.component';

/**
 * Order Finalization Component
 * Megrendelés véglegesítő - 4 lépéses stepper form
 *
 * Refaktorált verzió: 689 sor → ~180 sor (-74%)
 * - Child komponensekbe kiemelve a step formok
 * - Service-ekbe kiemelve a validáció és file upload
 */
@Component({
  selector: 'app-order-finalization',
  templateUrl: './order-finalization.component.html',
  styleUrls: ['./order-finalization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ContactStepComponent,
    BasicInfoStepComponent,
    DesignStepComponent,
    RosterStepComponent
  ]
})
export class OrderFinalizationComponent implements OnInit, OnDestroy {
  @ViewChild('stepContent') stepContent?: ElementRef<HTMLElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly autoSaveTrigger$ = new Subject<void>();
  private autoSaveResetTimer?: ReturnType<typeof setTimeout>;
  private initialized = false;

  // Services
  private readonly orderFinalizationService = inject(OrderFinalizationService);
  private readonly validationService = inject(OrderValidationService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly authService = inject(AuthService);
  private readonly storage = inject(TabloStorageService);

  /** Stepper lépések */
  readonly steps = STEPPER_STEPS;

  /** Aktuális lépés (0-3) */
  currentStep = signal<number>(0);

  /** Betöltés állapot */
  loading = signal<boolean>(false);

  /** Submit folyamatban */
  submitting = signal<boolean>(false);

  /** Auto-save status */
  autoSaveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  /** Step 1 - Kapcsolattartó */
  contactData = signal<ContactData>({ name: '', email: '', phone: '' });

  /** Step 2 - Alap adatok */
  basicInfoData = signal<BasicInfoData>({
    schoolName: '', city: '', className: '', classYear: '', quote: ''
  });

  /** Step 3 - Elképzelés */
  designData = signal<DesignData>({
    fontFamily: '', fontColor: '#000000', description: '',
    backgroundImageId: null, attachmentIds: []
  });

  /** Step 4 - Névsor */
  rosterData = signal<RosterData>({
    studentRoster: '', teacherRoster: '', sortType: 'abc', acceptTerms: false
  });

  /** Háttérkép fájlnév */
  backgroundFileName = signal<string | null>(null);

  /** Csatolmány fájlnevek */
  attachmentFileNames = signal<string[]>([]);

  /** Cached step validációk (performance optimization) */
  private stepValidations = computed(() => ({
    step1: this.validationService.isContactDataValid(this.contactData()),
    step2: this.validationService.isBasicInfoValid(this.basicInfoData()),
    step3: this.validationService.isDesignDataValid(this.designData()),
    step4: this.validationService.isRosterDataValid(this.rosterData())
  }));

  /** Step 1-4 valid-e */
  step1Valid = computed(() => this.stepValidations().step1);
  step2Valid = computed(() => this.stepValidations().step2);
  step3Valid = computed(() => this.stepValidations().step3);
  step4Valid = computed(() => this.stepValidations().step4);

  /** Aktuális lépés valid-e */
  currentStepValid = computed(() => {
    const v = this.stepValidations();
    return [v.step1, v.step2, v.step3, v.step4][this.currentStep()] ?? false;
  });

  /** Összes lépés valid-e */
  allStepsValid = computed(() => {
    const v = this.stepValidations();
    return v.step1 && v.step2 && v.step3 && v.step4;
  });

  /** Lépés kész-e (template-hez) */
  stepsCompleted = computed(() => {
    const v = this.stepValidations();
    return [v.step1, v.step1 && v.step2, v.step1 && v.step2 && v.step3, this.allStepsValid()];
  });

  /** Lépés elérhető-e (template-hez) */
  stepsAccessible = computed(() => {
    const v = this.stepValidations();
    return [true, v.step1, v.step1 && v.step2, v.step1 && v.step2 && v.step3];
  });

  constructor() {
    effect(() => {
      const step = this.currentStep();
      if (this.initialized) {
        queueMicrotask(() => this.saveStepToStorage(step));
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedStep();
    this.loadExistingData();
    this.setupAutoSave();
    this.initialized = true;
  }

  ngOnDestroy(): void {
    clearTimeout(this.autoSaveResetTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== STEP NAVIGATION ==========

  nextStep(): void {
    if (this.currentStepValid() && this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
      this.focusStepContent();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
      this.focusStepContent();
    }
  }

  goToStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex > 3) return;
    if (stepIndex <= this.currentStep() || this.stepsAccessible()[stepIndex]) {
      this.currentStep.set(stepIndex);
      this.focusStepContent();
    }
  }

  // ========== DATA UPDATES (from child components) ==========

  updateContactData(data: ContactData): void {
    this.contactData.set(data);
    this.triggerAutoSave();
  }

  updateBasicInfoData(data: BasicInfoData): void {
    this.basicInfoData.set(data);
    this.triggerAutoSave();
  }

  updateDesignData(data: DesignData): void {
    this.designData.set(data);
    this.triggerAutoSave();
  }

  updateRosterData(data: RosterData): void {
    this.rosterData.set(data);
    this.triggerAutoSave();
  }

  // ========== ACTIONS ==========

  openPreview(): void {
    this.loading.set(true);
    this.orderFinalizationService.generatePreviewPdf(this.collectFormData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.pdfUrl && isSecureUrl(response.pdfUrl)) {
            openSecureUrl(response.pdfUrl);
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba a PDF generálásakor');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Preview PDF generation failed', err);
          this.toastService.error('Hiba', 'Hiba történt az előnézet generálásakor');
          this.loading.set(false);
        }
      });
  }

  submitOrder(): void {
    if (!this.allStepsValid()) {
      this.toastService.error('Hiányzó adatok', 'Kérlek, töltsd ki az összes kötelező mezőt!');
      return;
    }

    this.submitting.set(true);
    this.orderFinalizationService.finalizeOrder(this.collectFormData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Siker!', response.message || 'Megrendelés sikeresen véglegesítve!');
            if (response.pdfUrl && isSecureUrl(response.pdfUrl)) {
              openSecureUrl(response.pdfUrl);
            }
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba történt a véglegesítéskor');
          }
          this.submitting.set(false);
        },
        error: (err) => {
          this.logger.error('Order finalization failed', err);
          this.toastService.error('Hiba', 'Hiba történt a megrendelés véglegesítésekor');
          this.submitting.set(false);
        }
      });
  }

  // ========== PRIVATE METHODS ==========

  private focusStepContent(): void {
    setTimeout(() => {
      const heading = this.stepContent?.nativeElement?.querySelector('h2');
      if (heading) (heading as HTMLElement).focus();
    }, 100);
  }

  private loadSavedStep(): void {
    const project = this.authService.getProject();
    if (!project) return;
    try {
      const step = this.storage.getCurrentStep(project.id);
      if (step >= 0 && step <= 3) this.currentStep.set(step);
    } catch { /* ignore */ }
  }

  private saveStepToStorage(step: number): void {
    const project = this.authService.getProject();
    if (!project) return;
    try {
      this.storage.setCurrentStep(project.id, step);
    } catch { /* ignore */ }
  }

  private setupAutoSave(): void {
    this.autoSaveTrigger$.pipe(debounceTime(2000), takeUntil(this.destroy$))
      .subscribe(() => this.performAutoSave());
  }

  private triggerAutoSave(): void {
    this.autoSaveTrigger$.next();
  }

  private performAutoSave(): void {
    if (this.submitting()) return;
    this.autoSaveStatus.set('saving');

    this.orderFinalizationService.autoSaveDraft(this.collectFormData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.autoSaveStatus.set('saved');
          clearTimeout(this.autoSaveResetTimer);
          this.autoSaveResetTimer = setTimeout(() => {
            if (this.autoSaveStatus() === 'saved') this.autoSaveStatus.set('idle');
          }, 2000);
        },
        error: (err) => {
          this.logger.error('Auto-save failed', err);
          this.autoSaveStatus.set('error');
          clearTimeout(this.autoSaveResetTimer);
          this.autoSaveResetTimer = setTimeout(() => {
            if (this.autoSaveStatus() === 'error') this.autoSaveStatus.set('idle');
          }, 3000);
        }
      });
  }

  private loadExistingData(): void {
    this.loading.set(true);
    this.orderFinalizationService.getExistingData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const mapped = this.orderFinalizationService.mapResponseToFormData(response);
          this.contactData.set(mapped.contact);
          this.basicInfoData.set(mapped.basicInfo);
          this.designData.set(mapped.design);
          this.rosterData.set(mapped.roster);
          if (mapped.design.backgroundImageId) {
            this.backgroundFileName.set('Korábban feltöltött háttérkép');
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  private collectFormData(): OrderFinalizationData {
    return {
      contact: this.contactData(),
      basicInfo: this.basicInfoData(),
      design: this.designData(),
      roster: this.rosterData()
    };
  }
}
