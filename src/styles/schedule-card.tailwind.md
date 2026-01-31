# Schedule Card - Tailwind CSS Utility Classes

> Alternatív megvalósítás SCSS helyett, Tailwind utility classes-ekkel

## Color Token Mapping

```css
/* Tailwind config extension - tailwind.config.js */
export default {
  theme: {
    extend: {
      colors: {
        'schedule-card': {
          'bg': '#ffffff',
          'border': '#e5e7eb',
          'border-hover': '#d1d5db',
          'success-bg': '#ecfdf5',
          'success-border': '#a7f3d0',
          'success-text': '#047857',
          'success-icon-bg': '#d1fae5',
          'warning-bg': '#fffbeb',
          'warning-border': '#fde68a',
          'warning-text': '#b45309',
          'warning-icon-bg': '#fef3c7',
          'icon-primary': '#3b82f6',
          'label': '#6b7280',
          'value': '#374151',
          'secondary': '#9ca3af',
        }
      },
      keyframes: {
        slideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          }
        },
      },
      animation: {
        slideInLeft: 'slideInLeft 0.3s ease-out',
      }
    },
  },
}
```

## Base Component (Tailwind Classes)

### Default State (Empty/Warning)

```html
<div class="schedule-card schedule-card--warning">
  <!-- Icon Container -->
  <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-schedule-card-warning-icon-bg">
    <svg class="w-6 h-6 text-schedule-card-warning-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>

  <!-- Content -->
  <div class="flex-1 flex flex-col gap-1 min-w-0">
    <span class="text-xs font-semibold text-schedule-card-label uppercase tracking-wide">
      Fotózás időpontja
    </span>
    <span class="text-sm font-medium text-schedule-card-warning-text truncate">
      Még nincs időpont
    </span>
    <span class="text-xs font-semibold text-schedule-card-secondary uppercase tracking-wide">
      Kötelező kitölteni
    </span>
  </div>

  <!-- Action Button -->
  <button class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-schedule-card-border hover:bg-schedule-card-icon-primary hover:border-schedule-card-icon-primary hover:text-white transition-all duration-200 focus:outline-2 focus:outline-offset-2 focus:outline-schedule-card-icon-primary">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  </button>
</div>
```

### Success State (Filled)

```html
<div class="schedule-card schedule-card--success">
  <!-- Icon Container -->
  <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-schedule-card-success-icon-bg">
    <svg class="w-6 h-6 text-schedule-card-success-text" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  </div>

  <!-- Content -->
  <div class="flex-1 flex flex-col gap-1 min-w-0">
    <span class="text-xs font-semibold text-schedule-card-label uppercase tracking-wide">
      Fotózás időpontja
    </span>
    <span class="text-sm font-medium text-schedule-card-success-text truncate">
      2025. március 15. 10:00
    </span>
    <span class="text-xs font-semibold text-schedule-card-success-text uppercase tracking-wide">
      Rögzítve
    </span>
  </div>

  <!-- Action Button -->
  <button class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-schedule-card-border hover:bg-schedule-card-icon-primary hover:border-schedule-card-icon-primary hover:text-white transition-all duration-200 focus:outline-2 focus:outline-offset-2 focus:outline-schedule-card-icon-primary">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </button>
</div>
```

## Angular Component Integration

```typescript
// schedule-card.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-schedule-card',
  template: `
    <div [ngClass]="cardClasses" (click)="onEdit()">
      <!-- Icon -->
      <div [ngClass]="iconClasses">
        <svg *ngIf="!isLoading" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span *ngIf="isLoading" class="animate-pulse">●</span>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col gap-1 min-w-0">
        <span class="text-xs font-semibold text-schedule-card-label uppercase tracking-wide">
          {{ label }}
        </span>
        <span class="text-sm font-medium truncate" [ngClass]="valueClasses">
          {{ value || 'Még nincs időpont' }}
        </span>
        <span class="text-xs font-semibold uppercase tracking-wide" [ngClass]="statusClasses">
          {{ statusText }}
        </span>
      </div>

      <!-- Action Button -->
      <button
        class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 hover:text-white focus:outline-2 focus:outline-offset-2"
        [ngClass]="actionClasses"
        (click)="onEdit(); $event.stopPropagation()"
        [disabled]="isDisabled">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  `,
  host: {
    '[ngClass]': 'hostClasses'
  }
})
export class ScheduleCardComponent {
  @Input() value: string | null = null;
  @Input() isLoading = false;
  @Input() isDisabled = false;

  label = 'Fotózás időpontja';

  get isSuccess(): boolean {
    return !!this.value;
  }

  get hostClasses(): string {
    const base = 'flex flex-row items-center gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer';
    const stateClass = this.isSuccess ? 'bg-schedule-card-success-bg border-schedule-card-success-border' : 'bg-schedule-card-warning-bg border-schedule-card-warning-border';
    const hover = this.isDisabled ? '' : 'hover:border-schedule-card-border-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0';
    return `${base} ${stateClass} ${hover}`;
  }

  get cardClasses(): string {
    return 'w-full flex flex-row items-center gap-4 md:gap-4 sm:gap-3 sm:flex-col sm:items-start';
  }

  get iconClasses(): string {
    const base = 'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200';
    if (this.isSuccess) {
      return `${base} bg-schedule-card-success-icon-bg`;
    }
    return `${base} bg-schedule-card-warning-icon-bg`;
  }

  get valueClasses(): string {
    return this.isSuccess ? 'text-schedule-card-success-text' : 'text-schedule-card-warning-text';
  }

  get statusClasses(): string {
    return this.isSuccess ? 'text-schedule-card-success-text' : 'text-schedule-card-warning-text';
  }

  get statusText(): string {
    return this.isSuccess ? 'Rögzítve' : 'Kötelező kitölteni';
  }

  get actionClasses(): string {
    const base = 'border-schedule-card-border text-schedule-card-secondary focus:outline-schedule-card-icon-primary';
    const hover = this.isDisabled ? '' : 'hover:bg-schedule-card-icon-primary hover:border-schedule-card-icon-primary';
    return `${base} ${hover}`;
  }

  onEdit(): void {
    if (!this.isDisabled) {
      // Emit event vagy navigate
      console.log('Edit schedule clicked');
    }
  }
}
```

## Responsive Behavior

### Mobile (max-width: 640px)

```html
<!-- Stack layout on mobile -->
<div class="flex flex-col items-start gap-3 p-3 rounded-lg border">
  <!-- Icon stays same size -->
  <div class="w-10 h-10 rounded-lg bg-schedule-card-warning-icon-bg flex items-center justify-center">
    <svg class="w-5 h-5" ... />
  </div>

  <!-- Content full width -->
  <div class="w-full flex flex-col gap-1">
    <span class="text-xs font-semibold uppercase">Fotózás időpontja</span>
    <span class="text-sm font-medium">2025. március 15. 10:00</span>
    <span class="text-xs font-semibold uppercase">Rögzítve</span>
  </div>

  <!-- Button full width -->
  <button class="w-full h-9 rounded-lg border flex items-center justify-center">
    <svg class="w-5 h-5" ... />
  </button>
</div>
```

### Tablet (max-width: 768px)

```html
<!-- Slightly compressed layout -->
<div class="flex items-center gap-3 p-3 rounded-lg border">
  <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
    <svg class="w-5 h-5" ... />
  </div>
  <div class="flex-1 flex flex-col gap-0.5 min-w-0">
    <span class="text-xs font-semibold uppercase">Fotózás időpontja</span>
    <span class="text-sm font-medium truncate">2025. március 15. 10:00</span>
    <span class="text-xs font-semibold uppercase">Rögzítve</span>
  </div>
  <button class="w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0">
    <svg class="w-4 h-4" ... />
  </button>
</div>
```

## CSS Custom Properties for Dark Mode

```css
/* Add to global CSS or Tailwind config */
@media (prefers-color-scheme: dark) {
  :root {
    --schedule-card-bg: #1f2937;
    --schedule-card-border: #374151;
    --schedule-card-border-hover: #4b5563;
    --schedule-card-success-bg: #064e3b;
    --schedule-card-success-border: #10b981;
    --schedule-card-success-text: #a7f3d0;
    --schedule-card-success-icon-bg: #047857;
    --schedule-card-warning-bg: #78350f;
    --schedule-card-warning-border: #f59e0b;
    --schedule-card-warning-text: #fcd34d;
    --schedule-card-warning-icon-bg: #b45309;
    --schedule-card-label: #9ca3af;
    --schedule-card-value: #f3f4f6;
    --schedule-card-secondary: #6b7280;
  }
}
```

## Animation & Transition Classes

```html
<!-- Animate in -->
<div class="animate-slideInLeft">
  <app-schedule-card />
</div>

<!-- Loading state -->
<div class="schedule-card schedule-card--warning">
  <div class="animate-pulse w-12 h-12 rounded-lg bg-schedule-card-warning-icon-bg"></div>
  ...
</div>
```

## Accessibility (a11y) Features

```html
<!-- Focus states -->
<div class="focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-schedule-card-icon-primary">
  <button class="focus:outline-2 focus:outline-offset-2 focus:outline-schedule-card-icon-primary">
    Edit
  </button>
</div>

<!-- High contrast -->
<div class="aria-busy:border-2 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed">
  <app-schedule-card />
</div>

<!-- Reduced motion -->
<div class="motion-reduce:transition-none motion-reduce:hover:transform-none">
  <app-schedule-card />
</div>
```

## Usage Examples

### Basic Usage

```html
<!-- Empty state -->
<app-schedule-card
  [value]="null"
  (onEdit)="openSchedulePicker()">
</app-schedule-card>

<!-- Filled state -->
<app-schedule-card
  [value]="'2025. március 15. 10:00'"
  (onEdit)="openSchedulePicker()">
</app-schedule-card>

<!-- Loading state -->
<app-schedule-card
  [isLoading]="true"
  [isDisabled]="true">
</app-schedule-card>

<!-- Disabled state -->
<app-schedule-card
  [value]="'2025. március 15. 10:00'"
  [isDisabled]="true">
</app-schedule-card>
```

### Within a List

```html
<div class="space-y-3">
  <app-schedule-card [value]="schedule1" />
  <app-schedule-card [value]="schedule2" />
  <app-schedule-card [value]="schedule3" />
</div>
```

## Comparison: SCSS vs Tailwind

| Aspect | SCSS | Tailwind |
|--------|------|----------|
| File Size | Smaller | Larger (utility classes) |
| Development Speed | Slower | Faster |
| Customization | Deep | Medium |
| Dark Mode | Manual | Built-in |
| Accessibility | Manual | Partial |
| Bundle Size | Optimized | Purged by build |
| Learning Curve | Moderate | High |
| Consistency | Variable | Guaranteed |

## Recommendation

- **Use SCSS** if you need precise control and custom animations
- **Use Tailwind** if you prefer rapid development and consistency
- **Mix Both** for component base (SCSS) + utilities (Tailwind)
