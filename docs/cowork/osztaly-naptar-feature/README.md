# Osztály Naptár Feature - TELJES DOKUMENTÁCIÓ

> **Tablókirály** - Közös események, közös élmények
> Verzió: 1.0 | Dátum: 2025-01-19

---

## STÁTUSZ: ✅ TELJESEN MEGTERVEZVE

---

## Mi ez?

Egyszerű eseménynaptár ahol a diákok látják az osztály **összes fontos dátumát**: szalagavató, ballagás, érettségi, fotózás, stb.

**"Mikor is van a szalagavató?" → App megnyit → 3 másodperc alatt tudja**

---

## Dokumentumok

| # | Fájl | Tartalom | Státusz |
|---|------|----------|---------|
| 01 | [user-flow.md](./01-user-flow.md) | Teljes UX flow, minden interakció | KÉSZ |
| 02 | [ui-design.md](./02-ui-design.md) | UI komponensek, ASCII mockups | KÉSZ |
| 03 | [backend-api.md](./03-backend-api.md) | REST API specifikáció | KÉSZ |
| 04 | [database-schema.md](./04-database-schema.md) | Adatbázis táblák | KÉSZ |
| 05 | [components.md](./05-components.md) | Angular komponensek | KÉSZ |
| -- | [CLAUDE-INSTRUCTIONS.md](./CLAUDE-INSTRUCTIONS.md) | Implementációs utasítások | KÉSZ |

---

## Vizuális Koncepció

```
┌─────────────────────────────┐
│ 📅 Osztály Naptár       ☰  │
├─────────────────────────────┤
│                             │
│ ─── JANUÁR ───────────────  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📸 Tabló fotózás        │ │
│ │    Jan 31. 10:00        │ │
│ │    👥 22 megy           │ │
│ │    [Érdekel] [✓ Megyek] │ │
│ └─────────────────────────┘ │
│                             │
│ ─── FEBRUÁR ──────────────  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💃 Szalagavató          │ │
│ │    Feb 14. 18:00        │ │
│ │    👥 25 megy • 2 érdek │ │
│ └─────────────────────────┘ │
│                             │
│ [+ Esemény]  ← Kapcsolatt.  │
└─────────────────────────────┘
```

---

## Funkciók

### Diák

| Funkció | Leírás |
|---------|--------|
| Lista nézet | Események időrendben, hónap csoportosítás |
| Részletek | Tap → modal (hely, idő, leírás) |
| Érdekel gomb | Jelzi érdeklődését |
| Megyek gomb | Jelzi részvételét |
| Push emlékeztető | 1 nappal előtte értesítés |

### Kapcsolattartó

| Funkció | Leírás |
|---------|--------|
| Új esemény | Form + ikon választó |
| Szerkesztés | Esemény módosítása |
| Törlés | Confirm dialog |
| Résztvevők | Látja ki megy / érdekel |
| Push küldés | Azonnali értesítés |

---

## Ami NEM kell (LATER)

| Funkció | Miért nem |
|---------|-----------|
| Hónap grid nézet | Mobilon felesleges |
| Google Calendar sync | Túl komplex most |
| Ismétlődő események | Nincs rá igény |
| Widget a Home-on | Később, ha kell |

---

## Tech Stack

| Réteg | Technológia |
|-------|-------------|
| Frontend | Angular 19, Signals, Tailwind |
| Backend | Laravel, REST API |
| DB | MySQL |
| Push | OneSignal (meglévő) |

---

## Becsült idő

| Fázis | Idő |
|-------|-----|
| Frontend komponensek | 2 nap |
| Backend API | 1 nap |
| Push integration | 0.5 nap |
| Tesztelés | 0.5 nap |
| **ÖSSZESEN** | **4 nap** |

---

## Kapcsolódás más feature-ökhöz

- **Hírfolyam**: Új esemény → feed item
- **Push**: Emlékeztető 1 nappal előtte
- **WebSocket**: Real-time "Megyek" frissítés

---

**READY FOR DETAILED PLANNING**
