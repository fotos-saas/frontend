# Photo Order (Webshop) - Angular Components

> Komponensek specifikációja Angular 19 + Signals alapon

---

## 1. Komponens Hierarchia

```
PhotoOrderModule
├── Pages (lazy loaded)
│   ├── GalleryPage
│   │   ├── GalleryHeaderComponent
│   │   ├── GalleryPhotoGridComponent
│   │   │   └── GalleryPhotoCardComponent
│   │   ├── QuickAddModalComponent
│   │   └── FloatingCartButtonComponent
│   │
│   ├── CartPage
│   │   ├── CartHeaderComponent
│   │   ├── CartItemListComponent
│   │   │   └── CartItemRowComponent
│   │   ├── CouponInputComponent
│   │   ├── OrderSummaryComponent
│   │   └── CartFooterComponent
│   │
│   ├── CheckoutPage
│   │   ├── CheckoutStepsComponent
│   │   ├── AuthStepComponent
│   │   ├── ShippingStepComponent
│   │   │   ├── ShippingMethodsComponent
│   │   │   └── PackagePointModalComponent
│   │   ├── PaymentStepComponent
│   │   └── CheckoutSummaryComponent
│   │
│   ├── SuccessPage
│   │   └── OrderConfirmationComponent
│   │
│   └── OrdersPage (history)
│       └── OrderListComponent
│
├── Shared Components
│   ├── CartBadgeComponent
│   ├── SizeSelectorComponent
│   ├── QuantityControlComponent
│   ├── PriceTagComponent
│   ├── PackageProgressComponent
│   ├── PromoBannerComponent
│   ├── TrustBadgesComponent
│   └── ExitIntentPopupComponent
│
└── Services
    ├── CartService (state management)
    ├── CartApiService (HTTP)
    ├── CheckoutService
    ├── PricingService
    └── CouponService
```

---

## 2. Services

### 2.1 CartService (State Management)

```typescript
// features/photo-order/services/cart.service.ts
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { CartApiService } from './cart-api.service';
import { PricingService } from './pricing.service';
import {
  Cart, CartItem, Photo, PrintSize, Package,
  PricingMode, PricingContext, CouponValidation
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly api = inject(CartApiService);
  private readonly pricing = inject(PricingService);
  private readonly router = inject(Router);

  // ═══════════════════════════════════════════════════════════════
  // STATE - Private writable signals
  // ═══════════════════════════════════════════════════════════════

  private _cart = signal<Cart | null>(null);
  private _items = signal<CartItem[]>([]);
  private _photos = signal<Map<number, Photo>>(new Map());
  private _printSizes = signal<PrintSize[]>([]);

  // Pricing context
  private _pricingMode = signal<PricingMode>('pricelist');
  private _package = signal<Package | null>(null);

  // Coupon
  private _couponCode = signal<string | null>(null);
  private _couponValidation = signal<CouponValidation | null>(null);

  // UI state
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _isCartOpen = signal(false);

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC READONLY SIGNALS
  // ═══════════════════════════════════════════════════════════════

  readonly cart = this._cart.asReadonly();
  readonly items = this._items.asReadonly();
  readonly printSizes = this._printSizes.asReadonly();
  readonly pricingMode = this._pricingMode.asReadonly();
  readonly package = this._package.asReadonly();
  readonly couponCode = this._couponCode.asReadonly();
  readonly couponValidation = this._couponValidation.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isCartOpen = this._isCartOpen.asReadonly();

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════════════════

  /** Total item count in cart */
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.qty, 0)
  );

  /** Total unique photos in cart */
  readonly uniquePhotoCount = computed(() =>
    new Set(this._items().map(item => item.photo_id)).size
  );

  /** Is cart empty? */
  readonly isEmpty = computed(() => this._items().length === 0);

  /** Cart items with photo data enriched */
  readonly enrichedItems = computed(() => {
    const photos = this._photos();
    const sizes = this._printSizes();

    return this._items().map(item => ({
      ...item,
      photo: photos.get(item.photo_id),
      printSize: sizes.find(s => s.id === item.print_size_id)
    }));
  });

  /** Package mode: progress info */
  readonly packageProgress = computed(() => {
    const pkg = this._package();
    if (!pkg || this._pricingMode() !== 'package') return null;

    const current = this.uniquePhotoCount();
    const max = pkg.max_photos;
    const remaining = Math.max(0, max - current);
    const percentage = Math.min(100, (current / max) * 100);

    return {
      current,
      max,
      remaining,
      percentage,
      isComplete: current >= max,
      isOverLimit: current > max
    };
  });

  /** Subtotal before discount */
  readonly subtotal = computed(() => {
    if (this._pricingMode() === 'package') {
      // Package mode: fixed price
      return this._package()?.price ?? 0;
    }

    // Pricelist mode: sum of item prices
    return this.enrichedItems().reduce((sum, item) => {
      const unitPrice = item.printSize?.price ?? 0;
      return sum + (unitPrice * item.qty);
    }, 0);
  });

  /** Discount amount from coupon */
  readonly discount = computed(() => {
    const validation = this._couponValidation();
    if (!validation?.valid) return 0;

    const subtotal = this.subtotal();

    if (validation.type === 'percentage') {
      return Math.round(subtotal * (validation.value / 100));
    } else {
      return Math.min(validation.value, subtotal);
    }
  });

  /** Final total */
  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this.discount())
  );

  /** Can proceed to checkout? */
  readonly canCheckout = computed(() => {
    if (this.isEmpty()) return false;

    // Package mode: must fill the package
    if (this._pricingMode() === 'package') {
      const progress = this.packageProgress();
      return progress?.isComplete ?? false;
    }

    return true;
  });

  /** Pricing context for display */
  readonly pricingContext = computed((): PricingContext => ({
    mode: this._pricingMode(),
    package: this._package(),
    subtotal: this.subtotal(),
    discount: this.discount(),
    total: this.total(),
    couponApplied: this._couponValidation()?.valid ?? false
  }));

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCTOR - LocalStorage sync
  // ═══════════════════════════════════════════════════════════════

  constructor() {
    // Load from localStorage on init
    this.loadFromStorage();

    // Persist to localStorage on changes
    effect(() => {
      const cart = this._cart();
      const items = this._items();
      if (cart) {
        localStorage.setItem('cart_data', JSON.stringify({ cart, items }));
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS - Public methods
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize cart for a work session
   */
  init(workSessionId: number): Observable<void> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.getOrCreateCart(workSessionId).pipe(
      tap({
        next: (response) => {
          this._cart.set(response.cart);
          this._items.set(response.items);
          this._printSizes.set(response.printSizes);
          this._pricingMode.set(response.pricingMode);
          this._package.set(response.package ?? null);

          // Build photo map
          const photoMap = new Map<number, Photo>();
          response.photos.forEach(p => photoMap.set(p.id, p));
          this._photos.set(photoMap);

          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Hiba a kosár betöltésekor');
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Add item to cart
   */
  addItem(photoId: number, printSizeId: number, qty: number = 1): Observable<CartItem> {
    const cart = this._cart();
    if (!cart) return of(null as any);

    this._isLoading.set(true);

    return this.api.addItem(cart.id, { photo_id: photoId, print_size_id: printSizeId, qty }).pipe(
      tap({
        next: (newItem) => {
          // Update local state
          this._items.update(items => {
            const existingIndex = items.findIndex(
              i => i.photo_id === photoId && i.print_size_id === printSizeId
            );

            if (existingIndex >= 0) {
              // Update existing item
              const updated = [...items];
              updated[existingIndex] = newItem;
              return updated;
            } else {
              // Add new item
              return [...items, newItem];
            }
          });

          this._isLoading.set(false);

          // Track analytics
          this.trackAddToCart(photoId, printSizeId, qty);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(itemId: number, qty: number): Observable<CartItem | null> {
    if (qty <= 0) {
      return this.removeItem(itemId);
    }

    this._isLoading.set(true);

    return this.api.updateItem(itemId, { qty }).pipe(
      tap({
        next: (updatedItem) => {
          this._items.update(items =>
            items.map(i => i.id === itemId ? updatedItem : i)
          );
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: number): Observable<null> {
    this._isLoading.set(true);

    return this.api.removeItem(itemId).pipe(
      tap({
        next: () => {
          this._items.update(items => items.filter(i => i.id !== itemId));
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Apply coupon code
   */
  applyCoupon(code: string): Observable<CouponValidation> {
    this._isLoading.set(true);

    return this.api.validateCoupon(code, this._cart()?.id ?? 0).pipe(
      tap({
        next: (validation) => {
          if (validation.valid) {
            this._couponCode.set(code);
            this._couponValidation.set(validation);
          } else {
            this._couponValidation.set(validation);
          }
          this._isLoading.set(false);
        },
        error: (err) => {
          this._couponValidation.set({
            valid: false,
            error: err.message || 'Érvénytelen kupon'
          });
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Remove applied coupon
   */
  removeCoupon(): void {
    this._couponCode.set(null);
    this._couponValidation.set(null);
  }

  /**
   * Open/close cart sidebar
   */
  toggleCart(): void {
    this._isCartOpen.update(v => !v);
  }

  openCart(): void {
    this._isCartOpen.set(true);
  }

  closeCart(): void {
    this._isCartOpen.set(false);
  }

  /**
   * Clear cart
   */
  clear(): Observable<void> {
    const cart = this._cart();
    if (!cart) return of(undefined);

    this._isLoading.set(true);

    return this.api.clearCart(cart.id).pipe(
      tap({
        next: () => {
          this._items.set([]);
          this._couponCode.set(null);
          this._couponValidation.set(null);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Get photo by ID (from cache)
   */
  getPhoto(photoId: number): Photo | undefined {
    return this._photos().get(photoId);
  }

  /**
   * Check if photo is in cart
   */
  isPhotoInCart(photoId: number): boolean {
    return this._items().some(i => i.photo_id === photoId);
  }

  /**
   * Get item count for specific photo
   */
  getPhotoItemCount(photoId: number): number {
    return this._items()
      .filter(i => i.photo_id === photoId)
      .reduce((sum, i) => sum + i.qty, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('cart_data');
      if (saved) {
        const { cart, items } = JSON.parse(saved);
        this._cart.set(cart);
        this._items.set(items);
      }
    } catch {
      // Ignore parse errors
    }
  }

  private trackAddToCart(photoId: number, printSizeId: number, qty: number): void {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'add_to_cart', {
        currency: 'HUF',
        items: [{
          item_id: `photo_${photoId}`,
          quantity: qty
        }]
      });
    }
  }
}

// Type guard for gtag
declare const gtag: (
  command: string,
  action: string,
  params?: Record<string, any>
) => void;
```

---

### 2.2 CartApiService (HTTP)

```typescript
// features/photo-order/services/cart-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Cart, CartItem, Photo, PrintSize, Package,
  PricingMode, CouponValidation
} from '../models';

interface CartResponse {
  cart: Cart;
  items: CartItem[];
  photos: Photo[];
  printSizes: PrintSize[];
  pricingMode: PricingMode;
  package?: Package;
}

@Injectable({
  providedIn: 'root'
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  /**
   * Get or create cart for work session
   */
  getOrCreateCart(workSessionId: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/init`, {
      work_session_id: workSessionId
    });
  }

  /**
   * Add item to cart
   */
  addItem(cartId: number, data: {
    photo_id: number;
    print_size_id: number;
    qty: number;
  }): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.baseUrl}/${cartId}/items`, data);
  }

  /**
   * Update cart item
   */
  updateItem(itemId: number, data: { qty: number }): Observable<CartItem> {
    return this.http.patch<CartItem>(`${this.baseUrl}/items/${itemId}`, data);
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: number): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/items/${itemId}`);
  }

  /**
   * Validate coupon code
   */
  validateCoupon(code: string, cartId: number): Observable<CouponValidation> {
    return this.http.post<CouponValidation>(`${this.baseUrl}/${cartId}/coupon/validate`, {
      code
    });
  }

  /**
   * Apply coupon to cart
   */
  applyCoupon(cartId: number, code: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${cartId}/coupon`, { code });
  }

  /**
   * Remove coupon from cart
   */
  removeCoupon(cartId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cartId}/coupon`);
  }

  /**
   * Clear all items from cart
   */
  clearCart(cartId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cartId}/items`);
  }

  /**
   * Get cart summary for checkout
   */
  getCartSummary(cartId: number): Observable<{
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  }> {
    return this.http.get<any>(`${this.baseUrl}/${cartId}/summary`);
  }
}
```

---

### 2.3 CheckoutService

```typescript
// features/photo-order/services/checkout.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CartService } from './cart.service';
import {
  CheckoutStep, ShippingMethod, PaymentMethod,
  ShippingAddress, Order, PackagePoint
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/checkout`;

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════

  private _currentStep = signal<CheckoutStep>('auth');
  private _shippingMethods = signal<ShippingMethod[]>([]);
  private _paymentMethods = signal<PaymentMethod[]>([]);
  private _selectedShipping = signal<ShippingMethod | null>(null);
  private _selectedPayment = signal<PaymentMethod | null>(null);
  private _shippingAddress = signal<ShippingAddress | null>(null);
  private _selectedPackagePoint = signal<PackagePoint | null>(null);
  private _isProcessing = signal(false);
  private _error = signal<string | null>(null);

  // User auth state
  private _isGuest = signal(true);
  private _guestEmail = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC SIGNALS
  // ═══════════════════════════════════════════════════════════════

  readonly currentStep = this._currentStep.asReadonly();
  readonly shippingMethods = this._shippingMethods.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly selectedShipping = this._selectedShipping.asReadonly();
  readonly selectedPayment = this._selectedPayment.asReadonly();
  readonly shippingAddress = this._shippingAddress.asReadonly();
  readonly selectedPackagePoint = this._selectedPackagePoint.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isGuest = this._isGuest.asReadonly();

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════

  /** Steps for progress indicator */
  readonly steps = computed(() => {
    const current = this._currentStep();
    const order: CheckoutStep[] = ['auth', 'shipping', 'payment', 'review'];

    return order.map((step, index) => ({
      id: step,
      label: this.getStepLabel(step),
      status: this.getStepStatus(step, current, order)
    }));
  });

  /** Shipping cost */
  readonly shippingCost = computed(() => {
    const method = this._selectedShipping();
    if (!method) return 0;

    // COD fee
    const paymentMethod = this._selectedPayment();
    const codFee = paymentMethod?.type === 'cod' ? (paymentMethod.fee ?? 0) : 0;

    return method.price + codFee;
  });

  /** Final order total */
  readonly orderTotal = computed(() =>
    this.cart.total() + this.shippingCost()
  );

  /** Can proceed to next step? */
  readonly canProceed = computed(() => {
    const step = this._currentStep();

    switch (step) {
      case 'auth':
        return !this._isGuest() || !!this._guestEmail();
      case 'shipping':
        return !!this._selectedShipping() && this.hasValidAddress();
      case 'payment':
        return !!this._selectedPayment();
      case 'review':
        return true;
      default:
        return false;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize checkout
   */
  init(): Observable<void> {
    return this.http.get<{
      shippingMethods: ShippingMethod[];
      paymentMethods: PaymentMethod[];
    }>(`${this.baseUrl}/options`).pipe(
      tap(response => {
        this._shippingMethods.set(response.shippingMethods);
        this._paymentMethods.set(response.paymentMethods);
      })
    );
  }

  /**
   * Continue as guest
   */
  continueAsGuest(email: string): void {
    this._isGuest.set(true);
    this._guestEmail.set(email);
    this.goToStep('shipping');
  }

  /**
   * Select shipping method
   */
  selectShipping(method: ShippingMethod): void {
    this._selectedShipping.set(method);

    // Clear package point if not foxpost
    if (method.type !== 'foxpost') {
      this._selectedPackagePoint.set(null);
    }
  }

  /**
   * Select package point (Foxpost)
   */
  selectPackagePoint(point: PackagePoint): void {
    this._selectedPackagePoint.set(point);
  }

  /**
   * Set shipping address
   */
  setShippingAddress(address: ShippingAddress): void {
    this._shippingAddress.set(address);
  }

  /**
   * Select payment method
   */
  selectPayment(method: PaymentMethod): void {
    this._selectedPayment.set(method);
  }

  /**
   * Navigate to step
   */
  goToStep(step: CheckoutStep): void {
    this._currentStep.set(step);
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    const order: CheckoutStep[] = ['auth', 'shipping', 'payment', 'review'];
    const currentIndex = order.indexOf(this._currentStep());
    if (currentIndex < order.length - 1) {
      this._currentStep.set(order[currentIndex + 1]);
    }
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    const order: CheckoutStep[] = ['auth', 'shipping', 'payment', 'review'];
    const currentIndex = order.indexOf(this._currentStep());
    if (currentIndex > 0) {
      this._currentStep.set(order[currentIndex - 1]);
    }
  }

  /**
   * Place order
   */
  placeOrder(): Observable<Order> {
    this._isProcessing.set(true);
    this._error.set(null);

    const orderData = {
      cart_id: this.cart.cart()?.id,
      guest_email: this._isGuest() ? this._guestEmail() : null,
      shipping_method_id: this._selectedShipping()?.id,
      payment_method_id: this._selectedPayment()?.id,
      shipping_address: this._shippingAddress(),
      package_point_id: this._selectedPackagePoint()?.id,
      coupon_code: this.cart.couponCode()
    };

    return this.http.post<Order>(`${this.baseUrl}/place-order`, orderData).pipe(
      tap({
        next: (order) => {
          this._isProcessing.set(false);

          // Handle payment redirect if needed
          if (order.payment_url) {
            window.location.href = order.payment_url;
          } else {
            // COD or free - go to success
            this.router.navigate(['/checkout/success'], {
              queryParams: { orderId: order.id }
            });
          }
        },
        error: (err) => {
          this._error.set(err.message || 'Hiba a rendelés leadásakor');
          this._isProcessing.set(false);
        }
      })
    );
  }

  /**
   * Reset checkout state
   */
  reset(): void {
    this._currentStep.set('auth');
    this._selectedShipping.set(null);
    this._selectedPayment.set(null);
    this._shippingAddress.set(null);
    this._selectedPackagePoint.set(null);
    this._isGuest.set(true);
    this._guestEmail.set(null);
    this._error.set(null);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private getStepLabel(step: CheckoutStep): string {
    const labels: Record<CheckoutStep, string> = {
      'auth': 'belépés',
      'shipping': 'szállítás',
      'payment': 'fizetés',
      'review': 'áttekintés'
    };
    return labels[step];
  }

  private getStepStatus(
    step: CheckoutStep,
    current: CheckoutStep,
    order: CheckoutStep[]
  ): 'completed' | 'current' | 'pending' {
    const stepIndex = order.indexOf(step);
    const currentIndex = order.indexOf(current);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  private hasValidAddress(): boolean {
    const shipping = this._selectedShipping();
    if (!shipping) return false;

    // Foxpost: needs package point
    if (shipping.type === 'foxpost') {
      return !!this._selectedPackagePoint();
    }

    // Pickup: no address needed
    if (shipping.type === 'pickup') {
      return true;
    }

    // Home delivery: needs full address
    const addr = this._shippingAddress();
    return !!(addr?.name && addr?.zip && addr?.city && addr?.address);
  }
}
```

---

## 3. Models

```typescript
// features/photo-order/models/index.ts

export interface Cart {
  id: number;
  user_id: number | null;
  work_session_id: number;
  package_id: number | null;
  coupon_id: number | null;
  coupon_discount: number;
  status: 'active' | 'abandoned' | 'converted';
  session_token: string;
  expires_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  photo_id: number;
  print_size_id: number;
  qty: number;
  type: 'print' | 'digital';
}

export interface EnrichedCartItem extends CartItem {
  photo?: Photo;
  printSize?: PrintSize;
}

export interface Photo {
  id: number;
  album_id: number;
  filename: string;
  thumbnail_url: string;
  preview_url: string;
  full_url: string;
}

export interface PrintSize {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
  price: number;
  weight_grams: number;
}

export interface Package {
  id: number;
  name: string;
  price: number;
  max_photos: number;
  description: string;
}

export type PricingMode = 'package' | 'pricelist';

export interface PricingContext {
  mode: PricingMode;
  package: Package | null;
  subtotal: number;
  discount: number;
  total: number;
  couponApplied: boolean;
}

export interface CouponValidation {
  valid: boolean;
  type?: 'percentage' | 'fixed';
  value?: number;
  error?: string;
  message?: string;
}

export type CheckoutStep = 'auth' | 'shipping' | 'payment' | 'review';

export interface ShippingMethod {
  id: number;
  name: string;
  type: 'home' | 'foxpost' | 'pickup';
  price: number;
  delivery_days: string;
  description?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'card' | 'transfer' | 'cod';
  fee?: number;
  description?: string;
}

export interface ShippingAddress {
  name: string;
  phone?: string;
  zip: string;
  city: string;
  address: string;
  note?: string;
}

export interface PackagePoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  total: number;
  payment_url?: string;
  created_at: string;
}
```

---

## 4. Shared Components

### 4.1 CartBadgeComponent

```typescript
// features/photo-order/components/cart-badge/cart-badge.component.ts
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (count() > 0) {
      <span
        class="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5
               bg-red-500 text-white text-xs font-bold
               rounded-full flex items-center justify-center
               animate-badge-pop"
        [class.scale-0]="!visible()"
        [class.scale-100]="visible()"
      >
        {{ displayCount() }}
      </span>
    }
  `,
  styles: [`
    @keyframes badge-pop {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }

    .animate-badge-pop {
      animation: badge-pop 0.2s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBadgeComponent {
  readonly count = input.required<number>();
  readonly visible = input<boolean>(true);

  readonly displayCount = computed(() => {
    const c = this.count();
    return c > 99 ? '99+' : c.toString();
  });
}
```

---

### 4.2 SizeSelectorComponent

```typescript
// features/photo-order/components/size-selector/size-selector.component.ts
import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintSize } from '../../models';

@Component({
  selector: 'app-size-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Trigger button -->
      <button
        type="button"
        class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
               flex items-center justify-between
               hover:border-gray-300 transition-colors
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        (click)="toggleDropdown()"
      >
        <span class="text-sm">
          @if (selected()) {
            {{ selected()!.name }} - {{ selected()!.width_mm }}×{{ selected()!.height_mm }}mm
          } @else {
            válassz méretet
          }
        </span>
        <span class="text-gray-400 transition-transform duration-200"
              [class.rotate-180]="isOpen()">
          ▼
        </span>
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div
          class="absolute top-full left-0 right-0 mt-1 z-20
                 bg-white border border-gray-200 rounded-xl shadow-lg
                 max-h-60 overflow-y-auto animate-dropdown"
        >
          @for (size of sizes(); track size.id) {
            <button
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-gray-50
                     flex items-center justify-between
                     border-b border-gray-100 last:border-b-0
                     transition-colors"
              [class.bg-blue-50]="selected()?.id === size.id"
              (click)="selectSize(size)"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ size.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ size.width_mm }} × {{ size.height_mm }} mm
                </p>
              </div>
              <span class="text-sm font-medium text-gray-700">
                {{ size.price | number:'1.0-0' }} Ft
              </span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes dropdown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-dropdown {
      animation: dropdown 0.15s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SizeSelectorComponent {
  readonly sizes = input.required<PrintSize[]>();
  readonly selected = input<PrintSize | null>(null);

  readonly sizeChange = output<PrintSize>();

  protected readonly isOpen = signal(false);

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectSize(size: PrintSize): void {
    this.sizeChange.emit(size);
    this.isOpen.set(false);
  }
}
```

---

### 4.3 QuantityControlComponent

```typescript
// features/photo-order/components/quantity-control/quantity-control.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quantity-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1 bg-gray-100 rounded-full p-1">
      <!-- Decrease button -->
      <button
        type="button"
        class="w-8 h-8 rounded-full bg-white shadow-sm
               flex items-center justify-center
               hover:bg-gray-50 active:scale-95
               transition-all duration-100
               disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="value() <= min()"
        (click)="decrease()"
        aria-label="Csökkentés"
      >
        <span class="text-gray-600 font-medium">−</span>
      </button>

      <!-- Value display -->
      <span
        class="w-8 text-center text-sm font-medium text-gray-900 tabular-nums"
      >
        {{ value() }}
      </span>

      <!-- Increase button -->
      <button
        type="button"
        class="w-8 h-8 rounded-full bg-white shadow-sm
               flex items-center justify-center
               hover:bg-gray-50 active:scale-95
               transition-all duration-100
               disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="max() !== null && value() >= max()!"
        (click)="increase()"
        aria-label="Növelés"
      >
        <span class="text-gray-600 font-medium">+</span>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityControlComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(1);
  readonly max = input<number | null>(null);

  readonly valueChange = output<number>();

  decrease(): void {
    const current = this.value();
    if (current > this.min()) {
      this.valueChange.emit(current - 1);
    }
  }

  increase(): void {
    const current = this.value();
    const maximum = this.max();
    if (maximum === null || current < maximum) {
      this.valueChange.emit(current + 1);
    }
  }
}
```

---

### 4.4 PriceTagComponent

```typescript
// features/photo-order/components/price-tag/price-tag.component.ts
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-baseline gap-0.5"
      [class.text-gray-900]="!strikethrough()"
      [class.text-gray-400]="strikethrough()"
      [class.line-through]="strikethrough()"
    >
      @if (showCurrency() && currencyPosition() === 'before') {
        <span class="text-[0.75em]">{{ currency() }}</span>
      }

      <span class="font-semibold tabular-nums">
        {{ formattedPrice() }}
      </span>

      @if (showCurrency() && currencyPosition() === 'after') {
        <span class="text-[0.75em] ml-0.5">{{ currency() }}</span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceTagComponent {
  readonly price = input.required<number>();
  readonly currency = input<string>('Ft');
  readonly showCurrency = input<boolean>(true);
  readonly currencyPosition = input<'before' | 'after'>('after');
  readonly strikethrough = input<boolean>(false);

  readonly formattedPrice = computed(() => {
    const p = this.price();
    return p.toLocaleString('hu-HU');
  });
}
```

---

### 4.5 PackageProgressComponent

```typescript
// features/photo-order/components/package-progress/package-progress.component.ts
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PackageProgress {
  current: number;
  max: number;
  remaining: number;
  percentage: number;
  isComplete: boolean;
  isOverLimit: boolean;
}

@Component({
  selector: 'app-package-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">📦</span>
          <span class="text-sm font-medium text-gray-700">csomagod</span>
        </div>
        <span
          class="text-sm font-semibold"
          [class.text-green-600]="progress().isComplete"
          [class.text-purple-600]="!progress().isComplete"
        >
          {{ progress().current }} / {{ progress().max }} kép
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          [class.bg-green-500]="progress().isComplete"
          [class.bg-purple-500]="!progress().isComplete"
          [style.width.%]="progress().percentage"
        ></div>
      </div>

      <!-- Status message -->
      <p class="mt-2 text-xs">
        @if (progress().isComplete) {
          <span class="text-green-600">✓ a csomagod tele van!</span>
        } @else {
          <span class="text-purple-600">
            még {{ progress().remaining }} képet választhatsz
          </span>
        }
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackageProgressComponent {
  readonly progress = input.required<PackageProgress>();
}
```

---

### 4.6 CouponInputComponent

```typescript
// features/photo-order/components/coupon-input/coupon-input.component.ts
import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponValidation } from '../../models';

@Component({
  selector: 'app-coupon-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-2">
      <!-- Input row -->
      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            type="text"
            [(ngModel)]="code"
            [disabled]="isApplied()"
            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                   text-sm uppercase tracking-wider
                   placeholder:normal-case placeholder:tracking-normal
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                   disabled:bg-green-50 disabled:border-green-200"
            placeholder="kuponkód"
            (keyup.enter)="onApply()"
          />

          @if (isApplied()) {
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
              ✓
            </span>
          }
        </div>

        @if (!isApplied()) {
          <button
            type="button"
            class="px-4 py-2.5 bg-gray-900 text-white rounded-xl
                   text-sm font-medium
                   hover:bg-gray-800 active:scale-95
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-all"
            [disabled]="!code.trim() || isLoading()"
            (click)="onApply()"
          >
            @if (isLoading()) {
              <span class="inline-flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white
                             rounded-full animate-spin"></span>
              </span>
            } @else {
              alkalmaz
            }
          </button>
        } @else {
          <button
            type="button"
            class="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl
                   text-sm hover:bg-gray-200 transition-colors"
            (click)="onRemove()"
          >
            törlés
          </button>
        }
      </div>

      <!-- Validation message -->
      @if (validation()) {
        <div
          class="text-xs px-1"
          [class.text-green-600]="validation()!.valid"
          [class.text-red-500]="!validation()!.valid"
        >
          @if (validation()!.valid) {
            🎉 {{ validation()!.message || 'kupon alkalmazva!' }}
          } @else {
            ❌ {{ validation()!.error || 'érvénytelen kupon' }}
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouponInputComponent {
  readonly appliedCode = input<string | null>(null);
  readonly validation = input<CouponValidation | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly apply = output<string>();
  readonly remove = output<void>();

  protected code = '';

  readonly isApplied = () => !!this.appliedCode() && this.validation()?.valid;

  onApply(): void {
    const trimmed = this.code.trim().toUpperCase();
    if (trimmed) {
      this.apply.emit(trimmed);
    }
  }

  onRemove(): void {
    this.code = '';
    this.remove.emit();
  }
}
```

---

### 4.7 OrderSummaryComponent

```typescript
// features/photo-order/components/order-summary/order-summary.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceTagComponent } from '../price-tag/price-tag.component';
import { PricingContext } from '../../models';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, PriceTagComponent],
  template: `
    <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <h3 class="text-sm font-medium text-gray-900">összesítés</h3>

      <!-- Line items -->
      <div class="space-y-2 text-sm">
        <!-- Subtotal -->
        <div class="flex justify-between">
          <span class="text-gray-600">részösszeg</span>
          <app-price-tag [price]="pricing().subtotal" />
        </div>

        <!-- Package info (if applicable) -->
        @if (pricing().mode === 'package' && pricing().package) {
          <div class="flex justify-between text-purple-600">
            <span>📦 {{ pricing().package!.name }}</span>
            <span class="text-xs">(max {{ pricing().package!.max_photos }} kép)</span>
          </div>
        }

        <!-- Discount -->
        @if (pricing().discount > 0) {
          <div class="flex justify-between text-green-600">
            <span>🎉 kedvezmény</span>
            <span>-<app-price-tag [price]="pricing().discount" /></span>
          </div>
        }

        <!-- Shipping (if provided) -->
        @if (shippingCost() !== null) {
          <div class="flex justify-between">
            <span class="text-gray-600">szállítás</span>
            @if (shippingCost() === 0) {
              <span class="text-green-600 font-medium">ingyenes</span>
            } @else {
              <app-price-tag [price]="shippingCost()!" />
            }
          </div>
        }
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-200"></div>

      <!-- Total -->
      <div class="flex justify-between items-center">
        <span class="font-medium text-gray-900">összesen</span>
        <span class="text-xl font-bold text-gray-900">
          <app-price-tag [price]="totalWithShipping()" />
        </span>
      </div>

      <!-- Trust badges -->
      @if (showTrustBadges()) {
        <div class="pt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>🔒 biztonságos fizetés</span>
          <span>📦 gyors szállítás</span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly pricing = input.required<PricingContext>();
  readonly shippingCost = input<number | null>(null);
  readonly showTrustBadges = input<boolean>(false);

  totalWithShipping(): number {
    const base = this.pricing().total;
    const shipping = this.shippingCost();
    return shipping !== null ? base + shipping : base;
  }
}
```

---

### 4.8 FloatingCartButtonComponent

```typescript
// features/photo-order/components/floating-cart-button/floating-cart-button.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartBadgeComponent } from '../cart-badge/cart-badge.component';

@Component({
  selector: 'app-floating-cart-button',
  standalone: true,
  imports: [CommonModule, CartBadgeComponent],
  template: `
    <button
      type="button"
      class="fixed bottom-6 right-6 z-40
             w-14 h-14 rounded-full
             bg-blue-600 text-white shadow-lg
             flex items-center justify-center
             hover:bg-blue-700 hover:scale-105
             active:scale-95
             transition-all duration-150"
      [class.animate-bounce-subtle]="itemCount() > 0 && !wasClicked()"
      (click)="onClick()"
      aria-label="Kosár megnyitása"
    >
      <span class="text-2xl">🛒</span>
      <app-cart-badge [count]="itemCount()" />
    </button>
  `,
  styles: [`
    @keyframes bounce-subtle {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }

    .animate-bounce-subtle {
      animation: bounce-subtle 2s ease-in-out infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingCartButtonComponent {
  readonly itemCount = input.required<number>();
  readonly wasClicked = input<boolean>(false);

  readonly click = output<void>();

  onClick(): void {
    this.click.emit();
  }
}
```

---

### 4.9 CartItemRowComponent

```typescript
// features/photo-order/components/cart-item-row/cart-item-row.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrichedCartItem } from '../../models';
import { QuantityControlComponent } from '../quantity-control/quantity-control.component';
import { PriceTagComponent } from '../price-tag/price-tag.component';

@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  imports: [CommonModule, QuantityControlComponent, PriceTagComponent],
  template: `
    <div class="flex gap-3 py-3">
      <!-- Photo thumbnail -->
      <div class="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        @if (item().photo) {
          <img
            [src]="item().photo!.thumbnail_url"
            [alt]="'Fotó'"
            class="w-full h-full object-cover"
          />
        }
      </div>

      <!-- Details -->
      <div class="flex-1 min-w-0">
        <!-- Size -->
        <p class="text-sm font-medium text-gray-900 truncate">
          @if (item().printSize) {
            {{ item().printSize!.name }}
          } @else {
            Digitális
          }
        </p>

        <!-- Dimensions -->
        @if (item().printSize) {
          <p class="text-xs text-gray-500">
            {{ item().printSize!.width_mm }} × {{ item().printSize!.height_mm }} mm
          </p>
        }

        <!-- Price per unit -->
        <p class="text-xs text-gray-500 mt-1">
          <app-price-tag [price]="unitPrice()" /> / db
        </p>
      </div>

      <!-- Right side: quantity + total + remove -->
      <div class="flex flex-col items-end justify-between">
        <!-- Remove button -->
        <button
          type="button"
          class="text-gray-400 hover:text-red-500 transition-colors p-1"
          (click)="onRemove()"
          aria-label="Eltávolítás"
        >
          <span class="text-sm">✕</span>
        </button>

        <!-- Quantity control -->
        <app-quantity-control
          [value]="item().qty"
          [min]="1"
          [max]="99"
          (valueChange)="onQuantityChange($event)"
        />

        <!-- Line total -->
        <span class="text-sm font-semibold text-gray-900 mt-1">
          <app-price-tag [price]="lineTotal()" />
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemRowComponent {
  readonly item = input.required<EnrichedCartItem>();

  readonly quantityChange = output<{ itemId: number; qty: number }>();
  readonly remove = output<number>();

  unitPrice(): number {
    return this.item().printSize?.price ?? 0;
  }

  lineTotal(): number {
    return this.unitPrice() * this.item().qty;
  }

  onQuantityChange(qty: number): void {
    this.quantityChange.emit({ itemId: this.item().id, qty });
  }

  onRemove(): void {
    this.remove.emit(this.item().id);
  }
}
```

---

### 4.10 QuickAddModalComponent

```typescript
// features/photo-order/components/quick-add-modal/quick-add-modal.component.ts
import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo, PrintSize } from '../../models';
import { SizeSelectorComponent } from '../size-selector/size-selector.component';
import { QuantityControlComponent } from '../quantity-control/quantity-control.component';
import { PriceTagComponent } from '../price-tag/price-tag.component';

export interface AddToCartEvent {
  photoId: number;
  printSizeId: number;
  qty: number;
}

@Component({
  selector: 'app-quick-add-modal',
  standalone: true,
  imports: [
    CommonModule,
    SizeSelectorComponent,
    QuantityControlComponent,
    PriceTagComponent
  ],
  template: `
    @if (isOpen() && photo()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        (click)="onBackdropClick($event)"
      >
        <!-- Modal -->
        <div
          class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                 max-h-[90vh] overflow-y-auto
                 animate-slide-up sm:animate-scale-in"
        >
          <!-- Photo preview -->
          <div class="aspect-[4/5] bg-gray-100">
            <img
              [src]="photo()!.preview_url"
              alt="Fotó"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Options -->
          <div class="p-5 space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">
              fénykép hozzáadása
            </h3>

            <!-- Size selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                méret
              </label>
              <app-size-selector
                [sizes]="printSizes()"
                [selected]="selectedSize()"
                (sizeChange)="onSizeChange($event)"
              />
            </div>

            <!-- Quantity -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">
                darabszám
              </label>
              <app-quantity-control
                [value]="quantity()"
                [min]="1"
                [max]="99"
                (valueChange)="quantity.set($event)"
              />
            </div>

            <!-- Total -->
            <div class="flex items-center justify-between py-3 border-t border-gray-100">
              <span class="text-sm text-gray-600">összesen:</span>
              <span class="text-xl font-bold text-gray-900">
                <app-price-tag [price]="totalPrice()" />
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700
                       hover:bg-gray-200 font-medium transition-colors"
                (click)="close.emit()"
              >
                mégse
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white
                       hover:bg-blue-700 font-medium transition-colors
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
                [disabled]="!canAdd()"
                (click)="onAdd()"
              >
                🛒 kosárba
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes scale-in {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.2s ease-out;
    }

    .animate-scale-in {
      animation: scale-in 0.15s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAddModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly photo = input<Photo | null>(null);
  readonly printSizes = input.required<PrintSize[]>();

  readonly close = output<void>();
  readonly add = output<AddToCartEvent>();

  protected readonly selectedSize = signal<PrintSize | null>(null);
  protected readonly quantity = signal(1);

  readonly canAdd = computed(() => !!this.selectedSize());

  readonly totalPrice = computed(() => {
    const size = this.selectedSize();
    const qty = this.quantity();
    return size ? size.price * qty : 0;
  });

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSizeChange(size: PrintSize): void {
    this.selectedSize.set(size);
  }

  onAdd(): void {
    const size = this.selectedSize();
    const photo = this.photo();
    if (!size || !photo) return;

    this.add.emit({
      photoId: photo.id,
      printSizeId: size.id,
      qty: this.quantity()
    });

    // Reset state
    this.selectedSize.set(null);
    this.quantity.set(1);
    this.close.emit();
  }
}
```

---

## 5. Pages

### 5.1 GalleryPage

```typescript
// features/photo-order/pages/gallery/gallery.page.ts
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Photo } from '../../models';
import { GalleryPhotoCardComponent } from '../../components/gallery-photo-card/gallery-photo-card.component';
import { QuickAddModalComponent, AddToCartEvent } from '../../components/quick-add-modal/quick-add-modal.component';
import { FloatingCartButtonComponent } from '../../components/floating-cart-button/floating-cart-button.component';
import { PackageProgressComponent } from '../../components/package-progress/package-progress.component';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [
    CommonModule,
    GalleryPhotoCardComponent,
    QuickAddModalComponent,
    FloatingCartButtonComponent,
    PackageProgressComponent
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
      <h1 class="text-lg font-semibold text-gray-900 lowercase">galéria</h1>
      <p class="text-sm text-gray-500">válassz képeket a rendeléshez</p>
    </header>

    <!-- Package progress (if in package mode) -->
    @if (cart.packageProgress(); as progress) {
      <div class="px-4 py-3">
        <app-package-progress [progress]="progress" />
      </div>
    }

    <!-- Photo grid -->
    <div class="p-4 pb-24">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        @for (photo of photos(); track photo.id) {
          <app-gallery-photo-card
            [photo]="photo"
            [isInCart]="cart.isPhotoInCart(photo.id)"
            [itemCount]="cart.getPhotoItemCount(photo.id)"
            (select)="openQuickAdd(photo)"
          />
        }
      </div>
    </div>

    <!-- Quick add modal -->
    <app-quick-add-modal
      [isOpen]="isQuickAddOpen()"
      [photo]="selectedPhoto()"
      [printSizes]="cart.printSizes()"
      (close)="closeQuickAdd()"
      (add)="onAddToCart($event)"
    />

    <!-- Floating cart button -->
    <app-floating-cart-button
      [itemCount]="cart.itemCount()"
      (click)="goToCart()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPage {
  protected readonly cart = inject(CartService);

  // Mock photos - replace with real data
  protected readonly photos = signal<Photo[]>([]);

  protected readonly isQuickAddOpen = signal(false);
  protected readonly selectedPhoto = signal<Photo | null>(null);

  openQuickAdd(photo: Photo): void {
    this.selectedPhoto.set(photo);
    this.isQuickAddOpen.set(true);
  }

  closeQuickAdd(): void {
    this.isQuickAddOpen.set(false);
    this.selectedPhoto.set(null);
  }

  onAddToCart(event: AddToCartEvent): void {
    this.cart.addItem(event.photoId, event.printSizeId, event.qty).subscribe();
  }

  goToCart(): void {
    // Navigate to cart
  }
}
```

---

### 5.2 CartPage

```typescript
// features/photo-order/pages/cart/cart.page.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItemRowComponent } from '../../components/cart-item-row/cart-item-row.component';
import { CouponInputComponent } from '../../components/coupon-input/coupon-input.component';
import { OrderSummaryComponent } from '../../components/order-summary/order-summary.component';
import { PackageProgressComponent } from '../../components/package-progress/package-progress.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CartItemRowComponent,
    CouponInputComponent,
    OrderSummaryComponent,
    PackageProgressComponent
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-gray-900 lowercase">🛒 kosár</h1>
          <p class="text-sm text-gray-500">
            {{ cart.itemCount() }} tétel a kosaradban
          </p>
        </div>
        @if (!cart.isEmpty()) {
          <button
            type="button"
            class="text-sm text-red-500 hover:text-red-600"
            (click)="onClearCart()"
          >
            kiürítés
          </button>
        }
      </div>
    </header>

    <div class="p-4 pb-32">
      @if (cart.isEmpty()) {
        <!-- Empty state -->
        <div class="text-center py-16">
          <span class="text-6xl mb-4 block">🛒</span>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">üres a kosarad</h2>
          <p class="text-gray-500 mb-6">adj hozzá képeket a galériából!</p>
          <a
            routerLink="/gallery"
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl
                   font-medium hover:bg-blue-700 transition-colors"
          >
            vissza a galériához
          </a>
        </div>
      } @else {
        <div class="space-y-6">
          <!-- Package progress (if applicable) -->
          @if (cart.packageProgress(); as progress) {
            <app-package-progress [progress]="progress" />
          }

          <!-- Cart items -->
          <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            @for (item of cart.enrichedItems(); track item.id) {
              <div class="px-4">
                <app-cart-item-row
                  [item]="item"
                  (quantityChange)="onQuantityChange($event)"
                  (remove)="onRemoveItem($event)"
                />
              </div>
            }
          </div>

          <!-- Coupon input -->
          <app-coupon-input
            [appliedCode]="cart.couponCode()"
            [validation]="cart.couponValidation()"
            [isLoading]="cart.isLoading()"
            (apply)="onApplyCoupon($event)"
            (remove)="onRemoveCoupon()"
          />

          <!-- Order summary -->
          <app-order-summary
            [pricing]="cart.pricingContext()"
            [showTrustBadges]="true"
          />
        </div>
      }
    </div>

    <!-- Sticky footer -->
    @if (!cart.isEmpty()) {
      <footer
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
               px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]
               shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      >
        <a
          routerLink="/checkout"
          class="block w-full py-3.5 bg-blue-600 text-white rounded-xl
                 text-center font-medium
                 hover:bg-blue-700 transition-colors"
          [class.opacity-50]="!cart.canCheckout()"
          [class.pointer-events-none]="!cart.canCheckout()"
        >
          tovább a pénztárhoz →
        </a>
      </footer>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly cart = inject(CartService);

  onQuantityChange(event: { itemId: number; qty: number }): void {
    this.cart.updateQuantity(event.itemId, event.qty).subscribe();
  }

  onRemoveItem(itemId: number): void {
    this.cart.removeItem(itemId).subscribe();
  }

  onApplyCoupon(code: string): void {
    this.cart.applyCoupon(code).subscribe();
  }

  onRemoveCoupon(): void {
    this.cart.removeCoupon();
  }

  onClearCart(): void {
    if (confirm('Biztosan kiüríted a kosarad?')) {
      this.cart.clear().subscribe();
    }
  }
}
```

---

### 5.3 CheckoutPage (Shipping Step)

```typescript
// features/photo-order/pages/checkout/checkout.page.ts
import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CheckoutService } from '../../services/checkout.service';
import { CartService } from '../../services/cart.service';
import { CheckoutStepsComponent } from '../../components/checkout-steps/checkout-steps.component';
import { ShippingMethodsComponent } from '../../components/shipping-methods/shipping-methods.component';
import { PaymentMethodsComponent } from '../../components/payment-methods/payment-methods.component';
import { OrderSummaryComponent } from '../../components/order-summary/order-summary.component';
import { ShippingMethod, PaymentMethod } from '../../models';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CheckoutStepsComponent,
    ShippingMethodsComponent,
    PaymentMethodsComponent,
    OrderSummaryComponent
  ],
  template: `
    <!-- Progress steps -->
    <app-checkout-steps [steps]="checkout.steps()" />

    <div class="p-4 pb-32">
      <div class="max-w-2xl mx-auto">
        <!-- Auth step -->
        @if (checkout.currentStep() === 'auth') {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">👤 bejelentkezés</h2>

            <!-- Guest email -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5">
              <p class="text-sm text-gray-600 mb-4">
                adj meg egy e-mail címet a rendelés nyomon követéséhez
              </p>
              <input
                type="email"
                [(ngModel)]="guestEmail"
                class="w-full px-4 py-3 rounded-xl border border-gray-200
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       outline-none"
                placeholder="pelda@email.hu"
              />
            </div>

            <!-- Continue button -->
            <button
              type="button"
              class="w-full py-3.5 bg-blue-600 text-white rounded-xl
                     font-medium hover:bg-blue-700 transition-colors
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
              [disabled]="!guestEmail.trim()"
              (click)="continueAsGuest()"
            >
              tovább vendégként
            </button>
          </div>
        }

        <!-- Shipping step -->
        @if (checkout.currentStep() === 'shipping') {
          <div class="space-y-6">
            <h2 class="text-lg font-semibold">📦 szállítás</h2>

            <!-- Shipping methods -->
            <app-shipping-methods
              [methods]="checkout.shippingMethods()"
              [selected]="checkout.selectedShipping()"
              (select)="onSelectShipping($event)"
            />

            <!-- Address form (for home delivery) -->
            @if (checkout.selectedShipping()?.type === 'home') {
              <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <h3 class="text-sm font-medium text-gray-700">szállítási cím</h3>

                <form [formGroup]="addressForm" class="space-y-3">
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="név *"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />

                  <div class="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      formControlName="zip"
                      placeholder="irányítószám *"
                      class="px-4 py-3 rounded-xl border border-gray-200
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      formControlName="city"
                      placeholder="város *"
                      class="px-4 py-3 rounded-xl border border-gray-200
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    formControlName="address"
                    placeholder="utca, házszám *"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />

                  <input
                    type="tel"
                    formControlName="phone"
                    placeholder="telefonszám"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </form>
              </div>
            }
          </div>
        }

        <!-- Payment step -->
        @if (checkout.currentStep() === 'payment') {
          <div class="space-y-6">
            <h2 class="text-lg font-semibold">💳 fizetés</h2>

            <app-payment-methods
              [methods]="checkout.paymentMethods()"
              [selected]="checkout.selectedPayment()"
              (select)="onSelectPayment($event)"
            />
          </div>
        }

        <!-- Review step -->
        @if (checkout.currentStep() === 'review') {
          <div class="space-y-6">
            <h2 class="text-lg font-semibold">✅ áttekintés</h2>

            <!-- Order summary -->
            <app-order-summary
              [pricing]="cart.pricingContext()"
              [shippingCost]="checkout.shippingCost()"
            />

            <!-- Shipping info -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 class="text-sm font-medium text-gray-700 mb-2">szállítás</h3>
              <p class="text-sm text-gray-900">
                {{ checkout.selectedShipping()?.name }}
              </p>
            </div>

            <!-- Payment info -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 class="text-sm font-medium text-gray-700 mb-2">fizetés</h3>
              <p class="text-sm text-gray-900">
                {{ checkout.selectedPayment()?.name }}
              </p>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Footer -->
    <footer
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
             px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]
             shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
    >
      <div class="max-w-2xl mx-auto flex gap-3">
        @if (checkout.currentStep() !== 'auth') {
          <button
            type="button"
            class="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl
                   font-medium hover:bg-gray-200 transition-colors"
            (click)="checkout.previousStep()"
          >
            vissza
          </button>
        }

        @if (checkout.currentStep() === 'review') {
          <button
            type="button"
            class="flex-1 py-3.5 bg-green-600 text-white rounded-xl
                   font-medium hover:bg-green-700 transition-colors
                   disabled:bg-gray-300 disabled:cursor-not-allowed"
            [disabled]="checkout.isProcessing()"
            (click)="placeOrder()"
          >
            @if (checkout.isProcessing()) {
              <span class="inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white/30 border-t-white
                             rounded-full animate-spin"></span>
                feldolgozás...
              </span>
            } @else {
              megrendelem ({{ checkout.orderTotal() | number:'1.0-0' }} Ft)
            }
          </button>
        } @else {
          <button
            type="button"
            class="flex-1 py-3.5 bg-blue-600 text-white rounded-xl
                   font-medium hover:bg-blue-700 transition-colors
                   disabled:bg-gray-300 disabled:cursor-not-allowed"
            [disabled]="!checkout.canProceed()"
            (click)="checkout.nextStep()"
          >
            tovább →
          </button>
        }
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  protected readonly checkout = inject(CheckoutService);
  protected readonly cart = inject(CartService);
  private readonly fb = inject(FormBuilder);

  protected guestEmail = '';

  protected addressForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    zip: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['']
  });

  ngOnInit(): void {
    this.checkout.init().subscribe();

    // Sync address form to service
    this.addressForm.valueChanges.subscribe(value => {
      this.checkout.setShippingAddress(value);
    });
  }

  continueAsGuest(): void {
    this.checkout.continueAsGuest(this.guestEmail.trim());
  }

  onSelectShipping(method: ShippingMethod): void {
    this.checkout.selectShipping(method);
  }

  onSelectPayment(method: PaymentMethod): void {
    this.checkout.selectPayment(method);
  }

  placeOrder(): void {
    this.checkout.placeOrder().subscribe();
  }
}
```

---

## 6. Routing Configuration

```typescript
// features/photo-order/photo-order.routes.ts
import { Routes } from '@angular/router';

export const PHOTO_ORDER_ROUTES: Routes = [
  {
    path: 'gallery',
    loadComponent: () =>
      import('./pages/gallery/gallery.page').then(m => m.GalleryPage)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/checkout/checkout.page').then(m => m.CheckoutPage)
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./pages/success/success.page').then(m => m.SuccessPage)
      },
      {
        path: 'cancel',
        loadComponent: () =>
          import('./pages/cancel/cancel.page').then(m => m.CancelPage)
      }
    ]
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.page').then(m => m.OrdersPage)
  }
];
```

---

## 7. File Structure Summary

```
src/app/features/photo-order/
├── components/
│   ├── cart-badge/
│   │   └── cart-badge.component.ts
│   ├── cart-item-row/
│   │   └── cart-item-row.component.ts
│   ├── checkout-steps/
│   │   └── checkout-steps.component.ts
│   ├── coupon-input/
│   │   └── coupon-input.component.ts
│   ├── floating-cart-button/
│   │   └── floating-cart-button.component.ts
│   ├── gallery-photo-card/
│   │   └── gallery-photo-card.component.ts
│   ├── order-summary/
│   │   └── order-summary.component.ts
│   ├── package-progress/
│   │   └── package-progress.component.ts
│   ├── payment-methods/
│   │   └── payment-methods.component.ts
│   ├── price-tag/
│   │   └── price-tag.component.ts
│   ├── quantity-control/
│   │   └── quantity-control.component.ts
│   ├── quick-add-modal/
│   │   └── quick-add-modal.component.ts
│   ├── shipping-methods/
│   │   └── shipping-methods.component.ts
│   └── size-selector/
│       └── size-selector.component.ts
├── models/
│   └── index.ts
├── pages/
│   ├── gallery/
│   │   └── gallery.page.ts
│   ├── cart/
│   │   └── cart.page.ts
│   ├── checkout/
│   │   └── checkout.page.ts
│   ├── success/
│   │   └── success.page.ts
│   ├── cancel/
│   │   └── cancel.page.ts
│   └── orders/
│       └── orders.page.ts
├── services/
│   ├── cart.service.ts
│   ├── cart-api.service.ts
│   ├── checkout.service.ts
│   └── pricing.service.ts
└── photo-order.routes.ts
```

---

## 8. Key Design Patterns

### 8.1 Cart State with LocalStorage Persistence
- Cart data survives page refresh
- Synced via effect() on state changes
- Session token for guest users

### 8.2 Pricing Modes
- **Pricelist**: Sum of individual item prices
- **Package**: Fixed price for X photos
- Both modes handled in computed signals

### 8.3 Quick Add Modal Pattern
- Photo selection opens modal
- Select size + quantity in one step
- Reduces clicks for common flow

### 8.4 Checkout Multi-Step Wizard
- Each step validates before proceeding
- Back button preserves selections
- Final review before payment

### 8.5 Service-Centric Architecture
- CartService holds all state
- Components are "dumb" - just display and emit events
- Easy to test services in isolation
