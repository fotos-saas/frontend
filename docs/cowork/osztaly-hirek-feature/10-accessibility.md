# Osztály Hírek - Accessibility (A11y) Specifikáció

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: WCAG 2.1 AA megfelelés

---

## 🎯 Accessibility Elvek

### Célcsoport

| Felhasználó | Igény |
|-------------|-------|
| **Látássérült** | Screen reader támogatás, nagy kontraszt |
| **Mozgáskorlátozott** | Billentyűzet navigáció |
| **Idős tanárok** | Nagy touch target, olvasható szöveg |
| **Kognitív** | Egyszerű nyelv, tiszta struktúra |

### WCAG 2.1 AA Követelmények

| Kritérium | Követelmény |
|-----------|-------------|
| 1.1.1 | Nem-szöveges tartalom: alt text |
| 1.3.1 | Info és kapcsolatok: szemantikus HTML |
| 1.4.3 | Kontraszt minimum: 4.5:1 |
| 2.1.1 | Billentyűzet: minden funkció elérhető |
| 2.4.4 | Link célja: érthető kontextusban |
| 4.1.2 | Név, szerep, érték: ARIA támogatás |

---

## 🏗️ Szemantikus HTML Struktúra

### Feed Lista

```html
<main id="main-content" aria-labelledby="feed-title">
  <h1 id="feed-title" class="sr-only">Osztály hírek</h1>

  <!-- Live region for new items -->
  <div
    aria-live="polite"
    aria-atomic="false"
    class="sr-only"
    id="feed-announcer"
  ></div>

  <!-- Feed list -->
  <ul
    role="feed"
    aria-labelledby="feed-title"
    aria-busy="false"
    class="feed-list"
  >
    <li
      role="article"
      aria-posinset="1"
      aria-setsize="47"
      tabindex="0"
      class="feed-card"
    >
      <!-- Card content -->
    </li>
    <!-- More items... -->
  </ul>

  <!-- Load more -->
  <button
    type="button"
    aria-label="Több hír betöltése"
    aria-controls="feed-list"
  >
    Több betöltése
  </button>
</main>
```

### Feed Card

```html
<article
  class="feed-card"
  tabindex="0"
  role="article"
  aria-labelledby="card-1-title"
  aria-describedby="card-1-content card-1-meta"
>
  <header class="feed-card__header">
    <span class="feed-card__icon" aria-hidden="true">🗳️</span>
    <h2 id="card-1-title" class="feed-card__title">
      Új szavazás indult
    </h2>
    <time
      datetime="2025-01-19T10:30:00Z"
      class="feed-card__time"
    >
      2 órája
    </time>
  </header>

  <p id="card-1-content" class="feed-card__content">
    Melyik sablon tetszik jobban?
  </p>

  <footer id="card-1-meta" class="feed-card__meta">
    <span aria-label="8 a 25-ből szavazott">
      <span aria-hidden="true">8/25</span>
    </span>
    <span aria-label="2 nap van hátra">
      <span aria-hidden="true">⏰ 2 nap</span>
    </span>
  </footer>

  <!-- Implicit link (egész kártya kattintható) -->
  <a
    href="/voting/45"
    class="feed-card__link"
    aria-label="Szavazás megnyitása: Melyik sablon tetszik jobban?"
  >
    <span class="sr-only">Megnyitás</span>
  </a>
</article>
```

---

## 🔔 Notification Bell

```html
<div class="notification-bell" role="region" aria-label="Értesítések">
  <button
    type="button"
    class="notification-bell__trigger"
    aria-expanded="false"
    aria-controls="notification-dropdown"
    aria-haspopup="menu"
    aria-label="Értesítések, 3 olvasatlan"
  >
    <svg aria-hidden="true" class="notification-bell__icon">
      <!-- Bell SVG -->
    </svg>
    <span
      class="notification-bell__badge"
      aria-hidden="true"
    >
      3
    </span>
  </button>

  <div
    id="notification-dropdown"
    class="notification-dropdown"
    role="menu"
    aria-labelledby="notification-title"
    aria-hidden="true"
  >
    <h2 id="notification-title" class="notification-dropdown__title">
      Értesítések
    </h2>

    <ul role="list" class="notification-list">
      <li role="menuitem" tabindex="-1">
        <a
          href="/voting/45"
          class="notification-item notification-item--unread"
          aria-label="Olvasatlan: Új szavazás indult, 2 órája"
        >
          <span class="notification-item__title">Új szavazás indult</span>
          <time datetime="2025-01-19T10:30:00Z">2 órája</time>
        </a>
      </li>
    </ul>

    <button
      type="button"
      class="notification-dropdown__mark-all"
      aria-label="Összes értesítés olvasottnak jelölése"
    >
      Mindet láttam
    </button>
  </div>
</div>
```

---

## 📢 Announcement Banner

```html
<div
  role="alert"
  aria-live="assertive"
  class="announcement-banner announcement-banner--important"
>
  <span class="announcement-banner__icon" aria-hidden="true">📢</span>

  <p class="announcement-banner__message">
    <strong>Fontos:</strong> Holnap 10:00 fotózás! Fehér ing kell!
  </p>

  <button
    type="button"
    class="announcement-banner__dismiss"
    aria-label="Hirdetmény bezárása"
  >
    <svg aria-hidden="true"><!-- X icon --></svg>
  </button>
</div>
```

---

## ⌨️ Billentyűzet Navigáció

### Focus Management

```typescript
// Feed card navigation
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
    case 'j':
      event.preventDefault();
      this.focusNextCard();
      break;

    case 'ArrowUp':
    case 'k':
      event.preventDefault();
      this.focusPreviousCard();
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();
      this.openCard();
      break;

    case 'Home':
      event.preventDefault();
      this.focusFirstCard();
      break;

    case 'End':
      event.preventDefault();
      this.focusLastCard();
      break;
  }
}
```

### Focus Trap (Dropdown)

```typescript
// notification-dropdown.component.ts
private trapFocus() {
  const focusableElements = this.dropdown.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  this.dropdown.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    if (e.key === 'Escape') {
      this.close();
      this.trigger.focus();
    }
  });
}
```

### Skip Link

```html
<!-- app.component.html -->
<a
  href="#main-content"
  class="skip-link"
>
  Ugrás a tartalomhoz
</a>

<style>
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 9999;
  padding: 1rem;
  background: var(--color-primary);
  color: white;

  &:focus {
    left: 1rem;
    top: 1rem;
  }
}
</style>
```

---

## 🎨 Kontraszt és Színek

### Minimum Kontraszt Arányok

| Elem | Foreground | Background | Ratio | OK? |
|------|------------|------------|-------|-----|
| Body text | #1E293B | #FFFFFF | 12.6:1 | ✅ |
| Meta text | #64748B | #FFFFFF | 4.7:1 | ✅ |
| Link | #3B82F6 | #FFFFFF | 4.5:1 | ✅ |
| Badge | #FFFFFF | #EF4444 | 4.6:1 | ✅ |
| Banner important | #7F1D1D | #FEF2F2 | 7.1:1 | ✅ |

### Ne Függj Csak a Színtől

```html
<!-- ROSSZ: Csak szín jelzi az olvasatlant -->
<li style="background: #EFF6FF;">Új üzenet</li>

<!-- JÓ: Ikon + szöveg + szín -->
<li class="notification-item--unread">
  <span class="sr-only">Olvasatlan:</span>
  <span class="unread-dot" aria-hidden="true"></span>
  Új üzenet
</li>
```

### Dark Mode Kontraszt

| Elem | Foreground | Background | Ratio |
|------|------------|------------|-------|
| Body text | #F1F5F9 | #0F172A | 13.1:1 |
| Meta text | #94A3B8 | #0F172A | 5.2:1 |
| Card bg | - | #1E293B | - |

---

## 📢 ARIA Live Regions

### Új Feed Item

```typescript
// news-feed.component.ts
private announceNewItem(item: FeedItem) {
  const announcer = document.getElementById('feed-announcer');
  announcer.textContent = `Új hír: ${item.title}`;

  // Clear after screen reader reads it
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}
```

### Loading States

```html
<div
  aria-live="polite"
  aria-busy="true"
  class="sr-only"
>
  Hírek betöltése...
</div>
```

### Action Feedback

```typescript
// Like feedback
private announceLike(liked: boolean, count: number) {
  const message = liked
    ? `Tetszik jelölve. Összesen ${count} like.`
    : `Tetszik visszavonva. Összesen ${count} like.`;

  this.announcer.announce(message, 'polite');
}
```

---

## 📱 Touch Target Méretek

### Minimum 44x44px

```scss
.feed-card {
  // Egész kártya kattintható
  min-height: 80px;
  padding: 16px;
}

.notification-bell__trigger {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.announcement-banner__dismiss {
  width: 44px;
  height: 44px;
  padding: 10px;
}

.like-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 8px 12px;
}
```

---

## 🔤 Olvashatóság

### Font Sizing

```scss
:root {
  // Base: 16px
  --font-size-sm: 0.875rem;   // 14px
  --font-size-base: 1rem;     // 16px
  --font-size-lg: 1.125rem;   // 18px
  --font-size-xl: 1.25rem;    // 20px

  // Line height
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}

.feed-card__title {
  font-size: var(--font-size-base);
  line-height: var(--line-height-tight);
}

.feed-card__content {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

.feed-card__meta {
  font-size: var(--font-size-sm);
}
```

### Responsive Font

```scss
// Nagyobb font tablet/desktop-on idősebb felhasználóknak
@media (min-width: 768px) {
  :root {
    --font-size-base: 1.0625rem; // 17px
  }
}
```

---

## 🖼️ Képek és Ikonok

### Alt Text

```html
<!-- Thumbnails -->
<img
  src="sample1.jpg"
  alt="Tablókép minta: Klasszikus kék háttér"
  loading="lazy"
/>

<!-- Decorative icon -->
<span aria-hidden="true">🗳️</span>

<!-- Avatar -->
<img
  src="avatar.jpg"
  alt=""
  role="presentation"
/>
<span class="sr-only">Kovács Peti</span>
```

### Icon + Text

```html
<!-- ROSSZ: Csak ikon -->
<button>❤️</button>

<!-- JÓ: Ikon + rejtett szöveg -->
<button aria-label="Tetszik">
  <span aria-hidden="true">❤️</span>
</button>

<!-- LEGJOBB: Ikon + látható szöveg -->
<button>
  <span aria-hidden="true">❤️</span>
  Tetszik
</button>
```

---

## 🔍 Focus Indicators

```scss
// Global focus style
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

// Custom focus for cards
.feed-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

// Remove outline on click (keep for keyboard)
.feed-card:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 📋 Screen Reader Testing

### Tesztelendő Szcenáriók

| Szcenárió | Elvárt viselkedés |
|-----------|-------------------|
| Feed betöltés | "Hírek betöltése... 10 hír betöltve" |
| Kártya navigáció | "1/47. Új szavazás indult, 2 órája" |
| Kártya megnyitás | Navigáció + "Szavazás oldal betöltve" |
| Új értesítés | "3 olvasatlan értesítés" |
| Dropdown megnyitás | "Értesítések menü, 3 elem" |
| Like | "Tetszik jelölve, összesen 4 like" |
| Banner | "Figyelem: Holnap 10:00 fotózás!" |

### Tesztelési Eszközök

- **macOS:** VoiceOver (CMD + F5)
- **Windows:** NVDA (ingyenes)
- **iOS:** VoiceOver (beállítások)
- **Android:** TalkBack (beállítások)

---

## ✅ A11y Checklist

### Strukturális
- [ ] Szemantikus HTML (article, nav, main, header)
- [ ] Heading hierarchy (h1 → h2 → h3)
- [ ] Skip link a navigációhoz
- [ ] Landmarks (role="main", role="navigation")

### Billentyűzet
- [ ] Minden interaktív elem elérhető
- [ ] Tab sorrend logikus
- [ ] Focus trap modálokban/dropdown-ban
- [ ] Escape bezárja a modálokat
- [ ] Arrow key navigáció listákban

### Vizuális
- [ ] Kontraszt minimum 4.5:1
- [ ] Focus indicator minden elemen
- [ ] Ne csak szín jelezzen státuszt
- [ ] Touch target min 44x44px

### Screen Reader
- [ ] ARIA labels minden interaktív elemen
- [ ] Alt text képeknek
- [ ] Live regions dinamikus tartalomhoz
- [ ] Hibák bejelentése

### Motion
- [ ] prefers-reduced-motion támogatás
- [ ] Nincs villogó tartalom
- [ ] Animációk 5mp alatt befejeződnek

### Forms
- [ ] Label minden input-hoz
- [ ] Error messages programozottan összekapcsolva
- [ ] Required mezők jelölve
