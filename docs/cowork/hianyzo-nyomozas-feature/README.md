# Hiányzók Nyomozása v2 - TELJES DOKUMENTÁCIÓ

> **Tablókirály** - Böki a havert, csinálja a dolgát
> Verzió: 1.0 | Dátum: 2025-01-19

---

## STÁTUSZ: ✅ TELJESEN MEGTERVEZVE

---

## Mi ez?

A diákok **"megbökhetik"** azokat az osztálytársakat, akik még nem szavaztak, nem voltak fotózáson, vagy nem választottak képet. Privát, barátságos nyomásgyakorlás - Gen Z stílusban.

**Ki bökhet?** Aki korábban regisztrált.
**Kit lehet bökni?** Csak aki már belépett (van push token).

---

## Dokumentumok

| # | Fájl | Tartalom | Státusz |
|---|------|----------|---------|
| 01 | [user-flow.md](./01-user-flow.md) | Teljes UX flow, bökés journey | KÉSZ |
| 02 | [ui-design.md](./02-ui-design.md) | Gen Z UI, emoji reakciók | KÉSZ |
| 03 | [backend-api.md](./03-backend-api.md) | REST API specifikáció | KÉSZ |
| 04 | [database-schema.md](./04-database-schema.md) | Adatbázis táblák | KÉSZ |
| 05 | [components.md](./05-components.md) | Angular komponensek | KÉSZ |
| -- | [CLAUDE-INSTRUCTIONS.md](./CLAUDE-INSTRUCTIONS.md) | Implementációs utasítások | KÉSZ |

---

## Vizuális Koncepció

```
┌─────────────────────────────┐
│ 🔍 hiányzók                 │
├─────────────────────────────┤
│                             │
│ [szavazás:8][fotó:3][kép:5] │
│                             │
│ ── nem szavazott (8) ────── │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Kiss Béla            │ │
│ │    utoljára: 3 napja    │ │
│ │             [👉 bökni]  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Tóth Gábor           │ │
│ │    utoljára: tegnap     │ │
│ │             [👉 bökni]  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐│
│   👤 Szabó Mari            ││
│   ⚠️ nem lépett be még     ││
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘│
│                             │
└─────────────────────────────┘
```

---

## Főbb Funkciók

### Ki bökhet kit?

| Feltétel | Bökhet? |
|----------|---------|
| Korábban regisztrált | ✅ Igen |
| Célpont belépett már | ✅ Igen |
| Célpont NEM lépett be | ❌ Nem (nincs push token) |
| Tanárt bökni | ❌ Nem |
| Önmagát bökni | ❌ Nem |

### Bökés Kategóriák

| Kategória | Mit jelent |
|-----------|------------|
| 🗳️ Szavazás | Nem szavazott aktív szavazáson |
| 📸 Fotózás | Nem volt fotózáson / nem jelentkezett pótfotózásra |
| 🖼️ Képválasztás | Nem választott képet a sajátjai közül |

### Előre Megírt Üzenetek (Gen Z stílus)

**Szavazáshoz:**
- 💀 "szavazz már pls"
- 🙏 "légyszi 3 katt"
- ⏰ "lejár hamarosan help"
- 👀 "látunk téged"

**Fotózáshoz:**
- 📸 "pótfotózás when?"
- 🖼️ "nélküled cringe lesz a tabló"
- 📅 "írj a fotósnak asap"

**Képválasztáshoz:**
- 🤔 "válassz egyet bármelyik jó"
- ✨ "döntsd el pls"
- ⏰ "lezárul mindjárt"

**Általános:**
- 👋 "hol vagy?"
- 🫠 "hiányzol"
- 🏃 "mindenki vár"

### Emoji Reakciók (Gen Z approved)

| Emoji | Jelentés |
|-------|----------|
| 💀 | "meghalok" / vicces |
| 😭 | "sírok" / nevetek |
| 🫡 | "oké megcsinálom" |
| ❤️ | pozitív |
| 👀 | "láttalak" |

---

## Anti-spam Szabályok

| Szabály | Limit |
|---------|-------|
| Max bökés / nap / célpont | 1 |
| Max bökés / nap összesen | 5 |
| Ugyanazt max összesen | 3x |

---

## Ami NINCS

| Funkció | Miért nem |
|---------|-----------|
| Gamification / rangok | Túl komplex |
| Névtelen bökés | Nem fair |
| Tanár bökése | Nem illő |
| Nem belépett bökése | Nincs push token |

---

## Tech Stack

| Réteg | Technológia |
|-------|-------------|
| Frontend | Angular 19, Signals, Tailwind |
| Backend | Laravel, REST API |
| DB | MySQL |
| Push | OneSignal |
| Real-time | WebSocket |

---

## Becsült Idő

| Fázis | Idő |
|-------|-----|
| Frontend komponensek | 2 nap |
| Backend API | 1 nap |
| Push integration | 0.5 nap |
| Tesztelés | 0.5 nap |
| **ÖSSZESEN** | **4 nap** |

---

## Kapcsolódás Más Feature-ökhöz

- **Hírfolyam**: Bökés értesítés a feedben (opcionális)
- **Push**: Bökés notification
- **WebSocket**: Real-time reakció frissítés

---

## Gen Z Kutatás Források

- [Gen Z Mobile App Usage 2025](https://perfectpairoptical.com/gen-zs-mobile-app-usage-patterns-in-2025-trends-insights/)
- [Gen Z Emoji Meanings](https://www.sloneek.com/blog/glossary-of-gen-z-emojis/)
- [How Gen Z Uses Emoji](https://www.dictionary.com/e/gen-z-explains-emoji-to-millennials/)

---

**READY FOR IMPLEMENTATION!**
