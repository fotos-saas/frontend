# Fénykép Rendelés Feature (Webshop)

> **Tablókirály** - Fényképek rendelése különböző méretekben

---

## Összefoglaló

A fénykép rendelés feature lehetővé teszi hogy:
1. Szülők/diákok böngésszenek az albumban
2. Kiválasszanak képeket
3. Méretet és mennyiséget állítsanak
4. Megrendeljék és kifizessék

**FONTOS**: Ez KÜLÖN a tabló workflow-tól! Itt fizetős rendelés történik.

---

## Business Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FÉNYKÉP RENDELÉS FLOW                               │
│                      (Fizetős webshop rendelés)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                         BELÉPÉSI PONTOK                            │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  A) Bejelentkezett user → /albums → /photos/:albumId               │    │
│   │  B) Guest link → /share/:token → /photos/guest/:token              │    │
│   │  C) Tabló completed után → "Rendelj képeket!" gomb                 │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      1. GALÉRIA / KÉP BÖNGÉSZÉS                    │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • Grid nézet (lazy load, infinite scroll)                         │    │
│   │  • Lightbox nagyításhoz                                            │    │
│   │  • Kép kiválasztás checkbox-szal                                   │    │
│   │  • Mennyiség beállítás (quick +/-)                                 │    │
│   │  • Kosár badge a header-ben                                        │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                          2. KOSÁR                                  │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • Kiválasztott képek listája                                      │    │
│   │  • Méret választás képenként (dropdown)                            │    │
│   │  • Mennyiség módosítás                                             │    │
│   │  • "Alkalmazz mindegyikre" bulk action                             │    │
│   │  • Kuponkód beváltás                                               │    │
│   │  • Összesítő: darabszám × ár = subtotal                            │    │
│   │                                                                    │    │
│   │  PRICING MODE:                                                     │    │
│   │  ├── PRICELIST: méret alapú darabár (10x15=500Ft, 13x18=800Ft)    │    │
│   │  └── PACKAGE: X kép egy árban (pl. 50 kép = 15.000 Ft)            │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                     3. CHECKOUT - AUTH                             │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  A) Bejelentkezés (ha van fiók)                                    │    │
│   │  B) Regisztráció (új fiók)                                         │    │
│   │  C) Vendég rendelés (csak adatok, nincs fiók)                      │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                   4. CHECKOUT - SZÁLLÍTÁS                          │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • Szállítási cím (név, cím, irányítószám, város)                  │    │
│   │  • Szállítási mód:                                                 │    │
│   │    ├── Házhozszállítás (GLS, MPL, stb.)                            │    │
│   │    ├── Csomagpont (PackagePoint modal - térkép)                    │    │
│   │    └── Személyes átvétel (ha van)                                  │    │
│   │  • Számlázási adatok (ha eltér)                                    │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                    5. CHECKOUT - FIZETÉS                           │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • Fizetési mód:                                                   │    │
│   │    ├── Online bankkártya (Stripe)                                  │    │
│   │    ├── Utánvét (+kezelési költség)                                 │    │
│   │    └── Átutalás (manuális)                                         │    │
│   │  • Végösszeg:                                                      │    │
│   │    subtotal + szállítás + utánvét díj - kupon kedvezmény           │    │
│   │  • ÁSZF elfogadás                                                  │    │
│   │  • "Megrendelem" gomb                                              │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │               6. SUCCESS / PAYMENT REDIRECT                        │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • Stripe → redirect → /checkout/success?session_id=xxx            │    │
│   │  • Utánvét → azonnal /checkout/success                             │    │
│   │  • Sikertelen → /checkout/cancel                                   │    │
│   │  • Email visszaigazolás küldése                                    │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                    7. RENDELÉS KÖVETÉS                             │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  • /orders - korábbi rendelések listája                            │    │
│   │  • /orders/:id - részletek, státusz, tracking                      │    │
│   │  • Email értesítések (státusz változáskor)                         │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Adatmodell

### Cart (Kosár)

```typescript
interface Cart {
  id: number;
  user_id: number | null;      // null = guest
  session_token: string;       // guest azonosító
  package_id: number | null;   // ha package mode
  coupon_id: number | null;
  coupon_discount: number;
  status: 'active' | 'checkout' | 'completed';
  expires_at: Date;
  items: CartItem[];
}
```

### CartItem (Kosár tétel)

```typescript
interface CartItem {
  id: number;
  cart_id: number;
  photo_id: number;
  print_size_id: number;
  qty: number;
  type: 'print' | 'digital';   // nyomtatott vs digitális
}
```

### PrintSize (Nyomtatási méret)

```typescript
interface PrintSize {
  id: number;
  name: string;           // "10x15", "13x18", "A4"
  width_mm: number;
  height_mm: number;
  weight_grams: number;   // szállítási díj számításhoz
}
```

### PricingContext

```typescript
interface PricingContext {
  mode: 'pricelist' | 'package';

  // Pricelist mode
  prices?: {
    sizeId: number;
    price: number;
  }[];

  // Package mode
  packagePrice?: number;
  maxSelectablePhotos?: number;
}
```

### Order (Rendelés)

```typescript
interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';

  // Összegek
  subtotal: number;
  shipping_cost: number;
  cod_fee: number;           // utánvét díj
  discount: number;
  total: number;

  // Szállítás
  shipping_method_id: number;
  shipping_address: ShippingAddress;
  package_point_id: number | null;
  tracking_number: string | null;

  // Fizetés
  payment_method: 'stripe' | 'cod' | 'transfer';
  payment_status: 'pending' | 'paid' | 'failed';
  stripe_session_id: string | null;

  // Kapcsolatok
  items: OrderItem[];
  coupon_id: number | null;
}
```

---

## Frontend Architektúra

```
src/app/features/photo-order/
├── pages/
│   ├── gallery/
│   │   ├── gallery.page.ts           ← Kép böngészés
│   │   └── gallery.page.html
│   ├── cart/
│   │   ├── cart.page.ts              ← Kosár kezelés
│   │   └── cart.page.html
│   ├── checkout/
│   │   ├── checkout-auth/            ← Bejelentkezés/regisztráció
│   │   ├── checkout-shipping/        ← Szállítási adatok
│   │   ├── checkout-payment/         ← Fizetés
│   │   ├── checkout-success/
│   │   └── checkout-cancel/
│   └── orders/
│       ├── orders-list/              ← Korábbi rendelések
│       └── order-detail/             ← Rendelés részletek
├── components/
│   ├── photo-grid/                   ← Kép grid (shared)
│   ├── cart-item/                    ← Kosár elem
│   ├── size-selector/                ← Méret választó
│   ├── quantity-control/             ← +/- gombok
│   ├── price-summary/                ← Összesítő
│   ├── coupon-input/                 ← Kupon mező
│   ├── shipping-form/                ← Szállítási űrlap
│   ├── package-point-modal/          ← Csomagpont térkép
│   └── payment-methods/              ← Fizetési módok
├── services/
│   ├── cart.service.ts               ← Kosár kezelés
│   ├── pricing.service.ts            ← Árazás logika
│   ├── checkout.service.ts           ← Checkout flow
│   ├── order.service.ts              ← Rendelések
│   └── shipping.service.ts           ← Szállítás
└── models/
    ├── cart.model.ts
    ├── order.model.ts
    └── pricing.model.ts
```

---

## Routing

```typescript
const routes: Routes = [
  // Galéria (bejelentkezett)
  { path: 'photos/:albumId', component: GalleryPage },

  // Galéria (guest)
  { path: 'photos/guest/:token', component: GalleryPage },

  // Kosár
  { path: 'cart', component: CartPage },

  // Checkout flow
  {
    path: 'checkout',
    children: [
      { path: '', redirectTo: 'auth', pathMatch: 'full' },
      { path: 'auth', component: CheckoutAuthPage },
      { path: 'shipping', component: CheckoutShippingPage },
      { path: 'payment', component: CheckoutPaymentPage },
      { path: 'success', component: CheckoutSuccessPage },
      { path: 'cancel', component: CheckoutCancelPage },
    ],
    canActivate: [CheckoutGuard],  // kosár nem üres
  },

  // Rendelések
  { path: 'orders', component: OrdersListPage },
  { path: 'orders/:id', component: OrderDetailPage },
];
```

---

## Cart Service (Signals)

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  // State
  private _cart = signal<Cart | null>(null);
  private _items = signal<CartItem[]>([]);
  private _isLoading = signal(false);

  // Computed
  readonly cart = this._cart.asReadonly();
  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.qty, 0)
  );
  readonly uniquePhotoCount = computed(() =>
    new Set(this._items().map(i => i.photo_id)).size
  );

  // Actions
  addItem(photoId: number, sizeId: number, qty: number): Observable<void> { ... }
  updateItem(itemId: number, qty: number): Observable<void> { ... }
  removeItem(itemId: number): Observable<void> { ... }
  applyCoupon(code: string): Observable<void> { ... }
  clear(): Observable<void> { ... }
}
```

---

## Pricing Service

```typescript
@Injectable({ providedIn: 'root' })
export class PricingService {
  // State
  private _context = signal<PricingContext | null>(null);
  private _sizes = signal<PrintSize[]>([]);

  // Computed
  readonly isPricelistMode = computed(() =>
    this._context()?.mode === 'pricelist'
  );
  readonly isPackageMode = computed(() =>
    this._context()?.mode === 'package'
  );

  // Methods
  getPrice(sizeId: number): number { ... }
  calculateSubtotal(items: CartItem[]): number { ... }
  calculateTotal(subtotal: number, shipping: number, codFee: number, discount: number): number { ... }
}
```

---

## API Endpoints

### Cart

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/cart` | Aktuális kosár |
| POST | `/api/cart/items` | Tétel hozzáadás |
| PUT | `/api/cart/items/:id` | Tétel módosítás |
| DELETE | `/api/cart/items/:id` | Tétel törlés |
| POST | `/api/cart/coupon` | Kupon alkalmazás |
| DELETE | `/api/cart/coupon` | Kupon törlés |

### Checkout

| Method | Endpoint | Leírás |
|--------|----------|--------|
| POST | `/api/checkout/validate` | Kosár validálás |
| POST | `/api/checkout/shipping` | Szállítási díj számítás |
| POST | `/api/checkout/create-order` | Rendelés létrehozás |
| POST | `/api/checkout/stripe-session` | Stripe session |

### Orders

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/orders` | Saját rendelések |
| GET | `/api/orders/:id` | Rendelés részletek |

---

## Pricing Modes

### 1. Pricelist Mode (Darabár)

```
Méret      | Ár
-----------+--------
10x15      | 500 Ft
13x18      | 800 Ft
15x20      | 1.200 Ft
20x30      | 2.000 Ft

Összeg = Σ (darab × méret_ár)
```

### 2. Package Mode (Csomag)

```
Csomag: 50 kép = 15.000 Ft (fix méret)

- Max 50 kép választható
- Minden kép ugyanaz a méret
- Fix összár
- Extra képek: +200 Ft/db
```

---

## Különbség a régi implementációtól

### Régi (cart.page.ts)
- ❌ 1300+ sor
- ❌ Tablo progress + cart + checkout keveredik
- ❌ Inline pricing logika
- ❌ Sok computed a template-ben

### Új (szétválasztva)
- ✅ Külön page: gallery, cart, checkout lépések
- ✅ Dedikált services: CartService, PricingService
- ✅ Tiszta data flow
- ✅ Könnyű tesztelés

---

## Kapcsolat más feature-ökkel

### Tabló Workflow → Photo Order

```
Tabló Completed oldal:
┌─────────────────────────────────────┐
│  ✅ Tablófotó kiválasztva!          │
│                                     │
│  📸 Szeretnél több képet rendelni?  │
│                                     │
│  [Képek rendelése] ← link to cart   │
└─────────────────────────────────────┘
```

### Értesítési Központ

- Rendelés visszaigazolás
- Státusz változás (feldolgozás, szállítás)
- Szállítás megérkezett

---

## Prioritások

1. **P0**: Gallery page (kép böngészés, kiválasztás)
2. **P0**: Cart page (méret, mennyiség)
3. **P0**: CartService + PricingService
4. **P1**: Checkout auth page
5. **P1**: Checkout shipping page
6. **P1**: Checkout payment page
7. **P2**: Orders list/detail
8. **P2**: Package point modal (térkép)

---

## Dokumentáció

| Fájl | Tartalom |
|------|----------|
| `01-user-flow.md` | Részletes vásárlási flow |
| `02-ui-design.md` | Vizuális design |
| `03-backend-api.md` | API specifikáció |
| `04-database-schema.md` | Adatbázis |
| `05-components.md` | Angular komponensek |
| `CLAUDE-INSTRUCTIONS.md` | Implementációs útmutató |
