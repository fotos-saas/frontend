import { Injectable, DestroyRef, inject, Signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { OrderFinalizationService } from './order-finalization.service';
import { OrderValidationService } from './order-validation.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { AuthService } from '../../../core/services/auth.service';
import { TabloStorageService } from '../../../core/services/tablo-storage.service';
import { isSecureUrl, openSecureUrl } from '../../../core/utils/url-validator.util';
import {
  OrderFinalizationData,
  ContactData,
  BasicInfoData,
  DesignData,
  RosterData
} from '../models/order-finalization.models';

/**
 * Signals interface a komponenstol kapott signal-ok tipusahoz
 */
export interface OrderFormSignals {
  contactData: Signal<ContactData>;
  basicInfoData: Signal<BasicInfoData>;
  designData: Signal<DesignData>;
  rosterData: Signal<RosterData>;
  loading: WritableSignal<boolean>;
  submitting: WritableSignal<boolean>;
  backgroundFileName: WritableSignal<string | null>;
  allStepsValid: Signal<boolean>;
}

/**
 * Order Finalization Facade Service
 * Kezeli: auto-save, storage persistence, data loading, preview, submit
 *
 * Component-scoped (NEM providedIn: 'root')
 */
@Injectable()
export class OrderFinalizationFacadeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderFinalizationService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly authService = inject(AuthService);
  private readonly storage = inject(TabloStorageService);

  private readonly autoSaveTrigger$ = new Subject<void>();
  private autoSaveResetTimer?: ReturnType<typeof setTimeout>;

  /** Auto-save allapot */
  autoSaveStatus: WritableSignal<'idle' | 'saving' | 'saved' | 'error'> | null = null;

  /** Referencia a komponens signal-jaira */
  private signals!: OrderFormSignals;

  /** Setter callback-ek a komponens signal-jainak frissitesehez */
  private setters!: {
    setContact: (data: ContactData) => void;
    setBasicInfo: (data: BasicInfoData) => void;
    setDesign: (data: DesignData) => void;
    setRoster: (data: RosterData) => void;
  };

  /**
   * Inicializalas - a komponens signal-jainak atadasa
   */
  init(
    signals: OrderFormSignals,
    autoSaveStatus: WritableSignal<'idle' | 'saving' | 'saved' | 'error'>,
    setters: {
      setContact: (data: ContactData) => void;
      setBasicInfo: (data: BasicInfoData) => void;
      setDesign: (data: DesignData) => void;
      setRoster: (data: RosterData) => void;
    }
  ): void {
    this.signals = signals;
    this.autoSaveStatus = autoSaveStatus;
    this.setters = setters;

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.autoSaveResetTimer);
    });
  }

  // ========== AUTO-SAVE ==========

  setupAutoSave(): void {
    this.autoSaveTrigger$.pipe(
      debounceTime(2000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.performAutoSave());
  }

  triggerAutoSave(): void {
    this.autoSaveTrigger$.next();
  }

  private performAutoSave(): void {
    if (this.signals.submitting()) return;
    this.autoSaveStatus!.set('saving');

    this.orderService.autoSaveDraft(this.collectFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.autoSaveStatus!.set('saved');
          clearTimeout(this.autoSaveResetTimer);
          this.autoSaveResetTimer = setTimeout(() => {
            if (this.autoSaveStatus!() === 'saved') this.autoSaveStatus!.set('idle');
          }, 2000);
        },
        error: (err) => {
          this.logger.error('Auto-save failed', err);
          this.autoSaveStatus!.set('error');
          clearTimeout(this.autoSaveResetTimer);
          this.autoSaveResetTimer = setTimeout(() => {
            if (this.autoSaveStatus!() === 'error') this.autoSaveStatus!.set('idle');
          }, 3000);
        }
      });
  }

  // ========== STORAGE PERSISTENCE ==========

  loadSavedStep(): number {
    const project = this.authService.getProject();
    if (!project) return 0;
    try {
      const step = this.storage.getCurrentStep(project.id);
      if (step >= 0 && step <= 3) return step;
    } catch { /* ignore */ }
    return 0;
  }

  saveStepToStorage(step: number): void {
    const project = this.authService.getProject();
    if (!project) return;
    try {
      this.storage.setCurrentStep(project.id, step);
    } catch { /* ignore */ }
  }

  // ========== DATA LOADING ==========

  loadExistingData(): void {
    this.signals.loading.set(true);
    this.orderService.getExistingData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const mapped = this.orderService.mapResponseToFormData(response);
          this.setters.setContact(mapped.contact);
          this.setters.setBasicInfo(mapped.basicInfo);
          this.setters.setDesign(mapped.design);
          this.setters.setRoster(mapped.roster);
          if (mapped.design.backgroundImageId) {
            this.signals.backgroundFileName.set('Korábban feltöltött háttérkép');
          }
          this.signals.loading.set(false);
        },
        error: () => this.signals.loading.set(false)
      });
  }

  // ========== ACTIONS ==========

  openPreview(): void {
    this.signals.loading.set(true);
    this.orderService.generatePreviewPdf(this.collectFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.pdfUrl && isSecureUrl(response.pdfUrl)) {
            openSecureUrl(response.pdfUrl);
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba a PDF generálásakor');
          }
          this.signals.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Preview PDF generation failed', err);
          this.toastService.error('Hiba', 'Hiba történt az előnézet generálásakor');
          this.signals.loading.set(false);
        }
      });
  }

  submitOrder(): void {
    if (!this.signals.allStepsValid()) {
      this.toastService.error('Hiányzó adatok', 'Kérlek, töltsd ki az összes kötelező mezőt!');
      return;
    }

    this.signals.submitting.set(true);
    this.orderService.finalizeOrder(this.collectFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Siker!', response.message || 'Megrendelés sikeresen véglegesítve!');
            this.router.navigate(['/order-data']);
          } else {
            this.toastService.error('Hiba', response.message || 'Hiba történt a véglegesítéskor');
            this.signals.submitting.set(false);
          }
        },
        error: (err) => {
          this.logger.error('Order finalization failed', err);
          this.toastService.error('Hiba', 'Hiba történt a megrendelés véglegesítésekor');
          this.signals.submitting.set(false);
        }
      });
  }

  // ========== PRIVATE ==========

  private collectFormData(): OrderFinalizationData {
    return {
      contact: this.signals.contactData(),
      basicInfo: this.signals.basicInfoData(),
      design: this.signals.designData(),
      roster: this.signals.rosterData()
    };
  }
}
