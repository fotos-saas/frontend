# Layout & Menürendszer Refaktor

> **Tablókirály** - Alkalmazás shell és navigáció újratervezése

---

## Összefoglaló

A jelenlegi felső navigációs sáv túlzsúfolt lett az új funkciókkal. Ez a feature egy modern 2-oszlopos layoutot vezet be: **bal oldali sidebar** + **fő tartalom terület**, miközben a **partner infó a tetején marad** (kötelező requirement).

---

## Problémák a jelenlegi rendszerrel

### 1. Zsúfolt navigáció
- Túl sok menüpont egy sorban
- Nem skálázható új funkciókhoz
- Mobil nézeten nehéz kezelni

### 2. Kihasználatlan hely
- Bal oldal üres (nagy kihasználatlan terület)
- Fő tartalom terület korlátozva van de feleslegesen

### 3. Hierarchia hiánya
- Minden menüpont egyenrangú
- Nincs csoportosítás
- Nehéz megtalálni a keresett funkciót

---

## Megoldás: Sidebar Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]    Partner: Kiss Béla - 12/A         [🔔] [👤]     │  ← Top bar (marad!)
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  🏠 főoldal│          M A I N   C O N T E N T              │
│            │                                                │
│  📸 tabló  │                                                │
│   ├ galéria│                                                │
│   ├ minták │                                                │
│   └ csapat │                                                │
│            │                                                │
│  🛒 rendelés                                                │
│   ├ kosár  │                                                │
│   └ korábbi│                                                │
│            │                                                │
│  📅 naptár │                                                │
│            │                                                │
│  📰 hírek  │                                                │
│            │                                                │
│  ⚙️ beáll. │                                                │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│  © 2024 Tablókirály                              [help] [?] │  ← Optional footer
└─────────────────────────────────────────────────────────────┘
```

---

## Fő jellemzők

### ✅ Top Bar (megmarad)
- Logo bal oldalon
- **Partner infó középen** (kötelező - "idióták ezek és sose tudják ki kicsoda")
- Értesítések + profil jobb oldalon

### ✅ Sidebar
- Csoportosított menük
- Collapse/expand szekciók
- Active state jelölés
- Mobilon hamburger menüvel nyílik

### ✅ Responsive viselkedés
- **Desktop (lg+)**: Sidebar mindig látható
- **Tablet (md)**: Sidebar collapsed (ikonok), hover-re kinyílik
- **Mobile (sm)**: Sidebar rejtett, hamburger gombbal nyitható overlay

---

## Menüstruktúra

```typescript
const menuStructure = [
  {
    id: 'home',
    label: 'főoldal',
    icon: '🏠',
    route: '/dashboard',
    children: null
  },
  {
    id: 'tablo',
    label: 'tabló',
    icon: '📸',
    children: [
      { label: 'galéria', route: '/tablo/gallery' },
      { label: 'minták', route: '/tablo/samples' },
      { label: 'csapat', route: '/tablo/team' },
      { label: 'szavazások', route: '/tablo/votes' },
    ]
  },
  {
    id: 'order',
    label: 'rendelés',
    icon: '🛒',
    children: [
      { label: 'kosár', route: '/cart' },
      { label: 'korábbi', route: '/orders' },
    ]
  },
  {
    id: 'calendar',
    label: 'naptár',
    icon: '📅',
    route: '/calendar',
    children: null
  },
  {
    id: 'news',
    label: 'hírek',
    icon: '📰',
    route: '/news',
    children: null
  },
  {
    id: 'settings',
    label: 'beállítások',
    icon: '⚙️',
    route: '/settings',
    children: null,
    position: 'bottom' // Sidebar alján
  }
];
```

---

## Tech Stack

| Elem | Technológia |
|------|-------------|
| Framework | Angular 19 |
| State | Signals |
| Styling | Tailwind CSS 3.4.x |
| Animációk | CSS transitions |
| Ikonok | Emoji (Gen Z style) |

---

## Fájlstruktúra

```
src/app/
├── core/
│   └── layout/
│       ├── components/
│       │   ├── app-shell/
│       │   │   ├── app-shell.component.ts
│       │   │   └── app-shell.component.html
│       │   ├── top-bar/
│       │   │   ├── top-bar.component.ts
│       │   │   └── top-bar.component.html
│       │   ├── sidebar/
│       │   │   ├── sidebar.component.ts
│       │   │   └── sidebar.component.html
│       │   ├── sidebar-menu-item/
│       │   │   ├── sidebar-menu-item.component.ts
│       │   │   └── sidebar-menu-item.component.html
│       │   └── mobile-nav-overlay/
│       │       ├── mobile-nav-overlay.component.ts
│       │       └── mobile-nav-overlay.component.html
│       ├── services/
│       │   └── sidebar-state.service.ts
│       └── models/
│           └── menu-item.model.ts
```

---

## Dokumentáció

| Fájl | Tartalom |
|------|----------|
| `01-user-flow.md` | Navigációs UX flow |
| `02-ui-design.md` | Vizuális design, responsive |
| `03-components.md` | Angular komponensek |
| `CLAUDE-INSTRUCTIONS.md` | Implementációs útmutató |

---

## Prioritások

1. **P0**: App shell + sidebar alap struktúra
2. **P0**: Top bar partner infóval
3. **P1**: Responsive behavior (mobile hamburger)
4. **P1**: Menu collapse/expand
5. **P2**: Animációk
6. **P2**: Active route highlighting

---

## Nem része ennek a feature-nek

- Konkrét page tartalmak
- Notification bell (külön feature)
- Profil dropdown (külön feature)
- Footer tartalom

---

## Gen Z Stílus emlékeztető

```typescript
// ✅ HELYES
menuLabel = 'beállítások';
emptyText = 'még nincs ilyen';

// ❌ HELYTELEN
menuLabel = 'Beállítások';  // NE nagybetű!
emptyText = 'Nincsenek elemek.'; // NE formális!
```
