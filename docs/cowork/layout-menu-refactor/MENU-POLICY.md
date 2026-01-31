# Menü Policy - Hova kerüljön az új menüpont?

> **CÉL**: Konzisztens menüstruktúra fenntartása. Új feature = tudd hova rakd!

---

## Menü Kategóriák

### 🏠 Főoldal (root)
**Route**: `/dashboard`
**Mi kerül ide**: Semmi más, ez standalone

---

### 📸 Tabló szekció
**Parent route**: `/tablo/*`

**IDE TARTOZIK**:
- Képek, fotók, galéria
- Tablóminták, sablonok
- Osztály/csapat kezelés
- Szavazások (tablóhoz kapcsolódó)
- Képszerkesztés, filterek
- Tabló előnézet, preview

**Jelenlegi almenük**:
```
📸 tabló
├── galéria      /tablo/gallery     - feltöltött képek
├── minták       /tablo/samples     - tabló sablonok
├── csapat       /tablo/team        - osztály tagok kezelése
└── szavazások   /tablo/votes       - idézet/kép szavazás
```

**Példák új menüpontokra**:
| Feature | Hova? | Route |
|---------|-------|-------|
| Képszerkesztő | tabló → szerkesztő | `/tablo/editor` |
| Tabló preview | tabló → előnézet | `/tablo/preview` |
| Háttérválasztó | tabló → hátterek | `/tablo/backgrounds` |
| Idézet szerkesztő | tabló → idézetek | `/tablo/quotes` |

---

### 🛒 Rendelés szekció
**Parent route**: `/order/*` vagy standalone routes

**IDE TARTOZIK**:
- Kosár, checkout
- Korábbi rendelések
- Nyomtatási méretek
- Fizetés, számlázás
- Szállítás, átvétel
- Kuponok, kedvezmények
- Webshop termékek

**Jelenlegi almenük**:
```
🛒 rendelés
├── kosár        /cart              - aktuális kosár
└── korábbi      /orders            - rendelés történet
```

**Példák új menüpontokra**:
| Feature | Hova? | Route |
|---------|-------|-------|
| Checkout | kosár oldalon belül | `/cart/checkout` |
| Rendelés részletek | korábbi → [id] | `/orders/:id` |
| Termék konfigurátor | rendelés → termékek | `/order/products` |
| Kuponjaim | rendelés → kuponok | `/order/coupons` |
| Pickpont választó | checkout flow része | `/cart/checkout/pickup` |

---

### 📅 Naptár (root)
**Route**: `/calendar`

**IDE TARTOZIK**:
- Osztály események
- Határidők
- Fotózási időpontok
- Emlékeztetők

**NINCS almenü** - ha bővül:
```
📅 naptár
├── események    /calendar/events
├── határidők    /calendar/deadlines
└── fotózások    /calendar/shoots
```

---

### 📰 Hírek (root)
**Route**: `/news`

**IDE TARTOZIK**:
- Osztály hírek, posztok
- Bejelentések
- Kommentek

**NINCS almenü** - ha bővül:
```
📰 hírek
├── posztok      /news/posts
└── archívum     /news/archive
```

---

### ⚙️ Beállítások (bottom, sticky)
**Route**: `/settings`
**Pozíció**: MINDIG a sidebar ALJÁN!

**IDE TARTOZIK**:
- Profil beállítások
- Értesítési preferenciák
- Fiók kezelés
- Nyelv, téma
- Adatvédelem

**Ha bővül**:
```
⚙️ beállítások
├── profil       /settings/profile
├── értesítések  /settings/notifications
├── fiók         /settings/account
└── adatvédelem  /settings/privacy
```

---

## Új Root Menüpontok

Ha egy feature **NEM ILLIK** a fenti kategóriákba, lehet új root menüpont.

### Mikor legyen új root?
- ✅ Teljesen független funkcionalitás
- ✅ Saját komplex aloldal struktúra lesz
- ✅ Nem logikus a meglévőkbe tenni

### Elhelyezési szabályok

```
🏠 főoldal           ← Fix, első
📸 tabló             ← Core feature #1
🛒 rendelés          ← Core feature #2
─────────────────────
[ÚJ FEATURE-ÖK IDE]  ← Közép szekció
─────────────────────
📅 naptár            ← Utility
📰 hírek             ← Utility
═════════════════════
⚙️ beállítások       ← FIX, ALUL, STICKY!
```

### Javasolt új root menüpontok

| Feature | Ikon | Label | Route | Indoklás |
|---------|------|-------|-------|----------|
| Értesítési központ | 🔔 | értesítések | `/notifications` | Önálló feature, nem settings |
| Bökések/Pokes | 👉 | bökések | `/pokes` | Önálló interakció rendszer |
| Hiányzók nyomozása | 🔍 | nyomozás | `/missing` | Önálló feature |
| Időkapszula | 💊 | kapszula | `/capsule` | Ha lesz ilyen |
| Segítség | ❓ | segítség | `/help` | Support, FAQ |

---

## Döntési Fa - Hova rakjam?

```
Új feature jön
     │
     ▼
┌─────────────────────────────────┐
│ Képekkel, tablóval kapcsolatos? │
└─────────────────────────────────┘
     │ IGEN                    │ NEM
     ▼                         ▼
  📸 TABLÓ             ┌───────────────────────────┐
                       │ Vásárlás, pénz, rendelés? │
                       └───────────────────────────┘
                            │ IGEN           │ NEM
                            ▼                ▼
                        🛒 RENDELÉS    ┌─────────────────────┐
                                       │ Idő, dátum, event?  │
                                       └─────────────────────┘
                                            │ IGEN      │ NEM
                                            ▼           ▼
                                        📅 NAPTÁR  ┌─────────────────┐
                                                   │ Kommunikáció,   │
                                                   │ poszt, hír?     │
                                                   └─────────────────┘
                                                        │ IGEN    │ NEM
                                                        ▼         ▼
                                                    📰 HÍREK  ┌──────────────┐
                                                              │ User config? │
                                                              └──────────────┘
                                                                  │ IGEN  │ NEM
                                                                  ▼       ▼
                                                              ⚙️ BEÁLL.  ÚJ ROOT!
```

---

## Implementációs Példa

### Új menüpont hozzáadása

```typescript
// menu-config.service.ts

// 1. Almenü hozzáadása meglévő szekcióhoz
{
  id: 'tablo',
  label: 'tabló',
  icon: '📸',
  children: [
    { id: 'gallery', label: 'galéria', route: '/tablo/gallery' },
    { id: 'samples', label: 'minták', route: '/tablo/samples' },
    { id: 'team', label: 'csapat', route: '/tablo/team' },
    { id: 'votes', label: 'szavazások', route: '/tablo/votes' },
    // ✅ ÚJ - ide a végére
    { id: 'editor', label: 'szerkesztő', route: '/tablo/editor' },
  ],
},

// 2. Új root menüpont (a megfelelő pozícióba!)
// A _menuItems tömbben, a naptár ELÉ:
{
  id: 'pokes',
  label: 'bökések',
  icon: '👉',
  route: '/pokes',
  badge: 5, // ha van olvasatlan
},
{
  id: 'calendar',  // Naptár marad utána
  ...
},
```

---

## Sorrend Szabályok

### Almenük sorrendje
1. **Leggyakrabban használt** → elől
2. **Logikai sorrend** (pl. kosár → fizetés → rendelések)
3. **Új feature** → végére (amíg nem derül ki a usage)

### Root menük sorrendje
1. 🏠 Főoldal (fix)
2. 📸 Tabló (core)
3. 🛒 Rendelés (core)
4. [Új feature-ök relevancia szerint]
5. 📅 Naptár (utility)
6. 📰 Hírek (utility)
7. ─── SEPARATOR ───
8. ⚙️ Beállítások (fix, alul)

---

## NE CSINÁLD

```typescript
// ❌ ROSSZ - Beállítások NEM a fő menüben
{
  id: 'tablo',
  children: [
    { id: 'settings', label: 'tabló beállítások', route: '/tablo/settings' },
  ],
}
// ✅ JÓ - Maradjon a Settings oldalon belül
// /settings/tablo vagy /settings oldalon egy szekció

// ❌ ROSSZ - Túl mély nesting
{
  id: 'tablo',
  children: [
    {
      id: 'gallery',
      children: [  // NE! Max 2 szint!
        { id: 'albums', ... }
      ]
    }
  ],
}
// ✅ JÓ - Lapos struktúra, route-on belül kezelve
{ id: 'gallery', route: '/tablo/gallery' }
// Az albumok: /tablo/gallery/albums (nem menüpont, csak route)

// ❌ ROSSZ - Inkonzisztens naming
{ label: 'Galéria' }      // Nagybetű
{ label: 'KOSÁR' }        // CAPS
{ label: 'beállítások.' } // Pont a végén
// ✅ JÓ
{ label: 'galéria' }
{ label: 'kosár' }
{ label: 'beállítások' }
```

---

## Badge Szabályok

```typescript
// Badge = olvasatlan/új elemek száma

// ✅ Hol lehet badge:
{ id: 'pokes', badge: 5 }      // Olvasatlan bökések
{ id: 'cart', badge: 3 }       // Kosárban lévő itemek
{ id: 'notifications', badge: 12 } // Olvasatlan értesítések

// ❌ Hol NE legyen badge:
{ id: 'gallery', badge: 150 }  // Nem, ez nem "olvasatlan"
{ id: 'settings', badge: 1 }   // Nem, nincs "új beállítás"
```

---

## Checklist új menüpontnál

- [ ] Döntési fa szerint kiválasztva a hely
- [ ] Route konzisztens a szekcióval (`/tablo/*`, `/order/*`, stb.)
- [ ] Label lowercase
- [ ] Emoji ikon választva
- [ ] Ha almenü: parent-be a megfelelő helyre
- [ ] Ha root: sorrend szabály szerint
- [ ] Badge csak ha értelmes
- [ ] Dokumentálva itt a MENU-POLICY.md-ben

---

## Verzió történet

| Dátum | Változás |
|-------|----------|
| 2024-01-XX | Initial menu structure |
| | |
| | |

---

**EMLÉKEZTETŐ**: Ha bizonytalan vagy, kérdezd meg! Jobb előre tisztázni mint később refaktorálni a menüt.
