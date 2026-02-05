import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  inject,
  viewChild,
  ElementRef
} from '@angular/core';
import { OrderValidationService } from './services/order-validation.service';
import { OrderFinalizationFacadeService } from './services/order-finalization-facade.service';
import {
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData,
  STEPPER_STEPS
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
 * Facade service kezeli: auto-save, storage, data loading, preview, submit
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
  ],
  providers: [OrderFinalizationFacadeService]
})
export class OrderFinalizationComponent implements OnInit, OnDestroy {
  readonly stepContent = viewChild<ElementRef<HTMLElement>>('stepContent');

  private readonly facade = inject(OrderFinalizationFacadeService);
  private readonly validationService = inject(OrderValidationService);
  private initialized = false;

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
    // Facade inicializálás
    this.facade.init(
      {
        contactData: this.contactData,
        basicInfoData: this.basicInfoData,
        designData: this.designData,
        rosterData: this.rosterData,
        loading: this.loading,
        submitting: this.submitting,
        backgroundFileName: this.backgroundFileName,
        allStepsValid: this.allStepsValid
      },
      this.autoSaveStatus,
      {
        setContact: (d) => this.contactData.set(d),
        setBasicInfo: (d) => this.basicInfoData.set(d),
        setDesign: (d) => this.designData.set(d),
        setRoster: (d) => this.rosterData.set(d)
      }
    );

    effect(() => {
      const step = this.currentStep();
      if (this.initialized) {
        queueMicrotask(() => this.facade.saveStepToStorage(step));
      }
    });
  }

  ngOnInit(): void {
    const savedStep = this.facade.loadSavedStep();
    if (savedStep > 0) this.currentStep.set(savedStep);
    this.facade.loadExistingData();
    this.facade.setupAutoSave();
    this.initialized = true;
  }

  ngOnDestroy(): void {
    // Facade uses DestroyRef, no manual cleanup needed
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
    this.facade.triggerAutoSave();
  }

  updateBasicInfoData(data: BasicInfoData): void {
    this.basicInfoData.set(data);
    this.facade.triggerAutoSave();
  }

  updateDesignData(data: DesignData): void {
    this.designData.set(data);
    this.facade.triggerAutoSave();
  }

  updateRosterData(data: RosterData): void {
    this.rosterData.set(data);
    this.facade.triggerAutoSave();
  }

  // ========== ACTIONS (delegated to facade) ==========

  openPreview(): void {
    this.facade.openPreview();
  }

  submitOrder(): void {
    this.facade.submitOrder();
  }

  // ========== PRIVATE ==========

  private focusStepContent(): void {
    setTimeout(() => {
      const heading = this.stepContent()?.nativeElement?.querySelector('h2');
      if (heading) (heading as HTMLElement).focus();
    }, 100);
  }
}
