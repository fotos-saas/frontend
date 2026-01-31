# Osztály Hírek - Egyszerűsített UI Koncepció

> Verzió: 2.0
> Dátum: 2025-01-19
> Elv: **"Less is more"** - Minimalista, kártyaalapú design

---

## 🎯 Alapelv: Progressive Disclosure

> "Fokozatosan mutasd meg az információt, ahogy a user igényli"

**MIT JELENT?**
- Első pillantásra: csak a lényeg
- Kattintásra: részletek
- Nem öntjük el infóval

---

## 📱 Egyszerűsített Feed Design

### Előtte (túl komplex)
```
❌ Túl sok info egy kártyán
❌ Sok gomb, link
❌ Zavaró
```

### Utána (minimalista)
```
┌─────────────────────────────────────┐
│ 🗳️  Új szavazás              2 órája │
│                                      │
│ Melyik sablon tetszik?               │
│                                      │
│ ░░░░░░░░░░░░░░░░░░░░░ 8/25          │
│                                      │
└─────────────────────────────────────┘
   ↑ Egész kártya kattintható!
```

**Szabályok:**
- 1 kártya = 1 ikon + 1 cím + 1 progress/info + timestamp
- NINCS külön gomb a kártyán
- Kártya kattintás = navigáció
- Max 3 sor szöveg

---

## 🎨 Kártya Típusok (Egyszerűsítve)

### 1. Hirdetmény
```
┌─────────────────────────────────────┐
│ 📢  Kapcsolattartó           ma     │
│                                      │
│ Holnap 10:00 fotózás!               │
│ Fehér ing kell!                      │
│                                      │
└─────────────────────────────────────┘
```
- **Szín:** Halvány sárga háttér (fontos) vagy fehér (info)
- **Akció:** Nincs, csak olvasás

---

### 2. Szavazás
```
┌─────────────────────────────────────┐
│ 🗳️  Szavazás                 2 napja │
│                                      │
│ Melyik sablon tetszik?               │
│                                      │
│ ████████░░░░░░░░░░░░░ 8/25          │
│                                      │
└─────────────────────────────────────┘
```
- **Progress bar:** Vizuális részvétel
- **Akció:** Katt → `/voting/:id`

---

### 3. Fórum
```
┌─────────────────────────────────────┐
│ 💬  Kovács Peti              2 órája │
│                                      │
│ "Szerintem a kék háttér jobb..."     │
│                                      │
│ ❤️ 3                                 │
│                                      │
└─────────────────────────────────────┘
```
- **Like szám:** Csak szám, nincs interakció itt
- **Akció:** Katt → `/forum/:id`

---

### 4. Minták
```
┌─────────────────────────────────────┐
│ 🖼️  Új minták                jan 17 │
│                                      │
│ 4 új minta érkezett                  │
│                                      │
│ [img] [img] [img] [img]              │
│                                      │
└─────────────────────────────────────┘
```
- **Thumbnails:** Max 4 kis kép
- **Akció:** Katt → `/samples`

---

## 🔔 Egyszerűsített Értesítések

### Navbar - Csak Harang + Badge
```
┌─────────────────────────────────────┐
│  Logo            🔔③        Menu    │
└─────────────────────────────────────┘
         ↓ Kattintás
┌─────────────────────────────────────┐
│ Értesítések                         │
│ ─────────────────────────────────── │
│ • Új szavazás indult          2ó    │
│ • Kovács Peti válaszolt       1n    │
│ • 4 új minta                  2n    │
│ ─────────────────────────────────── │
│ [Mindet láttam ✓]                   │
└─────────────────────────────────────┘
```

**Szabályok:**
- Max 5 értesítés a dropdown-ban
- Egy sor = egy értesítés
- Kattintás = navigáció + olvasottnak jelölés
- "Mindet láttam" = összes törlése

---

## 📐 Méretek és Spacing

### Kártya
```
┌────────────────────────────────────────┐
│ 16px padding                           │
│ ┌────────────────────────────────────┐ │
│ │ Ikon 24x24    Cím        Idő 12px │ │  ← Header: 32px
│ └────────────────────────────────────┘ │
│                                        │
│ Content max 3 sor                      │  ← Body: auto
│ Line-height: 1.5                       │
│                                        │
│ Meta info (progress, likes)            │  ← Footer: 24px
│                                        │
└────────────────────────────────────────┘
   Gap between cards: 12px
```

### Touch Target
- **Minimum:** 44x44px (Apple HIG)
- **Kártya magasság:** min 80px

### Tipográfia
| Elem | Méret | Súly |
|------|-------|------|
| Cím | 16px | 600 (semibold) |
| Body | 14px | 400 (normal) |
| Meta (idő, szám) | 12px | 400 |

---

## 🎨 Színek (Minimál Paletta)

```
Háttér:      #F8FAFC (slate-50)
Kártya:      #FFFFFF
Szöveg:      #1E293B (slate-800)
Meta szöveg: #64748B (slate-500)
Ikon:        #3B82F6 (blue-500)
Progress:    #3B82F6 (blue-500)
Fontos bg:   #FEF3C7 (amber-100)
```

### Dark Mode
```
Háttér:      #0F172A (slate-900)
Kártya:      #1E293B (slate-800)
Szöveg:      #F1F5F9 (slate-100)
Meta szöveg: #94A3B8 (slate-400)
```

---

## 📱 Mobile Layout

```
┌─────────────────────────┐
│ 🏠 Tablókirály    🔔③ ☰ │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 📢 Hirdetmény      │ │  ← Sticky ha van
│ └─────────────────────┘ │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Kártya 1            │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Kártya 2            │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Kártya 3            │ │
│ └─────────────────────┘ │
│                         │
│ [Több betöltése]        │  ← Gomb, nem infinite scroll
│                         │
└─────────────────────────┘
```

**Miért gomb és nem infinite scroll?**
- Egyszerűbb implementálni
- Tanároknak érthetőbb
- Kevesebb performance issue

---

## ⚡ Interakciók (Egyszerűsítve)

| Gesztus | Akció |
|---------|-------|
| Pull-down | Frissítés |
| Kártya tap | Navigáció a részletekhez |
| Harang tap | Dropdown toggle |
| "Mindet láttam" tap | Értesítések törlése |
| "Több betöltése" tap | +10 kártya |

**Nincs:**
- ~~Swipe akciók~~ (bonyolult)
- ~~Long press~~ (nem intuitív)
- ~~Double tap like~~ (túl fancy)

---

## 🧩 Komponens Egyszerűsítés

### Eredeti terv: 6 komponens
### Új terv: 3 komponens

| Komponens | Felelősség |
|-----------|------------|
| `news-feed` | Feed lista + pull-refresh + "több" gomb |
| `feed-card` | Univerzális kártya (típus alapján renderel) |
| `notification-bell` | Harang + dropdown + badge |

**Eltávolítva:**
- ~~notification-item~~ (beolvadt dropdown-ba)
- ~~notification-dropdown~~ (beolvadt bell-be)
- ~~feed-item~~ (átnevezve feed-card-ra)

---

## 🔄 State (Egyszerűsítve)

```typescript
// Teljes state 1 service-ben
interface NewsState {
  feed: FeedCard[];
  hasMore: boolean;
  loading: boolean;

  notifications: Notification[];
  unreadCount: number;

  announcement: Announcement | null;
}
```

**1 service = 1 state** - Nincs szétszórva!
