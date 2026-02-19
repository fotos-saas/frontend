import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/constants';
import { PlansService, PricingPlan } from '../../../shared/services/plans.service';
import { SubscriptionService } from '../../../features/partner/services/subscription.service';
import { PsInputComponent, PsSelectComponent, PsCheckboxComponent, PsSelectOption } from '@shared/components/form';
import { isSecureUrl } from '@core/utils/url-validator.util';

@Component({
  selector: 'app-register-app',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PasswordStrengthComponent,
    AuthLayoutComponent,
    LucideAngularModule,
    PsInputComponent,
    PsSelectComponent,
    PsCheckboxComponent,
  ],
  templateUrl: './register-app.component.html',
  styleUrls: ['./register-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterAppComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private plansService = inject(PlansService);
  private subscriptionService = inject(SubscriptionService);

  readonly ICONS = ICONS;

  readonly countryOptions: PsSelectOption[] = [
    { id: 'Magyarország', label: 'Magyarország' },
    { id: 'Ausztria', label: 'Ausztria' },
    { id: 'Németország', label: 'Németország' },
    { id: 'Szlovákia', label: 'Szlovákia' },
    { id: 'Románia', label: 'Románia' },
  ];

  // Steps
  currentStep = signal(1);
  totalSteps = 4;

  // Loading & messages
  isLoading = signal(false);
  plansLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Billing toggle
  isYearly = signal(false);

  // Selected plan
  selectedPlanId = signal<string>('iskola');

  // Pricing plans (betöltve API-ból)
  plans = signal<PricingPlan[]>([]);

  // Selected plan computed - fallback hardcoded értékkel
  selectedPlan = computed(() => {
    const allPlans = this.plans();
    return allPlans.find(p => p.id === this.selectedPlanId()) || allPlans[1] || {
      id: 'iskola',
      name: 'Iskola',
      description: 'Legtöbb fotósnak ideális',
      monthlyPrice: 14990,
      yearlyPrice: 149900,
      pausedPrice: 2500,
      features: [],
      limits: { storage_gb: 100, max_classes: 20, max_schools: null, max_contacts: null, max_templates: null },
      popular: true,
    };
  });

  // Current price computed
  currentPrice = computed(() => {
    const plan = this.selectedPlan();
    return this.isYearly() ? plan.yearlyPrice : plan.monthlyPrice;
  });

  // Monthly equivalent for yearly
  monthlyEquivalent = computed(() => {
    const plan = this.selectedPlan();
    return Math.round(plan.yearlyPrice / 12);
  });

  // Account form (Step 2)
  accountForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required]
  }, {
    validators: this.passwordMatchValidator
  });

  // Billing form (Step 3)
  billingForm: FormGroup = this.fb.group({
    company_name: ['', Validators.required],
    tax_number: [''],
    country: ['Magyarország', Validators.required],
    postal_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    city: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required]
  });

  // Terms accepted
  termsAccepted = signal(false);

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.plansLoading.set(true);
    this.plansService.getPricingPlans().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.plansLoading.set(false);

        // Check for plan from query params after plans are loaded
        this.route.queryParams.pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(params => {
          if (params['plan'] && plans.find(p => p.id === params['plan'])) {
            this.selectedPlanId.set(params['plan']);
          }
          if (params['yearly'] === 'true') {
            this.isYearly.set(true);
          }
        });
      },
      error: (err) => {
        this.logger.error('Failed to load plans', err);
        this.plansLoading.set(false);
        this.errorMessage.set('Nem sikerült betölteni a csomagokat.');
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmation = form.get('password_confirmation')?.value;
    if (password && confirmation && password !== confirmation) {
      return { passwordMismatch: true };
    }
    return null;
  }

  selectPlan(planId: string) {
    this.selectedPlanId.set(planId);
  }

  toggleBilling() {
    this.isYearly.update(v => !v);
  }

  nextStep() {
    // Validate current step
    if (this.currentStep() === 2 && this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    if (this.currentStep() === 3 && this.billingForm.invalid) {
      this.billingForm.markAllAsTouched();
      return;
    }

    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
      this.errorMessage.set(null);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      this.errorMessage.set(null);
    }
  }

  goToStep(step: number) {
    // Only allow going back or to current step
    if (step <= this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  formatPrice(price: number): string {
    return price.toLocaleString('hu-HU');
  }

  getMonthlyEquivalent(yearlyPrice: number): number {
    return Math.round(yearlyPrice / 12);
  }

  onSubmit() {
    if (!this.termsAccepted()) {
      this.errorMessage.set('El kell fogadnod az általános szerződési feltételeket.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const registrationData = {
      // Account
      name: this.accountForm.value.name,
      email: this.accountForm.value.email,
      password: this.accountForm.value.password,
      // Billing
      billing: this.billingForm.value,
      // Plan
      plan: this.selectedPlanId(),
      billing_cycle: this.isYearly() ? 'yearly' : 'monthly'
    };

    // Call backend to create Stripe Checkout Session
    this.subscriptionService.createCheckoutSession(registrationData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Átirányítás a fizetési oldalra...');

        // Redirect to Stripe Checkout
        if (response.checkout_url && isSecureUrl(response.checkout_url)) {
          window.location.href = response.checkout_url;
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Hiba történt a regisztráció során.';
        this.errorMessage.set(message);
      }
    });
  }
}
