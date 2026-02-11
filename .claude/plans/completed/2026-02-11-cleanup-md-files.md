# MD Fájlok Rendszerezése

**Státusz:** 🟡 In Progress
**Létrehozva:** 2025-02-05
**Utolsó módosítás:** 2025-02-05

## Összefoglaló
A frontend root-ban 32+ MD fájl van szétszórva. Rendszerezzük mappákba.

## Jelenlegi Káosz

```
frontend/
├── A11Y-COLOR-CONTRAST-FIX.md     ← A11Y
├── A11Y_AUDIT_REPORT.md           ← A11Y
├── A11Y_QUICK_FIX_GUIDE.md        ← A11Y
├── ACCESSIBILITY_FIXES.md         ← A11Y
├── ACCESSIBILITY_INDEX.md         ← A11Y
├── ACCESSIBILITY_SUMMARY.md       ← A11Y
├── CLAUDE.md                      ← MARAD (projekt config)
├── COMPONENT_REGISTRY.md          ← MARAD (workflow)
├── DARK_MODE_SETUP.md             ← Setup guide
├── DESIGN-SYSTEM.md               ← Design
├── DESKTOP_APP_STRATEGY.md        ← Plans
├── E2E_QUICK_START.md             ← Testing
├── E2E_SETUP_SUMMARY.md           ← Testing
├── LESSONS_LEARNED.md             ← MARAD (workflow)
├── PHOTO-SELECTION-BUGS.md        ← Bugs
├── PLAYWRIGHT_SETUP.md            ← Testing
├── REFACTORING-PLAN.md            ← Plans (completed?)
├── REFACTOR_PLAN.md               ← Plans (duplikált?)
├── VITEST_*.md                    ← Testing (4 db!)
├── Z-INDEX-*.md                   ← Completed refactor
└── ...
```

## Célstruktúra

```
frontend/
├── CLAUDE.md                      ← Projekt config
├── COMPONENT_REGISTRY.md          ← Workflow
├── LESSONS_LEARNED.md             ← Workflow
├── PROJECT_INDEX.json             ← Workflow
├── README.md                      ← Projekt README
│
├── docs/                          ← Dokumentáció
│   ├── accessibility/             ← A11Y dokumentáció
│   │   ├── audit-report.md
│   │   ├── color-contrast-fix.md
│   │   └── quick-fix-guide.md
│   ├── testing/                   ← Tesztelés
│   │   ├── e2e-setup.md
│   │   ├── playwright.md
│   │   └── vitest.md
│   ├── setup/                     ← Setup guides
│   │   ├── dark-mode.md
│   │   └── design-system.md
│   └── z-index-scale.md
│
└── .claude/
    └── plans/
        ├── active/
        ├── completed/
        │   ├── 2025-xx-xx-a11y-refactor.md
        │   ├── 2025-xx-xx-z-index-refactor.md
        │   └── 2025-xx-xx-vitest-setup.md
        └── decisions/
            └── 001-electron-over-tauri.md
```

## Feladatok

- [ ] A11Y fájlok → docs/accessibility/
- [ ] Testing fájlok → docs/testing/
- [ ] Setup fájlok → docs/setup/
- [ ] Completed tervek → .claude/plans/completed/
- [ ] Duplikált fájlok törlése
- [ ] DESKTOP_APP_STRATEGY.md → .claude/plans/active/

## Prompt a végrehajtáshoz

```
Rendszerezd a frontend MD fájlokat:

1. Mozgasd docs/accessibility/-be:
   - A11Y*.md
   - ACCESSIBILITY*.md

2. Mozgasd docs/testing/-be:
   - E2E*.md
   - PLAYWRIGHT*.md
   - VITEST*.md
   - TESTING.md

3. Mozgasd docs/setup/-be:
   - DARK_MODE_SETUP.md
   - DESIGN-SYSTEM.md

4. Mozgasd .claude/plans/completed/-be:
   - Z-INDEX*.md (2025-02-xx-z-index-refactor.md néven)
   - REFACTOR*.md (ellenőrizd, melyik kész)

5. Töröld a duplikátokat (ha vannak)

6. Frissítsd a CLAUDE.md-t az új útvonalakkal
```
