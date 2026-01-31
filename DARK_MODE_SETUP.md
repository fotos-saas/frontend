# Dark Mode CSS Változók - Quick Reference

## Gyors Indítás

Az alkalmazás **automatikusan** követi a rendszer dark mode beállítást. A CSS változók az `src/styles.scss`-ben vannak definiálva.

## Elérhető CSS Változók

### Háttér Szín
```scss
background: var(--bg-primary);     // Fő háttér (fehér/sötét szürke)
background: var(--bg-secondary);   // Kártya háttér (nagyon világos/sötét)
background: var(--bg-tertiary);    // Harmadik szint háttér
```

### Szöveg Szín
```scss
color: var(--text-primary);        // Fő szöveg
color: var(--text-secondary);      // Másodlagos szöveg
color: var(--text-muted);          // Tompított szöveg
```

### Kerület & Árnyék
```scss
border: 1px solid var(--border-color);
box-shadow: 0 1px 3px var(--shadow-color);
box-shadow: 0 2px 8px var(--shadow-color-hover);
```

### Gradients
```scss
background: var(--gradient-secondary);  // Szürke gradient
background: var(--gradient-blue);       // Kék gradient
background: var(--gradient-yellow);     // Sárga gradient
background: var(--gradient-green);      // Zöld gradient
```

### Akcióik Szín
```scss
color: var(--color-primary);            // Kék szín (#2563eb / #3b82f6)
color: var(--color-error);              // Piros szín (#dc2626 / #ef4444)
```

## Komponens Sablon

```scss
.my-component {
  // Háttér
  background: var(--bg-secondary);
  
  // Szöveg
  color: var(--text-primary);
  
  // Border
  border: 1px solid var(--border-color);
  
  // Árnyék
  box-shadow: 0 1px 3px var(--shadow-color);
  
  // Transition (smooth dark mode váltás)
  transition: background-color 0.3s ease, color 0.3s ease;
  
  &__header {
    color: var(--text-primary);
  }
  
  &__description {
    color: var(--text-secondary);
  }
  
  &__muted {
    color: var(--text-muted);
  }
  
  &__card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
  }
  
  &__button {
    background: var(--color-primary);
    color: white;
    
    &:hover {
      box-shadow: 0 2px 8px var(--shadow-color-hover);
    }
  }
}
```

## Dark Mode Működése

### Automatikus (Rendszer Beállítások)
Az alkalmazás automatikusan követi a felhasználó rendszer preferenciáját:
```scss
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1f2937;
    // ... stb.
  }
}
```

### Tesztelés Dev Tools-ban
1. Chrome/Firefox DevTools megnyitása: `F12`
2. Jobb klikk → Inspect → ESC (Console bezárása)
3. Menu gomb ☰ → Rendering
4. Scroll le: "Emulate CSS media feature prefers-color-scheme"
5. Válassz: `dark` vagy `light`

## Szín Értékek

### Light Mode
| Változó | Érték |
|---------|-------|
| `--bg-primary` | #ffffff |
| `--bg-secondary` | #f9fafb |
| `--bg-tertiary` | #f3f4f6 |
| `--text-primary` | #1f2937 (14.8:1) ✅ |
| `--text-secondary` | #4b5563 (7.1:1) ✅ WCAG AA |
| `--text-muted` | #6b7280 (4.6:1) ✅ WCAG AA |
| `--border-color` | #e5e7eb |

### Dark Mode
| Változó | Érték |
|---------|-------|
| `--bg-primary` | #1f2937 |
| `--bg-secondary` | #111827 |
| `--bg-tertiary` | #374151 |
| `--text-primary` | #f9fafb (15.3:1) ✅ |
| `--text-secondary` | #d1d5db (9.7:1) ✅ WCAG AAA |
| `--text-muted` | #9ca3af (4.8:1) ✅ WCAG AA |
| `--border-color` | #374151 |

## Tilos

❌ Hardcoded szín értékek:
```scss
background: #ffffff;  // NEM JÓ!
color: #1f2937;       // NEM JÓ!
```

✅ CSS Változók használata:
```scss
background: var(--bg-primary);   // JÓ!
color: var(--text-primary);      // JÓ!
```

## FAQ

**Q: Mit kell tennem új komponenshez?**
A: Használd a CSS változókat az `src/styles.scss`-ből.

**Q: Hogyan tesztelhetem a dark módot?**
A: DevTools → Rendering → Emulate CSS media feature prefers-color-scheme: dark

**Q: Támogatott-e Safari?**
A: Igen! CSS variables teljes Safari támogatás (iOS 9.3+).

**Q: Hogyan adok hozzá új színt?**
A: Az `src/styles.scss`-ben add hozzá az új CSS változót mindkét módhoz.

## Szerkesztés

Szín módosítása: **Szerkeszd az `src/styles.scss`-t**

```scss
:root {
  --bg-primary: #ffffff;  // Módosítsd itt (light mode)
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1f2937; // Módosítsd itt (dark mode)
  }
}
```

Aztán `npm run build` és kész!
