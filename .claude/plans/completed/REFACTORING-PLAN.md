# Refactoring Plan: Tailwind + Design System

## 🚀 FASE 1: Z-Index skála reparáció (1-2 óra)

### 1.1 CSS Változók Létrehozása

**Fájl**: `src/styles/z-index.scss`

```scss
// Z-index rendszer - Material Design alapú
:root {
  // Base layers
  --z-hide: -1;                  // Hidden elements
  --z-base: 0;                   // Default

  // Content layers (< 1000)
  --z-dropdown: 100;             // Dropdowns, select menus
  --z-sticky: 100;               // Sticky headers
  --z-tooltip: 150;              // Tooltips (dropdowns felett)

  // Modal/Overlay layers (1000+)
  --z-modal-backdrop: 1040;      // Modal overlay (semi-transparent)
  --z-modal: 1050;               // Modal dialog
  --z-popover: 1060;             // Popover/contextual content
  --z-notification: 1070;        // Toast, snackbar

  // Fixed nav (konfliktusok elkerülése végett)
  --z-navbar-mobile: 1000;       // Mobile menu (navbar felett)
  --z-navbar-overlay: 998;       // Mobile menu backdrop
}

// Komment dokumentáció:
/*
  Z-INDEX HIERARCHIA:

  1070  → Notification (toast, snackbar)
  1060  → Popover (contextual, dropdown lista)
  1050  → Modal dialog (form, dialog box)
  1040  → Modal backdrop (semi-transparent overlay)
  1000  → Navbar mobile menu
   998  → Navbar mobile backdrop
   150  → Tooltip (dropdown felett)
   100  → Dropdown, sticky header
     0  → Base content
    -1  → Hidden elements

  SZABÁLYOK:
  - Navbar mobile NEM lehet felett a modaloknak!
  - Popover mindig modal felett
  - Notification mindig felett
  - Soha ne használj >1100, ha esetleg jön iOS iframe layer
*/
```

### 1.2 SCSS Fájlok Módosítása

**A: navbar.component.scss**

```diff
  .navbar {
    position: sticky;
    top: 0;
-   z-index: 100;
+   z-index: var(--z-sticky);
  }

  .navbar__overlay {
-   z-index: 998;
+   z-index: var(--z-navbar-overlay);
  }

  .navbar__mobile-menu {
-   z-index: 1000;
+   z-index: var(--z-navbar-mobile);
  }
```

**B: lightbox-base.scss**

```diff
  .lightbox {
    &__overlay {
-     z-index: 60000;
+     z-index: var(--z-modal-backdrop);
    }

    &__container {
-     z-index: 60001;
+     z-index: var(--z-modal);
    }
  }
```

**C: dialog komponensek**

```diff
  .contact-edit-dialog {
-   z-index: 50;
+   z-index: var(--z-modal);

    &__overlay {
-     z-index: 10;
+     z-index: var(--z-modal-backdrop);
    }
  }
```

### 1.3 Jelenlegi problémás fájlok:
- ❌ `src/app/features/template-chooser/styles/_lightbox-base.scss` → Fix 60000 (delete!)
- ❌ `src/app/features/template-chooser/styles/_lightbox-mobile.scss` → Fix 60010
- ✅ `src/app/shared/components/navbar/navbar.component.scss` → Already good, just var()

### 1.4 Validálás

```bash
# Keressük meg az összes z-index-et
grep -r "z-index:" src/app --include="*.scss" | sort -t: -k2 -n

# Várt kimenet: -1, 100, 150, 998, 1000, 1040, 1050, 1060, 1070 (nincs 60000!)
```

---

## 🎨 FÁZIS 2: Dark Mode Completion (30 perc)

### 2.1 Theme Service Létrehozása

**Fájl**: `src/app/shared/services/theme.service.ts`

```typescript
import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>('light');
  theme$ = this.theme.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // 1. Próbáld meg localStorage-ből betölteni
    const saved = this.loadFromStorage();
    if (saved) {
      this.setTheme(saved);
      return;
    }

    // 2. Rendszer preferencia
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    }

    // 3. Figyelj a rendszer preferencia változásaira
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Csak ha nincs mentett localStorage
        if (!this.loadFromStorage()) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    this.saveToStorage(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private saveToStorage(theme: Theme): void {
    try {
      localStorage.setItem('kv:ui:theme', theme);
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
  }

  private loadFromStorage(): Theme | null {
    try {
      const saved = localStorage.getItem('kv:ui:theme');
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch (e) {
      console.warn('localStorage unavailable:', e);
      return null;
    }
  }
}
```

### 2.2 App Bootstrap-ban Injektálni

**Fájl**: `src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { ThemeService } from './app/shared/services/theme.service';

bootstrapApplication(AppComponent, {
  providers: [
    // ... other providers
    ThemeService,
  ],
}).catch((err) => console.error(err));
```

### 2.3 Shadow Colors Javítása

**Fájl**: `src/styles.scss`

```diff
  :root {
-   --shadow-color: rgba(0, 0, 0, 0.1);
+   --shadow-color: rgba(0, 0, 0, 0.12);
    --shadow-color-hover: rgba(0, 0, 0, 0.15);
  }

  @media (prefers-color-scheme: dark) {
    :root {
-     --shadow-color: rgba(0, 0, 0, 0.3);
-     --shadow-color-hover: rgba(0, 0, 0, 0.5);
+     --shadow-color: rgba(0, 0, 0, 0.4);
+     --shadow-color-hover: rgba(0, 0, 0, 0.6);
    }
  }
```

---

## 📐 FÁZIS 3: Tailwind Integration (2-3 óra, iterativ)

### 3.1 Tailwind Config Frissítése

**Fájl**: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Primér szín paletta
        primary: {
          50:  '#eff6ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Sötétség paletta (dark mode CSS vars helyett)
        neutral: {
          50:  '#f9fafb',
          900: '#1f2937',
        },
      },
      spacing: {
        'safe-gap': 'var(--safe-gap, 1rem)',
      },
      fontSize: {
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',    { lineHeight: '1.5rem' }],
        'lg':  ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.75rem',  { lineHeight: '2.25rem' }],
      },
      zIndex: {
        hide: '-1',
        dropdown: '100',
        tooltip: '150',
        backdrop: '1040',
        modal: '1050',
        popover: '1060',
        notification: '1070',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      animation: {
        shimmer: 'shimmer 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },
  corePlugins: {
    preflight: true, // Default Tailwind reset
  },
  plugins: [],
};
```

### 3.2 CSS Components Layer

**Fájl**: `src/styles/components.scss`

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  // Button Primary
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg
           font-medium transition-all duration-fast
           hover:bg-primary-700 active:scale-95
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-600;
  }

  // Card
  .card {
    @apply bg-white dark:bg-gray-900 rounded-lg shadow-sm
           hover:shadow-md transition-shadow duration-fast;
  }

  // Form Input
  .form-input {
    @apply w-full px-3 py-2 bg-gray-50 dark:bg-gray-800
           border-2 border-gray-300 dark:border-gray-700
           rounded-lg text-gray-900 dark:text-white
           focus:outline-none focus:border-primary-600
           focus:ring-4 focus:ring-primary-600/10
           disabled:opacity-50 disabled:cursor-not-allowed
           transition-all duration-fast;

    &::placeholder {
      @apply text-gray-400 dark:text-gray-600;
    }
  }

  .form-input--error {
    @apply border-red-600 focus:ring-red-600/10;
  }

  // Grid Responsive
  .grid-responsive {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .grid-responsive-3 {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  // Skeleton Loader
  .skeleton {
    @apply bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100
           dark:from-gray-800 dark:via-gray-700 dark:to-gray-800
           bg-[length:200%_100%] animate-shimmer;
  }
}
```

### 3.3 Komponens Refactoring Sorrend

**Prioritás**:
1. `template-chooser.component.html` (grid, cards) → Tailwind
2. `form-elements.scss` (form inputs) → Tailwind @layer
3. `navbar.component.scss` (mobilité) → Tailwind responsive
4. `footer.component.scss` (simple layout) → Tailwind

**Példa Refactoring**: Template Card

ELŐBB:
```scss
// template-chooser.component.scss
.template-card {
  position: relative;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px -12px rgba(0, 0, 0, 0.18);
    border-color: #d1d5db;
  }
}
```

UTÁN (Tailwind):
```html
<div class="relative bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700
            rounded-lg overflow-hidden cursor-pointer
            transition-all duration-300
            hover:-translate-y-1.5 hover:shadow-xl hover:border-gray-400 dark:hover:border-gray-600">
  <!-- content -->
</div>
```

---

## 🎯 FÁZIS 4: Animation Standardizáció (1 óra)

### 4.1 Animation Timing Skála

**Fájl**: `src/styles/animations.scss`

```scss
// Timing standardizáció
:root {
  // Milliseconds (millszekundum)
  --duration-fast: 150ms;     // 0.15s - snappy user interactions
  --duration-normal: 250ms;   // 0.25s - most transitions
  --duration-slow: 400ms;     // 0.4s - deliberate movements

  // Easing functions
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}

// Az összes transition/animation frissítése
.navbar__mobile-menu {
  transition: transform var(--duration-normal) var(--ease-in-out);
}

.lightbox__image {
  transition: opacity var(--duration-fast) var(--ease-out),
              filter var(--duration-fast) var(--ease-out);
}

.form-input:focus {
  transition: border-color var(--duration-fast) var(--ease-in-out),
              box-shadow var(--duration-fast) var(--ease-in-out);
}

.spinner {
  animation: spin var(--duration-slow) linear infinite;
}

.skeleton {
  animation: shimmer var(--duration-slow) var(--ease-in-out) infinite;
}

// Reduced Motion
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

### 4.2 SCSS Fájlok Frissítése

```bash
# Ezeket kellene végig keresni és `var(--duration-normal)` stb.-re módosítani

grep -r "transition:" src/app --include="*.scss" | grep -v "var(--duration"

# Cada match-et le kellene cserélni a duration variables-ra
```

---

## ✅ FÁZIS 5: Accessibility (2-3 óra, iterativ)

### 5.1 aria-label Checklist

**Buttons Without Text**:
```html
<!-- ❌ ELŐBB -->
<button class="navbar__hamburger">
  <span class="navbar__hamburger-line"></span>
  <span class="navbar__hamburger-line"></span>
  <span class="navbar__hamburger-line"></span>
</button>

<!-- ✅ UTÁN -->
<button class="navbar__hamburger"
        aria-label="Menü"
        [attr.aria-expanded]="isMenuOpen()">
  ...
</button>
```

**Interactive Cards**:
```html
<!-- ❌ ELŐBB -->
<div class="template-card" (click)="select()">
  <img src="..." alt="Template">
  <span>Template Name</span>
</div>

<!-- ✅ UTÁN -->
<button class="template-card"
        [attr.aria-pressed]="isSelected"
        [attr.aria-label]="'Template kiválasztása: ' + templateName">
  <img src="..." [attr.alt]="templateName">
  <span>{{ templateName }}</span>
</button>
```

### 5.2 WCAG Error State

```html
<!-- Error message with icon + accessible association -->
<div class="form-group">
  <label for="email">Email <span class="text-red-600">*</span></label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    [class.form-input--error]="form.get('email')?.invalid"
  >
  <div id="email-error" role="alert" *ngIf="form.get('email')?.invalid" class="form-error">
    <span aria-hidden="true">⚠</span>
    Érvényes email-t adjon meg
  </div>
</div>
```

---

## 📋 IMPLEMENTÁLÁSI ROADMAP

```
HETI TIMELINE:
┌─ Hétfő (3 óra)
│  ├─ Z-index CSS variables (1 óra)
│  ├─ Navbar/Lightbox módosítása (1 óra)
│  ├─ Testing z-index conflicts (1 óra)
│
├─ Kedd (2 óra)
│  ├─ Theme Service (1 óra)
│  ├─ App bootstrap + localStorage (1 óra)
│
├─ Szerda-Csütörtök (4-5 óra)
│  ├─ Tailwind config (1 óra)
│  ├─ Form elements refactor (2 óra)
│  ├─ Template chooser grid (1-2 óra)
│
└─ Péntek (2-3 óra)
   ├─ Animation standardizáció (1 óra)
   ├─ Accessibility audit (1-2 óra)
   ├─ Testing + cross-browser check
```

**Total: ~12-15 óra (2 nap aktív munka)**

---

## 🧪 TESTING CHECKLIST

```bash
# Build validálás
npm run build

# Tailwind PurgeCSS Check
npm run build -- --prod
# Ellenőrizd a bundle size-t

# Z-index validálás
grep -r "z-index:" src --include="*.scss" | grep -v "var(--z"

# Dark mode tesztelés
# 1. System dark mode ON → vizuálisan ellenőrizz
# 2. LocalStorage 'kv:ui:theme' = 'dark'
# 3. Refresh → dark mode maradjon

# Accessibility
# 1. Tab navigation → összes button elérhető?
# 2. Screen reader → aria-label-ek működnek?
# 3. Focus states → outline látható?

# Safari tesztelés
# 1. Nincs flexbox gap (már fixed)
# 2. CSS variables működnek
# 3. Animation perform OK
```

---

## 📞 RESOURCE LINKS

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Z-Index MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)
- [WCAG 2.1 Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Timing](https://material.io/design/motion/speed.html)
