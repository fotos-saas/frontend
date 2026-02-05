# 🚀 PhotoStack Master Prompt

## Egyszerű Használat

**Másold be ezt Claude Code-nak, töltsd ki a []-es részeket:**

---

```markdown
# PhotoStack Feladat

## Előkészítés
Olvasd be:
1. frontend/CLAUDE.md (projekt szabályok)
2. [érintett fájlok listája]

## Feladat
[Írd le mit szeretnél]

## Típus (válassz egyet)
- [ ] Új feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Performance
- [ ] Security

## Követelmények
Kövesd a CLAUDE.md szabályait:
- TypeScript strict (no any)
- Cleanup pattern (takeUntil)
- Error handling
- Magyar UI szövegek
- Max 300 sor/fájl

## Workflow
1. Tervezd meg a megoldást (ne írj még kódot)
2. Várd meg a jóváhagyásom
3. Implementáld
4. Spawolj REVIEWER subagent-et a kód ellenőrzésére
5. Javítsd a review alapján

## Output
- Módosított fájlok listája
- Rövid összefoglaló
```

---

## 🎯 Gyors Prompt-ok

### Új Feature
```
Olvasd be a CLAUDE.md-t. Implementáld: [feature leírás]
Érintett: [fájlok]
Mikor kész, spawolj reviewer subagent-et.
```

### Bug Fix
```
Olvasd be: [fájl]
Bug: [leírás]
Javítsd, majd spawolj reviewer subagent-et ellenőrzésre.
```

### Refactor
```
Olvasd be: [fájl]
Probléma: [túl hosszú/duplikált kód/stb]
Tervezd meg a refactort, mutasd meg, majd implementáld.
```

### Security Check
```
Spawolj egy security audit subagent-et erre: [fájl]
Fókusz: IPC validáció, input sanitization
```

### Performance Check
```
Spawolj egy performance audit subagent-et erre: [komponens]
Fókusz: change detection, bundle size, memory
```

---

## 🤖 Subagent Prompt-ok

### Reviewer Subagent
```
Review-zd szigorúan ezt a kódot: [fájl vagy diff]

Checklist:
- Memory leak? (subscription cleanup)
- Type safety? (any használat)
- Error handling?
- Input validation?
- CLAUDE.md szabályok?

NE JAVÍTS! Csak listázd a problémákat.
```

### Security Subagent
```
Security audit: [fájl]

Ellenőrizd:
- IPC input validation
- Típus ellenőrzés
- Méret limitek
- Error message info leak
- Electron security settings

Listázd a vulnerabilities-eket severity szerint.
```

### Performance Subagent
```
Performance audit: [fájl/komponens]

Ellenőrizd:
- OnPush change detection?
- trackBy ngFor-nál?
- Virtual scrolling nagy listákhoz?
- Subscription cleanup?
- Bundle size impact?

Add meg a konkrét javítási javaslatokat.
```

---

## 📊 Teljes Workflow Prompt (Komplex Feature)

```markdown
# Teljes Workflow: [Feature Név]

## 1. ARCHITECT FÁZIS
Olvasd be: frontend/CLAUDE.md + [kapcsolódó fájlok]

Tervezd meg:
- Architektúra döntések
- Szükséges fájlok/változtatások
- Interface-ek/típusok
- Implementációs sorrend

**Várd meg a jóváhagyásom a tervhez!**

## 2. IMPLEMENT FÁZIS
Implementáld a jóváhagyott terv szerint.
Kövesd a CLAUDE.md szabályait.

## 3. REVIEW FÁZIS
Spawolj REVIEWER subagent-et:
"Review-zd a [fájlok] módosításait. Checklist: memory leak,
type safety, error handling, input validation, projekt szabályok."

## 4. FIX FÁZIS
Javítsd a KRITIKUS és FIGYELMEZTETÉS hibákat.

## 5. SECURITY FÁZIS (ha IPC/auth érintett)
Spawolj SECURITY subagent-et audit-ra.

## 6. FINAL
- Listázd a módosított fájlokat
- Rövid összefoglaló
- Breaking changes (ha van)
```

---

## ⚡ One-Liner Prompt-ok

```bash
# Új IPC handler
"Adj hozzá [handler-name] IPC handler-t. Input: [params]. Output: [result]. Kövesd a CLAUDE.md IPC mintát."

# Komponens létrehozás
"Hozz létre [ComponentName] komponenst. Standalone, OnPush, cleanup pattern. Template: [leírás]"

# Service bővítés
"Bővítsd a [ServiceName]-et: [új metódus leírás]. Error handling, TypeScript strict."

# Bug keresés
"Keress memory leak-et a [fájl]-ban. Ellenőrizd: subscription cleanup, event listener, interval."

# Quick review
"Spawolj reviewer-t: [fájl]. Fókusz: [terület]."
```

---

## 🏁 Workflow Végén

Kérd meg Claude-ot:
```
Összegezd:
1. Mit csináltál (fájlok, változások)
2. Időbecslés (Clockify-hoz)
3. Tesztelési javaslatok
```

**Clockify beírás:**
```
[Feature/Bug neve]: [rövid leírás]
Fájlok: [X fájl módosítva]
```
