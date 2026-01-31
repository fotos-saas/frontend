# Osztály Hírek - Animációk Specifikáció

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Subtle, performant micro-interactions

---

## 🎯 Animációs Elvek

### Szabályok

| Elv | Leírás |
|-----|--------|
| **Purposeful** | Minden animációnak célja van (feedback, direction, continuity) |
| **Quick** | Max 300ms, általában 150-200ms |
| **Subtle** | Ne vonja el a figyelmet a tartalomról |
| **Performant** | Csak transform és opacity (GPU accelerated) |
| **Respectful** | `prefers-reduced-motion` támogatás |

### Timing Functions

```scss
// Gyors belépés, lassú kilépés (természetes)
$ease-out: cubic-bezier(0.33, 1, 0.68, 1);

// Lassú belépés, gyors kilépés
$ease-in: cubic-bezier(0.32, 0, 0.67, 0);

// Gyors mindkét végén
$ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

// Spring-like bounce
$spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 📰 Feed Animációk

### 1. Feed Card Megjelenés (Staggered Entry)

**Mikor:** Feed betöltődik

```scss
.feed-card {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 200ms $ease-out forwards;

  // Staggered delay
  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 50}ms;
    }
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Időzítés:**
- Duration: 200ms
- Delay: 50ms * index (max 500ms)
- Easing: ease-out

---

### 2. Új Feed Item (Real-time)

**Mikor:** WebSocket-en új item jön

```scss
.feed-card--new {
  animation: slideInFromTop 300ms $spring;
  background-color: var(--color-highlight);

  // Highlight fade
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--color-primary);
    opacity: 0.1;
    animation: highlightFade 2s ease-out forwards;
  }
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes highlightFade {
  to {
    opacity: 0;
  }
}
```

---

### 3. Feed Card Hover (Desktop)

**Mikor:** Mouse hover

```scss
.feed-card {
  transition: transform 150ms $ease-out,
              box-shadow 150ms $ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    transition-duration: 50ms;
  }
}
```

---

### 4. Feed Card Tap (Mobile)

**Mikor:** Touch tap

```scss
.feed-card {
  // Touch feedback
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
    transition: transform 100ms $ease-out;
  }
}
```

---

### 5. Pull-to-Refresh

**Mikor:** User húzza le a feed-et

```scss
.ptr-spinner {
  transform: rotate(0deg);
  animation: spin 1s linear infinite;
  opacity: 0;
  transition: opacity 150ms $ease-out;

  &--visible {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Pull indicator
.ptr-indicator {
  transform: translateY(var(--pull-distance, 0));
  transition: none; // User controls this

  &--releasing {
    transition: transform 200ms $spring;
  }
}
```

---

### 6. "Több betöltése" Loading

**Mikor:** Loading more items

```scss
.load-more-btn {
  position: relative;

  &--loading {
    color: transparent;

    &::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-primary);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}
```

---

### 7. Skeleton Loading

**Mikor:** Kezdeti betöltés

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton) 0%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton--text {
  height: 16px;
  margin-bottom: 8px;

  &:last-child {
    width: 60%;
  }
}

.skeleton--avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
```

---

## 🔔 Notification Animációk

### 1. Badge Bounce

**Mikor:** Új értesítés érkezik

```scss
.notification-badge {
  transition: transform 200ms $spring;

  &--new {
    animation: badgeBounce 400ms $spring;
  }
}

@keyframes badgeBounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
```

---

### 2. Dropdown Open/Close

**Mikor:** Harang kattintás

```scss
.notification-dropdown {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transform-origin: top right;
  pointer-events: none;
  transition: opacity 150ms $ease-out,
              transform 150ms $ease-out;

  &--open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
}

// Backdrop fade
.notification-backdrop {
  opacity: 0;
  transition: opacity 150ms $ease-out;

  &--visible {
    opacity: 1;
  }
}
```

---

### 3. Notification Item Hover

**Mikor:** Mouse hover (unread item)

```scss
.notification-item {
  transition: background-color 100ms $ease-out;

  &:hover {
    background-color: var(--color-hover);
  }

  &--unread {
    background-color: var(--color-unread-bg);

    &:hover {
      background-color: var(--color-unread-hover);
    }
  }
}
```

---

### 4. Mark All Read

**Mikor:** "Mindet láttam" gomb

```scss
.notification-item {
  &--marking-read {
    animation: fadeOutSlide 200ms $ease-in forwards;
  }
}

@keyframes fadeOutSlide {
  to {
    opacity: 0.5;
    transform: translateX(10px);
  }
}

// Badge countdown
.notification-badge {
  &--clearing {
    animation: countDown 300ms $ease-out forwards;
  }
}

@keyframes countDown {
  to {
    transform: scale(0);
    opacity: 0;
  }
}
```

---

## 📢 Banner Animációk

### 1. Banner Slide In

**Mikor:** Aktív hirdetmény van

```scss
.announcement-banner {
  transform: translateY(-100%);
  animation: bannerSlideIn 300ms $ease-out 500ms forwards;
}

@keyframes bannerSlideIn {
  to {
    transform: translateY(0);
  }
}
```

---

### 2. Banner Dismiss

**Mikor:** X gomb kattintás

```scss
.announcement-banner {
  &--dismissing {
    animation: bannerSlideOut 200ms $ease-in forwards;
  }
}

@keyframes bannerSlideOut {
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}
```

---

### 3. Banner Color Pulse (Important)

**Mikor:** Fontos hirdetmény

```scss
.announcement-banner--important {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--color-danger);
    opacity: 0;
    animation: pulseOnce 1s $ease-out;
  }
}

@keyframes pulseOnce {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
  }
}
```

---

## ❤️ Like Animáció

### Instagram-style Heart

**Mikor:** Like gomb kattintás

```scss
.like-btn {
  position: relative;

  &__icon {
    transition: transform 150ms $spring,
                color 150ms $ease-out;
  }

  &--liked .like-btn__icon {
    color: var(--color-danger);
    transform: scale(1.2);
  }

  // Burst effect
  &--liked::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--color-danger);
    opacity: 0;
    animation: likeBurst 400ms $ease-out;
  }
}

@keyframes likeBurst {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

---

### Like Count Increment

**Mikor:** Like szám változik

```scss
.like-count {
  &--incrementing {
    animation: countBump 200ms $spring;
  }
}

@keyframes countBump {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
```

---

## 📊 Progress Bar Animáció

### Voting Progress

**Mikor:** Szavazás kártya megjelenik

```scss
.progress-bar__fill {
  width: 0;
  animation: progressGrow 600ms $ease-out 200ms forwards;
}

@keyframes progressGrow {
  to {
    width: var(--progress-percent);
  }
}
```

---

## ♿ Accessibility - Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  // Kivételek ahol fontos a feedback
  .skeleton {
    animation: none;
    background: var(--color-skeleton);
  }

  // Loading spinner marad
  .spinner {
    animation-duration: 1s !important;
  }
}
```

---

## 📐 Performance Guidelines

### DO ✅

```scss
// GPU accelerated
transform: translateY(10px);
transform: scale(1.1);
opacity: 0.5;
```

### DON'T ❌

```scss
// Layout triggering (AVOID)
width: 100px;
height: 100px;
margin: 10px;
padding: 10px;
left: 10px;
top: 10px;
```

### will-change Használat

```scss
// Csak ha valóban szükséges
.feed-card--animating {
  will-change: transform, opacity;
}

// Animáció után töröld
.feed-card {
  will-change: auto;
}
```

---

## 📋 Animation Inventory

| Element | Trigger | Duration | Easing |
|---------|---------|----------|--------|
| Feed card enter | Page load | 200ms | ease-out |
| Feed card hover | Mouse hover | 150ms | ease-out |
| New feed item | WebSocket | 300ms | spring |
| Dropdown open | Click | 150ms | ease-out |
| Badge bounce | New notification | 400ms | spring |
| Banner slide | Page load | 300ms | ease-out |
| Like heart | Click | 150ms | spring |
| Like burst | Click | 400ms | ease-out |
| Progress bar | Card visible | 600ms | ease-out |
| Skeleton shimmer | Loading | 1500ms | linear |
| Spinner | Loading | 800ms | linear |

---

## ✅ Checklist

### Feed
- [ ] Card staggered entry
- [ ] New item slide-in
- [ ] Card hover effect
- [ ] Card tap feedback
- [ ] Pull-to-refresh spinner
- [ ] Load more loading state
- [ ] Skeleton loading

### Notifications
- [ ] Badge bounce
- [ ] Dropdown open/close
- [ ] Item hover
- [ ] Mark all read animation

### Banner
- [ ] Slide in
- [ ] Dismiss slide out
- [ ] Important pulse

### Interactions
- [ ] Like heart animation
- [ ] Like burst effect
- [ ] Like count bump
- [ ] Progress bar grow

### Accessibility
- [ ] prefers-reduced-motion support
- [ ] Focus visible states
- [ ] No motion sickness triggers
