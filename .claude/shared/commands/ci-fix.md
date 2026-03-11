---
name: ci-fix
description: CI warning-ok automatikus javítása — lekéri a legutóbbi futás logját, kigyűjti a hibákat, és javítja
user_invocable: true
---

# PhotoStack CI-Fix — Automatikus CI Warning Javítás

## 1. Legutóbbi CI futás lekérése

Futtasd PÁRHUZAMOSAN mindkét repóra:

### Frontend CI
```bash
cd frontend && gh run list --limit 1 --json databaseId,conclusion,name --jq '.[0]'
```
Ha van futás, kérd le a logját:
```bash
gh run view <ID> --log-failed 2>/dev/null || gh run view <ID> --log
```

### Backend CI
```bash
cd backend && gh run list --limit 1 --json databaseId,conclusion,name --jq '.[0]'
```
Ha van futás:
```bash
gh run view <ID> --log-failed 2>/dev/null || gh run view <ID> --log
```

## 2. Warning-ok kigyűjtése

A CI logból keresd ki:
- `::warning::` — GitHub Actions warning annotations
- `⚠️` — saját warning üzenetek
- `TÚLMÉRET` / `sor, limit:` — fájlméret túllépések
- `console.log` — debug maradványok
- `shell_exec` — security hibák
- `safeLikePattern` — ILIKE security
- `dd(` / `dump(` / `var_dump(` — debug függvények
- `localStorage.*token` — token tárolás hiba
- Pint hibák — code style
- TypeScript hibák — compile errors

## 3. Priorizálás

Rendezd táblázatba:

| # | Prioritás | Repó | Fájl | Probléma | Javítás |
|---|-----------|------|------|----------|---------|
| | 🔴 SECURITY | | | | |
| | 🟠 HIBA | | | | |
| | 🟡 WARNING | | | | |

Prioritás sorrend:
1. 🔴 **SECURITY** — shell_exec, localStorage token, ILIKE, dd/dump
2. 🟠 **HIBA** — TypeScript compile error, PHP szintaxis
3. 🟡 **WARNING** — fájlméret, console.log, Pint style, lint

## 4. Javítás

Minden problémát javíts Agent tool-okkal PÁRHUZAMOSAN ahol lehet:

### Fájlméret túllépés (>500 sor)
- Bontsd szét a fájlt: service → sub-service, controller → controller + action
- CLAUDE.md szabályok szerint (max 500 sor, metódus max 50 sor)

### Security hibák
- `shell_exec` → Symfony Process
- `localStorage.*token` → sessionStorage
- ILIKE → `QueryHelper::safeLikePattern()`
- `dd(`/`dump(`/`var_dump(` → törölni

### console.log maradványok
- Töröld, KIVÉVE ha `// keep` komment van mellette

### Pint code style
- Futtasd: `docker exec photostack-app php vendor/bin/pint`

### TypeScript hibák
- Javítsd a compile error-okat

## 5. Commit + Push

Javítás után:
1. `git pull --rebase` mindkét repóban
2. Commit: `fix: CI warning-ok javítása — [rövid összefoglaló]`
3. Push mindkét repó

## 6. Ellenőrzés

Várd meg az új CI futást:
```bash
cd frontend && gh run list --limit 1 --watch
cd backend && gh run list --limit 1 --watch
```

Ha minden zöld → jelentsd a usernek hány warning-ot javítottál.
Ha maradt warning → listázd mi maradt és miért (pl. túl nagy refaktor kellene).
