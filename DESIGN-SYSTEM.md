# Design System & Tailwind Quick Reference

## 🎨 COLOR PALETTE

### Primary Colors
```
Blue 50:   #eff6ff
Blue 500:  #3b82f6
Blue 600:  #2563eb (DEFAULT PRIMÉR)
Blue 700:  #1d4ed8
```

### Status Colors
```
Success:   #22c55e (Green-500)
Error:     #dc2626 (Red-600)
Warning:   #f59e0b (Amber-500)
Info:      #3b82f6 (Blue-500)
```

### Neutral (Light Mode)
```
Background 50:    #f9fafb
Text Primary:     #1f2937 (Gray-900) - 14.8:1 kontraszt ✅
Text Secondary:   #4b5563 (Gray-600) - 7.1:1 kontraszt ✅ WCAG AA
Text Muted:       #6b7280 (Gray-500) - 4.6:1 kontraszt ✅ WCAG AA
Border:           #e5e7eb (Gray-200)
Shadow:           rgba(0, 0, 0, 0.12)
```

### Neutral (Dark Mode)
```
Background 900:   #1f2937
Text Primary:     #f9fafb (Gray-50) - 15.3:1 kontraszt ✅
Text Secondary:   #d1d5db (Gray-300) - 9.7:1 kontraszt ✅ WCAG AAA
Text Muted:       #9ca3af (Gray-400) - 4.8:1 kontraszt ✅ WCAG AA (dark mode-ban)
Border:           #374151 (Gray-700)
Shadow:           rgba(0, 0, 0, 0.4)
```

## 📏 SPACING SCALE

```
xs:   0.25rem (4px)
sm:   0.5rem  (8px)
md:   1rem    (16px)
lg:   1.5rem  (24px)
xl:   2rem    (32px)
2xl:  3rem    (48px)
```

**Safari Gap Alternative** (NO flexbox gap!):
```scss
// Container
display: flex;
margin: -0.5rem;  // Negative margin of gap/2

// Children
> * {
  margin: 0.5rem;  // Gap amount
}
```

## 🔤 TYPOGRAPHY

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Sizes
```
xs:   0.75rem  (12px) - Labels, helper text
sm:   0.875rem (14px) - Body small, captions
base: 1rem     (16px) - Body text (default)
lg:   1.125rem (18px) - Subheading
xl:   1.25rem  (20px) - Heading 3
2xl:  1.75rem  (28px) - Heading 1
```

### Font Weights
```
400: Regular (body)
500: Medium (labels, small headings)
600: Semibold (headings, buttons)
700: Bold (main headings)
```

### Line Height
```
xs:   1rem
sm:   1.25rem
base: 1.5rem
lg:   1.75rem
```

## ⏱️ ANIMATION TIMING

```
Fast:     150ms  (0.15s) - Quick interactions (hover, focus)
Normal:   250ms  (0.25s) - Most transitions (default)
Slow:     400ms  (0.4s)  - Deliberate movements (modals, drawers)
Loading:  1s     (1s)    - Spinners, shimmer
```

### Easing Functions
```
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  // Material default
ease-out:    cubic-bezier(0, 0, 0.2, 1)    // Enter animations
ease-in:     cubic-bezier(0.4, 0, 1, 1)    // Exit animations
linear:      linear                         // Spinners only
```

## 📦 Z-INDEX SCALE

```
-1:   Hidden elements
0:    Base content
100:  Dropdowns, sticky headers
150:  Tooltips
1000: Navbar mobile menu
998:  Navbar overlay backdrop
1040: Modal backdrop
1050: Modal dialog
1060: Popover
1070: Notification (toast)
```

## 🎯 COMPONENT CLASSES

### Button
```html
<!-- Primary -->
<button class="btn-primary">Submit</button>

<!-- Secondary -->
<button class="btn-secondary">Cancel</button>

<!-- Icon Only (44x44 min) -->
<button class="p-2.5 hover:bg-gray-100 rounded-lg">
  <svg class="w-5 h-5"></svg>
</button>
```

### Card
```html
<div class="card p-4 md:p-6">
  <h3 class="font-semibold text-lg mb-2">Title</h3>
  <p class="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

### Form Input
```html
<div class="form-group">
  <label class="form-label">Label <span class="text-red-600">*</span></label>
  <input type="text" class="form-input">
  <p class="form-error" *ngIf="error">Error message</p>
</div>
```

### Grid Layout
```html
<!-- 2 columns mobile, 3 tablet, 4 desktop -->
<div class="grid-responsive">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
</div>

<!-- Tailwind equivalent -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  ...
</div>
```

### Loading Skeleton
```html
<div class="space-y-3">
  <div class="skeleton h-4 w-3/4"></div>
  <div class="skeleton h-4 w-1/2"></div>
  <div class="skeleton h-8 w-full"></div>
</div>
```

### Mobile-First Responsive
```html
<!-- Mobile: 100%, Tablet (md): 50%, Desktop (lg): 33% -->
<div class="w-full md:w-1/2 lg:w-1/3">Content</div>

<!-- Nested responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="col-span-1 md:col-span-2">Full width on desktop</div>
</div>
```

## 🎬 COMMON ANIMATIONS

### Fade In
```html
<div class="opacity-0 animate-fadeIn">Content</div>
```

```scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 250ms ease-out;
}
```

### Slide In
```scss
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInUp {
  animation: slideInUp 250ms ease-out;
}
```

### Scale
```html
<button class="hover:scale-105 active:scale-95 transition-transform duration-fast">
  Click me
</button>
```

### Shimmer (Loading)
```scss
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1s ease-in-out infinite;
}
```

## ♿ ACCESSIBILITY PATTERNS

### Focus Visible
```scss
.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Touch Target (44x44 minimum)
```scss
.button,
.navbar__hamburger {
  min-width: 44px;
  min-height: 44px;
}
```

### Reduced Motion
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Semantic HTML + ARIA
```html
<!-- Icon Button -->
<button aria-label="Menu megnyitása">
  <svg aria-hidden="true"></svg>
</button>

<!-- Form Error -->
<input aria-describedby="error-id">
<p id="error-id" role="alert">Error message</p>

<!-- Loading State -->
<button aria-busy="true">
  Loading... <span aria-hidden="true">⏳</span>
</button>
```

## 📱 RESPONSIVE BREAKPOINTS

```
DEFAULT (Mobile):  0px
sm:                640px  (Small tablet)
md:                768px  (Tablet)
lg:                1024px (Small laptop)
xl:                1280px (Desktop)
2xl:               1536px (Large desktop)
```

### Usage Pattern
```html
<!-- Mobile first -->
<div class="text-sm sm:text-base lg:text-lg">
  Text grows with screen size
</div>

<!-- Grid responsive -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 1 col mobile, 2 col tablet, 3 col desktop -->
</div>

<!-- Visibility -->
<nav class="hidden lg:flex">Desktop nav</nav>
<div class="lg:hidden">Mobile nav</div>
```

## 🎨 DARK MODE

### CSS Variables (Automatic)
```html
<!-- Automatically switches based on system preference -->
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

### Manual Dark Mode Class
```scss
.dark {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
}

// or use Tailwind dark: prefix
class="dark:bg-gray-900"
```

### Theme Service (TypeScript)
```typescript
// Inject ThemeService
constructor(private theme: ThemeService) {}

// Toggle theme
toggleTheme() {
  this.theme.toggleTheme();
}

// Watch theme changes
this.theme.theme$.subscribe(theme => {
  console.log('Theme changed to:', theme);
});
```

## 🚀 BEST PRACTICES

### ✅ DO
- Mobile-first responsive (sm, md, lg)
- CSS variables for theme colors
- Tailwind @layer for components
- Semantic HTML with aria-labels
- Touch targets ≥ 44x44px
- Focus-visible for keyboard nav
- Transition/animation with variables
- LocalStorage for user preferences

### ❌ DON'T
- Hardcoded colors (#2563eb)
- Flexbox gap (Safari issue!)
- Inline styles (use classes)
- Magic z-index numbers
- Inconsistent timing (0.1s vs 0.8s)
- Animations without reduced-motion
- Missing alt text on images
- Disabled buttons without styling
- Clickable divs (use <button>)

## 🔧 COMMON PATTERNS

### Button Variants
```html
<!-- Primary -->
<button class="btn-primary">Save</button>

<!-- Destructive -->
<button class="btn-destructive">Delete</button>

<!-- Ghost -->
<button class="btn-ghost">More options</button>

<!-- Loading -->
<button class="btn-primary opacity-70" disabled>
  <span aria-hidden="true">⏳</span> Loading...
</button>
```

### Form Field Pattern
```html
<div class="form-group">
  <label for="name" class="form-label">
    Name <span class="text-red-600" aria-label="required">*</span>
  </label>
  <input
    id="name"
    type="text"
    class="form-input"
    aria-describedby="name-error"
    required
  >
  <p id="name-error" role="alert" class="form-error" *ngIf="error">
    Please enter your name
  </p>
</div>
```

### Modal/Dialog
```html
<div class="fixed inset-0 z-modal-backdrop bg-black/50" (click)="close()">
  <div class="fixed inset-4 z-modal bg-white dark:bg-gray-900 rounded-lg shadow-xl
              sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md
              sm:-translate-x-1/2 sm:-translate-y-1/2">
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">Dialog Title</h2>
      <p class="text-gray-600 dark:text-gray-400">Content here</p>
      <div class="mt-6 flex gap-3 justify-end">
        <button class="btn-ghost" (click)="close()">Cancel</button>
        <button class="btn-primary" (click)="confirm()">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

---

**Dokumentáció verzió**: 1.0
**Utolsó frissítés**: 2025-01-08
