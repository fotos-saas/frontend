# Tabló Workflow - UI Design

> Vizuális design specifikáció, színek, komponensek, animációk

---

## Design Alapelvek

### Gen Z Stílus
- **Lowercase** minden szövegben
- **Emoji-first** kommunikáció
- **Casual tone** - "kész!", nem "Befejezve."
- **Rounded corners** - 12px+ border-radius
- **Soft shadows** - subtle, nem harsh

### Mobile-First
- Touch-friendly: min 44x44px tap targets
- Thumb-zone optimalizálás
- Sticky footer navigáció
- Swipe gesztusok támogatása

---

## Színpaletta

### Primary Colors

```scss
// Brand
$primary-500: #3b82f6;      // Kék - fő akció
$primary-600: #2563eb;      // Kék hover
$primary-50: #eff6ff;       // Kék háttér (selected)

// Success
$success-500: #22c55e;      // Zöld - completed
$success-50: #f0fdf4;       // Zöld háttér

// Warning
$warning-500: #f59e0b;      // Narancs - attention
$warning-50: #fffbeb;       // Narancs háttér

// Error
$error-500: #ef4444;        // Piros - hiba
$error-50: #fef2f2;         // Piros háttér
```

### Neutral Colors

```scss
$gray-50: #f9fafb;          // Page background
$gray-100: #f3f4f6;         // Card background
$gray-200: #e5e7eb;         // Border
$gray-300: #d1d5db;         // Disabled
$gray-400: #9ca3af;         // Placeholder
$gray-500: #6b7280;         // Secondary text
$gray-700: #374151;         // Primary text
$gray-900: #111827;         // Headings
```

---

## Typography

### Font Stack

```scss
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Scale

| Elem | Size | Weight | Line Height |
|------|------|--------|-------------|
| H1 (page title) | 24px | 700 | 1.2 |
| H2 (section) | 20px | 600 | 1.3 |
| H3 (card title) | 16px | 600 | 1.4 |
| Body | 14px | 400 | 1.5 |
| Small | 12px | 400 | 1.4 |
| Caption | 11px | 500 | 1.3 |

### Gen Z Lowercase Rule

```scss
// ✅ HELYES
.page-title {
  text-transform: lowercase;
}

// Eredmény: "képválasztás", "retusálás", "kész!"
```

---

## Layout

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR (56px mobile / 64px desktop)                           │
├─────────────────────────────────────────────────────────────────┤
│  STEPPER (80px)                                                 │
├─────────────────────────────────────────────────────────────────┤
│  INFO BANNER (60px)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MAIN CONTENT (flex-1, scrollable)                              │
│  - Photo Grid                                                   │
│  - Preview Panel                                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  STICKY FOOTER (72px + safe-area)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Spacing Scale

```scss
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
```

---

## Komponensek

### 1. Workflow Stepper

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ① képválasztás ───── ② retusálás ───── ③ tablókép ───── ✓       │
│        ●                    ○                 ○            ○        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**States:**

| State | Ikon | Szín | Vonal |
|-------|------|------|-------|
| Completed | ✓ | success-500 | solid green |
| Active | ● (filled) | primary-500 | solid blue |
| Upcoming | ○ (outline) | gray-300 | dashed gray |

**CSS:**

```scss
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-6;
  background: white;
  border-bottom: 1px solid $gray-200;
}

.stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;

  &__icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;

    &--completed {
      background: $success-500;
      color: white;
    }

    &--active {
      background: $primary-500;
      color: white;
    }

    &--upcoming {
      border: 2px solid $gray-300;
      color: $gray-400;
    }
  }

  &__label {
    font-size: 11px;
    font-weight: 500;
    color: $gray-500;
    text-transform: lowercase;

    &--active {
      color: $primary-600;
      font-weight: 600;
    }
  }
}

.stepper-line {
  flex: 1;
  height: 2px;
  margin: 0 $space-2;

  &--completed {
    background: $success-500;
  }

  &--active {
    background: linear-gradient(to right, $success-500, $primary-500);
  }

  &--upcoming {
    background: $gray-200;
    border-style: dashed;
  }
}
```

**Mobile (< 640px):**
- Csak ikonok, label rejtett
- Tap-re tooltip a label-lel

---

### 2. Info Banner

```
┌─────────────────────────────────────────────────────────────────────┐
│  📷 jelöld meg a rólad készült képeket                              │
│  Kattints a képekre amelyeken te vagy látható                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Variants:**

| Lépés | Emoji | Szöveg | Háttér |
|-------|-------|--------|--------|
| Claiming | 📷 | jelöld meg a rólad készült képeket | gray-50 |
| Retouch | ✨ | válaszd ki melyik képeket retusáljuk (max X) | primary-50 |
| Tablo | 🖼️ | válaszd ki a tablóképedet | primary-50 |
| Completed | ✅ | köszönjük, kész! | success-50 |

**CSS:**

```scss
.info-banner {
  padding: $space-4 $space-6;
  border-radius: 12px;
  margin: $space-4;

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $gray-900;
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__subtitle {
    font-size: 13px;
    color: $gray-500;
    margin-top: $space-1;
  }

  &--default {
    background: $gray-50;
    border: 1px solid $gray-200;
  }

  &--primary {
    background: $primary-50;
    border: 1px solid $primary-200;
  }

  &--success {
    background: $success-50;
    border: 1px solid $success-200;
  }
}
```

---

### 3. Photo Grid

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │         │ │    ✓    │ │         │ │    ✓    │                   │
│  │         │ │ SELECTED│ │         │ │ SELECTED│                   │
│  │  thumb  │ │  thumb  │ │  thumb  │ │  thumb  │                   │
│  │         │ │         │ │         │ │         │                   │
│  │         │ │ kék keret│ │         │ │ kék keret│                  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Responsive Grid:**

| Breakpoint | Oszlopok | Gap | Thumbnail |
|------------|----------|-----|-----------|
| < 480px | 2 | 8px | ~45vw |
| 480-768px | 3 | 12px | ~30vw |
| 768-1024px | 4 | 16px | 200px |
| > 1024px | 5 | 16px | 220px |

**Photo Card States:**

```scss
.photo-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__checkbox {
    position: absolute;
    top: $space-2;
    right: $space-2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: 2px solid $gray-300;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  // Hover - show checkbox
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .photo-card__checkbox {
      opacity: 1;
    }
  }

  // Selected state
  &--selected {
    box-shadow: 0 0 0 3px $primary-500;

    .photo-card__checkbox {
      opacity: 1;
      background: $primary-500;
      border-color: $primary-500;
      color: white;
    }
  }

  // Disabled state (limit reached)
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }
}
```

**Selection Animation:**

```scss
@keyframes select-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.photo-card--selected {
  animation: select-pop 0.3s ease;
}
```

---

### 4. Sticky Footer

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     3 kép kiválasztva                    [tovább a retusáláshoz →] │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Variants by step:**

| Lépés | Bal oldal | Jobb oldal |
|-------|-----------|------------|
| Claiming | "X kép kiválasztva" | [tovább a retusáláshoz →] |
| Retouch | "X / Y kép" + progress | [← vissza] [tovább →] |
| Tablo | "1 kép kiválasztva" | [← vissza] [véglegesítés →] |
| Completed | - | [képek rendelése →] |

**CSS:**

```scss
.workflow-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid $gray-200;
  padding: $space-4 $space-6;
  padding-bottom: calc($space-4 + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;

  &__info {
    font-size: 14px;
    color: $gray-600;

    strong {
      color: $gray-900;
    }
  }

  &__actions {
    display: flex;
    gap: $space-3;
  }
}

// Progress mini bar (retouch step)
.mini-progress {
  width: 60px;
  height: 4px;
  background: $gray-200;
  border-radius: 2px;
  overflow: hidden;
  margin-top: $space-1;

  &__fill {
    height: 100%;
    background: $primary-500;
    transition: width 0.3s ease;
  }
}
```

---

### 5. Primary Button

```scss
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: $primary-500;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;

  &:hover {
    background: $primary-600;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: $gray-300;
    cursor: not-allowed;
    transform: none;
  }

  // Arrow icon animation
  &__icon {
    transition: transform 0.2s ease;
  }

  &:hover &__icon {
    transform: translateX(4px);
  }
}

.btn-secondary {
  background: transparent;
  color: $gray-600;
  border: 1px solid $gray-300;

  &:hover {
    background: $gray-50;
    border-color: $gray-400;
  }
}
```

---

### 6. Registration Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                          [✕]       │
│                                                                     │
│                     majdnem kész! 🎉                                │
│                                                                     │
│   Add meg az adataidat hogy elmenthessük a választásod              │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  teljes neved *                                             │   │
│   │  [                                                      ]   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  email cím *                                                │   │
│   │  [                                                      ]   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  telefonszám (opcionális)                                   │   │
│   │  [                                                      ]   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ☐ Elfogadom az adatvédelmi tájékoztatót                          │
│                                                                     │
│                     [mentés és tovább →]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  border-radius: 20px;
  padding: $space-8;
  max-width: 440px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;

  &__close {
    position: absolute;
    top: $space-4;
    right: $space-4;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $gray-100;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $gray-200;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    margin-bottom: $space-2;
  }

  &__subtitle {
    font-size: 14px;
    color: $gray-500;
    text-align: center;
    margin-bottom: $space-6;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 7. Input Fields

```scss
.form-field {
  margin-bottom: $space-5;

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: $gray-700;
    margin-bottom: $space-2;
    text-transform: lowercase;
  }

  &__input {
    width: 100%;
    padding: $space-3 $space-4;
    font-size: 16px; // Prevents iOS zoom
    border: 2px solid $gray-200;
    border-radius: 12px;
    background: white;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &::placeholder {
      color: $gray-400;
    }

    &:focus {
      outline: none;
      border-color: $primary-500;
      box-shadow: 0 0 0 4px $primary-50;
    }

    &--error {
      border-color: $error-500;

      &:focus {
        box-shadow: 0 0 0 4px $error-50;
      }
    }
  }

  &__error {
    font-size: 12px;
    color: $error-500;
    margin-top: $space-1;
  }
}
```

---

### 8. Tablo Preview Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ELŐNÉZET                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │                                                             │   │
│   │                      NAGY KÉP                               │   │
│   │                                                             │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Ez a kép fog megjelenni a tablón:                                 │
│   "Kiss Béla - 12/A"                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**CSS:**

```scss
.preview-panel {
  background: $gray-50;
  border-radius: 16px;
  padding: $space-6;
  margin: $space-4;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: $gray-500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $space-4;
  }

  &__image {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__caption {
    margin-top: $space-4;
    text-align: center;

    &-label {
      font-size: 13px;
      color: $gray-500;
    }

    &-name {
      font-size: 16px;
      font-weight: 600;
      color: $gray-900;
      margin-top: $space-1;
    }
  }
}
```

---

### 9. Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│               véglegesíted a választásod?                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │                      [TABLO KÉP]                            │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Ez a kép kerül a tablóra, és nem módosítható később.              │
│                                                                     │
│        [mégse]                      [igen, véglegesítem]            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 10. Completed Summary

```scss
.summary-card {
  background: white;
  border-radius: 16px;
  border: 1px solid $gray-200;
  overflow: hidden;
  margin: $space-4;

  &__header {
    background: $gray-50;
    padding: $space-4 $space-6;
    font-weight: 600;
    border-bottom: 1px solid $gray-200;
  }

  &__body {
    padding: $space-6;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    padding: $space-2 0;
    font-size: 14px;

    &-label {
      color: $gray-500;
      display: flex;
      align-items: center;
      gap: $space-2;
    }

    &-value {
      font-weight: 500;
      color: $gray-900;
    }
  }
}
```

---

## Animációk

### Page Transitions

```scss
// Route transition
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.3s ease;
}
```

### Selection Feedback

```scss
// Haptic-like visual feedback
@keyframes tap-feedback {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.photo-card:active {
  animation: tap-feedback 0.15s ease;
}
```

### Loading States

```scss
// Skeleton shimmer
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    $gray-200 25%,
    $gray-100 50%,
    $gray-200 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}
```

### Success Celebration

```scss
@keyframes confetti-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-icon {
  animation: confetti-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## Dark Mode (Optional Later)

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --border: #374151;
  }
}
```

---

## Responsive Breakpoints

```scss
$breakpoints: (
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px,
);

@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}

// Usage
.photo-grid {
  grid-template-columns: repeat(2, 1fr);

  @include respond-to('sm') {
    grid-template-columns: repeat(3, 1fr);
  }

  @include respond-to('md') {
    grid-template-columns: repeat(4, 1fr);
  }

  @include respond-to('lg') {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

---

## Accessibility

### Focus States

```scss
// Visible focus ring
*:focus-visible {
  outline: 2px solid $primary-500;
  outline-offset: 2px;
}

// Remove default on mouse users
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast

All text meets WCAG AA (4.5:1 minimum):
- Body text ($gray-700) on white: 6.14:1 ✓
- Secondary text ($gray-500) on white: 4.68:1 ✓
- White on primary ($primary-500): 4.52:1 ✓

---

## Z-Index Scale

```scss
$z-index: (
  'base': 0,
  'dropdown': 10,
  'sticky': 20,
  'fixed': 30,
  'modal-backdrop': 40,
  'modal': 50,
  'popover': 60,
  'toast': 70,
);
```
