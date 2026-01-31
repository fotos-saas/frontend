# 🤖 CLAUDE CODE UTASÍTÁSOK - Osztály Hírek Feature

> **OLVASD EL ELŐSZÖR!** Ez a dokumentum a teljes implementációs terv.
> Minden fázist sorrendben hajts végre. NE ugorj előre!

---

## 📋 PROJEKT ÁTTEKINTÉS

**Feature neve:** Osztály Hírek (News Feed)
**Cél:** Egyszerű, minimalista hírfolyam a Home oldalon
**Dokumentáció:** Olvasd el MINDEN fájlt ebben a mappában MIELŐTT kódolsz!

```
cowork/osztaly-hirek-feature/
├── README.md                 # Összefoglaló
├── 01-trendkutatas.md        # Design trendek
├── 02-user-flow.md           # UX flow, gombok, navigáció
├── 03-komponensek.md         # Eredeti komponens lista
├── 04-egyszerusitett-ui.md   # ⭐ MINIMALISTA UI - KÖVESD EZT!
├── 05-push-strategia.md      # Push notification terv (FÁZIS 2)
└── CLAUDE-INSTRUCTIONS.md    # TE ITT VAGY
```

---

## ⚠️ KRITIKUS SZABÁLYOK

### Kódminőség
- [ ] **MINDIG** olvasd el a `claude.md` fájlt a projekt gyökerében
- [ ] **MINDIG** kövesd a meglévő kód stílusát (nézz példákat!)
- [ ] **SOHA** ne írj 300 sornál hosszabb komponenst
- [ ] **SOHA** ne duplikálj kódot - használj service-t, helper-t
- [ ] **MINDIG** TypeScript strict mode, nincs `any`
- [ ] **MINDIG** OnPush change detection stratégia

### Teljesítmény
- [ ] Lazy loading ahol lehet
- [ ] TrackBy minden `*ngFor`-nál
- [ ] Signals használata (nem BehaviorSubject)
- [ ] Képek lazy loading (`loading="lazy"`)

### Tesztelés
- [ ] **MINDEN FÁZIS VÉGÉN** tesztelj Chrome-ban!
- [ ] Használd a `mcp__Claude_in_Chrome__` toolokat
- [ ] Amíg nem működik TÖKÉLETESEN, addig javíts
- [ ] Screenshot készítés a végállapotról

### Stock Képek
- Ha kép kell mockuphoz/teszthez: https://picsum.photos/
- Példa: `https://picsum.photos/200/300` (200x300 random kép)

---

## 🎯 FÁZIS 1: FEED CARD KOMPONENS

### Cél
Egyetlen univerzális kártya komponens ami minden feed item típust megjelenít.

### Lépések

#### 1.1 Típusok létrehozása
```
Fájl: src/app/core/models/news.types.ts
```

```typescript
// KÖTELEZŐ típusok - másold és egészítsd ki!
export type FeedItemType =
  | 'announcement'
  | 'poll_created'
  | 'poll_ending'
  | 'poll_closed'
  | 'forum_post'
  | 'samples_added';

export interface FeedItem {
  id: number;
  type: FeedItemType;
  title: string;
  content: string;
  createdAt: string;
  // ... lásd 03-komponensek.md
}
```

#### 1.2 Feed Card komponens
```
Fájl: src/app/shared/components/feed-card/
```

**Követelmények:**
- Input: `@Input() item: FeedItem`
- Output: `@Output() cardClick = new EventEmitter<FeedItem>()`
- Megjelenítés: ikon + cím + tartalom + idő
- Stílus: lásd `04-egyszerusitett-ui.md`
- Kattintható az egész kártya

**Design:**
```
┌─────────────────────────────────────┐
│ [ikon]  Cím                   2 órája │
│                                      │
│ Tartalom max 3 sor...                │
│                                      │
│ [meta info: progress, likes, stb]    │
└─────────────────────────────────────┘
```

#### 1.3 TESZT - Chrome-ban ellenőrizd!

```
TESZTELÉSI CHECKLIST:
[ ] Komponens renderel hiba nélkül
[ ] Minden típus (announcement, poll, forum, samples) jól néz ki
[ ] Kattintás működik
[ ] Responsive: mobil (375px), tablet (768px), desktop (1024px)
[ ] Dark mode működik (ha van)
[ ] Console error NINCS
```

**Chrome tesztelés:**
1. `ng serve` indítása
2. Navigálj a komponenshez
3. Készíts screenshot-ot
4. Ellenőrizd console-t hibákra

### ✅ FÁZIS 1 KÉSZ FELTÉTEL
- [ ] `news.types.ts` megvan
- [ ] `feed-card` komponens kész
- [ ] SCSS stílusok a specifikáció szerint
- [ ] Chrome teszt SIKERES (screenshot!)
- [ ] Nincs console error

---

## 🎯 FÁZIS 2: NEWS FEED KOMPONENS

### Cél
Feed lista komponens ami megjeleníti a kártyákat, pull-to-refresh és "Több betöltése" gombbal.

### Lépések

#### 2.1 News Service
```
Fájl: src/app/core/services/news.service.ts
```

```typescript
@Injectable({ providedIn: 'root' })
export class NewsService {
  // Signals
  readonly feed = signal<FeedItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly hasMore = signal<boolean>(true);

  // Methods
  loadFeed(page: number): Observable<FeedResponse>;
  refreshFeed(): Observable<FeedItem[]>;
}
```

**FONTOS:** Mock data használata amíg nincs backend!

#### 2.2 News Feed komponens
```
Fájl: src/app/features/news-feed/
```

**Követelmények:**
- Kártyák listázása `<app-feed-card>` használatával
- Pull-to-refresh (opcionális, ha bonyolult akkor kihagyható)
- "Több betöltése" gomb alul
- Empty state ha nincs adat
- Loading spinner

**Design:**
```
┌─────────────────────────┐
│ [Kártya 1]              │
│ [Kártya 2]              │
│ [Kártya 3]              │
│ ...                     │
│ [Több betöltése]        │
└─────────────────────────┘
```

#### 2.3 TESZT - Chrome-ban!

```
TESZTELÉSI CHECKLIST:
[ ] Feed renderel mock adattal
[ ] "Több betöltése" működik
[ ] Empty state megjelenik üres listánál
[ ] Loading spinner működik
[ ] Kártya kattintás console.log-ot ír (később navigáció)
[ ] Responsive mindhárom breakpoint-on
[ ] Performance: 60fps scroll
```

### ✅ FÁZIS 2 KÉSZ FELTÉTEL
- [ ] `news.service.ts` kész mock adattal
- [ ] `news-feed` komponens működik
- [ ] Chrome teszt SIKERES
- [ ] Scroll performance OK

---

## 🎯 FÁZIS 3: NOTIFICATION BELL

### Cél
Harang ikon a navbar-ban badge-dzsel és dropdown panellel.

### Lépések

#### 3.1 Notification Bell komponens
```
Fájl: src/app/shared/components/notification-bell/
```

**Követelmények:**
- Harang ikon (heroicon vagy SVG)
- Badge szám (piros kör)
- Kattintásra dropdown megnyílik
- Click outside bezárja
- Max 5 értesítés látszik
- "Mindet láttam" gomb

**Design:**
```
  🔔③
   ↓ kattintás
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

#### 3.2 Navbar integráció
- Add hozzá a meglévő navbar-hoz
- Jobb oldalon, a menü előtt

#### 3.3 TESZT - Chrome-ban!

```
TESZTELÉSI CHECKLIST:
[ ] Harang megjelenik navbar-ban
[ ] Badge szám helyes
[ ] Dropdown megnyílik/bezárul
[ ] Click outside bezár
[ ] "Mindet láttam" működik (badge 0 lesz)
[ ] Értesítésre kattintás (console.log most)
[ ] Mobil nézet OK
[ ] Z-index helyes (dropdown felül van)
```

### ✅ FÁZIS 3 KÉSZ FELTÉTEL
- [ ] `notification-bell` komponens kész
- [ ] Navbar-ba integrálva
- [ ] Dropdown működik
- [ ] Chrome teszt SIKERES

---

## 🎯 FÁZIS 4: HOME INTEGRÁCIÓ

### Cél
Feed és banner integrálása a Home oldalba.

### Lépések

#### 4.1 Announcement Banner komponens
```
Fájl: src/app/shared/components/announcement-banner/
```

**Követelmények:**
- Sticky banner felül
- 3 szín: piros (fontos), sárga (info), zöld (siker)
- Bezárható (X gomb)
- Bezárás megjegyzése localStorage-ban

#### 4.2 Home módosítás
```
Fájl: src/app/features/home/home.component.html
```

**Struktúra:**
```html
<!-- Banner (ha van aktív) -->
<app-announcement-banner
  *ngIf="activeAnnouncement()"
  [announcement]="activeAnnouncement()"
  (dismiss)="onDismiss($event)"
/>

<!-- Feed -->
<app-news-feed />

<!-- Meglévő tartalom (opcionálisan megtartva) -->
```

#### 4.3 TESZT - Teljes flow!

```
TESZTELÉSI CHECKLIST:
[ ] Home oldal betölt
[ ] Banner megjelenik (ha van)
[ ] Banner bezárható
[ ] Feed megjelenik
[ ] Kártya kattintás navigál (ha már be van kötve)
[ ] Harang működik
[ ] Responsive OK
[ ] Teljes E2E flow működik
```

### ✅ FÁZIS 4 KÉSZ FELTÉTEL
- [ ] `announcement-banner` kész
- [ ] Home-ba integrálva
- [ ] Teljes UI működik
- [ ] Chrome teszt SIKERES (screenshot!)

---

## 🎯 FÁZIS 5: NAVIGÁCIÓ ÉS BEKÖTÉS

### Cél
Kártyák és értesítések bekötése a tényleges oldalakra.

### Lépések

#### 5.1 Router navigáció
- Feed card kattintás → megfelelő oldal
- Notification kattintás → megfelelő oldal

**Mapping:**
| Típus | Navigáció |
|-------|-----------|
| announcement | marad (nincs nav) |
| poll_created | `/voting/:id` |
| poll_closed | `/voting/:id/results` |
| forum_post | `/forum/:id` |
| samples_added | `/samples` |

#### 5.2 TESZT - Teljes E2E!

```
TESZTELÉSI CHECKLIST:
[ ] Szavazás kártya → szavazás oldal
[ ] Fórum kártya → fórum oldal
[ ] Minták kártya → minták oldal
[ ] Értesítés kattintás → megfelelő oldal
[ ] Vissza gomb működik
[ ] Deeplink működik
```

### ✅ FÁZIS 5 KÉSZ FELTÉTEL
- [ ] Minden navigáció működik
- [ ] E2E teszt sikeres
- [ ] Nincs console error
- [ ] Screenshot a végállapotról

---

## 📝 ÖSSZEFOGLALÓ TODO

```
FÁZIS 1: Feed Card [~1 nap]
├── [ ] news.types.ts
├── [ ] feed-card komponens
├── [ ] SCSS stílusok
└── [ ] ✅ Chrome teszt

FÁZIS 2: News Feed [~1 nap]
├── [ ] news.service.ts (mock data)
├── [ ] news-feed komponens
├── [ ] Empty state + loading
└── [ ] ✅ Chrome teszt

FÁZIS 3: Notification Bell [~1 nap]
├── [ ] notification-bell komponens
├── [ ] Navbar integráció
├── [ ] Dropdown + badge
└── [ ] ✅ Chrome teszt

FÁZIS 4: Home Integráció [~0.5 nap]
├── [ ] announcement-banner
├── [ ] Home módosítás
└── [ ] ✅ Chrome teszt

FÁZIS 5: Navigáció [~0.5 nap]
├── [ ] Router bekötés
├── [ ] E2E teszt
└── [ ] ✅ Végső screenshot

ÖSSZESEN: ~4 nap
```

---

## 🔧 HASZNOS PARANCSOK

```bash
# Fejlesztés indítása
cd frontend-tablo && npm run start

# Build ellenőrzés
npm run build

# Lint
npm run lint

# Típus ellenőrzés
npx tsc --noEmit
```

---

## 🧪 CHROME TESZTELÉS WORKFLOW

1. **Indítsd el az appot**
   ```bash
   ng serve --port 4205
   ```

2. **Használd a Chrome MCP toolokat:**
   - `mcp__Claude_in_Chrome__navigate` - oldal megnyitás
   - `mcp__Claude_in_Chrome__computer` - screenshot
   - `mcp__Claude_in_Chrome__read_page` - DOM ellenőrzés
   - `mcp__Claude_in_Chrome__read_console_messages` - hibák

3. **Minden fázis végén:**
   - Screenshot készítés
   - Console hibák ellenőrzése
   - Responsive teszt (resize_window)

---

## ❌ GYAKORI HIBÁK - KERÜLD EL!

1. **NE ugorj fázist!** Sorrendben haladj.
2. **NE írj teszteletlen kódot!** Minden fázis végén Chrome teszt.
3. **NE használj `any` típust!** Strict TypeScript.
4. **NE duplikálj stílusokat!** Tailwind utilities vagy közös SCSS.
5. **NE felejts el TrackBy-t!** Minden `*ngFor`-nál.
6. **NE hagyd a console.log-okat!** Töröld mielőtt kész.

---

## ✅ SIKERKRITÉRIUM

A feature AKKOR kész, ha:
1. Minden checkbox ✅ pipálva
2. Chrome-ban tesztelve, screenshot van
3. Nincs console error
4. Responsive működik (mobil, tablet, desktop)
5. Kód review: nincs 300+ soros fájl, nincs duplikáció
6. Performance: smooth scroll, nincs lag

---

**KEZD EL A FÁZIS 1-GYEL!** 🚀

Először olvasd el a teljes dokumentációt (01-05 fájlok), majd kezdj a típusok létrehozásával.
