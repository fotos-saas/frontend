import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PrepaymentPublicService, PublicPrepaymentData, CheckoutResponse } from './prepayment-public.service';
import { isSecureUrl } from '@core/utils/url-validator.util';

type PageState = 'loading' | 'payable' | 'package_select' | 'already_paid' | 'expired' | 'invalid';

@Component({
  selector: 'app-client-prepayment',
  standalone: true,
  imports: [FormsModule, DecimalPipe, LucideAngularModule],
  templateUrl: './client-prepayment.component.html',
  styleUrl: './client-prepayment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPrepaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private prepaymentService = inject(PrepaymentPublicService);
  readonly ICONS = ICONS;

  // Oldal állapot
  state = signal<PageState>('loading');
  errorMessage = signal('');
  data = signal<PublicPrepaymentData | null>(null);

  // Űrlap mezők
  parentName = signal('');
  parentEmail = signal('');
  parentPhone = signal('');
  paymentMethod = signal<string>('stripe');
  selectedPackageKey = signal<string | null>(null);
  acceptTerms = signal(false);

  // Checkout állapot
  submitting = signal(false);
  showBankDetails = signal(false);
  bankDetails = signal<CheckoutResponse['data']['bank_details'] | null>(null);

  // Számított értékek
  branding = computed(() => this.data()?.branding ?? null);
  prepayment = computed(() => this.data()?.prepayment ?? null);
  packages = computed(() => this.data()?.packages ?? []);
  isPackageMode = computed(() => this.prepayment()?.mode === 'package');
  paymentMethods = computed(() => this.prepayment()?.payment_methods ?? []);

  displayAmount = computed(() => {
    if (this.isPackageMode()) {
      const pkg = this.packages().find(p => p.key === this.selectedPackageKey());
      return pkg?.price_huf ?? 0;
    }
    return this.prepayment()?.amount_huf ?? 0;
  });

  canSubmit = computed(() => {
    const p = this.prepayment();
    if (!p) return false;
    if (!this.parentName().trim() || !this.parentEmail().trim()) return false;
    if (!this.acceptTerms()) return false;
    if (this.isPackageMode() && !this.selectedPackageKey()) return false;
    if (this.submitting()) return false;
    return true;
  });

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('invalid');
      this.errorMessage.set('Hiányzó vagy hibás hivatkozás.');
      return;
    }
    this.loadPrepayment();
  }

  selectPackage(key: string): void {
    this.selectedPackageKey.set(key);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    this.prepaymentService
      .createCheckout(this.token, {
        parent_name: this.parentName().trim(),
        parent_email: this.parentEmail().trim(),
        parent_phone: this.parentPhone().trim() || undefined,
        payment_method: this.paymentMethod(),
        package_key: this.selectedPackageKey() ?? undefined,
        accept_terms: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.data.payment_method === 'stripe' && res.data.checkout_url) {
            if (isSecureUrl(res.data.checkout_url)) {
              window.location.href = res.data.checkout_url;
            }
          } else if (res.data.payment_method === 'bank_transfer' && res.data.bank_details) {
            this.bankDetails.set(res.data.bank_details);
            this.showBankDetails.set(true);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Hiba történt a fizetés indításakor.');
        },
      });
  }

  private loadPrepayment(): void {
    this.state.set('loading');

    this.prepaymentService
      .getPrepayment(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.data.set(res.data);
          const p = res.data.prepayment;

          // Előtöltés ha van adat
          if (p.parent_name) this.parentName.set(p.parent_name);
          if (p.parent_email) this.parentEmail.set(p.parent_email);
          if (p.parent_phone) this.parentPhone.set(p.parent_phone);

          // Alapértelmezett fizetési mód
          if (p.payment_methods.length === 1) {
            this.paymentMethod.set(p.payment_methods[0]);
          }

          // Állapot meghatározás
          if (p.is_paid) {
            this.state.set('already_paid');
          } else if (p.is_expired) {
            this.state.set('expired');
          } else if (p.mode === 'package') {
            this.state.set('package_select');
          } else {
            this.state.set('payable');
          }
        },
        error: (err) => {
          this.state.set('invalid');
          this.errorMessage.set(err.error?.message || 'Az előleg nem található vagy lejárt.');
        },
      });
  }
}
