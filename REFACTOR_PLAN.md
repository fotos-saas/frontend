# Frontend-Tablo Refaktorálási Terv

**Készült:** 2026-01-08
**Full Review alapján**

---

## 📊 Kiindulási Állapot

### Fájlméret Problémák
| Komponens | Jelenlegi | Limit | Túllépés |
|-----------|-----------|-------|----------|
| `template-chooser.component.ts` | **883 sor** | 300 | +583 sor ❌ |
| `order-finalization.component.ts` | **689 sor** | 300 | +389 sor ❌ |
| `navbar.component.ts` | **362 sor** | 300 | +62 sor ⚠️ |

### Szakértői Értékelés Összefoglaló
| Terület | Érték | Státusz |
|---------|-------|---------|
| Angular (OnPush, Signals) | 85% | ✅ Jó |
| Performance | 70% | ⚠️ Javítandó |
| Security | 85% | ✅ Jó |
| Accessibility | 60% | ⚠️ Javítandó |
| UI/UX | 87% | ✅ Kiváló |

---

## 🔴 MAGAS PRIORITÁS (1. hét)

### 1. template-chooser.component.ts Refaktorálás ✅ KÉSZ
**Cél:** 883 sor → ~200 sor
**Eredmény:** 883 → 403 sor (-54%)

#### Új Child Komponensek:
- [x] `lightbox/lightbox.component.ts` (351 sor) ✅
  - Zoom logika
  - Keyboard navigation (ESC, Arrow keys)
  - Image transition
  - Touch gestures
  - Thumbnail lazy loading

- [ ] `template-gallery/template-gallery.component.ts` (~150 sor) - JÖVŐBEN
- [ ] `selection-summary/selection-summary.component.ts` (~80 sor) - JÖVŐBEN

#### Új Services:
- [x] `services/zoom.service.ts` (137 sor) ✅
  - `zoomIn()`, `zoomOut()`, `resetZoom()`
  - Continuous zoom (mousedown)
  - Zoom level signal

- [x] `services/drag-scroll.service.ts` (211 sor) ✅
  - Mouse drag handling
  - Momentum scroll effect (jégen csúszás)
  - Touch support
  - Auto-scroll to item

#### Eredmény:
```
template-chooser/
├── template-chooser.component.ts (~200 sor) ✅
├── components/
│   ├── lightbox/
│   │   ├── lightbox.component.ts
│   │   ├── lightbox.component.html
│   │   └── lightbox.component.scss
│   ├── template-gallery/
│   │   ├── template-gallery.component.ts
│   │   ├── template-gallery.component.html
│   │   └── template-gallery.component.scss
│   └── selection-summary/
│       ├── selection-summary.component.ts
│       ├── selection-summary.component.html
│       └── selection-summary.component.scss
└── services/
    ├── template-chooser.service.ts (meglévő)
    ├── zoom.service.ts (ÚJ)
    └── drag-scroll.service.ts (ÚJ)
```

---

### 2. order-finalization.component.ts Refaktorálás 🔄 FOLYAMATBAN
**Cél:** 689 sor → ~150-200 sor
**Szakértői elemzés:** ✅ KÉSZ (2026-01-08)

#### 📊 Szakértői Értékelések Összefoglaló

| Szakértő | Fő Megállapítások | Prioritás |
|----------|-------------------|-----------|
| **Angular** | 18 update metódus duplikáció, komponens túl nagy | KRITIKUS |
| **Performance** | Computed signal 6x hívás, setTimeout leak | MAGAS |
| **Security** | ngx-editor XSS, MIME spoofing | KRITIKUS |
| **Accessibility** | WCAG 6/10, ARIA hiányok, kontraszt | MAGAS |

#### 🔴 KRITIKUS Biztonsági Javítások (Először!)
- [ ] **DOMPurify integráció** - ngx-editor HTML sanitization (XSS védelem)
- [ ] **Magic bytes ellenőrzés** - File upload MIME spoofing ellen
- [ ] **Telefon validáció** - Hiányzik teljesen

#### Új Child Komponensek:
- [ ] `components/steps/contact-step/contact-step.component.ts` (~80 sor)
  - Input signal: `data: ContactData`
  - Output: `dataChange: EventEmitter<ContactData>`
  - Saját validációs üzenetek
  - ARIA: `aria-describedby`, `aria-invalid`

- [ ] `components/steps/basic-info-step/basic-info-step.component.ts` (~90 sor)
  - Iskola, város, osztály, évfolyam, idézet
  - Max length validáció

- [ ] `components/steps/design-step/design-step.component.ts` (~120 sor)
  - Betűtípus, szín választó
  - Rich text editor (ngx-editor + DOMPurify!)
  - File upload (háttérkép, csatolmány)

- [ ] `components/steps/roster-step/roster-step.component.ts` (~100 sor)
  - Névsor textarea-k
  - ÁSZF checkbox
  - Sorrend típus select

- [ ] `components/stepper-navigation/stepper-navigation.component.ts` (~60 sor)
  - Step gombok
  - ARIA `role="tab"`, `aria-selected`
  - Progress jelzés

#### Új Services:
- [ ] `services/order-validation.service.ts` (~80 sor)
  - `validateContactData()`, `validateBasicInfo()`, stb.
  - Centralizált validáció
  - Email regex erősítés
  - Telefon validáció (magyar formátum)

- [ ] `services/file-upload.service.ts` (~100 sor)
  - MIME type + extension validáció
  - Magic bytes ellenőrzés
  - Upload progress tracking
  - Per-file loading state

- [ ] `services/form-auto-save.service.ts` (~50 sor)
  - Debounced auto-save
  - Save status signal
  - Timer cleanup ngOnDestroy

#### Performance Optimalizációk:
- [ ] **stepValidations cache** - computed signal duplikáció megszüntetése
- [ ] **setTimeout cleanup** - memory leak fix
- [ ] **Per-file loading** - globális loading helyett
- [ ] **beforeunload védelem** - adatvesztés megelőzés

#### Accessibility Javítások:
- [ ] **Focus management** - lépésváltáskor fókusz az új step címére
- [ ] **ARIA live regions** - Toast, auto-save, loading
- [ ] **Error kapcsolat** - `aria-describedby` minden hibaüzenethez
- [ ] **Color contrast** - placeholder #64748b (4.6:1 kontraszt)
- [ ] **File input sr-only** - `hidden` helyett vizuálisan rejtett

#### Eredmény Struktúra:
```
order-finalization/
├── order-finalization.component.ts (~150 sor) - Koordinátor
├── order-finalization.component.html
├── order-finalization.component.scss
├── components/
│   ├── steps/
│   │   ├── contact-step/
│   │   │   ├── contact-step.component.ts
│   │   │   └── contact-step.component.html
│   │   ├── basic-info-step/
│   │   │   ├── basic-info-step.component.ts
│   │   │   └── basic-info-step.component.html
│   │   ├── design-step/
│   │   │   ├── design-step.component.ts
│   │   │   └── design-step.component.html
│   │   └── roster-step/
│   │       ├── roster-step.component.ts
│   │       └── roster-step.component.html
│   └── stepper-navigation/
│       ├── stepper-navigation.component.ts
│       └── stepper-navigation.component.html
├── services/
│   ├── order-finalization.service.ts (meglévő)
│   ├── order-validation.service.ts (ÚJ)
│   ├── file-upload.service.ts (ÚJ)
│   └── form-auto-save.service.ts (ÚJ)
└── models/
    └── order-finalization.models.ts (meglévő)
```

---

### 3. Skip Link Hozzáadása (A11y)
- [ ] `index.html` - Skip link elem
- [ ] `styles.scss` - Skip link stílusok

```html
<a href="#main-content" class="skip-link">Ugrás a tartalomhoz</a>
```

---

### 4. Memory Leak Fix
- [ ] `home.component.ts` - takeUntil hozzáadása (93. és 244. sor)

```typescript
// ELŐTTE:
this.authService.updatePhotoDate(result.date).subscribe({...});

// UTÁNA:
this.authService.updatePhotoDate(result.date)
  .pipe(takeUntil(this.destroy$))
  .subscribe({...});
```

---

## 🟡 KÖZEPES PRIORITÁS (2. hét)

### 5. navbar.component.ts Refaktorálás
**Cél:** 362 sor → ~200 sor

- [ ] `services/responsive-breakpoint.service.ts` (~80 sor)
  - ResizeObserver logika kiemelés
  - `isMobileMode` signal

- [ ] Computed signals hozzáadása a komponenshez

---

### 6. TrackBy Hozzáadása
- [ ] `order-data.component.ts` - `trackByTag()`
- [ ] `missing-persons.component.ts` - `trackByPerson()`

---

### 7. Form Label Javítások (A11y)
- [ ] `missing-persons.component.html` - search input label
- [ ] `missing-persons.component.html` - filter select label
- [ ] Minden icon-only gombhoz `aria-label`

---

### 8. API Cache (shareReplay)
- [ ] `template-chooser.service.ts` - `loadCategories()` cache
- [ ] Egyéb service-ek átnézése

---

## 🟢 ALACSONY PRIORITÁS (3. hét)

### 9. Color Contrast Javítás
- [ ] Szürke szövegek kontrasztja (min 4.5:1)
- [ ] Placeholder színek (#6b7280 vagy sötétebb)

### 10. Standalone + Lazy Loading
- [ ] `HomeComponent` → standalone + lazy
- [ ] `SamplesComponent` → standalone + lazy
- [ ] `OrderDataComponent` → standalone + lazy
- [ ] `MissingPersonsComponent` → standalone + lazy
- [ ] `NavbarComponent` → standalone

### 11. Dark Mode
- [ ] Tailwind dark mode config
- [ ] Komponens stílusok dark variant

---

## 📈 Várt Eredmények

### Fájlméret Javulás
| Komponens | Előtte | Utána | Változás |
|-----------|--------|-------|----------|
| template-chooser | 883 | ~200 | -77% ✅ |
| order-finalization | 689 | ~200 | -71% ✅ |
| navbar | 362 | ~200 | -45% ✅ |

### Új Újrafelhasználható Komponensek
- `LightboxComponent` - Bármely galériához
- `TemplateGalleryComponent` - Grid megjelenítés
- `SelectionSummaryComponent` - Kiválasztás összegző
- 4× Step komponens - Wizard pattern

### Új Újrafelhasználható Services
- `ZoomService` - Zoom funkcionalitás
- `DragScrollService` - Húzható scroll
- `FormAutoSaveService` - Auto-mentés
- `ResponsiveBreakpointService` - Reszponzív breakpoint

---

## ✅ Ellenőrző Lista (Commit előtt)

- [ ] TypeScript hiba: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`
- [ ] Chrome console: 0 error
- [ ] UI: Screenshot összehasonlítás (nem törött)
- [ ] Tesztek: `npm run test` (ha van)

---

## 📝 Megjegyzések

- Minden refaktorálás előtt **screenshot készítés**!
- Minden módosítás után **Chrome console ellenőrzés**!
- Commit message: angol, Conventional Commits format
- Kommunikáció: magyar

---

**Következő lépés:** order-finalization.component.ts refaktorálás

---

## 📋 Változtatások Log (2026-01-08)

### Refaktorált fájlok:
1. `template-chooser.component.ts` - 883 → 403 sor (-54%)
2. Új: `components/lightbox/lightbox.component.ts` (351 sor)
3. Új: `components/lightbox/lightbox.component.html` (253 sor)
4. Új: `components/lightbox/lightbox.component.scss` (import only)
5. Új: `services/zoom.service.ts` (137 sor)
6. Új: `services/drag-scroll.service.ts` (211 sor)

### Build státusz: ✅ SIKERES
### Chrome console: ✅ No Angular errors
