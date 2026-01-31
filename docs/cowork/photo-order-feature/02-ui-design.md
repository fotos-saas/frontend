# Fénykép Rendelés - UI Design

> Vizuális design specifikáció az e-commerce webshophoz

---

## Design Alapelvek

### E-commerce Optimalizáció
- **Conversion-focused**: Minden elem a vásárlás felé terel
- **Trust signals**: Biztonság jelzések mindenhol
- **Urgency**: Kuponok, limitált idő jelzések
- **Frictionless**: Minimális kattintás a vásárlásig

### Gen Z + Szülő Kombó
- Diákok: Casual, emoji, fun
- Szülők: Professzionális, megbízható, egyértelmű árak

---

## Színpaletta

### Ugyanaz mint a Tablo Workflow

```scss
// Brand
$primary-500: #3b82f6;
$primary-600: #2563eb;

// Prices & Money
$price-color: #059669;        // Emerald - árak
$discount-color: #dc2626;     // Piros - kedvezmény
$original-price: #9ca3af;     // Áthúzott eredeti ár

// Cart
$cart-badge: #ef4444;         // Piros badge
```

---

## Layout

### Gallery Page

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR + CART BADGE                                           │
├─────────────────────────────────────────────────────────────────┤
│  ALBUM INFO + FILTER BAR                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHOTO GRID (scrollable, infinite)                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  STICKY CART SUMMARY                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Cart Page

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (← vissza, kosár title)                                 │
├─────────────────────────────────────────────────────────────────┤
│  PROMO BANNER (kupon)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CART ITEMS (scrollable)                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BULK SIZE ACTION                                               │
├─────────────────────────────────────────────────────────────────┤
│  ORDER SUMMARY (subtotal, discount, total)                      │
├─────────────────────────────────────────────────────────────────┤
│  CHECKOUT CTA (sticky)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Checkout Page

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER + PROGRESS (① fiók → ② szállítás → ③ fizetés)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FORM CONTENT (current step)                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ORDER SUMMARY SIDEBAR / BOTTOM                                 │
├─────────────────────────────────────────────────────────────────┤
│  NEXT STEP CTA                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komponensek

### 1. Cart Badge (Header)

```
┌─────────┐
│   🛒    │
│    3    │  ← Piros badge
└─────────┘
```

**CSS:**

```scss
.cart-button {
  position: relative;
  padding: $space-2;

  &__icon {
    font-size: 24px;
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    background: $cart-badge;
    color: white;
    font-size: 11px;
    font-weight: 700;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $space-1;
    animation: badge-pop 0.3s ease;
  }
}

@keyframes badge-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

### 2. Photo Card (Gallery)

```
┌─────────────────────────┐
│                         │
│                         │
│        THUMBNAIL        │
│                         │
│                         │
├─────────────────────────┤
│  ○ / ● checkbox         │
│        vagy             │
│  ✓ 2db  (ha selected)   │
└─────────────────────────┘
```

**States:**

| State | Border | Badge | Background |
|-------|--------|-------|------------|
| Default | none | hidden | - |
| Hover | subtle shadow | checkbox visible | - |
| Selected | 3px primary | qty badge | primary-50 |
| Disabled | - | - | 50% opacity |

**CSS:**

```scss
.gallery-photo-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // Overlay gradient for better badge visibility
  &__overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(transparent, rgba(0,0,0,0.3));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  // Quantity badge
  &__qty-badge {
    position: absolute;
    bottom: $space-2;
    right: $space-2;
    background: $primary-500;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: $space-1 $space-2;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: $space-1;

    &::before {
      content: '✓';
    }
  }

  // Selection checkbox (top right)
  &__checkbox {
    position: absolute;
    top: $space-2;
    right: $space-2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: 2px solid $gray-300;
    opacity: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .gallery-photo-card__overlay,
    .gallery-photo-card__checkbox {
      opacity: 1;
    }
  }

  &--selected {
    box-shadow: 0 0 0 3px $primary-500;

    .gallery-photo-card__overlay {
      opacity: 1;
    }
  }
}
```

---

### 3. Quick Add Modal (on photo tap)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │                      NAGY KÉP                           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Méret:  [10x15 ▼]    Mennyiség:  [−] 2 [+]           │   │
│   │                                                         │   │
│   │                    Ár: 1.000 Ft                         │   │
│   │                                                         │   │
│   │        [kosárba]            [tovább böngészek]          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.quick-add-modal {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  max-width: 440px;
  width: 100%;

  &__image {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
  }

  &__controls {
    padding: $space-6;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-4;
  }

  &__price {
    font-size: 24px;
    font-weight: 700;
    color: $price-color;
    text-align: center;
    margin: $space-4 0;
  }

  &__actions {
    display: flex;
    gap: $space-3;

    button {
      flex: 1;
    }
  }
}
```

---

### 4. Size Selector

```
┌─────────────────────────────────────┐
│  Méret                          ▼   │
└─────────────────────────────────────┘
         ↓ (dropdown open)
┌─────────────────────────────────────┐
│  ○ 10x15 cm              500 Ft    │
│  ● 13x18 cm              800 Ft    │  ← selected
│  ○ 15x20 cm            1.200 Ft    │
│  ○ 20x30 cm            2.000 Ft    │
│  ○ A4                  2.500 Ft    │
└─────────────────────────────────────┘
```

**CSS:**

```scss
.size-selector {
  position: relative;

  &__trigger {
    width: 100%;
    padding: $space-3 $space-4;
    background: white;
    border: 2px solid $gray-200;
    border-radius: 12px;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      border-color: $gray-300;
    }

    &--open {
      border-color: $primary-500;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid $primary-500;
    border-top: none;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    z-index: $z-dropdown;
    max-height: 300px;
    overflow-y: auto;
  }

  &__option {
    padding: $space-3 $space-4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background 0.1s ease;

    &:hover {
      background: $gray-50;
    }

    &--selected {
      background: $primary-50;
      font-weight: 500;
    }

    &-name {
      display: flex;
      align-items: center;
      gap: $space-2;
    }

    &-price {
      color: $price-color;
      font-weight: 600;
    }
  }
}
```

---

### 5. Quantity Control

```
┌─────┬─────────┬─────┐
│  −  │    2    │  +  │
└─────┴─────────┴─────┘
```

**CSS:**

```scss
.qty-control {
  display: inline-flex;
  align-items: center;
  border: 2px solid $gray-200;
  border-radius: 12px;
  overflow: hidden;

  &__btn {
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    font-size: 18px;
    font-weight: 600;
    color: $gray-600;
    cursor: pointer;
    transition: all 0.1s ease;

    &:hover {
      background: $gray-100;
      color: $gray-900;
    }

    &:active {
      background: $gray-200;
    }

    &:disabled {
      color: $gray-300;
      cursor: not-allowed;
    }
  }

  &__value {
    width: 48px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: $gray-900;
    border-left: 1px solid $gray-200;
    border-right: 1px solid $gray-200;
  }
}
```

---

### 6. Cart Item Row

```
┌───────────────────────────────────────────────────────────────────┐
│  ┌───────┐  IMG_0234.jpg                                         │
│  │       │  Méret: [10x15 ▼]                                     │
│  │ thumb │  Mennyiség: [−] 2 [+]                                 │
│  │       │                                            1.000 Ft   │
│  └───────┘                                              [🗑️]     │
└───────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.cart-item {
  display: flex;
  gap: $space-4;
  padding: $space-4 0;
  border-bottom: 1px solid $gray-100;

  &__thumb {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__details {
    flex: 1;
    min-width: 0;
  }

  &__filename {
    font-size: 14px;
    font-weight: 500;
    color: $gray-900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: $space-2;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    align-items: center;
  }

  &__price {
    margin-left: auto;
    font-size: 16px;
    font-weight: 600;
    color: $price-color;
    white-space: nowrap;
  }

  &__delete {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $gray-100;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray-500;
    transition: all 0.2s ease;

    &:hover {
      background: $error-50;
      color: $error-500;
    }
  }
}

// Mobile responsive
@media (max-width: 640px) {
  .cart-item {
    flex-wrap: wrap;

    &__thumb {
      width: 60px;
      height: 60px;
    }

    &__price {
      width: 100%;
      text-align: right;
      margin-top: $space-2;
    }
  }
}
```

---

### 7. Coupon Input

```
┌─────────────────────────────────────────────────────────────────┐
│  🎁 Van kuponkódod?                                             │
│                                                                 │
│  ┌─────────────────────────────────────┐                        │
│  │  GYORS10                            │  [beváltás]            │
│  └─────────────────────────────────────┘                        │
│                                                                 │
│  ✅ Kupon aktiválva: 10% kedvezmény (-780 Ft)     [törlés]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.coupon-section {
  background: $warning-50;
  border: 1px dashed $warning-500;
  border-radius: 12px;
  padding: $space-4;
  margin: $space-4 0;

  &__title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: $space-3;
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__form {
    display: flex;
    gap: $space-2;
  }

  &__input {
    flex: 1;
    padding: $space-3;
    border: 2px solid $gray-200;
    border-radius: 10px;
    font-size: 14px;
    text-transform: uppercase;

    &:focus {
      outline: none;
      border-color: $primary-500;
    }

    &::placeholder {
      text-transform: none;
    }
  }

  &__success {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $space-3;
    padding: $space-3;
    background: $success-50;
    border-radius: 10px;
    font-size: 13px;
    color: $success-700;

    button {
      color: $gray-500;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        color: $error-500;
      }
    }
  }
}
```

---

### 8. Order Summary Box

```
╔═════════════════════════════════════════════════════════════════╗
║  ÖSSZESÍTŐ                                                      ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Részösszeg (6 db):                                 7.800 Ft   ║
║  Kedvezmény (GYORS10 -10%):                          -780 Ft   ║
║  Szállítás (Csomagpont):                              990 Ft   ║
║  ─────────────────────────────────────────────────────────────  ║
║  ÖSSZESEN:                                          8.010 Ft   ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
```

**CSS:**

```scss
.order-summary {
  background: $gray-50;
  border-radius: 16px;
  padding: $space-6;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $gray-500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $space-4;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    padding: $space-2 0;
    font-size: 14px;

    &--discount {
      color: $discount-color;
    }

    &--total {
      font-size: 18px;
      font-weight: 700;
      padding-top: $space-4;
      margin-top: $space-2;
      border-top: 2px solid $gray-200;
    }
  }

  &__label {
    color: $gray-600;
  }

  &__value {
    font-weight: 500;
    color: $gray-900;

    &--price {
      color: $price-color;
    }
  }
}
```

---

### 9. Checkout Progress Steps

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ fiók  ─────────  ② szállítás  ─────────  ③ fizetés          │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.checkout-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4 $space-6;
  background: white;
  border-bottom: 1px solid $gray-200;
}

.checkout-step {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: 13px;
  color: $gray-400;

  &__number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  &--completed {
    color: $success-500;

    .checkout-step__number {
      background: $success-500;
      border-color: $success-500;
      color: white;
    }
  }

  &--active {
    color: $primary-500;

    .checkout-step__number {
      background: $primary-500;
      border-color: $primary-500;
      color: white;
    }

    .checkout-step__label {
      font-weight: 600;
    }
  }
}

.checkout-progress__line {
  width: 60px;
  height: 2px;
  margin: 0 $space-2;
  background: $gray-200;

  &--completed {
    background: $success-500;
  }
}
```

---

### 10. Shipping Method Cards

```
┌─────────────────────────────────────────────────────────────────┐
│  ○ 🚚 Házhozszállítás (GLS)                        1.290 Ft    │
│       3-5 munkanap                                              │
├─────────────────────────────────────────────────────────────────┤
│  ● 📦 Csomagpont (GLS/Foxpost)                       990 Ft    │  ← selected
│       2-4 munkanap                 [csomagpont választás →]     │
│       Foxpost - Budapest, Váci út 12.                           │
├─────────────────────────────────────────────────────────────────┤
│  ○ 🏫 Iskolai átvétel                              INGYENES    │
│       A fotózás helyszínén                                      │
│       Várható: 2024. február 15.                                │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.shipping-option {
  padding: $space-4;
  border: 2px solid $gray-200;
  border-radius: 12px;
  margin-bottom: $space-3;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $gray-300;
  }

  &--selected {
    border-color: $primary-500;
    background: $primary-50;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
  }

  &__radio {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid $gray-300;
    flex-shrink: 0;
    margin-top: 2px;

    .shipping-option--selected & {
      border-color: $primary-500;
      background: $primary-500;
      box-shadow: inset 0 0 0 4px white;
    }
  }

  &__icon {
    font-size: 20px;
  }

  &__content {
    flex: 1;
  }

  &__name {
    font-weight: 600;
    color: $gray-900;
  }

  &__time {
    font-size: 13px;
    color: $gray-500;
    margin-top: $space-1;
  }

  &__price {
    font-weight: 600;
    color: $price-color;
    white-space: nowrap;

    &--free {
      color: $success-500;
    }
  }

  &__selected-point {
    margin-top: $space-3;
    margin-left: 44px;
    padding: $space-3;
    background: white;
    border-radius: 8px;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
```

---

### 11. Payment Methods

```
┌─────────────────────────────────────────────────────────────────┐
│  ● 💳 Bankkártyás fizetés (Stripe)                              │
│       Azonnali, biztonságos online fizetés                      │
│       [Visa] [Mastercard] [Amex]                                │
├─────────────────────────────────────────────────────────────────┤
│  ○ 💵 Utánvét                                      +590 Ft     │
│       Fizetés átvételkor készpénzben                            │
├─────────────────────────────────────────────────────────────────┤
│  ○ 🏦 Banki átutalás                                            │
│       Előre utalás, szállítás a beérkezés után                  │
└─────────────────────────────────────────────────────────────────┘
```

**COD Extra Fee highlight:**

```scss
.payment-option__extra-fee {
  display: inline-block;
  padding: $space-1 $space-2;
  background: $warning-100;
  color: $warning-700;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  margin-left: $space-2;
}
```

---

### 12. Checkout CTA Button

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│            [🔒 biztonságos fizetés - 8.010 Ft]                  │
│                                                                 │
│      🔒 SSL titkosítás • 💳 PCI DSS megfelelőség                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.checkout-cta {
  padding: $space-4 $space-6;
  background: white;
  border-top: 1px solid $gray-200;

  &__button {
    width: 100%;
    padding: $space-4;
    font-size: 16px;
    font-weight: 600;
    background: $primary-500;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    transition: all 0.2s ease;

    &:hover {
      background: $primary-600;
    }

    &:disabled {
      background: $gray-300;
      cursor: not-allowed;
    }
  }

  &__trust {
    display: flex;
    justify-content: center;
    gap: $space-4;
    margin-top: $space-3;
    font-size: 11px;
    color: $gray-500;
  }
}
```

---

### 13. Success Page

```scss
.success-page {
  text-align: center;
  padding: $space-12 $space-6;

  &__icon {
    width: 80px;
    height: 80px;
    background: $success-100;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $space-6;
    font-size: 40px;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: $space-2;
  }

  &__order-number {
    font-size: 14px;
    color: $gray-500;
    margin-bottom: $space-6;
  }

  &__email-notice {
    background: $primary-50;
    border-radius: 12px;
    padding: $space-4;
    font-size: 14px;
    margin-bottom: $space-8;
  }
}
```

---

### 14. Promo Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  🎁 10% kedvezmény a GYORS10 kuponnal!     [kupon beváltása]   │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.promo-banner {
  background: linear-gradient(135deg, $warning-500, $warning-600);
  color: white;
  padding: $space-3 $space-4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;

  &__text {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__cta {
    background: white;
    color: $warning-600;
    padding: $space-2 $space-3;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;

    &:hover {
      background: $gray-100;
    }
  }
}
```

---

### 15. Sticky Cart Summary (Gallery)

```
┌─────────────────────────────────────────────────────────────────┐
│  🛒 3 kép a kosárban (6 db)           [kosár megtekintése →]   │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.sticky-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid $gray-200;
  padding: $space-3 $space-4;
  padding-bottom: calc($space-3 + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: $z-sticky;
  transform: translateY(100%);
  transition: transform 0.3s ease;

  &--visible {
    transform: translateY(0);
  }

  &__info {
    font-size: 14px;
    color: $gray-600;

    strong {
      color: $gray-900;
    }
  }
}
```

---

## Exit Intent Popup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                      [✕]        │
│                                                                 │
│                   várj, ne menj még! 🛒                         │
│                                                                 │
│   3 csodálatos kép vár a kosaradban!                            │
│                                                                 │
│   🎁 Használd a MARADJ5 kódot és kapj                           │
│      5% extra kedvezményt!                                      │
│                                                                 │
│        [vissza a kosárhoz]        [később]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.exit-popup {
  background: white;
  border-radius: 20px;
  padding: $space-8;
  max-width: 400px;
  text-align: center;

  &__emoji {
    font-size: 48px;
    margin-bottom: $space-4;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: $space-2;
  }

  &__message {
    color: $gray-600;
    margin-bottom: $space-4;
  }

  &__coupon {
    background: $warning-50;
    border: 2px dashed $warning-500;
    border-radius: 12px;
    padding: $space-4;
    margin: $space-4 0;

    &-code {
      font-size: 24px;
      font-weight: 700;
      color: $warning-600;
      letter-spacing: 2px;
    }
  }

  &__actions {
    display: flex;
    gap: $space-3;
    margin-top: $space-6;

    button {
      flex: 1;
    }
  }
}
```

---

## Responsive Considerations

### Mobile Cart

- Full-width items
- Stacked controls (méret above qty)
- Bottom sheet style summary
- Thumb-friendly tap targets

### Desktop Cart

- Side-by-side layout (items + summary)
- Inline controls
- Fixed summary sidebar

```scss
@media (min-width: 1024px) {
  .cart-page {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: $space-8;
    max-width: 1200px;
    margin: 0 auto;

    &__items {
      // Left column
    }

    &__sidebar {
      position: sticky;
      top: $space-4;
      align-self: start;
    }
  }
}
```

---

## Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Button hover | 0.2s | ease |
| Modal appear | 0.3s | ease-out |
| Cart badge pop | 0.3s | spring |
| Dropdown open | 0.2s | ease-out |
| Page transition | 0.3s | ease |
| Loading shimmer | 1.5s | linear (infinite) |
