# Tabló Workflow Feature

> **Tablókirály** - Tablófotó kiválasztási és retusálási folyamat

---

## Összefoglaló

A tabló workflow a diákok számára biztosítja a tablófotó kiválasztási folyamatot:
1. Saját képek megjelölése (claiming)
2. Regisztráció (ha guest)
3. Retusálandó képek kiválasztása
4. Tablókép kiválasztása (1 db)
5. Befejezés

**FONTOS**: Ez egy ELŐRE KIFIZETETT csomag része! A diák már fizetett a tablóért, itt csak a képet választja ki.

---

## Business Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TABLÓ WORKFLOW                                   │
│                     (Előre kifizetett csomag része)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FOTÓS OLDAL (admin)                     DIÁK OLDAL (frontend)             │
│   ─────────────────                       ─────────────────────             │
│                                                                             │
│   1. Fotós létrehoz WorkSession-t                                           │
│      └── Beállítja: max_retouch_photos                                      │
│      └── Feltölti a képeket (Album)                                         │
│      └── Generál megosztó linket                                            │
│                           │                                                 │
│                           ▼                                                 │
│                    ┌──────────────────┐                                     │
│                    │  GUEST LINK      │                                     │
│                    │  /share/:token   │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│                             ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │  1. CLAIMING     │                                     │
│                    │  "ez én vagyok"  │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│                             ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │  2. REGISTRATION │                                     │
│                    │  név, email, tel │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│                             ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │  3. RETOUCH      │                                     │
│                    │  max X kép       │                                     │
│                    │  "ezeket retusáld"│                                    │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│   Fotós megkapja a listát ◄─┤                                               │
│   Retusál (külső eszközben) │                                               │
│                             ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │  4. TABLO SELECT │                                     │
│                    │  pontosan 1 kép  │                                     │
│                    │  "ez legyen a    │                                     │
│                    │   tablóképem"    │                                     │
│                    └────────┬─────────┘                                     │
│                             │                                               │
│   Fotós megkapja a képet ◄──┤                                               │
│   Tablóra teszi             │                                               │
│                             ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │  5. COMPLETED    │                                     │
│                    │  "köszönjük!"    │                                     │
│                    └──────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Lépések részletesen

### 1. Claiming (Képválasztás)

**Cél**: Diák megjelöli a róla készült fényképeket

**UI**:
- Grid nézet az összes képről
- Kattintásra kiválasztás (checkbox)
- Nincs limit - annyi képet jelöl amennyit akar
- Progress bar mutatja a lépést

**Adatok**:
- `claimed_photo_ids: number[]` → localStorage + backend

**Továbblépés**: Legalább 1 kép kiválasztva

---

### 2. Registration (Regisztráció)

**Cél**: Guest user regisztrálása

**UI**:
- Modal ablak
- Mezők: név, email, telefon (opcionális)
- Email megerősítés küldése

**Backend**:
- `TabloProgress.createChildWorkSession()`
- User létrehozás `type: 'guest'` → `type: 'registered'`

**Skip**: Ha már regisztrált user, automatikusan tovább

---

### 3. Retouch (Retusálás választás)

**Cél**: Diák kiválasztja mely képeket szeretné retusáltatni

**UI**:
- Grid nézet CSAK a claimed képekből
- Max limit: `workSession.max_retouch_photos`
- Counter: "3 / 5 kép kiválasztva"

**Adatok**:
- `retouch_photo_ids: number[]` → backend (TabloProgress.steps_data)

**Továbblépés**: Legalább 1 kép (vagy 0 ha nem kér retust)

---

### 4. Tablo Select (Tablókép választás)

**Cél**: PONTOSAN 1 kép kiválasztása a tablóra

**UI**:
- Grid nézet CSAK a claimed képekből
- Single selection mode (radio button stílus)
- Előnézet a kiválasztott képről

**Adatok**:
- `tablo_photo_id: number` → backend

**Továbblépés**: Pontosan 1 kép kiválasztva

---

### 5. Completed (Befejezve)

**Cél**: Visszajelzés a diáknak

**UI**:
- Összefoglaló oldal
- Kiválasztott képek megjelenítése (read-only)
- "Köszönjük!" üzenet
- Esetleg: "Szülők értesítése" gomb

**Adatok**:
- `TabloProgress.status = 'completed'`
- `TabloProgress.completed_at = now()`

---

## Adatmodell

### TabloProgress (Backend)

```php
// Meglévő tábla - használjuk
Schema::table('tablo_progress', function (Blueprint $table) {
    $table->id();
    $table->foreignId('work_session_id');
    $table->foreignId('user_id')->nullable();
    $table->string('current_step'); // claiming, registration, retouch, tablo, completed
    $table->json('steps_data')->nullable();
    // steps_data = {
    //   claimed_photo_ids: [1, 2, 3],
    //   retouch_photo_ids: [1, 2],
    //   tablo_photo_id: 1
    // }
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();
});
```

### WorkSession (Backend)

```php
// Meglévő - kiegészítés
$table->integer('max_retouch_photos')->default(5);
$table->boolean('is_tablo_mode')->default(false);
```

---

## Frontend Architektúra

```
src/app/features/tablo-workflow/
├── pages/
│   ├── claiming/
│   │   ├── claiming.page.ts
│   │   └── claiming.page.html
│   ├── registration/
│   │   ├── registration.page.ts        (vagy modal)
│   │   └── registration.page.html
│   ├── retouch-select/
│   │   ├── retouch-select.page.ts
│   │   └── retouch-select.page.html
│   ├── tablo-select/
│   │   ├── tablo-select.page.ts
│   │   └── tablo-select.page.html
│   └── completed/
│       ├── completed.page.ts
│       └── completed.page.html
├── components/
│   ├── workflow-stepper/              ← Progress indicator
│   ├── photo-select-grid/             ← Újrahasználható grid
│   └── workflow-footer/               ← Tovább/Vissza gombok
├── services/
│   ├── tablo-workflow.service.ts      ← Központi state management
│   └── tablo-api.service.ts           ← Backend kommunikáció
└── models/
    └── tablo-workflow.model.ts
```

---

## Routing

```typescript
const routes: Routes = [
  {
    path: 'tablo/:token',
    children: [
      { path: '', redirectTo: 'claiming', pathMatch: 'full' },
      { path: 'claiming', component: ClaimingPage },
      { path: 'registration', component: RegistrationPage },
      { path: 'retouch', component: RetouchSelectPage },
      { path: 'select', component: TabloSelectPage },
      { path: 'completed', component: CompletedPage },
    ],
    canActivate: [TabloWorkflowGuard],
  }
];
```

---

## Service State (Signals)

```typescript
// tablo-workflow.service.ts
@Injectable({ providedIn: 'root' })
export class TabloWorkflowService {
  // State
  private _currentStep = signal<TabloStep>('claiming');
  private _workSession = signal<WorkSession | null>(null);
  private _album = signal<Album | null>(null);
  private _claimedPhotoIds = signal<number[]>([]);
  private _retouchPhotoIds = signal<number[]>([]);
  private _tabloPhotoId = signal<number | null>(null);

  // Computed
  readonly currentStep = this._currentStep.asReadonly();
  readonly maxRetouchPhotos = computed(() =>
    this._workSession()?.max_retouch_photos ?? 5
  );
  readonly canProceed = computed(() => {
    const step = this._currentStep();
    if (step === 'claiming') return this._claimedPhotoIds().length > 0;
    if (step === 'retouch') return true; // 0 is allowed
    if (step === 'tablo') return this._tabloPhotoId() !== null;
    return false;
  });

  // Actions
  init(token: string): Observable<void> { ... }
  nextStep(): Observable<void> { ... }
  previousStep(): Observable<void> { ... }
  selectPhoto(photoId: number): void { ... }
  deselectPhoto(photoId: number): void { ... }
}
```

---

## API Endpoints

| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/tablo/validate/:token` | Token validálás, session info |
| GET | `/api/tablo/progress/:token` | Aktuális progress lekérése |
| POST | `/api/tablo/progress/:token/claim` | Claimed képek mentése |
| POST | `/api/tablo/progress/:token/register` | Regisztráció |
| POST | `/api/tablo/progress/:token/retouch` | Retouch képek mentése |
| POST | `/api/tablo/progress/:token/tablo` | Tablókép mentése |
| POST | `/api/tablo/progress/:token/complete` | Workflow lezárása |

---

## Különbség a régi implementációtól

### Régi (photo-grid.page.ts)
- ❌ 900+ sor egy komponensben
- ❌ Tablo + Normal + Retouch mode keveredik
- ❌ Sok feltételes logika
- ❌ Nehéz karbantartani

### Új (szétválasztva)
- ✅ Külön page minden lépéshez
- ✅ Tiszta single responsibility
- ✅ Központi service a state-hez
- ✅ Könnyű tesztelni
- ✅ Könnyű bővíteni

---

## Prioritások

1. **P0**: Workflow service + routing
2. **P0**: Claiming page
3. **P0**: Tablo select page
4. **P1**: Registration modal/page
5. **P1**: Retouch select page
6. **P2**: Completed page
7. **P2**: Email értesítések

---

## Kapcsolódó feature-ök

- **photo-order-feature**: Fénykép rendelés (webshop) - KÜLÖN!
- **layout-menu-refactor**: Sidebar menu
- **ertesitesi-kozpont**: Értesítések

---

## Dokumentáció

| Fájl | Tartalom |
|------|----------|
| `01-user-flow.md` | Részletes UX flow |
| `02-ui-design.md` | Vizuális design |
| `03-backend-api.md` | API specifikáció |
| `04-components.md` | Angular komponensek |
| `CLAUDE-INSTRUCTIONS.md` | Implementációs útmutató |
