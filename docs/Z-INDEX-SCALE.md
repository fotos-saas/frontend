# Z-Index Standardizációs Útmutató

## Áttekintés

A projekt z-index értékeinek standardizálása az alábbi CSS változó-alapú skálát alkalmazza. Ez biztosítja a konzisztens rétegépítést és könnyebb karbantartást.

## CSS Változó Skála

Az összes z-index érték a `src/styles.scss` fájlban definiált CSS változókat használja:

### Base Rétegek (0-100)
```scss
--z-base: 0;              // Alapértelmezett z-index
--z-dropdown: 100;        // Legördülő menük, dropdown-ek
--z-sticky: 100;          // Sticky elemek (navbar, info panelek)
```

### Fixed Elemek (1000-1100)
```scss
--z-navbar: 1000;         // Navbar, mobil menü
--z-sidebar: 1020;        // Oldalsáv (ha szükséges)
```

### Overlay és Modal Háttér (1040-1080)
```scss
--z-modal-backdrop: 1040; // Modal/dialog háttér overlay
--z-modal: 1050;          // Modal/dialog konténer
--z-modal-content: 1055;  // Modal/dialog belső tartalom
--z-popover: 1060;        // Popover/tooltip háttér
--z-tooltip: 1070;        // Tooltip szöveg
```

### Felső Rétegek (1090+)
```scss
--z-lightbox: 60000;           // Lightbox konténer
--z-lightbox-overlay: 59999;   // Lightbox overlay háttér
--z-lightbox-content: 60001;   // Lightbox belső tartalom
--z-toast: 70000;              // Toast üzenetek
--z-skip-link: 10000;          // Skip link (a11y, csak fókusz esetén)
```

## Rétegek Sorrendje

```
┌─────────────────────────────────────┐
│  z-toast (70000)                    │  ← Toast üzenetek
├─────────────────────────────────────┤
│  z-lightbox-content (60001)         │  ← Lightbox főtartalom
│  z-lightbox-overlay (59999)         │  ← Lightbox háttér
│  z-lightbox (60000)                 │  ← Lightbox konténer
├─────────────────────────────────────┤
│  z-tooltip (1070)                   │  ← Tooltip szöveg
│  z-popover (1060)                   │  ← Popover/tooltip
│  z-modal-content (1055)             │  ← Dialog belső
│  z-modal (1050)                     │  ← Dialog konténer
│  z-modal-backdrop (1040)            │  ← Dialog háttér
├─────────────────────────────────────┤
│  z-sidebar (1020)                   │  ← Oldalsáv
│  z-navbar (1000)                    │  ← Navbar/mobil menü
├─────────────────────────────────────┤
│  z-dropdown (100)                   │  ← Dropdown, sticky
│  z-sticky (100)                     │  ← Sticky elemek
├─────────────────────────────────────┤
│  z-base (0)                         │  ← Alapértelmezett
└─────────────────────────────────────┘
```

## Használat

### HTML-ben (direktben)
```html
<div class="my-element" style="z-index: var(--z-modal);">
  Modal tartalom
</div>
```

### SCSS-ben (komponensekben)
```scss
.my-component {
  z-index: var(--z-modal);

  &__floating-button {
    z-index: var(--z-dropdown);
  }
}
```

### Dinamikus Z-Index
Ha relativ z-index értékre van szükség:
```scss
.my-component {
  z-index: var(--z-modal);

  &__overlay {
    z-index: calc(var(--z-modal) - 1);
  }

  &__content {
    z-index: calc(var(--z-modal) + 1);
  }
}
```

## Komponens Igazítás

### Navbar (`navbar.component.scss`)
```scss
.navbar {
  z-index: var(--z-navbar);        // 1000
}

.navbar__overlay {
  z-index: calc(var(--z-navbar) - 2);  // 998
}

.navbar__mobile-menu {
  z-index: var(--z-navbar);        // 1000
}

.navbar__mobile-menu-header {
  z-index: var(--z-dropdown);      // 100
}
```

### Toast (`toast.component.ts`)
```scss
.toast {
  z-index: var(--z-toast);         // 70000
}
```

### Lightbox (`_lightbox-base.scss`)
```scss
.lightbox {
  z-index: var(--z-lightbox);      // 60000
}

.lightbox__overlay {
  z-index: var(--z-lightbox-overlay);   // 59999
}

.lightbox__container {
  z-index: var(--z-lightbox-content);   // 60001
}
```

### Dialog Komponensek
```scss
.dialog-backdrop {
  z-index: var(--z-modal-backdrop); // 1040
}

.dialog__close {
  z-index: var(--z-dropdown);      // 100
}
```

### Lightbox Header (`_lightbox-header.scss`)
```scss
.lightbox__close-floating {
  z-index: var(--z-dropdown);      // 100
}

.lightbox__counter-floating {
  z-index: var(--z-dropdown);      // 100
}
```

## Gyakori Hibák

### ❌ Hardcoded érték
```scss
.my-modal {
  z-index: 1050;  // ROSSZ!
}
```

### ✅ CSS változó
```scss
.my-modal {
  z-index: var(--z-modal);  // JÓ!
}
```

### ❌ Extrém érték
```scss
.important {
  z-index: 99999;  // ROSSZ!
}
```

### ✅ Skálázott érték
```scss
.important {
  z-index: var(--z-toast);  // JÓ! (70000)
}
```

## Maintenance Szabályok

1. **Új komponens létrehozásakor**: Mindig CSS változót használj, ne hardcoded értéket!
2. **Z-index debug**: `grep -r "z-index" src/` a hardcoded értékeket megtalálni
3. **Skála módosítása**: Ha megváltoztatod a skálát, csak az `src/styles.scss`-ben kell szerkeszteni
4. **Csökkenő értékek**: Relativ z-index-hez `calc()` használj, pl.: `calc(var(--z-modal) - 1)`

## Ellenőrzés

Hardcoded z-index értékeket keresni:
```bash
grep -r "z-index\s*:\s*[0-9]" src/ --include="*.scss" --include="*.ts"
```

Ha vannak találatok, frissítsd őket az alábbi táblázat szerint:

| Hardcoded | CSS Változó | Érték |
|-----------|------------|-------|
| 0 | `--z-base` | 0 |
| 5-20 | `--z-base` | 0 |
| 50-100 | `--z-dropdown` / `--z-sticky` | 100 |
| 998-1000 | `--z-navbar` | 1000 |
| 1040-1080 | `--z-modal-*` | 1040-1070 |
| 50000+ | `--z-lightbox-*` | 59999-60001 |
| 70000+ | `--z-toast` | 70000 |

## További Információ

- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **Z-Index**: https://developer.mozilla.org/en-US/docs/Web/CSS/z-index
- **Stacking Context**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index
