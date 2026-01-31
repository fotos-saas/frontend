# Photo Order (Webshop) - Claude Implementációs Útmutató

> Lépésről lépésre útmutató a fénykép rendelés feature implementálásához

---

## 🎯 Feature Összefoglaló

**Mi ez?**: E-commerce webshop fényképek rendeléséhez (nyomtatott fotók)

**Fő folyamat**:
1. **Gallery** - Képek böngészése, kosárba rakás
2. **Cart** - Kosár kezelése, kupon alkalmazása
3. **Checkout** - Szállítás, fizetés kiválasztása
4. **Success** - Rendelés visszaigazolása

**Két pricing mód**:
- **Pricelist**: Darabonkénti ár méret szerint
- **Package**: Fix ár X képért (előre kifizetett csomag)

---

## 📋 Előfeltételek

Mielőtt elkezdenéd, ellenőrizd:

- [ ] Angular 19.x telepítve
- [ ] Tailwind CSS 3.4.x konfigurálva
- [ ] Backend Cart API létezik (vagy mock-olható)
- [ ] `environment.ts` tartalmazza az `apiUrl`-t
- [ ] Fizetési szolgáltató integráció tervezett (SimplePay/Stripe/stb)

---

## 🚀 Implementációs Sorrend

### Fázis 1: Alapok (Prioritás: P0)

#### 1.1 Models létrehozása
```bash
mkdir -p src/app/features/photo-order/models
touch src/app/features/photo-order/models/index.ts
```

Másold be a `03-components.md` Section 3 tartalmát.

#### 1.2 Cart Service
```bash
mkdir -p src/app/features/photo-order/services
touch src/app/features/photo-order/services/cart-api.service.ts
touch src/app/features/photo-order/services/cart.service.ts
```

**Sorrend**:
1. `CartApiService` - HTTP hívások
2. `CartService` - State management + localStorage

**FONTOS**: A CartService konstruktorban:
- Betölti a localStorage-ból az előző kosarat
- `effect()`-tel perzisztálja a változásokat

#### 1.3 Routing beállítása
```bash
touch src/app/features/photo-order/photo-order.routes.ts
```

Add hozzá az `app.routes.ts`-hez:
```typescript
{
  path: '',
  loadChildren: () =>
    import('./features/photo-order/photo-order.routes')
      .then(m => m.PHOTO_ORDER_ROUTES)
}
```

---

### Fázis 2: Shared Components (Prioritás: P0)

Sorrend:
1. `PriceTagComponent` - ár formázva
2. `QuantityControlComponent` - +/- gombok
3. `SizeSelectorComponent` - méret dropdown
4. `CartBadgeComponent` - kosár badge animációval
5. `CartItemRowComponent` - kosár sor
6. `OrderSummaryComponent` - összesítés box

```bash
mkdir -p src/app/features/photo-order/components/{price-tag,quantity-control,size-selector,cart-badge,cart-item-row,order-summary}
```

---

### Fázis 3: Gallery & Cart Pages (Prioritás: P0)

#### 3.1 GalleryPage
```bash
mkdir -p src/app/features/photo-order/pages/gallery
mkdir -p src/app/features/photo-order/components/gallery-photo-card
mkdir -p src/app/features/photo-order/components/quick-add-modal
mkdir -p src/app/features/photo-order/components/floating-cart-button
```

**Tesztelés**:
- [ ] Photo grid megjelenik
- [ ] Kattintásra Quick Add Modal nyílik
- [ ] Méret + darab választás működik
- [ ] Kosárba gomb hozzáadja
- [ ] Floating cart button frissül
- [ ] Package mode: progress bar

#### 3.2 CartPage
```bash
mkdir -p src/app/features/photo-order/pages/cart
mkdir -p src/app/features/photo-order/components/coupon-input
mkdir -p src/app/features/photo-order/components/package-progress
```

**Tesztelés**:
- [ ] Tételek listázódnak
- [ ] Quantity +/- működik
- [ ] Törlés működik
- [ ] Kupon alkalmazása
- [ ] Összesítés helyes
- [ ] Tovább gomb navigál

---

### Fázis 4: Checkout (Prioritás: P1)

#### 4.1 CheckoutService
```bash
touch src/app/features/photo-order/services/checkout.service.ts
```

Multi-step wizard state management.

#### 4.2 CheckoutPage és komponensek
```bash
mkdir -p src/app/features/photo-order/pages/checkout
mkdir -p src/app/features/photo-order/components/{checkout-steps,shipping-methods,payment-methods}
```

**Lépések**:
1. Auth (guest email vagy login)
2. Shipping (házhoz/foxpost/személyes)
3. Payment (kártya/utánvét/átutalás)
4. Review (áttekintés, végső összeg)

#### 4.3 SuccessPage
```bash
mkdir -p src/app/features/photo-order/pages/success
```

---

### Fázis 5: Extra Features (Prioritás: P2)

- [ ] Exit intent popup (kosárelhagyás)
- [ ] Foxpost package point selector
- [ ] Order history page
- [ ] Cart abandonment email trigger

---

## 🎨 UI/UX Irányelvek

### Gen Z Stílus
- **Kisbetűs** headingek ("kosár", "pénztár")
- **Emoji-first** ikonok (🛒, 📦, 💳)
- **Rounded-xl/2xl** gombok és kártyák
- **Casual** szövegezés ("töltsd ki", "remek választás!")

### E-commerce Best Practices
- Trust badges a checkout-nál (🔒 biztonságos)
- Progress indicator multi-step-nél
- Clear pricing - nincs rejtett költség
- Sticky summary sidebar desktop-on
- One-click upsell opportunities

### Mobile First
- Full-width gombok mobile-on
- Bottom sheet modálok
- Swipe to delete cart items
- Safe area padding

---

## 🔌 Backend API Elvárások

### Cart API
```
POST /api/cart/init                    → Kosár létrehozása/visszatöltése
POST /api/cart/:id/items               → Tétel hozzáadása
PATCH /api/cart/items/:itemId          → Tétel módosítása
DELETE /api/cart/items/:itemId         → Tétel törlése
DELETE /api/cart/:id/items             → Kosár kiürítése
POST /api/cart/:id/coupon/validate     → Kupon ellenőrzése
POST /api/cart/:id/coupon              → Kupon alkalmazása
```

### Checkout API
```
GET  /api/checkout/options             → Szállítási/fizetési módok
POST /api/checkout/place-order         → Rendelés leadása
GET  /api/orders/:id                   → Rendelés részletei
GET  /api/orders                       → Rendelés történet
```

### Mock Data fejlesztéshez

```typescript
// mock-data.ts
export const MOCK_PRINT_SIZES: PrintSize[] = [
  { id: 1, name: '10x15', width_mm: 100, height_mm: 150, price: 290, weight_grams: 15 },
  { id: 2, name: '13x18', width_mm: 130, height_mm: 180, price: 390, weight_grams: 20 },
  { id: 3, name: '15x21', width_mm: 150, height_mm: 210, price: 490, weight_grams: 25 },
  { id: 4, name: '20x30', width_mm: 200, height_mm: 300, price: 890, weight_grams: 45 },
];

export const MOCK_SHIPPING_METHODS: ShippingMethod[] = [
  { id: 1, name: 'Házhoz szállítás', type: 'home', price: 1290, delivery_days: '2-3 munkanap' },
  { id: 2, name: 'Foxpost automata', type: 'foxpost', price: 890, delivery_days: '1-2 munkanap' },
  { id: 3, name: 'Személyes átvétel', type: 'pickup', price: 0, delivery_days: 'Egyeztetés szerint' },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: 'Bankkártya', type: 'card', description: 'SimplePay-jel' },
  { id: 2, name: 'Utánvét', type: 'cod', fee: 490, description: '+490 Ft kezelési díj' },
  { id: 3, name: 'Átutalás', type: 'transfer', description: 'Előre utalással' },
];
```

---

## ⚠️ Gyakori Hibák

### 1. LocalStorage race condition
```typescript
// ❌ ROSSZ - async init + sync save conflict
constructor() {
  this.loadFromStorage();
}

// ✅ JÓ - effect kezel mindent
constructor() {
  this.loadFromStorage();

  effect(() => {
    const cart = this._cart();
    const items = this._items();
    if (cart) {
      localStorage.setItem('cart_data', JSON.stringify({ cart, items }));
    }
  });
}
```

### 2. Pricing mode keveredés
```typescript
// ❌ ROSSZ - nincs mode check
readonly subtotal = computed(() =>
  this.enrichedItems().reduce((sum, item) =>
    sum + (item.printSize?.price ?? 0) * item.qty, 0)
);

// ✅ JÓ - mode alapján számol
readonly subtotal = computed(() => {
  if (this._pricingMode() === 'package') {
    return this._package()?.price ?? 0;
  }
  return this.enrichedItems().reduce((sum, item) =>
    sum + (item.printSize?.price ?? 0) * item.qty, 0);
});
```

### 3. Coupon state kezelés
```typescript
// ❌ ROSSZ - validation nincs resetelve
removeCoupon(): void {
  this._couponCode.set(null);
  // validation marad!
}

// ✅ JÓ - mindkettő reset
removeCoupon(): void {
  this._couponCode.set(null);
  this._couponValidation.set(null);
}
```

### 4. Checkout step validation
```typescript
// ❌ ROSSZ - nem ellenőrzi a függőségeket
goToStep(step: CheckoutStep): void {
  this._currentStep.set(step);
}

// ✅ JÓ - csak előző step-ek után
goToStep(step: CheckoutStep): void {
  const order: CheckoutStep[] = ['auth', 'shipping', 'payment', 'review'];
  const targetIndex = order.indexOf(step);
  const currentIndex = order.indexOf(this._currentStep());

  // Csak vissza vagy 1 lépéssel előre
  if (targetIndex <= currentIndex + 1) {
    this._currentStep.set(step);
  }
}
```

### 5. Package mode limit
```typescript
// ❌ ROSSZ - nem blokkolja a túllépést
addItem(photoId: number, ...): void {
  this._items.update(items => [...items, newItem]);
}

// ✅ JÓ - package limit check
addItem(photoId: number, ...): Observable<CartItem> {
  // Check package limit before adding
  if (this._pricingMode() === 'package') {
    const pkg = this._package();
    if (pkg && this.uniquePhotoCount() >= pkg.max_photos) {
      this._error.set('Elérted a csomag maximumát!');
      return of(null as any);
    }
  }
  // ... continue with add
}
```

---

## 🧪 Tesztelési Checklist

### Unit Tests
- [ ] `CartService.addItem()` - új tétel hozzáadása
- [ ] `CartService.addItem()` - meglévő tétel qty növelés
- [ ] `CartService.updateQuantity()` - qty csökkentés 0-ra = törlés
- [ ] `CartService.subtotal` - pricelist mode
- [ ] `CartService.subtotal` - package mode
- [ ] `CartService.discount` - percentage coupon
- [ ] `CartService.discount` - fixed amount coupon
- [ ] `CheckoutService.canProceed` - minden step

### E2E Tests
- [ ] Teljes vásárlási folyamat (guest)
- [ ] Kupon alkalmazás és törlés
- [ ] Package mode limit betartása
- [ ] Kosár perzisztencia (page refresh)
- [ ] Mobile checkout flow

---

## 📁 Végső Fájlstruktúra

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
│   ├── cart/
│   │   └── cart.page.ts
│   ├── checkout/
│   │   └── checkout.page.ts
│   ├── gallery/
│   │   └── gallery.page.ts
│   ├── orders/
│   │   └── orders.page.ts
│   └── success/
│       └── success.page.ts
├── services/
│   ├── cart-api.service.ts
│   ├── cart.service.ts
│   ├── checkout.service.ts
│   └── pricing.service.ts
└── photo-order.routes.ts
```

---

## 🔄 Review Checklist

Implementáció befejezése előtt:

- [ ] Minden komponens `standalone: true`
- [ ] Minden komponens `ChangeDetectionStrategy.OnPush`
- [ ] Nincs BehaviorSubject - csak Signals
- [ ] LocalStorage persistence működik
- [ ] Mobile responsive (teszteld 375px)
- [ ] Accessibility: aria-labels, keyboard nav
- [ ] Error handling minden API hívásra
- [ ] Loading states minden async művelethez
- [ ] Analytics events track-elve (add_to_cart, begin_checkout, purchase)
- [ ] Console.log-ok eltávolítva

---

## 🚨 KRITIKUS SZABÁLYOK

1. **Package limit** - Ne engedd túllépni a csomag max_photos értékét
2. **Coupon validation** - Backend-en kell validálni, ne csak frontend-en
3. **Price consistency** - Mindig backend-ről jöjjön a végleges ár
4. **Payment security** - Soha ne tárold a kártyaadatokat!
5. **Cart expiry** - Kezeld a lejárt kosár esetet gracefully
6. **Stock check** - Checkout előtt ellenőrizd a készletet (ha van)

---

## 💡 Extra Tippek

### Cart Abandonment
```typescript
// Exit intent detection
@HostListener('document:mouseleave', ['$event'])
onMouseLeave(event: MouseEvent): void {
  if (event.clientY < 10 && !this.cart.isEmpty()) {
    this.showExitIntent = true;
  }
}
```

### Analytics Integration
```typescript
// Google Analytics 4 events
trackPurchase(order: Order): void {
  gtag('event', 'purchase', {
    transaction_id: order.order_number,
    value: order.total,
    currency: 'HUF',
    items: this.cart.enrichedItems().map(item => ({
      item_id: `photo_${item.photo_id}`,
      item_name: item.printSize?.name,
      price: item.printSize?.price,
      quantity: item.qty
    }))
  });
}
```

### Foxpost Integration
```typescript
// Foxpost APM selector
openFoxpostSelector(): void {
  const script = document.createElement('script');
  script.src = 'https://cdn.foxpost.hu/apm/selector.js';
  script.onload = () => {
    window.foxpostApmSelector.open({
      onSelect: (point) => {
        this.checkout.selectPackagePoint(point);
      }
    });
  };
  document.body.appendChild(script);
}
```
