# Layout - Akciók & Ajánlások

**Dátum:** 2025-01-20
**Prioritás:** Alacsony - Szépítés és minor fixes

---

## 🔴 Magas Prioritás (THIS WEEK)

### 1. TopBar Dark Mode Support
**File:** `src/app/core/layout/components/top-bar/top-bar.component.ts`

**Probléma:** TopBar csak light mode-ban van implementálva

**Megoldás:**
```typescript
// app-shell.component.ts-ban az AppShell-nek kéne:
// Dark mode context detection és TopBar-nak pass-through

// Vagy egyszerűbb: Add dark mode inline styles
template: `
  <header
    class="h-14 md:h-16
           bg-white/80 dark:bg-slate-900/80
           backdrop-blur-md
           border-b border-slate-200/50 dark:border-slate-800/50
           shadow-sm
           fixed top-0 left-0 right-0 z-40"
  >
  ...
  </header>
`
```

**Idő:** 15 perc
**Teszt:** Storybook DarkMode variant

---

### 2. Storybook A11y Variant Hozzáadás
**Files:**
- `src/app/core/layout/components/sidebar/sidebar.stories.ts`
- `src/app/core/layout/components/sidebar-menu-item/sidebar-menu-item.stories.ts`

**Probléma:** Hiányzik az accessibility variant

**Megoldás:**
```typescript
export const A11y: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'image-alt', enabled: false }, // Not applicable
        ]
      }
    }
  },
  render: () => ({
    template: `
      <div class="min-h-screen bg-gray-100 pt-16">
        <app-sidebar />
      </div>
    `,
  }),
};
```

**Idő:** 10 perc
**Teszt:** Run `npm run test:a11y`

---

### 3. Button Active State
**File:** `src/app/core/layout/components/top-bar/top-bar.component.ts`

**Probléma:** Logout gomb nincs active feedback-je

**Megoldás:**
```typescript
// Logout button-nál
class="... active:scale-95 active:opacity-90"
```

**Idő:** 5 perc
**Teszt:** Klikkelj az Kilépés gombra

---

## 🟡 Közepes Prioritás (NEXT WEEK)

### 4. Sidebar Disabled Variant (Storybook)
**File:** `src/app/core/layout/components/sidebar-menu-item/sidebar-menu-item.stories.ts`

**Probléma:** Nincs explicit Disabled story

**Megoldás:**
```typescript
export const Disabled: Story = {
  args: {
    item: {
      ...simpleItem,
      disabled: true,
    },
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-slate-900 p-2">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};
```

**Idő:** 10 perc

---

### 5. Safari Glassmorphism Fallback
**File:** `src/styles.scss`

**Probléma:** iOS Safari régi verzióban nincs backdrop-filter

**Megoldás:**
```scss
/* TopBar glassmorphism */
.topbar-glass {
  background: rgba(255, 255, 255, 0.95);

  @supports (backdrop-filter: blur(1px)) {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(15, 23, 42, 0.95);

    @supports (backdrop-filter: blur(1px)) {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
    }
  }
}
```

**Idő:** 20 perc
**Teszt:** iOS Safari 14+

---

### 6. ARIA Current Page Indicator
**File:** `src/app/core/layout/components/sidebar-menu-item/sidebar-menu-item.component.ts`

**Probléma:** Screen reader-ek nem tudják, melyik az aktív oldal

**Megoldás:**
```typescript
// Active link-nél
[attr.aria-current]="rla.isActive ? 'page' : null"

// Template:
<a
  [routerLink]="item().route"
  routerLinkActive="item-active"
  #rla="routerLinkActive"
  [attr.aria-current]="rla.isActive ? 'page' : null"
  ...
>
  {{ item().label }}
</a>
```

**Idő:** 10 perc
**Teszt:** VoiceOver / NVDA

---

## 🟢 Alacsony Prioritás (LATER)

### 7. Tailwind Config Extend
**File:** `tailwind.config.js`

**Probléma:** Config minimális, lehetne gazdagabb

**Megoldás:**
```javascript
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'glass-light': 'rgba(255, 255, 255, 0.8)',
        'glass-dark': 'rgba(15, 23, 42, 0.8)',
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideInLeft: {
          'from': { opacity: '0', transform: 'translateX(-8px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      zIndex: {
        'skip-link': '10000',
        'navbar': '1000',
        'sidebar': '1020',
        'modal': '1050',
      },
    },
  },
  plugins: [],
}
```

**Idő:** 30 perc
**Teszt:** `npm run build`

---

### 8. AppShell Gradient Gazdagítás
**File:** `src/app/core/layout/components/app-shell/app-shell.component.ts`

**Probléma:** Gradient könnyű, lehetne érdekesebb

**Megoldás:**
```typescript
// Jelenleg
class="bg-gradient-to-br from-slate-50 to-slate-100"

// Opció 1: Subtle purple accent
class="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200"

// Opció 2: Subtle blue
class="bg-gradient-to-br from-slate-50 to-blue-50"

// Opció 3: Custom gradient (Tailwind config extend)
class="bg-gradient-to-br from-slate-50 to-slate-100 opacity-90"
// + overlay: "bg-gradient-to-br from-purple-500/5 to-pink-500/5"
```

**Idő:** 15 perc
**Teszt:** Screenshot @ light & dark mode

---

### 9. Tooltip Support (Collapsed Sidebar)
**File:** `src/app/core/layout/components/sidebar-menu-item/sidebar-menu-item.component.ts`

**Probléma:** Tablet mód-ban (collapsed) nincs tooltip

**Megoldás:**
```typescript
// Collapsed mód-ban
[attr.title]="collapsed() ? item().label : null"

// Jobb: Tooltip directive
<app-tooltip [content]="item().label" *ngIf="collapsed()">
  <lucide-icon [name]="item().icon!" [size]="20"></lucide-icon>
</app-tooltip>
```

**Idő:** 45 perc (tooltip directive create)
**Teszt:** Hover tablet resize-nél

---

## 📋 Implementation Checklist

### High Priority
- [ ] TopBar dark mode (15 min)
- [ ] Storybook A11y variant (10 min)
- [ ] Button active state (5 min)
- **Total:** ~30 perc

### Medium Priority
- [ ] Sidebar Disabled story (10 min)
- [ ] Safari fallback (20 min)
- [ ] ARIA current page (10 min)
- **Total:** ~40 perc

### Low Priority
- [ ] Tailwind config extend (30 min)
- [ ] Gradient gazdagítás (15 min)
- [ ] Tooltip support (45 min)
- **Total:** ~90 perc

---

## 🚀 Végrehajtási Sorrend

**Week 1 (This Week):**
1. TopBar dark mode
2. Storybook A11y
3. Button active state
4. Commit & push

**Week 2 (Next Week):**
1. Sidebar Disabled
2. Safari fallback
3. ARIA current
4. Test on devices

**Week 3 (Later):**
1. Config extend
2. Gradient enhance
3. Tooltip (if needed)
4. Performance test

---

## 📊 Impact Assessment

| Task | Impact | Effort | ROI |
|------|--------|--------|-----|
| TopBar dark | High | Low | 10/10 |
| A11y variant | Medium | Very Low | 9/10 |
| Active state | Low | Very Low | 7/10 |
| Disabled story | Low | Very Low | 5/10 |
| Safari fallback | Medium | Low | 8/10 |
| ARIA current | High | Very Low | 9/10 |
| Config extend | Low | Medium | 3/10 |
| Gradient | Low | Very Low | 2/10 |
| Tooltip | Low | High | 4/10 |

---

## ✅ Done Items (Reference)

- [x] TopBar layout responsive
- [x] Sidebar collapsed/expanded states
- [x] Mobile overlay implementation
- [x] Dark theme via CSS variables
- [x] Animations (slide, fade, stagger)
- [x] Focus indicators
- [x] prefers-reduced-motion support
- [x] Storybook setup (basic)
- [x] WCAG AA/AAA contrast

---

**Status:** Ready for implementation
**Last Updated:** 2025-01-20
**Next Review:** 2025-01-27
