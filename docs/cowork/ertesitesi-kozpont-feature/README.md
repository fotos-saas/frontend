# Értesítési Központ - TELJES DOKUMENTÁCIÓ

> **Tablókirály** - Minden értesítés egy helyen, Gen Z stílusban
> Verzió: 1.0 | Dátum: 2025-01-19

---

## STÁTUSZ: ✅ TELJESEN MEGTERVEZVE

---

## Mi ez?

Egy **egységes értesítési rendszer**, ami három rétegből áll:
1. **In-App Inbox** - Bell icon + dropdown, összes értesítés tárolva
2. **Toast/Snackbar** - Azonnali feedback akciókra
3. **Notification Modes** - "chill / aktív / mindent" módok

**Kiegészíti a meglévő push stratégiát** (05-push-strategia.md) az in-app résszel.

---

## Dokumentumok

| # | Fájl | Tartalom | Státusz |
|---|------|----------|---------|
| 01 | [user-flow.md](./01-user-flow.md) | UX flow, user journey | ✅ KÉSZ |
| 02 | [ui-design.md](./02-ui-design.md) | UI komponensek, animációk | ✅ KÉSZ |
| 03 | [backend-api.md](./03-backend-api.md) | REST API specifikáció | ✅ KÉSZ |
| 04 | [database-schema.md](./04-database-schema.md) | Adatbázis táblák | ✅ KÉSZ |
| 05 | [components.md](./05-components.md) | Angular komponensek | ✅ KÉSZ |
| -- | [CLAUDE-INSTRUCTIONS.md](./CLAUDE-INSTRUCTIONS.md) | Implementációs utasítások | ✅ KÉSZ |

---

## Vizuális Koncepció

### Bell Icon + Inbox Dropdown

```
┌─────────────────────────────────────────────────────────┐
│  [logo]  hírfolyam  naptár  hiányzók    🔔③    [avatar] │
└─────────────────────────────────────────────────────────┘
                                           ↓ (click)
                              ┌─────────────────────────────┐
                              │ értesítések        [mind ✓] │
                              ├─────────────────────────────┤
                              │ ── ma ───────────────────── │
                              │                             │
                              │ 👉 kiss béla bökött     2p  │
                              │    "szavazz már pls"        │
                              │    [💀] [😭] [🫡] [❤️] [👀]  │
                              │                             │
                              │ 🗳️ új szavazás indult  15p  │
                              │    sablon választás         │
                              │              [megnézem →]   │
                              │                             │
                              │ ── tegnap ───────────────── │
                              │                             │
                              │ 📸 pótfotózás holnap!   1n  │
                              │    ne felejtsd el           │
                              │                             │
                              ├─────────────────────────────┤
                              │ [összes értesítés →]        │
                              └─────────────────────────────┘
```

### Toast Típusok

```
Success:
┌──────────────────────────────────────────┐
│ ✓ szavazat elküldve                      │
└──────────────────────────────────────────┘

With Action (Snackbar):
┌──────────────────────────────────────────┐
│ ✓ bökés elküldve                [vissza] │
└──────────────────────────────────────────┘

Error:
┌──────────────────────────────────────────┐
│ ✗ hiba történt               [újra]      │
└──────────────────────────────────────────┘

Warning Banner (sticky):
┌──────────────────────────────────────────────────────────┐
│ ⚠️ szavazás 1 órán belül zárul!              [megnézem] │
└──────────────────────────────────────────────────────────┘
```

### Notification Modes

```
┌─────────────────────────────────────────────┐
│ 🔔 értesítési mód                           │
├─────────────────────────────────────────────┤
│                                             │
│  [😴 chill]  [⚡ aktív]  [🔥 mindent]       │
│                  ↑                          │
│              kiválasztva                    │
│                                             │
│ ─────────────────────────────────────────── │
│ ⚡ aktív mód:                               │
│ • szavazások, határidők                     │
│ • bökések, említések                        │
│ • fontos hirdetmények                       │
│ • max 3 push/nap                            │
│                                             │
│ [részletes beállítások →]                   │
└─────────────────────────────────────────────┘
```

---

## Fő Funkciók

### 1. In-App Notification Inbox

| Feature | Leírás |
|---------|--------|
| Bell icon | Navbar-ban, badge-el az olvasatlan számmal |
| Dropdown | Utolsó 10 értesítés, csoportosítva (ma, tegnap, régebbi) |
| Full page | `/notifications` - összes értesítés, szűrőkkel |
| Mark as read | Egyenként vagy "mind olvasott" |
| Quick actions | Inline reakciók, "megnézem" gombok |
| Real-time | WebSocket-en keresztül új értesítések |

### 2. Toast/Snackbar System

| Típus | Mikor | Auto-dismiss | Akció |
|-------|-------|--------------|-------|
| **Toast** | Siker feedback | 3s | - |
| **Snackbar** | Visszavonható akció | 5s | "vissza" |
| **Error toast** | Hiba | 5s | "újra" |
| **Banner** | Fontos figyelmeztetés | Manuális | CTA gomb |

### 3. Notification Modes (V1 - Egyszerűsített)

| Mód | Push/nap | Mit kap | Mikor ajánlott |
|-----|----------|---------|----------------|
| 🔔 normál | max 3 | Szavazások, bökések, válaszok, hirdetmények | Alapértelmezett |
| 🔕 csendes | max 1 | Csak kritikus (hirdetmények, @mention) | Vizsgaidőszak |

> **V2-ben:** 3 módra bővíthető (chill/aktív/mindent)

### 4. WebSocket Cascade Logic

```
Esemény történik
      ↓
User ONLINE? ───yes──→ In-app toast/dropdown frissül (NO push)
      │
      no
      ↓
Push notification küldés
      ↓
User 7 napja inaktív? ───yes──→ Email digest is
```

---

## Értesítés Típusok

| Típus | Emoji | Példa | Prioritás |
|-------|-------|-------|-----------|
| `poke_received` | 👉 | "kiss béla bökött" | HIGH |
| `poke_reaction` | 💀😭🫡 | "kiss béla reagált: 💀" | MEDIUM |
| `vote_created` | 🗳️ | "új szavazás: sablon választás" | HIGH |
| `vote_ending` | ⏰ | "szavazás 24 órán belül zárul" | HIGH |
| `vote_closed` | 📊 | "szavazás lezárult, eredmény..." | MEDIUM |
| `mention` | 📣 | "kovács peti említett" | HIGH |
| `reply` | ↩️ | "nagy anna válaszolt" | MEDIUM |
| `announcement` | 📢 | "fontos: holnap fotózás!" | CRITICAL |
| `event_reminder` | 📅 | "holnap: szalagavató" | HIGH |
| `samples_added` | 🖼️ | "4 új minta érkezett" | LOW |

---

## Micro-animációk

### Bell Icon
- **Új értesítés:** Ring animation (rotate ±15°)
- **Badge update:** Pop effect (scale 0 → 1.3 → 1)

### Toast
- **Megjelenés:** Slide up + fade in
- **Eltűnés:** Slide down + fade out
- **Progress bar:** Timer vizualizáció

### Dropdown
- **Megnyitás:** Fade in + scale (0.95 → 1)
- **Bezárás:** Fade out

### Notification Item
- **Hover:** Subtle background change
- **Új:** Pulse glow effect
- **Mark as read:** Fade transition

---

## Haptic Feedback (Mobile PWA)

| Esemény | Vibration Pattern |
|---------|-------------------|
| Új bökés | Light tap (10ms) |
| Reakció kapott | Double tap (10ms, 50ms, 10ms) |
| Deadline közelít | Warning (50ms, 100ms, 50ms) |
| Hiba | Error (100ms) |

---

## Tech Stack

| Réteg | Technológia |
|-------|-------------|
| Frontend | Angular 20+ (Signals, `input()`, `output()`, standalone, OnPush), Tailwind |
| Backend | Laravel 12, REST API |
| DB | PostgreSQL |
| Real-time | WebSocket (Laravel Reverb) - meglévő `WebsocketService` |
| Push | OneSignal (meglévő) |
| Animációk | CSS animációk |

> **MEGJEGYZÉS:** A projektben már létezik `ToastService` és `WebsocketService` - ezeket bővítjük, nem újakat hozunk létre!
> **KRITIKUS:** Minden komponens Angular 20+ Signal API-t használ: `input()`, `output()` - NEM `@Input/@Output` decorator!

---

## Kapcsolódás Más Feature-ökhöz

| Feature | Kapcsolat |
|---------|-----------|
| **Push stratégia** | Kiegészíti - in-app + cascade logic |
| **Hírfolyam** | Értesítések a feed eseményekről |
| **Hiányzók Nyomozása** | Bökés értesítések |
| **Naptár** | Event reminder értesítések |

---

## Becsült Idő

| Fázis | Idő | Megjegyzés |
|-------|-----|------------|
| Toast/Snackbar bővítés | 0.5 nap | Meglévő ToastService bővítése (queue, action callback) |
| Bell icon + dropdown | 1.5 nap | |
| Full notifications page | 1 nap | |
| Notification modes | 0.5 nap | V1: normál + csendes (2 mód) |
| WebSocket integration | 0.5 nap | Meglévő WebsocketService használata |
| Micro-animációk | 0.5 nap | |
| Backend API | 1 nap | |
| **ÖSSZESEN** | **~5 nap** | Csökkentett, mert létező infrastruktúrát használunk |

---

## Nem Tartalmaz (V1)

| Feature | Miért nem |
|---------|-----------|
| AI-alapú időzítés | Túl komplex, nem prioritás |
| Email értesítések | Külön feature később |
| Notification grouping (stacking) | V2-ben |
| Rich media in notifications | V2-ben |
| Sticky banner | V2-ben (scope csökkentés) |
| 3 notification mode (chill/aktív/mindent) | V2-ben, V1 csak 2 mód |

---

**READY FOR IMPLEMENTATION!**
