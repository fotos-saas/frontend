# Terv: Generikus TableHeaderComponent + Lista Grid Egységesítés

## Probléma

1. **20 helyen** van `table-header` minta (18 inline HTML + 2 dedikált komponens)
2. **`grid-template-columns` MINDIG duplikált** — header és row kétszer definiálja ugyanazt
3. **Design inkonzisztencia:**
   - Padding: `8px 16px` vs `8px 12px` vs `6px 14px` vs `12px 20px`
   - Font: `0.6875rem/0.025em` vs `0.75rem/0.05em`
   - Breakpoint: `640px` vs `768px` vs `1024px`
4. **2 komponensnél hiányzik** a `grid-template-columns` (`service-catalog`, `billing-charges`)
5. **1 outlier** teljesen más struktúrával (`marketer/project-list`)

## Megoldás

### 1. `TableHeaderComponent` — Generikus, újrafelhasználható

**Fájlok:**
```
shared/components/table-header/
  ├── table-header.component.ts    (komponens + inline template + styles)
  ├── table-header.types.ts        (TableColumn interface, SortDirection type)
  └── index.ts                     (public API export)
```

**Interface:**
```typescript
export interface TableColumn {
  key: string;           // azonosító (emit-elés sortChange-nél)
  label: string;         // megjelenített szöveg (üres string = icon-only)
  width?: string;        // CSS grid width, default: '1fr'
  align?: 'left' | 'center' | 'right';  // default: 'left'
  sortable?: boolean;    // kattintható rendezés, default: false
  icon?: string;         // Lucide ikon neve (ICONS konstans)
  tooltip?: string;      // matTooltip szöveg
}
```

**Komponens API:**
```typescript
// Inputs (signal-based)
columns = input.required<TableColumn[]>();
sortBy = input<string>('');
sortDir = input<SortDirection>('asc');

// Outputs
sortChange = output<string>();

// Computed
gridTemplate = computed(() => columns().map(c => c.width ?? '1fr').join(' '));
```

### 2. CSS Custom Property — Grid Szinkron Megoldás

A **fő probléma** (duplikált `grid-template-columns`) megoldása CSS variable-lel:

**Szülő komponens HTML:**
```html
<div class="list-container" [style.--table-cols]="gridTemplate()">
  <app-table-header [columns]="cols" ... />
  <div class="row-grid">
    @for (item of items(); track item.id) {
      <div class="list-row">...</div>
    }
  </div>
</div>
```

**`_list-page.scss` módosítás:**
```scss
.table-header {
  display: grid;
  grid-template-columns: var(--table-cols);  // ← EZ AZ ÚJ
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 4px;
}

.list-row {
  // ...meglévő stílusok...
  grid-template-columns: var(--table-cols);  // ← EZ AZ ÚJ
}
```

A `gridTemplate` computed signal-t a szülőben a `columns` definícióból számoljuk:
```typescript
readonly cols: TableColumn[] = [...];
readonly gridTemplate = computed(() => this.cols.map(c => c.width ?? '1fr').join(' '));
```

### 3. Design Egységesítés

**Egységes stílusok a `TableHeaderComponent`-ben:**
- Padding: `8px 16px` (a `_list-page.scss` base-hez igazítva)
- Font: `0.6875rem`, `600 weight`, `uppercase`, `letter-spacing: 0.025em`
- Sortable hover: `background: #f1f5f9`, active: `color: primary, background: #e0f2fe`
- Non-sortable: `cursor: default`, no hover effect
- Responsive: `@media (max-width: 640px) { display: none }` (alapértelmezett)

---

## Implementációs Sprintek

### Sprint 1: Alap Komponens + `_list-page.scss` Frissítés

1. Létrehozás:
   - `table-header.types.ts` — `TableColumn`, `SortDirection`
   - `table-header.component.ts` — standalone, OnPush, inline template+styles
   - `index.ts` — export-ok

2. `_list-page.scss` frissítés:
   - `.table-header` + `.list-row` → `grid-template-columns: var(--table-cols)`
   - A régi `grid-template-columns` override-ok továbbra is működnek (CSS specifikusság)

### Sprint 2: Egyszerű statikus fejlécek migrálása (12 db)

Nincs sortable, egyszerű label-ek. Minden esetben:
- Oszlop definíció hozzáadása a TS-ben (`cols: TableColumn[]`)
- `gridTemplate` computed signal
- HTML: `<div [style.--table-cols]="gridTemplate()">` wrapper
- HTML: `<app-table-header [columns]="cols" />`
- SCSS: `grid-template-columns` duplikált sorok TÖRLÉSE

**Érintett fájlok (12 pár = HTML + SCSS):**

| # | Komponens | Jelenlegi grid | Oszlopszám |
|---|-----------|---------------|------------|
| 1 | `school-list` | `1fr 100px 120px` | 3 |
| 2 | `teacher-list` | `1fr 200px 120px` | 3 |
| 3 | `client-list` (orders) | `1fr 100px 80px` | 3 |
| 4 | `contact-list` | `1fr 1fr 120px 80px` | 4 |
| 5 | `student-list` | `1fr 100px 200px 100px` | 4 |
| 6 | `bug-report-list` (partner) | `1fr 120px 120px 150px` | 4 |
| 7 | `webshop-orders` | (hiányzik, pótolni) | 5 |
| 8 | `billing-list` | `140px 1fr 120px 120px 130px` | 5 |
| 9 | `invoices` (subscription) | `1.2fr 1fr 0.8fr 100px 180px` | 5 |
| 10 | `service-catalog` | (hiányzik, pótolni) | 5 |
| 11 | `billing-charges` | (hiányzik, pótolni) | 6 |
| 12 | `gallery-monitoring` | `2fr 70px 130px 90px 80px 120px` | 6 |

### Sprint 3: Sortable fejlécek migrálása (4 db)

| # | Komponens | Sortable oszlopok |
|---|-----------|-------------------|
| 1 | `project-table-header` → törlés | school_name, tablo_status, missing_count |
| 2 | `finalization-table-header` → törlés | school_name, finalized_at |
| 3 | `subscriber-detail` (audit log) | dátum |
| 4 | `project-users-tab` | dátum |

A 2 dedikált komponens (`project-table-header`, `finalization-table-header`) **törölhető**.

### Sprint 4: Complex/Outlier esetek (4 db)

| # | Komponens | Teendő |
|---|-----------|--------|
| 1 | `subscribers-list` (super-admin) | `1fr 120px 120px 120px 100px 40px`, statikus migráció |
| 2 | `bug-report-list` (super-admin) | `1fr 140px 110px 110px 80px 140px`, statikus migráció |
| 3 | `invoice-list` (billing/tabs) | `1.5fr 1.5fr 1fr 0.8fr 0.8fr 1fr`, statikus migráció |
| 4 | `marketer/project-list` | **REDESIGN:** col-* → th-* migráció, egyedi background header stílus megtartása VAGY egységesítés |

### Sprint 5: Cleanup

1. Régi SCSS duplikált `grid-template-columns` sorok törlése
2. `project-table-header/` mappa törlése
3. `finalization-table-header/` mappa törlése
4. Padding/font/breakpoint inkonzisztenciák felszámolása
5. `@use '...' as *` → `@use '...' as list` javítás (bug-report-list)

---

## Összesítés

| Mutató | Előtte | Utána |
|--------|--------|-------|
| Inline `.table-header` HTML blokkok | 18 | 0 |
| Dedikált header komponensek | 2 (nem reusable) | 1 (generikus) |
| Duplikált `grid-template-columns` | ~18 pár (36 def.) | 0 (CSS variable) |
| Padding variációk | 4 féle | 1 (egységes) |
| Font variációk | 2 féle | 1 (egységes) |
| Responsive breakpoint variációk | 3 féle | 1 (egységes, 640px) |

**Érintett fájlok:** ~40-45 (20 HTML + 16 SCSS + 3 új + 2 törölt + `_list-page.scss`)
