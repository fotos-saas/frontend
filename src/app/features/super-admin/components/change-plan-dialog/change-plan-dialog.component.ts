import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnInit,
  input,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PsSelectComponent, PsRadioGroupComponent } from '@shared/components/form';
import { PsRadioOption } from '@shared/components/form/form.types';
import { SuperAdminService } from '../../services/super-admin.service';
import { PlansService, PlanOption } from '../../../../shared/services/plans.service';
import { ICONS } from '../../../../shared/constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

type PlanType = 'alap' | 'iskola' | 'studio' | 'vip';
type BillingCycleType = 'monthly' | 'yearly';

/**
 * Csomag váltás dialógus
 * Partner csomagjának és számlázási ciklusának módosítása.
 */
@Component({
  selector: 'app-change-plan-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSelectComponent, PsRadioGroupComponent, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      variant="edit"
      headerStyle="hero"
      theme="blue"
      [icon]="ICONS.PACKAGE"
      title="Csomag váltás"
      [description]="subscriberName()"
      size="md"
      [closable]="!isSubmitting()"
      [isSubmitting]="isSubmitting()"
      [errorMessage]="errorMessage()"
      (closeEvent)="onCancel()"
      (submitEvent)="onSubmit()"
    >
      <ng-container dialogBody>
        <ps-select
          label="Csomag"
          [options]="planSelectOptions()"
          [(ngModel)]="selectedPlan"
          name="plan"
        />

        <ps-radio-group
          label="Számlázási ciklus"
          [options]="billingCycleOptions"
          [(ngModel)]="selectedBillingCycle"
          name="billingCycle"
        />

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
      </ng-container>

      <ng-container dialogFooter>
        <button
          type="button"
          class="btn btn--outline"
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
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          }
          Módosítás
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styles: [`
    .price-preview {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-top: 1rem;

      &__label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin-bottom: 0.25rem;
      }

      &__value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
      }
    }

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePlanDialogComponent implements OnInit, AfterViewInit {
  private readonly logger = inject(LoggerService);
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

  // Plan options - PlansService-ből töltve
  planOptions = signal<PlanOption[]>([]);

  // Mapped options for ps-select (PlanOption.value → PsSelectOption.id)
  readonly planSelectOptions = computed(() =>
    this.planOptions().map(p => ({ id: p.value, label: p.label }))
  );

  // Billing cycle options for ps-radio-group
  readonly billingCycleOptions: PsRadioOption[] = [
    { value: 'monthly', label: 'Havi' },
    { value: 'yearly', label: 'Éves (2 hónap ajándék)' },
  ];

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
    this.plansService.getPlanSelectOptions().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => this.planOptions.set(options));

    this.plansService.getPlanPrices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (prices) => {
        this.planPrices.set(prices as Record<string, Record<BillingCycleType, number>>);
      },
      error: (err) => {
        this.logger.error('Failed to load plan prices', err);
      }
    });
  }

  readonly hasChanges = computed(() => {
    return this.selectedPlan() !== this.currentPlan() ||
           this.selectedBillingCycle() !== this.currentBillingCycle();
  });

  ngAfterViewInit(): void {
    this.selectedPlan.set(this.currentPlan());
    this.selectedBillingCycle.set(this.currentBillingCycle());
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
