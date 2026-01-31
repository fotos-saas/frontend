# Schedule Card Component - Gyors Integrációs Guide

Fotózás időpontja kártya komponens szükséges lépések az integráláshoz.

---

## 📂 Fájl Struktúra

```
frontend-tablo/src/
├── app/shared/components/
│   └── schedule-card/
│       ├── schedule-card.component.ts       ✅ Komponens logika
│       ├── schedule-card.component.html     ✅ Template
│       ├── schedule-card.component.scss     ✅ Komponens stílusok
│       ├── schedule-card.stories.ts         ✅ Storybook demo (8+ variáció)
│       └── DESIGN.md                        ✅ Teljes design dokumentáció
│
└── styles/
    ├── schedule-card.scss                   ✅ Global BEM styles
    ├── schedule-card.tailwind.md            ✅ Tailwind alternatíva
    └── schedule-card-tokens.scss            ✅ Color tokens & variables
```

---

## 🚀 Integrációs Lépések

### 1. Global Stílusok Importálása

**Fájl:** `frontend-tablo/src/styles.scss`

```scss
// Már meglévő:
@tailwind base;
@tailwind components;
@tailwind utilities;

// Új import - ADD THIS:
@import 'styles/schedule-card-tokens';
@import 'styles/schedule-card';
```

### 2. Komponens Exportálása az App Module-ból

**Fájl:** `frontend-tablo/src/app/app.module.ts` (ha nem standalone)

```typescript
import { ScheduleCardComponent } from './shared/components/schedule-card/schedule-card.component';

@NgModule({
  imports: [
    // ... other imports
    ScheduleCardComponent, // Standalone component
  ],
})
export class AppModule { }
```

Vagy standalone komponenst közvetlenül használd:

```typescript
// app.component.ts
import { ScheduleCardComponent } from './shared/components/schedule-card/schedule-card.component';

@Component({
  selector: 'app-root',
  imports: [ScheduleCardComponent], // Direct import
  template: `<app-schedule-card [value]="date"></app-schedule-card>`
})
export class AppComponent { }
```

### 3. Komponens Exportálása Shared Module-ból (Opcionális)

**Fájl:** `frontend-tablo/src/app/shared/shared.module.ts`

```typescript
import { ScheduleCardComponent } from './components/schedule-card/schedule-card.component';

@NgModule({
  declarations: [ScheduleCardComponent],
  exports: [ScheduleCardComponent],
})
export class SharedModule { }
```

---

## 💻 Használat a Komponensekből

### Alapvető Használat

```html
<!-- Üres state (warning) -->
<app-schedule-card
  [value]="null"
  (editClick)="onEditClick()">
</app-schedule-card>

<!-- Kitöltött state (success) -->
<app-schedule-card
  [value]="'2025. március 15. 10:00'"
  (editClick)="onEditClick()">
</app-schedule-card>

<!-- Loading -->
<app-schedule-card
  [value]="null"
  [isLoading]="true"
  [isDisabled]="true">
</app-schedule-card>

<!-- Disabled -->
<app-schedule-card
  [value]="'2025. március 15. 10:00'"
  [isDisabled]="true">
</app-schedule-card>
```

### TypeScript Implementation

```typescript
import { Component, ViewChild } from '@angular/core';
import { ScheduleCardComponent } from './shared/components/schedule-card/schedule-card.component';

@Component({
  selector: 'app-order-form',
  template: `
    <form>
      <app-schedule-card
        [value]="scheduleDate"
        [isLoading]="isLoading"
        [isDisabled]="isSubmitting"
        [label]="'Fotózás időpontja'"
        (editClick)="openSchedulePicker()"
        (cardClick)="focusSchedule()">
      </app-schedule-card>

      <button (click)="submit()">Mentés</button>
    </form>
  `
})
export class OrderFormComponent {
  @ViewChild(ScheduleCardComponent) scheduleCard!: ScheduleCardComponent;

  scheduleDate: string | null = null;
  isLoading = false;
  isSubmitting = false;

  openSchedulePicker(): void {
    console.log('Edit schedule clicked');
    // Open date picker modal/dialog
  }

  focusSchedule(): void {
    console.log('Schedule card clicked');
  }

  submit(): void {
    this.isSubmitting = true;
    // Submit form...
  }
}
```

### RxJS Observable Integration

```typescript
import { Component } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-order-flow',
  template: `
    <app-schedule-card
      [value]="(scheduleDate$ | async)"
      [isLoading]="(isLoading$ | async)"
      [isDisabled]="(isSubmitting$ | async)"
      (editClick)="onEditSchedule()">
    </app-schedule-card>
  `
})
export class OrderFlowComponent {
  scheduleDate$: Observable<string | null>;
  isLoading$: Observable<boolean>;
  isSubmitting$: Observable<boolean>;

  constructor(private orderService: OrderService) {
    this.scheduleDate$ = this.orderService.getScheduleDate();
    this.isLoading$ = this.orderService.getLoadingState();
    this.isSubmitting$ = this.orderService.getSubmittingState();
  }

  onEditSchedule(): void {
    this.orderService.openScheduleEditor();
  }
}
```

### List/Array Usage

```html
<!-- Lista több schedule card-dal -->
<div class="schedule-card-list">
  <app-schedule-card
    *ngFor="let schedule of schedules; let i = index"
    [value]="schedule.date"
    [label]="schedule.label"
    [isLoading]="loadingIds.includes(schedule.id)"
    [isDisabled]="schedule.isArchived"
    (editClick)="editSchedule(schedule)"
    (cardClick)="selectSchedule(schedule)">
  </app-schedule-card>
</div>

<style>
  .schedule-card-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
```

---

## 🎨 Stöyle Testre Szabása

### CSS Variables Override

```scss
// App-specifikus override
:root {
  // Success color testre szabása
  --schedule-card-success-bg: #ecfdf5;      // Custom zöld
  --schedule-card-success-icon-bg: #d1fae5;
  --schedule-card-success-text: #047857;

  // Icon szín override
  --schedule-card-icon-primary: #8b5cf6;    // Purple instead of blue

  // Spacing override
  --schedule-card-gap: 1.25rem;
}
```

### SCSS Mixin Használat

```scss
// Component-specifikus stílusok
.my-schedule-card {
  @include schedule-card-success;

  // Custom hover
  &:hover {
    @include schedule-card-hover;
    background: lighten(var(--schedule-card-success-bg), 2%);
  }
}
```

### Tailwind Utility Kombinálás

```html
<!-- Tailwind + Schedule Card mix -->
<div class="max-w-md mx-auto p-4 rounded-lg bg-blue-50">
  <app-schedule-card
    [value]="date"
    (editClick)="onEdit()">
  </app-schedule-card>
</div>
```

---

## 🧪 Tesztelés

### Unit Teszt Alapok

```typescript
// schedule-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleCardComponent } from './schedule-card.component';

describe('ScheduleCardComponent', () => {
  let component: ScheduleCardComponent;
  let fixture: ComponentFixture<ScheduleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCardComponent);
    component = fixture.componentInstance;
  });

  it('should emit editClick on button click', () => {
    spyOn(component.editClick, 'emit');
    const button = fixture.debugElement.nativeElement.querySelector('button');
    button.click();
    expect(component.editClick.emit).toHaveBeenCalled();
  });

  it('should show success state when value is provided', () => {
    component.value = '2025. március 15. 10:00';
    fixture.detectChanges();
    expect(component.isSuccess).toBe(true);
  });

  it('should be disabled when isDisabled is true', () => {
    component.isDisabled = true;
    fixture.detectChanges();
    const button = fixture.debugElement.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });
});
```

### Storybook Tesztelés

```bash
# Terminal-ban
npm run storybook

# Browser: http://localhost:6006
# Menj a "Shared/Schedule Card" szekciónál
# Tesztelj mindegyik story-t:
# ✅ Default (empty)
# ✅ WithSelection (filled)
# ✅ Loading
# ✅ Disabled
# ✅ DarkMode
# ✅ Mobile
# ✅ A11y variants
```

---

## 🔍 Debugging

### Chrome DevTools

```javascript
// Console-ben:
// CSS variable értékek ellenőrzése
getComputedStyle(document.documentElement)
  .getPropertyValue('--schedule-card-success-text')
// Output: " #047857"

// Component HTML struktura ellenőrzése
document.querySelector('.schedule-card')
```

### Common Issues & Solutions

| Probléma | Megoldás |
|----------|----------|
| Komponens nem jelenik meg | Ellenőrizd az import-okat, module export-ot |
| Stílus nem érvényesül | Futtasd `npm run build`, cache clear |
| Dark mode nem működik | Ellenőrizd a `prefers-color-scheme` media query-t |
| Mobile layout rossz | DevTools >768px breakpoint tesztje |
| Hover effect nem működik | `pointer-events` check, z-index probléma |

---

## 📊 Performance Tips

### Change Detection

```typescript
// OnPush strategy (ajánlott)
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderFormComponent { }
```

### Memory Optimization

```typescript
// Unsubscribe properly
private destroy$ = new Subject<void>();

ngOnInit() {
  this.scheduleDate$
    .pipe(takeUntil(this.destroy$))
    .subscribe(date => this.scheduleDate = date);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### CSS Performance

```scss
// Containment (browser optimization)
.schedule-card {
  contain: layout style paint;
}
```

---

## ♿ Accessibility Checklist

- [ ] Keyboard navigation tesztelve (Tab, Enter, Space)
- [ ] ARIA labels megadva (`aria-label`, `aria-hidden`)
- [ ] Color contrast ratio 4.5:1+ (WCAG AA)
- [ ] Focus indicator látható (outline/ring)
- [ ] Touch target 36px+ minimum
- [ ] Screen reader tesztelve
- [ ] Dark mode tesztelve
- [ ] High contrast mode tesztelve
- [ ] Reduced motion tesztelve

---

## 📱 Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | >768px | Horizontal (icon - content - button) |
| Tablet | 640-768px | Horizontal, compressed |
| Mobile | <640px | Vertical stack |

---

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Full support |
| Firefox 88+ | ✅ Full | Full support |
| Safari 14+ | ✅ Full | Needs `-webkit` prefix |
| Edge 90+ | ✅ Full | Chromium-based |
| IE 11 | ❌ No | Flexbox, Grid issues |

---

## 🔧 Troubleshooting

### Komponens nem betöltődik

```bash
# 1. Check import
grep -r "ScheduleCardComponent" src/

# 2. Verify module export
grep -A 5 "ScheduleCardComponent" src/app/shared/

# 3. Check build
npm run build --verbose

# 4. Clear cache
rm -rf .angular/cache
npm run build
```

### Stílus nem alkalmazódik

```bash
# 1. Verify SCSS import in styles.scss
grep "schedule-card" src/styles.scss

# 2. Check compiled CSS
grep "schedule-card" dist/*/styles.css

# 3. Rebuild styles
npm run build -- --watch

# 4. Hard refresh browser
Ctrl+Shift+Delete (Chrome DevTools > Application > Clear all)
```

### TypeScript Type Errors

```bash
# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format
```

---

## 📚 Referenciák

- **Design Dokumentáció:** `/schedule-card/DESIGN.md`
- **Storybook Demo:** `npm run storybook`
- **Global Tokens:** `styles/schedule-card-tokens.scss`
- **Color Palette:** `styles/schedule-card.scss` (CSS variables section)

---

## ✅ Deployment Checklist

- [ ] Komponens tesztelve (unit + visual)
- [ ] Accessibility tesztelve
- [ ] Mobile responsive tesztelve
- [ ] Dark mode tesztelve
- [ ] Build hibamentes
- [ ] Production bundle nincs nagyobb
- [ ] Documentation frissítve
- [ ] Git commit előkészítve

---

## 💡 Tippek & Trükkök

### Rapid Development

```bash
# Gyors Storybook demo
npm run storybook -- --port 6006

# Watch mode
npm run build -- --watch

# Egyszerre futtatva 2 terminalban
# Terminal 1: npm run storybook
# Terminal 2: npm run build -- --watch
```

### Custom Theming

```scss
// Light theme
.light-theme {
  --schedule-card-success-bg: #ecfdf5;
  --schedule-card-icon-primary: #3b82f6;
}

// Dark theme
.dark-theme {
  --schedule-card-success-bg: #064e3b;
  --schedule-card-icon-primary: #60a5fa;
}
```

### Integration with Schedule Picker

```typescript
// order-data.component.ts
import { ScheduleReminderDialogComponent } from './schedule-reminder-dialog/schedule-reminder-dialog.component';

@Component({
  imports: [
    ScheduleCardComponent,
    ScheduleReminderDialogComponent
  ]
})
export class OrderDataComponent {
  openSchedulePicker(): void {
    // Use MatDialog vagy Modal service
    this.dialog.open(ScheduleReminderDialogComponent, {
      data: { currentDate: this.scheduleDate }
    });
  }
}
```

---

## 📞 Support & Questions

Ha kérdéseid vannak:

1. **Dokumentáció:** Olvasd a `DESIGN.md` dokumentációt
2. **Storybook:** Nézd meg a `schedule-card.stories.ts` demo-kat
3. **Kód:** Ellenőrizd a komponens TypeScript/HTML implementációt
4. **Tests:** Futtasd a unit teszteket debuggal

---

**Status:** Production Ready ✅
**Utolsó Update:** 2025. január 4.
