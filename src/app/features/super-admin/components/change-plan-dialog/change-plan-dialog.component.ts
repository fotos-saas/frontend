import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
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
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { SuperAdminService } from '../../services/super-admin.service';
import { PlansService, PlanOption } from '../../../../shared/services/plans.service';
import { ICONS } from '../../../../shared/constants';

type PlanType = 'alap' | 'iskola' | 'studio' | 'vip';
type BillingCycleType = 'monthly' | 'yearly';

/**
 * Csomag váltás dialógus
 * Partner csomagjának és számlázási ciklusának módosítása.
 */
@Component({
  selector: 'app-change-plan-dialog',
  standalone: true,
  imports: [FormsModule, A11yModule, LucideAngularModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div #dialogContent class="dialog dialog--md" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" tabindex="-1">
        <!-- Header -->
        <header class="dialog__header">
          <div class="dialog__icon">
            <lucide-icon [name]="ICONS.PACKAGE" [size]="28" />
          </div>
          <h2 class="dialog__title">Csomag váltás</h2>
          <p class="dialog__subtitle">{{ subscriberName() }}</p>
        </header>

        <!-- Content -->
        <div class="dialog__content">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="plan" class="form-label">Csomag</label>
              <select
                id="plan"
                class="form-select"
                [(ngModel)]="selectedPlan"
                name="plan"
                required
              >
                @for (plan of planOptions(); track plan.value) {
                  <option [value]="plan.value">{{ plan.label }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Számlázási ciklus</label>
              <div class="radio-group">
                <label class="radio-item" [class.radio-item--active]="selectedBillingCycle() === 'monthly'">
                  <input
                    type="radio"
                    name="billingCycle"
                    value="monthly"
                    [(ngModel)]="selectedBillingCycle"
                  />
                  <span>Havi</span>
                </label>
                <label class="radio-item" [class.radio-item--active]="selectedBillingCycle() === 'yearly'">
                  <input
                    type="radio"
                    name="billingCycle"
                    value="yearly"
                    [(ngModel)]="selectedBillingCycle"
                  />
                  <span>Éves (2 hónap ajándék)</span>
                </label>
              </div>
            </div>

            <!-- Ár előnézet -->
            <div class="price-preview">
              <div class="price-preview__label">Új ár</div>
              <div class="price-preview__value">{{ formatPrice(newPrice()) }}</div>
            </div>

            @if (hasChanges()) {
              <div class="change-info">
                <lucide-icon [name]="ICONS.INFO" [size]="16" />
                <span>A változás azonnal érvénybe lép. A Stripe automatikusan számolja a proration-t.</span>
              </div>
            }

            @if (errorMessage()) {
              <div class="error-message">
                <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
                {{ errorMessage() }}
              </div>
            }
          </form>
        </div>

        <!-- Footer -->
        <footer class="dialog__footer">
          <button
            type="button"
            class="btn btn--secondary"
            (click)="onCancel()"
            [disabled]="isSubmitting()"
          >
            Mégse
          </button>
          <button
            type="button"
            class="btn btn--primary"
            (click)="onSubmit()"
            [disabled]="isSubmitting() || !hasChanges()"
          >
            @if (isSubmitting()) {
              <span class="btn__spinner"></span>
            }
            Módosítás
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    @use '../dialog-shared.scss';

    .change-info {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      color: #1e40af;
      font-size: 0.8125rem;
      margin-top: 1rem;

      lucide-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePlanDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly service = inject(SuperAdminService);
  private readonly plansService = inject(PlansService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Inputs */
  readonly subscriberId = input.required<number>();
  readonly subscriberName = input.required<string>();
  readonly currentPlan = input.required<PlanType>();
  readonly currentBillingCycle = input.required<BillingCycleType>();

  /** Outputs */
  readonly close = output<void>();
  readonly changed = output<void>();

  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLElement>;

  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

  // Plan options - PlansService-ből töltve
  planOptions = signal<PlanOption[]>([]);

  // Plan prices - PlansService-ből töltve
  planPrices = signal<Record<string, Record<BillingCycleType, number>>>({});

  // Form state
  selectedPlan = signal<PlanType>('alap');
  selectedBillingCycle = signal<BillingCycleType>('monthly');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Computed
  readonly newPrice = computed(() => {
    const prices = this.planPrices();
    const planPrices = prices[this.selectedPlan()];
    return planPrices?.[this.selectedBillingCycle()] ?? 0;
  });

  ngOnInit(): void {
    this.loadPlanData();
  }

  private loadPlanData(): void {
    // Load plan options
    this.plansService.getPlanSelectOptions().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => this.planOptions.set(options));

    // Load plan prices
    this.plansService.getPlanPrices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (prices) => {
        this.planPrices.set(prices as Record<string, Record<BillingCycleType, number>>);
      },
      error: (err) => {
        console.error('Failed to load plan prices:', err);
      }
    });
  }

  readonly hasChanges = computed(() => {
    return this.selectedPlan() !== this.currentPlan() ||
           this.selectedBillingCycle() !== this.currentBillingCycle();
  });

  readonly backdropHandler = createBackdropHandler(() => this.onCancel());

  ngAfterViewInit(): void {
    // Set initial values from inputs
    this.selectedPlan.set(this.currentPlan());
    this.selectedBillingCycle.set(this.currentBillingCycle());

    this.previousActiveElement = document.activeElement as HTMLElement;

    if (this.dialogContent?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(this.dialogContent.nativeElement);
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
      if (this.dialogContent?.nativeElement) {
        this.onCancel();
      }
    }
  }

  formatPrice(price: number): string {
    const formatted = new Intl.NumberFormat('hu-HU').format(price);
    const suffix = this.selectedBillingCycle() === 'yearly' ? '/év' : '/hó';
    return `${formatted} Ft${suffix}`;
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.hasChanges() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.changePlan(this.subscriberId(), {
      plan: this.selectedPlan(),
      billing_cycle: this.selectedBillingCycle()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.changed.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Hiba történt a csomag váltás során.');
        }
      });
  }
}
