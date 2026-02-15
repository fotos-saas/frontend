import { Component, inject, input, output, signal, ChangeDetectionStrategy, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent, PsTextareaComponent, PsCheckboxComponent, PsRadioGroupComponent, PsRadioOption } from '@shared/components/form';
import { ClientWebshopService, ShopConfig, CheckoutRequest } from '../../client-webshop.service';
import { cartItems, cartTotal } from '../../client-webshop.state';

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe, LucideAngularModule, DialogWrapperComponent, PsInputComponent, PsTextareaComponent, PsCheckboxComponent, PsRadioGroupComponent],
  templateUrl: './checkout-dialog.component.html',
  styleUrl: './checkout-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutDialogComponent {
  private webshopService = inject(ClientWebshopService);
  private destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  config = input.required<ShopConfig>();
  token = input.required<string>();
  close = output<void>();
  checkoutRedirect = output<string>();

  customerName = signal('');
  customerEmail = signal('');
  customerPhone = signal('');
  deliveryMethod = signal<'pickup' | 'shipping'>('pickup');
  shippingAddress = signal('');
  shippingNotes = signal('');
  customerNotes = signal('');
  acceptTerms = signal(false);
  submitting = signal(false);
  error = signal('');

  readonly cartItems = cartItems;
  readonly cartTotal = cartTotal;

  readonly deliveryOptions = computed<PsRadioOption[]>(() => {
    const cfg = this.config();
    const total = this.cartTotal();
    const isFreeShipping = cfg.shipping_free_threshold_huf && total >= cfg.shipping_free_threshold_huf;
    const shippingLabel = isFreeShipping ? 'Ingyenes szállítás' : `${cfg.shipping_cost_huf?.toLocaleString('hu-HU') ?? 0} Ft`;
    return [
      { value: 'pickup', label: 'Személyes átvétel', sublabel: 'Ingyenes' },
      { value: 'shipping', label: 'Házhozszállítás', sublabel: shippingLabel },
    ];
  });

  readonly shippingCost = computed(() => {
    const cfg = this.config();
    if (this.deliveryMethod() !== 'shipping') return 0;
    if (cfg.shipping_free_threshold_huf && this.cartTotal() >= cfg.shipping_free_threshold_huf) return 0;
    return cfg.shipping_cost_huf;
  });

  readonly grandTotal = computed(() => this.cartTotal() + this.shippingCost());

  submit(): void {
    if (!this.customerName() || !this.customerEmail()) {
      this.error.set('Kérjük töltsd ki a kötelező mezőket.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customerEmail())) {
      this.error.set('Kérjük adj meg egy érvényes email címet.');
      return;
    }

    if (this.deliveryMethod() === 'shipping' && !this.shippingAddress()) {
      this.error.set('Szállítási cím megadása kötelező.');
      return;
    }

    if (this.config().terms_text && !this.acceptTerms()) {
      this.error.set('Az ÁSZF elfogadása kötelező.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);

    const data: CheckoutRequest = {
      customer_name: this.customerName(),
      customer_email: this.customerEmail(),
      customer_phone: this.customerPhone() || undefined,
      delivery_method: this.deliveryMethod(),
      shipping_address: this.deliveryMethod() === 'shipping' ? this.shippingAddress() : undefined,
      shipping_notes: this.shippingNotes() || undefined,
      customer_notes: this.customerNotes() || undefined,
      items: this.cartItems().map(item => ({
        product_id: item.productId,
        media_id: item.mediaId,
        quantity: item.quantity,
      })),
    };

    this.webshopService.createCheckout(this.token(), data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.checkoutRedirect.emit(res.checkout_url);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Hiba történt a rendelés feldolgozásakor.');
        this.submitting.set(false);
      },
    });
  }
}
