import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  HostListener,
  input,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { LucideAngularModule } from 'lucide-angular';
import { createBackdropHandler } from '../../utils/dialog.util';
import { ICONS } from '../../constants/icons.constants';
import { PlansService, PlanConfig, PricingPlan } from '../../services/plans.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

/** Csapattag role-ok */
const TEAM_MEMBER_ROLES = ['designer', 'marketer', 'printer', 'assistant'];

export type UpgradeFeature = 'schools' | 'contacts' | 'projects' | 'storage' | 'templates';

/**
 * Upgrade dialógus - csomagváltásra ösztönzés
 *
 * Használat több helyen: iskolák, kapcsolattartók, projektek limit elérésekor.
 * Dinamikusan tölti a csomag adatokat a PlansService-ből.
 */
@Component({
  selector: 'app-upgrade-dialog',
  standalone: true,
  imports: [A11yModule, LucideAngularModule],
  templateUrl: './upgrade-dialog.component.html',
  styleUrls: ['./upgrade-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly router = inject(Router);
  private readonly plansService = inject(PlansService);
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Csapattag-e (nem válthat csomagot) */
  readonly isTeamMember = computed(() => {
    const roles = this.authService.getCurrentUser()?.roles ?? [];
    return TEAM_MEMBER_ROLES.some(r => roles.includes(r));
  });

  /** Signal-based inputs */
  readonly feature = input<UpgradeFeature>('schools');
  readonly currentPlanId = input<string>('alap');

  /** Signal-based output */
  readonly close = output<void>();

  readonly dialogContent = viewChild.required<ElementRef<HTMLElement>>('dialogContent');

  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

  /** Backdrop handler */
  readonly backdropHandler = createBackdropHandler(() => this.onClose());

  /** Upgrade data signals */
  readonly currentPlanName = signal<string>('Alap');
  readonly nextPlanName = signal<string>('Pro');
  readonly currentLimit = signal<number | null>(0);
  readonly nextLimit = signal<number | null>(null);

  /** Extended data for new features */
  readonly currentPlan = signal<PlanConfig | null>(null);
  readonly nextPlan = signal<PlanConfig | null>(null);
  readonly allPlans = signal<PricingPlan[]>([]);
  readonly selectedPlanId = signal<string | null>(null);

  /** Computed: Kiválasztott csomag adatai */
  readonly selectedPlan = computed(() => {
    const planId = this.selectedPlanId();
    if (!planId) return null;
    return this.allPlans().find(p => p.id === planId) ?? null;
  });

  /** Loading states */
  readonly isLoading = signal<boolean>(true);
  readonly isPlansLoading = signal<boolean>(true);

  /** Computed: Összes adat betöltődött */
  readonly isDataReady = computed(() => !this.isLoading() && this.currentPlan() !== null);
  readonly isPlansReady = computed(() => !this.isPlansLoading() && this.allPlans().length > 0);

  /** Computed: Elérhető csomagok (jelenlegi fölöttiek) */
  readonly availablePlans = computed(() => {
    const plans = this.allPlans();
    const currentId = this.currentPlanId();
    const planOrder = ['alap', 'iskola', 'studio', 'vip'];
    const currentIndex = planOrder.indexOf(currentId);

    // Csak a jelenlegi csomagnál magasabbakat mutatjuk
    return plans.filter(plan => {
      const planIndex = planOrder.indexOf(plan.id);
      return planIndex > currentIndex;
    });
  });

  /** Ajánlott csomag-e (a következő a sorban) */
  isRecommendedPlan(planId: string): boolean {
    const planOrder = ['alap', 'iskola', 'studio', 'vip'];
    const currentIndex = planOrder.indexOf(this.currentPlanId());
    const nextIndex = currentIndex + 1;
    return planOrder[nextIndex] === planId;
  }

  ngOnInit(): void {
    this.loadUpgradeData();
    this.loadAllPlans();
    // Egyből az ajánlott csomagot válasszuk ki
    this.preselectRecommendedPlan();
  }

  /** Ajánlott csomag előválasztása */
  private preselectRecommendedPlan(): void {
    const planOrder = ['alap', 'iskola', 'studio', 'vip'];
    const currentIndex = planOrder.indexOf(this.currentPlanId());
    const nextPlanId = planOrder[currentIndex + 1];
    if (nextPlanId) {
      this.selectedPlanId.set(nextPlanId);
    }
  }

  private loadUpgradeData(): void {
    this.isLoading.set(true);
    this.plansService.getUpgradeData(this.currentPlanId(), this.feature())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.currentPlanName.set(data.currentPlanName);
        this.nextPlanName.set(data.nextPlanName);
        this.currentLimit.set(data.currentLimit);
        this.nextLimit.set(data.nextLimit);
        this.currentPlan.set(data.currentPlan);
        this.nextPlan.set(data.nextPlan);
        this.isLoading.set(false);
      });
  }

  private loadAllPlans(): void {
    this.isPlansLoading.set(true);
    this.plansService.getPricingPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(plans => {
        this.allPlans.set(plans);
        this.isPlansLoading.set(false);
      });
  }

  /** Ár formázás */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('hu-HU').format(price);
  }

  /** Csomag kiválasztása - részletek megjelenítése */
  selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
  }

  /** Csomag kiválasztás megerősítése - Stripe Portal megnyitása */
  async confirmPlanSelection(): Promise<void> {
    const planId = this.selectedPlanId();
    if (planId) {
      this.isLoading.set(true);
      try {
        await this.paymentService.openCustomerPortal();
        this.close.emit();
      } catch (error) {
        this.logger.error('Failed to open Stripe portal', error);
        this.isLoading.set(false);
      }
    }
  }

  /** Kiválasztás törlése */
  clearSelection(): void {
    this.selectedPlanId.set(null);
  }

  /** Check if plan is current */
  isCurrentPlan(planId: string): boolean {
    return planId === this.currentPlanId();
  }

  /** Feature details */
  get featureDetails() {
    const details: Record<UpgradeFeature, { icon: string; title: string; description: string; unit: string }> = {
      schools: {
        icon: ICONS.SCHOOL,
        title: 'Iskolák',
        description: 'Elérted a csomagodban elérhető maximum iskolaszámot.',
        unit: 'iskola'
      },
      contacts: {
        icon: ICONS.USERS,
        title: 'Kapcsolattartók',
        description: 'Elérted a csomagodban elérhető maximum kapcsolattartó számot.',
        unit: 'kapcsolattartó'
      },
      projects: {
        icon: ICONS.FOLDER_OPEN,
        title: 'Projektek',
        description: 'Elérted a csomagodban elérhető maximum projektszámot.',
        unit: 'projekt'
      },
      storage: {
        icon: ICONS.HARD_DRIVE,
        title: 'Tárhely',
        description: 'Elérted a csomagodban elérhető maximum tárhelyet.',
        unit: 'GB'
      },
      templates: {
        icon: ICONS.LAYOUT_TEMPLATE,
        title: 'Sablonok',
        description: 'Elérted a csomagodban elérhető maximum sablonszámot.',
        unit: 'sablon'
      }
    };
    return details[this.feature()];
  }

  ngAfterViewInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;

    const contentEl = this.dialogContent()?.nativeElement;
    if (contentEl) {
      this.focusTrap = this.focusTrapFactory.create(contentEl);
      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();

    if (this.previousActiveElement?.focus) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
      }, 0);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.dialogContent()?.nativeElement) {
        this.onClose();
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  /** Csomagváltás gomb - Stripe Portal megnyitása */
  async onUpgrade(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.paymentService.openCustomerPortal();
      this.close.emit();
    } catch (error) {
      this.logger.error('Failed to open Stripe portal', error);
      this.isLoading.set(false);
    }
  }

}
