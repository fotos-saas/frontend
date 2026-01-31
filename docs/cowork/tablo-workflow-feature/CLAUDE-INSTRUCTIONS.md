# Tabló Workflow - Claude Implementációs Útmutató

> Lépésről lépésre útmutató a tabló workflow feature implementálásához

---

## 🎯 Feature Összefoglaló

**Mi ez?**: Diákok tablófotó kiválasztási folyamata (előre kifizetett csomag része)

**5 lépés**:
1. **Claiming** - Saját képek megjelölése ("ez én vagyok")
2. **Registration** - Guest user regisztrálása
3. **Retouch** - Retusálandó képek kiválasztása (KÖTELEZŐ, max X db)
4. **Tablo Select** - Tablókép kiválasztása (pontosan 1 db)
5. **Completed** - Befejezés, összefoglaló

---

## 📋 Előfeltételek

Mielőtt elkezdenéd, ellenőrizd:

- [ ] Angular 19.x telepítve
- [ ] Tailwind CSS 3.4.x konfigurálva
- [ ] Backend API végpontok léteznek (vagy mock-olhatók)
- [ ] `environment.ts` tartalmazza az `apiUrl`-t

---

## 🚀 Implementációs Sorrend

### Fázis 1: Alapok (Prioritás: P0)

#### 1.1 Models létrehozása
```bash
# Fájlok létrehozása
mkdir -p src/app/features/tablo-workflow/models
touch src/app/features/tablo-workflow/models/index.ts
```

Másold be a `03-components.md` Section 3 tartalmát.

#### 1.2 Services létrehozása
```bash
mkdir -p src/app/features/tablo-workflow/services
touch src/app/features/tablo-workflow/services/tablo-api.service.ts
touch src/app/features/tablo-workflow/services/tablo-workflow.service.ts
```

**Sorrend**:
1. Először `TabloApiService` - egyszerű HTTP hívások
2. Aztán `TabloWorkflowService` - state management

#### 1.3 Routing beállítása
```bash
touch src/app/features/tablo-workflow/tablo-workflow.routes.ts
```

Add hozzá az `app.routes.ts`-hez:
```typescript
{
  path: 'tablo',
  loadChildren: () =>
    import('./features/tablo-workflow/tablo-workflow.routes')
      .then(m => m.TABLO_WORKFLOW_ROUTES)
}
```

---

### Fázis 2: Shared Components (Prioritás: P0)

Sorrend:
1. `WorkflowStepperComponent` - progress indicator
2. `PhotoThumbnailComponent` - egyetlen kép megjelenítése
3. `PhotoSelectGridComponent` - multi-select grid
4. `WorkflowFooterComponent` - sticky footer navigációhoz
5. `InfoBannerComponent` - info üzenetek

```bash
mkdir -p src/app/features/tablo-workflow/components/{workflow-stepper,photo-thumbnail,photo-select-grid,workflow-footer,info-banner}
```

---

### Fázis 3: Pages (Prioritás: P0-P2)

#### 3.1 ClaimingPage (P0)
```bash
mkdir -p src/app/features/tablo-workflow/pages/claiming
touch src/app/features/tablo-workflow/pages/claiming/claiming.page.ts
```

**Tesztelés**:
- [ ] Grid megjelenik képekkel
- [ ] Kattintásra kiválasztódik/kijelölődik
- [ ] Footer mutatja a számot
- [ ] Tovább gomb működik

#### 3.2 TabloSelectPage (P0)
```bash
mkdir -p src/app/features/tablo-workflow/pages/tablo-select
```

**Tesztelés**:
- [ ] Single selection működik
- [ ] Preview panel frissül
- [ ] Confirmation modal megjelenik
- [ ] Véglegesítés után completed

#### 3.3 RetouchSelectPage (P1)
```bash
mkdir -p src/app/features/tablo-workflow/pages/retouch-select
```

**FONTOS**: Maximum limit érvényesítése!
- A `max_retouch_photos` értéket a `WorkSession`-ből vesszük
- NEM engedünk 0 választást ("nem kérek retust" NINCS!)

#### 3.4 RegistrationPage (P1)
```bash
mkdir -p src/app/features/tablo-workflow/pages/registration
```

Vagy modal komponensként a claiming page-en belül.

#### 3.5 CompletedPage (P2)
```bash
mkdir -p src/app/features/tablo-workflow/pages/completed
```

---

### Fázis 4: Guard és navigáció (P1)

```bash
mkdir -p src/app/features/tablo-workflow/guards
touch src/app/features/tablo-workflow/guards/tablo-progress.guard.ts
```

A guard:
- Validálja a token-t
- Inicializálja a service-t ha kell
- Redirect-el ha rossz lépésen van a user

---

## 🎨 UI/UX Irányelvek

### Gen Z Stílus
- **Kisbetűs** headingek és gombok
- **Emoji-first** ikonok (📸, ✨, 🎓)
- **Rounded-xl/2xl** mindenhol
- **Casual** szövegezés ("ez én vagyok", "köszi!")

### Mobile First
- Grid: 3 oszlop mobile, 6 desktop
- Sticky footer safe-area-val
- Touch-friendly (min 44px tap targets)

### Animációk
- `transition-all duration-150` alapértelmezett
- Selection: scale + ring animáció
- Modal: slide-up mobile, scale desktop

---

## 🔌 Backend API Elvárások

```
GET  /api/tablo/validate/:token     → Token validálás, session info
GET  /api/tablo/progress/:token     → Aktuális progress
POST /api/tablo/progress/:token/claim    → Claimed képek mentése
POST /api/tablo/progress/:token/register → Regisztráció
POST /api/tablo/progress/:token/retouch  → Retouch képek mentése
POST /api/tablo/progress/:token/tablo    → Tablókép mentése
POST /api/tablo/progress/:token/complete → Workflow lezárása
```

### Mock Data fejlesztéshez

```typescript
// mock-data.ts
export const MOCK_PHOTOS: Photo[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  album_id: 1,
  filename: `photo_${i + 1}.jpg`,
  thumbnail_url: `https://picsum.photos/seed/${i}/200/267`,
  preview_url: `https://picsum.photos/seed/${i}/400/533`,
  full_url: `https://picsum.photos/seed/${i}/800/1067`,
  width: 800,
  height: 1067
}));

export const MOCK_WORK_SESSION: WorkSession = {
  id: 1,
  name: '12/A Osztály Tablófotózás',
  max_retouch_photos: 5,
  is_tablo_mode: true,
  album_id: 1
};
```

---

## ⚠️ Gyakori Hibák

### 1. Signals reaktivitás
```typescript
// ❌ ROSSZ - nem reaktív
get canProceed(): boolean {
  return this.claimedPhotoIds.size > 0;
}

// ✅ JÓ - computed signal
readonly canProceed = computed(() =>
  this._claimedPhotoIds().size > 0
);
```

### 2. Set kezelés
```typescript
// ❌ ROSSZ - mutáció nem triggerel update-et
this._claimedPhotoIds().add(photoId);

// ✅ JÓ - új Set létrehozása
this._claimedPhotoIds.update(ids => {
  const newIds = new Set(ids);
  newIds.add(photoId);
  return newIds;
});
```

### 3. Retouch limit
```typescript
// ❌ ROSSZ - engedi a 0 választást
readonly canProceed = computed(() => {
  if (step === 'retouch') return true;
});

// ✅ JÓ - minimum 1 kötelező!
readonly canProceed = computed(() => {
  if (step === 'retouch') {
    return this._retouchPhotoIds().size >= 1;
  }
});
```

### 4. Guard subscription leak
```typescript
// ❌ ROSSZ - nem unsubscribe-ol
return service.init(token).pipe(map(() => true));

// ✅ JÓ - single emission, auto-complete
return service.init(token).pipe(
  take(1),
  map(() => true),
  catchError(() => of(false))
);
```

---

## 🧪 Tesztelési Checklist

### Unit Tests
- [ ] `TabloWorkflowService.togglePhotoSelection()` - claim mode
- [ ] `TabloWorkflowService.togglePhotoSelection()` - retouch mode with limit
- [ ] `TabloWorkflowService.selectTabloPhoto()` - single selection
- [ ] `TabloWorkflowService.canProceed` - minden step-re
- [ ] Guard redirect logic

### E2E Tests
- [ ] Teljes workflow végigvitele
- [ ] URL direct access (guard működik?)
- [ ] Visszalépés és újraválasztás
- [ ] Mobile touch interactions

---

## 📁 Végső Fájlstruktúra

```
src/app/features/tablo-workflow/
├── components/
│   ├── confirm-modal/
│   │   └── confirm-modal.component.ts
│   ├── info-banner/
│   │   └── info-banner.component.ts
│   ├── photo-select-grid/
│   │   └── photo-select-grid.component.ts
│   ├── photo-single-select-grid/
│   │   └── photo-single-select-grid.component.ts
│   ├── photo-thumbnail/
│   │   └── photo-thumbnail.component.ts
│   ├── preview-panel/
│   │   └── preview-panel.component.ts
│   ├── registration-modal/
│   │   └── registration-modal.component.ts
│   ├── selection-counter/
│   │   └── selection-counter.component.ts
│   ├── workflow-footer/
│   │   └── workflow-footer.component.ts
│   └── workflow-stepper/
│       └── workflow-stepper.component.ts
├── guards/
│   └── tablo-progress.guard.ts
├── models/
│   └── index.ts
├── pages/
│   ├── claiming/
│   │   └── claiming.page.ts
│   ├── completed/
│   │   └── completed.page.ts
│   ├── registration/
│   │   └── registration.page.ts
│   ├── retouch-select/
│   │   └── retouch-select.page.ts
│   └── tablo-select/
│       └── tablo-select.page.ts
├── services/
│   ├── tablo-api.service.ts
│   └── tablo-workflow.service.ts
└── tablo-workflow.routes.ts
```

---

## 🔄 Review Checklist

Implementáció befejezése előtt:

- [ ] Minden komponens `standalone: true`
- [ ] Minden komponens `ChangeDetectionStrategy.OnPush`
- [ ] Nincs BehaviorSubject - csak Signals
- [ ] Mobile responsive (teszteld 375px szélesség)
- [ ] Accessibility: aria-labels, keyboard nav
- [ ] Error handling minden API hívásra
- [ ] Loading states minden async művelethez
- [ ] Console.log-ok eltávolítva

---

## 🚨 KRITIKUS SZABÁLYOK

1. **NINCS "nem kérek retust" opció** - A retouch lépésnél minimum 1 képet kell választani
2. **Maximum limit betartása** - `max_retouch_photos` érték tiszteletben tartása
3. **Single selection tablóra** - Pontosan 1 kép választható
4. **Token validálás** - Minden API hívás előtt ellenőrizni
5. **Progress mentése** - Minden lépés után backend sync
