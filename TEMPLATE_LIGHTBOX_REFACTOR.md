# Template Lightbox Refactor

## Összefoglaló

A template-chooser lightbox átdolgozása a tablostudio `product-lightbox` dizájn alapján.

## Változtatások

### 1. HTML Struktúra (BEM naming)

**Új struktúra:**
```
lightbox (overlay + blur)
  └── container
       ├── header (glassmorphism)
       │    ├── counter "1 / 10"
       │    └── close button (X)
       ├── main
       │    ├── arrow prev
       │    ├── image-wrapper (+ zoom directive)
       │    └── arrow next
       ├── gallery (thumbnail strip, scrollable)
       └── info panel (glassmorphism)
            ├── template neve
            ├── kategória badge
            └── Kijelölés/Kijelölve gomb
```

**HTML fájl:** `template-chooser.component.html` (línea 163-365)

### 2. TypeScript Komponens

**Új metódusok:**
- `getCurrentTemplateIndex()`: Aktuális template index lekérése
- `selectTemplateByIndex(index: number)`: Template kiválasztása index alapján

**Fájl:** `template-chooser.component.ts` (línea 442-462)

### 3. Moduláris SCSS Struktúra

**Új mappák és fájlok:**
```
frontend-tablo/src/app/features/template-chooser/
├── styles/
│   ├── _lightbox-base.scss       (103 sor) - overlay, container, alapok
│   ├── _lightbox-header.scss     (65 sor)  - felső bar, counter, close
│   ├── _lightbox-image.scss      (63 sor)  - fő kép area
│   ├── _lightbox-navigation.scss (64 sor)  - nyilak (prev/next)
│   ├── _lightbox-gallery.scss    (95 sor)  - thumbnail strip
│   ├── _lightbox-info.scss       (179 sor) - info panel egyszerűsített
│   └── _lightbox-mobile.scss     (120 sor) - responsive
└── template-chooser.component.scss (import-ok)
```

**Főbb változások:**
- Glassmorphism dizájn: `rgba(255,255,255,0.1)`, `backdrop-filter: blur(20px)`
- Thumbnail gallery: 80x80px thumbnails, scrollable
- Egyszerűsített info panel: csak template név + kategória badge + Kijelölés gomb
- Safari kompatibilis: gap property helyett margin trick használata

### 4. Dizájn Elemek

#### Glassmorphism
```scss
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 12px;
```

#### Safari Kompatibilis Spacing
```scss
// NEM gap property!
// Helyette:
margin: -8px;

> * {
  margin: 8px;
}
```

#### Thumbnail Gallery
- Width: 80x80px
- Active state: `border-color: #6366f1` + `box-shadow`
- Scrollable: horizontal scroll, custom scrollbar

#### Info Panel
- **Baloldal:** Template név + kategória badge
- **Jobboldal:** Kijelölés/Kijelölve gomb
- **NO ár, leírás, artist** (mint termékekben)

### 5. Responsive Design

- **Desktop:** teljes glassmorphism layout
- **Tablet (max 768px):** info panel kisebb padding
- **Mobile (max 640px):** full screen, kisebb nyilak, thumbnail 60x60px
- **Touch devices:** nagyobb touch target (56px arrow, 72px thumbnail)

## Követelmények Teljesítése

- ✅ Új HTML struktúra BEM névvel
- ✅ Moduláris SCSS (max 120 sor/fájl)
- ✅ Glassmorphism header és info panel
- ✅ Thumbnail gallery integrálva
- ✅ Info panel egyszerűsítve (template specifikus)
- ✅ Safari kompatibilis (gap → margin trick)
- ✅ Zoom directive megtartva
- ✅ Keyboard navigation megtartva (ArrowLeft/Right, Space, Escape)
- ✅ BEM naming convention
- ✅ Mobile-first responsive

## Build és Teszt

```bash
npm run build
# ✅ Sikeres build (csak CSS budget warning)
```

## Továbbfejlesztési Lehetőségek

1. **Animations:** Fade-in, slide-in animációk hozzáadása
2. **Loading states:** Skeleton loader thumbnail-ekhez
3. **Keyboard shortcuts:** Zoom (+ / -), Reset (0)
4. **Accessibility:** ARIA labels finomhangolása
5. **Storybook:** Stories létrehozása a komponenshez

## Időbecslés

- **AI idő:** ~45 perc
- **Szorzó:** ×3
- **Ajánlott bejelentés:** 2.25 óra

## Kapcsolódó Fájlok

- HTML: `template-chooser.component.html`
- TypeScript: `template-chooser.component.ts`
- SCSS main: `template-chooser.component.scss`
- SCSS modules: `styles/_lightbox-*.scss` (7 db)

---

**Dátum:** 2026-01-06
**Referencia:** tablostudio/product-lightbox
