# Diák Kommunikációs Csatorna - Koncepció Terv

> Kutatás dátuma: 2025-01-19

## Összefoglaló

A meglévő **Voting** + **Forum** modulok jó alapot adnak, de hiányzik az összekötő elem: egy központi értesítési és hirdetési rendszer.

---

## Javasolt Új Funkciók

### 🥇 1. PRIORITÁS - Értesítési Központ (Notification Center)

**Leírás:**
Központi értesítési rendszer, ami összegyűjti az összes releváns eseményt.

**Értesítési Típusok:**
```
📢 Új szavazás indult: "Melyik sablon tetszik?"
⏰ Szavazás hamarosan lejár (24h): "Sablon választás"
💬 @Kovács Peti említett téged
↩️ Válasz érkezett a hozzászólásodra
📣 Kapcsolattartói hirdetmény: "Holnap fotózás!"
✅ Szavazás lezárult, eredmények elérhetők
```

**UI Javaslat:**
- Navbar-ban harang ikon 🔔
- Badge a olvasatlan értesítések számával
- Dropdown lista az értesítésekkel
- "Mind olvasottnak jelölése" gomb

**Technikai Megvalósítás:**
- LocalStorage alapú olvasott/olvasatlan tracking
- Backend: `notifications` tábla
- Opcionális: Push notification (PWA)
- Opcionális: Email digest

**Komplexitás:** Közepes
**Becsült idő:** 2-3 nap

---

### 🥈 2. PRIORITÁS - Kapcsolattartói Hirdetmények (Announcements)

**Leírás:**
Kiemelt üzenetek a kapcsolattartótól, amelyek mindenki számára láthatók.

**Típusok:**
| Típus | Szín | Viselkedés |
|-------|------|------------|
| 🔴 **Fontos** | Piros | Sticky banner a home-on, nem zárható be |
| 🟡 **Info** | Sárga | Banner, bezárható, notification |
| 🟢 **Siker** | Zöld | Toast + notification |

**Példa Use Case-ek:**
- "Holnap fotózás! Hozzátok a fehér inget!" (Fontos)
- "Kérlek szavazzatok, ma lejár!" (Info)
- "A tabló elkészült, minták elérhetők!" (Siker)

**UI Javaslat:**
```
┌─────────────────────────────────────────┐
│ 🔴 FONTOS: Holnap 10:00 fotózás!       │
│    Ne felejtsétek a fehér inget!    [X] │
└─────────────────────────────────────────┘
```

**Komplexitás:** Alacsony
**Becsült idő:** 1-2 nap

---

### 🥉 3. PRIORITÁS - Aktivitás Timeline (Activity Feed)

**Leírás:**
Közösségi feed, ami mutatja az osztály aktivitását.

**Megjelenített Események:**
```
📅 Ma 14:30 - Kovács Peti szavazott a "Sablon választás"-ra
📅 Ma 14:25 - Új hozzászólás: "Szerintem a kék jobb..."
📅 Ma 10:00 - Kapcsolattartó új szavazást indított
📅 Tegnap   - 5 új szavazat érkezett
📅 Jan 18   - Nagy Anna csatlakozott
```

**Cél:**
- Közösségi érzés: "mások is aktívak"
- FOMO effektus: ösztönzi a részvételt
- Átláthatóság: mi történik a projektben

**UI Javaslat:**
- Home oldalon oldalsáv vagy kártya
- Mobil: összecsukható szekció
- Maximálisan 10-20 elem látható

**Komplexitás:** Közepes
**Becsült idő:** 2 nap

---

### 4. PRIORITÁS - Sablon Összehasonlító

**Leírás:**
Side-by-side összehasonlítás a szavazásnál.

**Funkciók:**
- 2-3 sablon egymás mellett
- Nagyítható lightbox
- Mobil: swipe navigáció
- Szavazás közvetlenül az összehasonlítóból

**UI Javaslat:**
```
┌──────────────────────────────────────────────┐
│  [Sablon A]     [Sablon B]     [Sablon C]    │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │         │   │         │   │         │    │
│  │  KÉP    │   │  KÉP    │   │  KÉP    │    │
│  │         │   │         │   │         │    │
│  └─────────┘   └─────────┘   └─────────┘    │
│  [Szavazok]    [Szavazok]    [Szavazok]     │
└──────────────────────────────────────────────┘
```

**Komplexitás:** Alacsony-Közepes
**Becsült idő:** 1-2 nap

---

### 5. PRIORITÁS - Kérdezz-Felelek (Q&A)

**Leírás:**
Egyszerűsített kérdés-válasz rendszer a fórum mellett.

**Különbség a fórumtól:**
- Csak kérdés-válasz formátum
- Kapcsolattartó válaszai kiemelve
- Kereshető FAQ generálás
- Nincs nested reply

**Példa:**
```
❓ Diák: "Mikor lesz a fotózás?"
   └── ✅ Kapcsolattartó: "Jövő hétfőn 10:00-kor"

❓ Diák: "Lehet utólag pótfotózni?"
   └── ✅ Kapcsolattartó: "Igen, február 15-ig"
```

**Komplexitás:** Közepes
**Becsült idő:** 2-3 nap

---

## Javasolt Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND-TABLO APP                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │  HOME   │  │ VOTING  │  │  FORUM  │  │ SAMPLES │       │
│   │         │  │         │  │         │  │         │       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│        │            │            │            │             │
│        └────────────┼────────────┼────────────┘             │
│                     │            │                          │
│              ┌──────▼────────────▼──────┐                   │
│              │   NOTIFICATION SERVICE    │   ← ÚJ!          │
│              │   (központi értesítések)  │                  │
│              └──────────────────────────┘                   │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  ANNOUNCEMENT SERVICE │   ← ÚJ!              │
│              │  (kapcsolattartói     │                      │
│              │   hirdetmények)       │                      │
│              └───────────────────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   ACTIVITY SERVICE    │   ← ÚJ!              │
│              │  (timeline feed)      │                      │
│              └───────────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobil-First UI Koncepció

```
┌─────────────────────────┐
│  🏠 Tablókirály    🔔(3) │  ← Navbar értesítés badge-dzsel
├─────────────────────────┤
│  ╔═══════════════════╗  │
│  ║ 📢 FONTOS!        ║  │  ← Sticky hirdetmény banner
│  ║ Holnap fotózás!   ║  │
│  ╚═══════════════════╝  │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ 🗳️ Szavazások (2) │  │  ← Kártya aktív badge-dzsel
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 💬 Fórum     (5)  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🖼️ Minták         │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 📋 Megrendelés    │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│  📅 Legutóbbi aktivitás │  ← Mini timeline
│  ─────────────────────  │
│  • Peti szavazott (2p)  │
│  • Új hozzászólás (1h)  │
│  • Anna csatlakozott    │
└─────────────────────────┘
```

---

## Implementációs Sorrend Javaslat

| Fázis | Funkció | Idő | Függőség |
|-------|---------|-----|----------|
| 1 | Notification Service (alap) | 1 nap | - |
| 2 | Navbar értesítés ikon | 0.5 nap | Fázis 1 |
| 3 | Hirdetmények (Announcements) | 1.5 nap | - |
| 4 | Home banner integráció | 0.5 nap | Fázis 3 |
| 5 | Activity Timeline | 2 nap | - |
| 6 | Sablon összehasonlító | 1.5 nap | - |
| 7 | Q&A modul | 2-3 nap | - |
| 8 | Push notification (PWA) | 3-4 nap | Fázis 1 |
| 9 | Email digest | 2 nap | Backend |

**Összesen:** ~15 munkanap a teljes kommunikációs csatornához

---

## Kérdések a Döntéshez

1. **Melyik prioritás a legfontosabb?**
   - Értesítések?
   - Hirdetmények?
   - Timeline?

2. **PWA (Progressive Web App) kell?**
   - Push notification-höz kellene
   - Offline módhoz kellene
   - De extra fejlesztés

3. **Email értesítések kellenek?**
   - Napi digest?
   - Azonnali (pl. @mention)?

4. **A fórum elég, vagy külön Q&A modul is kell?**

5. **Van más ötleted, amit a diákok használnának?**
