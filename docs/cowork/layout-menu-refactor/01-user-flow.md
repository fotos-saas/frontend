# Layout & Menürendszer - User Flow

> Navigációs élmény és interakciók részletes leírása

---

## 1. Belépés az alkalmazásba

### 1.1 Desktop (lg: 1024px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ [🎓]  Tablókirály     Partner: Kiss Béla - 12/A    [🔔] [👤]   │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│ 🏠 főoldal  │    üdv, béla! 👋                                  │
│             │                                                   │
│ 📸 tabló    │    ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│   galéria   │    │ 📸      │ │ 🗳️      │ │ 📅      │           │
│   minták    │    │ galéria │ │ szavazás│ │ naptár  │           │
│   csapat    │    └─────────┘ └─────────┘ └─────────┘           │
│   szavazás  │                                                   │
│             │    legutóbbi aktivitás                            │
│ 🛒 rendelés │    ─────────────────────                          │
│   kosár     │    • új minták érkeztek                           │
│   korábbi   │    • szavazás hamarosan zárul                     │
│             │                                                   │
│ 📅 naptár   │                                                   │
│             │                                                   │
│ 📰 hírek    │                                                   │
│             │                                                   │
│ ─────────── │                                                   │
│ ⚙️ beállítás│                                                   │
│             │                                                   │
└─────────────┴───────────────────────────────────────────────────┘
```

**Interakciók:**
1. Sidebar mindig látható
2. Aktív menüpont kiemelve (háttérszín + bold)
3. Hover effekt menüpontokon
4. Expandable szekciók (tabló, rendelés)

---

### 1.2 Tablet (md: 768px - 1023px)

```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] [🎓] Tablókirály   Partner: Kiss Béla       [🔔] [👤]      │
├─────┬───────────────────────────────────────────────────────────┤
│     │                                                           │
│ 🏠  │    üdv, béla! 👋                                          │
│ 📸  │                                                           │
│ 🛒  │    ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│ 📅  │    │ 📸      │ │ 🗳️      │ │ 📅      │                   │
│ 📰  │    │ galéria │ │ szavazás│ │ naptár  │                   │
│ ──  │    └─────────┘ └─────────┘ └─────────┘                   │
│ ⚙️  │                                                           │
│     │                                                           │
└─────┴───────────────────────────────────────────────────────────┘
```

**Interakciók:**
1. Sidebar collapsed - csak ikonok látszanak (60px széles)
2. Hover-re kinyílik teljes szélességre (240px)
3. Vagy hamburger gombbal is nyitható
4. Click outside → bezáródik

---

### 1.3 Mobile (sm: < 768px)

```
┌───────────────────────────┐
│ [☰] [🎓]    Partner...  [👤]│
├───────────────────────────┤
│                           │
│   üdv, béla! 👋           │
│                           │
│   ┌─────────┐ ┌─────────┐│
│   │ 📸      │ │ 🗳️      ││
│   │ galéria │ │ szavazás││
│   └─────────┘ └─────────┘│
│                           │
│   ┌─────────┐ ┌─────────┐│
│   │ 📅      │ │ 📰      ││
│   │ naptár  │ │ hírek   ││
│   └─────────┘ └─────────┘│
│                           │
└───────────────────────────┘
```

**Hamburger menü megnyitva:**

```
┌───────────────────────────┐
│ [✕] [🎓]    Partner...  [👤]│
├───────────────────────────┤
│┌─────────────────────────┐│
││ 🏠 főoldal              ││
││                         ││
││ 📸 tabló           [▼]  ││
││   ├ galéria             ││
││   ├ minták              ││
││   ├ csapat              ││
││   └ szavazások          ││
││                         ││
││ 🛒 rendelés        [▼]  ││
││   ├ kosár               ││
││   └ korábbi             ││
││                         ││
││ 📅 naptár               ││
││ 📰 hírek                ││
││ ─────────────────────── ││
││ ⚙️ beállítások          ││
│└─────────────────────────┘│
│  ▓▓▓▓▓▓ backdrop ▓▓▓▓▓▓   │
└───────────────────────────┘
```

**Interakciók:**
1. Sidebar rejtett alapból
2. Hamburger (☰) gomb a top bar-on
3. Teljes képernyős overlay-ként jelenik meg
4. Backdrop click → bezáródik
5. Menüpont választás → bezáródik + navigáció

---

## 2. Menü interakciók

### 2.1 Expand/Collapse szekciók

**Zárt állapot:**
```
📸 tabló                    [▶]
```

**Nyitott állapot:**
```
📸 tabló                    [▼]
   galéria
   minták
   csapat
   szavazások
```

**Működés:**
1. Click a szekció nevére VAGY a nyílra
2. Animált kinyílás/becsukás (200ms ease)
3. Egy időben több is lehet nyitva
4. Állapot mentés localStorage-ba

```typescript
// localStorage key
'sidebar_expanded_sections' = ['tablo', 'order']
```

---

### 2.2 Active route jelölés

```
📸 tabló                    [▼]
   galéria          ← parent aktív
   minták           ← AKTÍV (kék háttér)
   csapat
   szavazások
```

**Szabályok:**
1. Aktív route: kék háttér + bold szöveg
2. Aktív route parent szekciója: automatikusan kinyílik
3. Hover: világosabb kék háttér

---

### 2.3 Hover behavior (Desktop)

```
Normál:     📸 tabló
Hover:      📸 tabló          ← háttérszín változás
Click:      📸 tabló          ← kinyílik ha van child
```

---

## 3. Top Bar interakciók

### 3.1 Partner infó

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]    Partner: Kiss Béla - 12/A osztály    [🔔] [👤]    │
└─────────────────────────────────────────────────────────────┘
```

**FONTOS:** A partner infó MINDIG látható marad!
- Desktop: teljes szöveg
- Tablet: rövidített ("Partner: Kiss Béla")
- Mobile: még rövidebb ("Partner...")

**Click behavior:**
- NEM kattintható (csak display)
- Vagy későbbi feature: partner váltás modal

---

### 3.2 Notification Bell (placeholder)

```
[🔔] ← badge ha van olvasatlan
 ↓
┌──────────────────┐
│ Értesítések      │  ← Külön feature implementálja
│ ─────────────    │
│ • új minták...   │
│ • szavazás...    │
└──────────────────┘
```

---

### 3.3 User Avatar / Profil

```
[👤] ← vagy profilkép thumbnail
 ↓
┌──────────────────┐
│ Kiss Béla        │
│ kiss@email.com   │
│ ─────────────    │
│ profilom         │
│ kijelentkezés    │
└──────────────────┘
```

---

## 4. Navigációs flow-k

### 4.1 Route váltás

```
User @ /dashboard
    ↓
Click "galéria"
    ↓
Router navigates to /tablo/gallery
    ↓
Sidebar updates:
  - "főoldal" deaktiválódik
  - "tabló" szekció kinyílik (ha volt zárva)
  - "galéria" aktívvá válik
    ↓
Content area: GalleryPage renderelődik
```

---

### 4.2 Deep link belépés

```
User opens: tablokiralyapp.hu/tablo/samples
    ↓
App loads
    ↓
Sidebar automatically:
  - "tabló" szekció KINYÍLIK
  - "minták" AKTÍV lesz
    ↓
SamplesPage renderelődik
```

---

### 4.3 Mobile menü használat

```
User @ /dashboard (mobile)
    ↓
Tap [☰] hamburger
    ↓
Sidebar overlay megjelenik (slide-in balról)
    ↓
Tap "📸 tabló"
    ↓
Szekció kinyílik
    ↓
Tap "minták"
    ↓
Overlay bezáródik (slide-out)
    ↓
Router navigates to /tablo/samples
```

---

## 5. Keyboard navigáció (Accessibility)

### 5.1 Tab sorrend

```
1. Logo (skip link: main content)
2. Hamburger (mobile only)
3. Partner info (nem focusable)
4. Notification bell
5. User avatar
6. Sidebar menü itemek (top to bottom)
7. Main content
```

### 5.2 Keyboard shortcuts

| Billentyű | Akció |
|-----------|-------|
| `Tab` | Következő elem |
| `Shift+Tab` | Előző elem |
| `Enter/Space` | Aktiválás (click) |
| `Escape` | Overlay bezárása |
| `ArrowDown` | Következő menüpont |
| `ArrowUp` | Előző menüpont |
| `ArrowRight` | Szekció kinyitása |
| `ArrowLeft` | Szekció bezárása |

---

## 6. Edge case-ek

### 6.1 Hosszú partner név

```
Desktop:  Partner: Budapesti Műszaki Egyetem - 12/A Gépészmérnök
Tablet:   Partner: Budapesti Műszaki E...
Mobile:   Partner: Bud...
```

**Megoldás:** Text truncate + tooltip hover-re

### 6.2 Sok menüpont (scrollable sidebar)

```
┌─────────────┐
│ 🏠 főoldal  │
│ 📸 tabló    │
│   galéria   │
│   minták    │
│   csapat    │  ← Scroll starts here
│   szavazás  │     if content overflows
│ 🛒 rendelés │
│   kosár     │
│   korábbi   │
│ 📅 naptár   │
│ 📰 hírek    │
│ 👉 bökések  │
│ 🔍 nyomozás │
├─────────────┤  ← Sticky footer section
│ ⚙️ beállítás│
└─────────────┘
```

**Szabály:**
- Beállítások sticky marad alul
- Többi menü scrollolható

### 6.3 Nincs jogosultság egy menüponthoz

```
📸 tabló
   galéria
   minták       (disabled - szürke, nem kattintható)
   csapat
```

**Megoldás:**
- Disabled state + tooltip: "ehhez nincs hozzáférésed"
- Vagy teljesen elrejtve (config alapján)

### 6.4 Offline állapot

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] ⚠️ offline   Partner: Kiss Béla        [🔔] [👤]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Animációk összefoglaló

| Animáció | Trigger | Időtartam | Easing |
|----------|---------|-----------|--------|
| Sidebar slide (mobile) | Hamburger click | 200ms | ease-out |
| Szekció expand | Section click | 200ms | ease |
| Backdrop fade | Overlay open/close | 150ms | ease |
| Hover highlight | Mouse enter | 100ms | ease |
| Active indicator | Route change | 150ms | ease |

---

## 8. States összefoglaló

### Sidebar States

| State | Leírás |
|-------|--------|
| `expanded` | Desktop: teljes szélesség |
| `collapsed` | Tablet: csak ikonok |
| `hidden` | Mobile: nincs látható |
| `overlay` | Mobile: overlay nyitva |

### Menu Item States

| State | Leírás |
|-------|--------|
| `default` | Normál állapot |
| `hover` | Egér felette |
| `active` | Aktív route |
| `expanded` | Gyerekek láthatók |
| `disabled` | Nem elérhető |
