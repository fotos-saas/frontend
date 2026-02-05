# 📋 Plans & Decisions Archive

Ez a mappa tartalmazza az összes tervet, döntést és stratégiát amit Claude készített.

## Mappa Struktúra

```
.claude/plans/
├── README.md              ← Ez a fájl
├── active/                ← Aktív, folyamatban lévő tervek
│   └── [feature-name].md
├── completed/             ← Befejezett tervek (archívum)
│   └── [date]-[name].md
└── decisions/             ← Architektúra döntések (ADR)
    └── [number]-[name].md
```

## Fájl Formátum

### Plan Template
```markdown
# [Feature/Task Name]

**Státusz:** 🟡 In Progress | ✅ Completed | ❌ Cancelled
**Létrehozva:** YYYY-MM-DD
**Utolsó módosítás:** YYYY-MM-DD

## Összefoglaló
Rövid leírás...

## Feladatok
- [ ] Task 1
- [ ] Task 2
- [x] Completed task

## Technikai Részletek
...

## Kapcsolódó Fájlok
- `path/to/file.ts`
```

### Decision Template (ADR)
```markdown
# ADR-[number]: [Title]

**Státusz:** Accepted | Superseded | Deprecated
**Dátum:** YYYY-MM-DD

## Kontextus
Mi a probléma?

## Döntés
Mit választottunk?

## Következmények
Mi lesz a hatása?
```

## Használat

Claude automatikusan:
1. **MENTI** a terveket ide implementáció előtt
2. **OLVASSA** az aktív terveket új session elején
3. **MOZGATJA** completed/-be ha kész
