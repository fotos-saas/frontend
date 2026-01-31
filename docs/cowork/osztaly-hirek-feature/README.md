# Osztály Hírek Feature - TELJES DOKUMENTÁCIÓ

> **Tablókirály** - Diák kommunikációs csatorna
> Verzió: 2.0 | Utolsó frissítés: 2025-01-19

---

## STÁTUSZ: TELJESEN MEGTERVEZVE

A feature "totál brutál végig" meg van tervezve. Minden aspektus dokumentálva.

---

## Mi ez?

Egyszerű, minimalista hírfolyam ahol a diákok látják mi történik az osztállyal.

**Egy pillantás = minden info.**

---

## Dokumentumok

| # | Fájl | Tartalom | Státusz |
|---|------|----------|---------|
| 01 | [trendkutatas.md](./01-trendkutatas.md) | Gen Z UI/UX, activity feed patterns | KÉSZ |
| 02 | [user-flow.md](./02-user-flow.md) | Részletes UX flow, minden gomb | KÉSZ |
| 03 | [komponensek.md](./03-komponensek.md) | Eredeti komponens lista | KÉSZ |
| 04 | [egyszerusitett-ui.md](./04-egyszerusitett-ui.md) | **MINIMALISTA UI KONCEPCIÓ** | KÉSZ |
| 05 | [push-strategia.md](./05-push-strategia.md) | Push notification terv (FÁZIS 2) | KÉSZ |
| 06 | [backend-api.md](./06-backend-api.md) | **API SPECIFIKÁCIÓ** | **ÚJ** |
| 07 | [database-schema.md](./07-database-schema.md) | **ADATBÁZIS SÉMA** | **ÚJ** |
| 08 | [error-states.md](./08-error-states.md) | **ERROR & EDGE CASES** | **ÚJ** |
| 09 | [animations.md](./09-animations.md) | **ANIMÁCIÓ SPEC** | **ÚJ** |
| 10 | [accessibility.md](./10-accessibility.md) | **WCAG 2.1 AA A11Y** | **ÚJ** |
| 11 | [testing-plan.md](./11-testing-plan.md) | **TESZTELÉSI TERV** | **ÚJ** |
| 12 | [caching-strategy.md](./12-caching-strategy.md) | **CACHE STRATÉGIA** | **ÚJ** |
| 13 | [angular-ux-patterns.md](./13-angular-ux-patterns.md) | **ANGULAR UX PATTERNS** | **ÚJ** |
| 14 | [realtime-websocket.md](./14-realtime-websocket.md) | **WEBSOCKET REAL-TIME** | **ÚJ** |
| -- | [CLAUDE-INSTRUCTIONS.md](./CLAUDE-INSTRUCTIONS.md) | Implementációs utasítások | KÉSZ |

---

## Vizuális Koncepció

```
┌─────────────────────────┐
│ Tablókirály    🔔③ ☰ │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 📢 Holnap fotózás!  │ │  ← Sticky banner
│ └─────────────────────┘ │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🗳️ Szavazás    2ó   │ │
│ │ Melyik sablon?      │ │
│ │ ████████░░░░ 8/25   │ │  ← Progress bar
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 💬 Kovács Peti  1n  │ │
│ │ "Szerintem a kék.." │ │
│ │ ❤️ 3                │ │
│ └─────────────────────┘ │
│                         │
│ [Több betöltése]        │
└─────────────────────────┘
```

---

## Architektúra Összefoglaló

### Frontend Komponensek (3 db)

```
src/app/
├── shared/components/
│   ├── feed-card/              # Univerzális kártya
│   ├── notification-bell/      # Harang + dropdown
│   └── announcement-banner/    # Sticky banner
└── features/
    └── news-feed/              # Feed lista
```

### Backend API Endpoints

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/projects/{id}/feed` | Feed lekérés |
| POST | `/projects/{id}/feed/mark-read` | Olvasottnak jelölés |
| GET | `/notifications` | Értesítések |
| POST | `/notifications/mark-read` | Értesítés olvasott |
| GET | `/projects/{id}/announcements/active` | Aktív banner |
| POST | `/projects/{id}/announcements` | Hirdetmény létrehozás |

### Adatbázis Táblák (7 db)

```
feed_items              # Központi feed
feed_item_reads         # Ki mit olvasott
notifications           # User értesítések
notification_settings   # Push beállítások
announcements           # Hirdetmények
announcement_dismissals # Ki mit rejtett el
announcement_views      # Megtekintés statisztika
```

---

## Technikai Követelmények

### Frontend

| Követelmény | Érték |
|-------------|-------|
| Framework | Angular 19 |
| State | Signals (nem RxJS BehaviorSubject) |
| Styling | Tailwind CSS + SCSS |
| Change Detection | OnPush |
| Max file size | 300 sor |
| TypeScript | Strict, no `any` |

### Performance

| Metrika | Cél |
|---------|-----|
| FCP | < 2s |
| LCP | < 2.5s |
| CLS | < 0.1 |
| Bundle size | < 250KB gzipped |
| Lighthouse | > 90 |

### Accessibility

| Követelmény | Standard |
|-------------|----------|
| WCAG level | AA |
| Kontraszt | 4.5:1 min |
| Touch target | 44x44px min |
| Screen reader | VoiceOver, NVDA tested |

---

## Implementációs Fázisok

### FÁZIS 1: Feed Card (1 nap)
- [ ] `news.types.ts` létrehozás
- [ ] `feed-card` komponens
- [ ] SCSS stílusok
- [ ] Chrome teszt

### FÁZIS 2: News Feed (1 nap)
- [ ] `news.service.ts` (mock data)
- [ ] `news-feed` komponens
- [ ] Empty state + loading
- [ ] Chrome teszt

### FÁZIS 3: Notification Bell (1 nap)
- [ ] `notification-bell` komponens
- [ ] Navbar integráció
- [ ] Dropdown + badge
- [ ] Chrome teszt

### FÁZIS 4: Home Integráció (0.5 nap)
- [ ] `announcement-banner` komponens
- [ ] Home módosítás
- [ ] Chrome teszt

### FÁZIS 5: Navigáció (0.5 nap)
- [ ] Router bekötés
- [ ] E2E teszt
- [ ] Végső screenshot

### FÁZIS 6: Backend API (2 nap)
- [ ] Feed endpoints
- [ ] Notification endpoints
- [ ] Announcement endpoints
- [ ] WebSocket setup

### FÁZIS 7: Push Notifications (2 nap)
- [ ] OneSignal setup
- [ ] Backend push küldés
- [ ] Opt-in UI
- [ ] User settings

**ÖSSZESEN: ~8 nap**

---

## Design Szabályok

### "Less is More"

| ❌ Kerülendő | ✅ Használandó |
|--------------|----------------|
| Sok gomb | Kattintható kártya |
| Infinite scroll | "Több" gomb |
| Swipe gestures | Egyszerű tap |
| Komplex animációk | Subtle transitions |
| Sok szín | 2-3 szín max |

### Színek

```
Light Mode:
  Háttér:      #F8FAFC
  Kártya:      #FFFFFF
  Szöveg:      #1E293B
  Primary:     #3B82F6

Dark Mode:
  Háttér:      #0F172A
  Kártya:      #1E293B
  Szöveg:      #F1F5F9
```

---

## Push Notification Szabályok

| Szabály | Limit |
|---------|-------|
| Max push / nap | 3 |
| Min idő két push között | 2 óra |
| User online | NE küldj push-t |
| Csoportosítás | "3 új szavazat" (nem 3 külön) |

### Opt-In Stratégia

```
❌ ROSSZ: Azonnal kérdezni
✅ JÓ: Első szavazás UTÁN kérdezni
```

---

## Sikerkritérium

A feature AKKOR kész, ha:

1. ✅ Minden dokumentum checkbox pipálva
2. ✅ Chrome-ban tesztelve, screenshot van
3. ✅ Nincs console error
4. ✅ Responsive működik (mobil, tablet, desktop)
5. ✅ Kód review: nincs 300+ soros fájl
6. ✅ Performance: smooth scroll, nincs lag
7. ✅ Accessibility: WCAG 2.1 AA megfelelés
8. ✅ Tesztek: Unit + E2E lefedettség

---

## Gyors Linkek

- **Claude Code:** [CLAUDE-INSTRUCTIONS.md](./CLAUDE-INSTRUCTIONS.md)
- **UI Design:** [04-egyszerusitett-ui.md](./04-egyszerusitett-ui.md)
- **API Spec:** [06-backend-api.md](./06-backend-api.md)
- **Error States:** [08-error-states.md](./08-error-states.md)

---

## Changelog

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-01-19 | 1.0 | Alap dokumentáció (01-05) |
| 2025-01-19 | 2.0 | Teljes specifikáció (06-12) |

---

**READY FOR IMPLEMENTATION!**
