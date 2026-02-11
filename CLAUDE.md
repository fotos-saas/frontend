# PhotoStack Frontend - Angular 21+ Standalone

> **Projekt áttekintés:** [`../CLAUDE.md`](../CLAUDE.md) | **Backend szabályok:** [`../backend/CLAUDE.md`](../backend/CLAUDE.md)
> **Agent prompt-ok:** [`.claude/AGENTS.md`](.claude/AGENTS.md) | **Workflow példák:** [`.claude/WORKFLOWS.md`](.claude/WORKFLOWS.md)

---

## KRITIKUS SZABÁLYOK

| # | Szabály | Részletek |
|---|---------|-----------|
| 1 | **MINDEN UI szöveg MAGYAR** | |
| 2 | **Fájlméret limit** | Komponens max 300 sor |
| 3 | **Redundancia csökkentés** | Duplikált kód service/helper-be |
| 4 | **ConfirmDialog törléshez** | Destruktív műveleteknél `ConfirmDialogComponent` |
| 5 | **`page-card` class MINDEN oldalon** | `<div class="my-page page-card">` |
| 6 | **Dialógusok page-card KÍVÜL** | backdrop-filter stacking context miatt! |
| 7 | **`dialog-backdrop` + `dialog-panel` class** | Egységes dialógus stílus |
| 8 | **Lucide ikonok `ICONS` konstanssal** | NEM emoji! `import { ICONS } from '@shared/constants'` |
| 9 | **Új ikon = 2 HELYEN regisztráld!** | `icons.constants.ts` ÉS `lucide-icons.ts` |
| 10 | **`matTooltip` tooltiphez** | Angular Material tooltip |
| 11 | **`createBackdropHandler` dialógusokhoz** | Szöveg kijelölés közben NE záródjon be! |
| 12 | **Lista stílus: `_list-page.scss`** | MINDIG a közös stílusokat használd! |

---

## PROJECT MEMORY

```
MINDEN ÚJ BESZÉLGETÉS ELEJÉN:

1. OLVASD BE az aktív terveket:
   ls .claude/plans/active/
   Ha van fájl, olvasd be mindegyiket!

2. Ha TERVET készítesz (>30 perc munka):
   MENTSD: .claude/plans/active/[feature-name].md

3. Ha BEFEJEZTED a tervet:
   MOZGASD: .claude/plans/completed/[date]-[name].md
```

---

## SMART CONTEXT LOADING

Feladat típusa alapján töltsd be a megfelelő context fájlt:

| Ha a feladat... | Töltsd be |
|-----------------|-----------|
| Electron/IPC | `.claude/context/electron.md` |
| UI komponens | `.claude/context/ui-components.md` |
| API/HTTP hívás | `.claude/context/api.md` |
| Űrlap/Form | `.claude/context/forms.md` |

---

## DEFAULT WORKFLOW

### Gyors Mód (kis javításokhoz, <20 sor)

SKIP: Registry ellenőrzés, Ref MCP, Review subagent
CSAK: Implementálj + rövid összegzés

### Teljes Workflow (új feature, refactor, >20 sor)

0. **REGISTRY CHECK** — COMPONENT_REGISTRY.md + LESSONS_LEARNED.md
1. **MEGÉRTÉS** — Érintett fájlok beolvasása
2. **TERVEZÉS** — Rövid terv (max 5 pont), Ref MCP dokumentáció
3. **IMPLEMENTÁCIÓ** — CLAUDE.md szabályok követése
4. **REVIEW** — REVIEWER subagent (AUTO!), `.claude/AGENTS.md` alapján
5. **JAVÍTÁS** — Review alapján
6. **POST-IMPLEMENTATION** — Registry/Lessons frissítés ha releváns

---

## LISTA KOMPONENS SABLON

**MINDIG ezt a mintát kövesd listáknál!** Fájl: `shared/styles/_list-page.scss`

```scss
@use '../../../shared/styles/list-page' as list;
```

```html
<div class="table-header">
  <span class="th th-name">Név</span>
  <span class="th th-status">Státusz</span>
  <span class="th th-actions">Műveletek</span>
</div>

<div class="row-grid">
  @for (item of items(); track item.id; let i = $index) {
    <div class="list-row" [style.animation-delay]="i * 0.03 + 's'">
      <!-- Tartalom -->
    </div>
  }
</div>
```

**Elérhető osztályok:** `.table-header`, `.th`, `.row-grid`, `.list-row`, `.action-btn`, `.skeleton-row`, `.pagination`, `.empty-state`

---

## TOOLTIP RENDSZER (ANGULAR MATERIAL)

```typescript
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({ imports: [MatTooltipModule] })
```

```html
<button matTooltip="Mentés">Save</button>
<button matTooltip="Szöveg" matTooltipPosition="above">Felül</button>
```

NE használd: `data-tooltip` - ELAVULT!

---

## IKON RENDSZER (LUCIDE)

### Új ikon hozzáadása - KÉT LÉPÉS KÖTELEZŐ!

**1. lépés:** `src/app/shared/constants/icons.constants.ts`

```typescript
export const ICONS = {
  // ... meglévő ikonok
  PERCENT: 'percent',  // konstans hozzáadása
} as const;
```

**2. lépés:** `src/app/shared/constants/lucide-icons.ts`

```typescript
import { Percent } from 'lucide-angular';  // import hozzáadása

export const LUCIDE_ICONS_MAP = {
  // ... meglévő ikonok
  Percent,  // objektumhoz hozzáadás
};
```

> GYAKORI HIBA: Ha csak az icons.constants.ts-hez adod hozzá, de a lucide-icons.ts-hez NEM, akkor "[name] icon not found" hibát kapsz!

### Használat komponensben

```typescript
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({ imports: [LucideAngularModule] })
export class MyComponent {
  readonly ICONS = ICONS;
}
```

```html
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
```

NE használd: Emojikat - Lucide ikont használj!

---

## DIALOG RENDSZER

### DialogWrapperComponent (ajánlott)

```typescript
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
```

- **3 header stílus:** hero (gradient+nagy ikon), flat (border-bottom+kis ikon), minimal (csak cím)
- **3 méret:** sm (384px), md (480px), lg (800px)
- **5 téma:** purple, green, blue, red, amber
- **Slotok:** dialogBody, dialogLeft/dialogRight (2-column), dialogFooter, dialogExtra
- **Footer:** end/center/stretch align, Enter submit, ESC close

### Egyedi dialógus (ha DialogWrapper nem elég)

```typescript
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({...})
export class MyDialogComponent {
  close = output<void>();
  backdropHandler = createBackdropHandler(() => this.close.emit());
}
```

### Panel méretek (CSS)

| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR modal |
| `dialog-panel--lg` | 600px | Részletes form |

---

## UI/UX ANIMÁCIÓK

### Loading States
- **Skeleton loading** spinner helyett (shimmer effekttel)

### Lista Animációk
- **Staggered entry**: Kártyák egymás után (0.05s delay)
- **Hover**: translateY(-2px) + shadow növelés

### Dialog/Modal
- **Backdrop**: fadeIn 0.2s
- **Content**: slideUp 0.3s cubic-bezier

### A11y - KÖTELEZŐ!

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PAGE-CARD LAYOUT

```html
<div class="my-component page-card">
  <!-- Tartalom -->
</div>
```

---

## ELECTRON SPECIFIKUS SZABÁLYOK

### IPC Biztonsági Checklist

```typescript
ipcMain.handle('handler-name', async (_event, params) => {
  // 1. Típus validáció
  if (typeof params.key !== 'string') {
    return { success: false, error: 'Invalid params' };
  }
  // 2. Hossz/méret limit
  if (params.key.length > 100) {
    return { success: false, error: 'Key too long' };
  }
  // 3. try/catch + logging
  try {
    return { success: true, data };
  } catch (error) {
    log.error('Handler failed:', error);
    return { success: false, error: 'Operation failed' };
  }
});
```

### ElectronService Használat

```typescript
if (this.electronService.isElectron) {
  // Desktop-only kód
}
```

---

## CAPACITOR SPECIFIKUS SZABÁLYOK

```typescript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Mobile-only kód
}
```

---

## TESZTELÉSI KÖVETELMÉNYEK

| Típus | Tool | Coverage cél |
|-------|------|--------------|
| Unit | Vitest + Testing Library | >80% core |
| E2E | Playwright | Kritikus flow-k |
| Visual | Storybook | Komponensek |

```bash
npm run test           # Unit tesztek
npm run test:coverage  # Coverage report
npm run e2e            # E2E tesztek
```

---

## REF MCP - DOKUMENTÁCIÓ KERESÉS

| Helyzet | Parancs |
|---------|---------|
| Angular API | `ref_search_documentation("angular signal")` |
| Angular Material | `ref_search_documentation("angular material dialog")` |
| RxJS operátor | `ref_search_documentation("rxjs switchMap")` |
| Laravel | `ref_search_documentation("laravel eloquent relationship")` |
| Electron API | `ref_search_documentation("electron ipcMain")` |

**NE TALÁLJ KI API-T!** Ha bizonytalan vagy, keresd meg a doksiban!

---

## PROJEKT FÁJLOK REFERENCIA

| Fájl | Leírás | Mikor olvasd |
|------|--------|--------------|
| `CLAUDE.md` | Frontend szabályok + workflow | MINDIG |
| `COMPONENT_REGISTRY.md` | Komponens/service katalógus | Új komponens előtt |
| `PROJECT_INDEX.json` | Gépi projekt struktúra | Kereséshez |
| `LESSONS_LEARNED.md` | Gyakori hibák + megoldások | Tanulságokért |
| `.claude/AGENTS.md` | Agent prompt sablonok | Subagent spawoláshoz |
| `.claude/WORKFLOWS.md` | Workflow példák | Komplex feladatokhoz |
| `.claude/context/*.md` | Smart context fájlok | Feladat alapján |

---

## ACE Learned Strategies

<!-- ACE:START - Do not edit manually -->
skills[2	]{id	section	content	helpful	harmful	neutral}:
  angular_dialog_patterns-00001	angular_dialog_patterns	Place Angular dialogs outside page-card containers for backdrop-filter	1	0	0
  tooling_workarounds-00002	tooling_workarounds	Use ace-learn --lines N flag after /resume sessions	1	0	0
<!-- ACE:END -->
