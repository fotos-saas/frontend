import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/constants/icons.constants';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

@Component({
  selector: 'app-register-app',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PasswordStrengthComponent,
    AuthLayoutComponent,
    LucideAngularModule
  ],
  templateUrl: './register-app.component.html',
  styleUrls: ['./register-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterAppComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // Steps
  currentStep = signal(1);
  totalSteps = 4;

  // Loading & messages
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Billing toggle
  isYearly = signal(false);

  // Selected plan
  selectedPlanId = signal<string>('iskola');

  // Pricing plans
  readonly plans: PricingPlan[] = [
    {
      id: 'alap',
      name: 'Alap',
      description: 'Kezdő fotósoknak',
      monthlyPrice: 4990,
      yearlyPrice: 49900,
      features: [
        '20 GB tárhely',
        'Max. 3 osztály',
        'Online képválasztás',
        'Sablon szerkesztő',
        'QR kódos megosztás',
        'Email támogatás'
      ]
    },
    {
      id: 'iskola',
      name: 'Iskola',
      description: 'Legtöbb fotósnak ideális',
      monthlyPrice: 14990,
      yearlyPrice: 149900,
      popular: true,
      features: [
        '100 GB tárhely',
        'Max. 20 osztály',
        'Saját subdomain',
        'Online fizetés (Stripe)',
        'SMS értesítések',
        'Prioritás támogatás'
      ]
    },
    {
      id: 'studio',
      name: 'Stúdió',
      description: 'Nagyobb stúdióknak',
      monthlyPrice: 29990,
      yearlyPrice: 299900,
      features: [
        '500 GB tárhely',
        'Korlátlan osztály',
        'Custom domain',
        'White-label (saját márka)',
        'API hozzáférés',
        'Dedikált support'
      ]
    }
  ];

  // Selected plan computed
  selectedPlan = computed(() => {
    return this.plans.find(p => p.id === this.selectedPlanId()) || this.plans[1];
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

  constructor() {
    // Check for plan from query params
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['plan'] && this.plans.find(p => p.id === params['plan'])) {
        this.selectedPlanId.set(params['plan']);
      }
      if (params['yearly'] === 'true') {
        this.isYearly.set(true);
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
      ...this.accountForm.value,
      // Billing
      billing: this.billingForm.value,
      // Plan
      plan: this.selectedPlanId(),
      billing_cycle: this.isYearly() ? 'yearly' : 'monthly'
    };

    // TODO: Implement actual registration with payment
    // For now, simulate success
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('Sikeres regisztráció! Átirányítunk a fizetéshez...');

      // Redirect after delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 1500);

    /*
    this.authService.registerWithPlan(registrationData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Redirect to Stripe checkout
        if (response.checkout_url) {
          window.location.href = response.checkout_url;
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
    */
  }
}
