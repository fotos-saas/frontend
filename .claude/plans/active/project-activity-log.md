# Projekt Activity Log + Éjszakai Szinkronizáció — Implementációs Terv

> Dátum: 2026-02-27 | Becsült idő: ~20 óra (4 sprint)

---

## Áttekintés

Három egymásra épülő feature:

1. **`last_activity_at` a projekteken** → "Módosítva" oszlop a listában
2. **Projekt aktivitás tab** → részletes napló a projekt adatlapon
3. **Projekt aktivitás menüpont** → cross-projekt összesített nézet (csoportosítva)

Az éjszakai szinkronizáció erre fog épülni (külön terv), de ennek az alap feltétele a `last_activity_at` + activity log.

---

## Döntések

### Meglévő Spatie Activity Log BŐVÍTÉSE (nem új tábla!)

**A projekt már használ Spatie Activity Log-ot** 11 model-en. Van:
- `activity_log` tábla
- Custom `Activity` model (`partner_id` scope-pal)
- `GetActivityLogAction` + `PartnerActivityLogController`
- Frontend `ActivityLogComponent` kategória/event szűrőkkel

**NEM csinálunk új `tablo_project_activities` táblát.** Ehelyett:
- Bővítjük a Spatie logolást a hiányzó eseményekre
- Hozzáadunk `last_activity_at` timestamp-et a `tablo_projects`-hez
- A projekt adatlapon szűrt Spatie log-ot mutatunk (`subject_type = TabloPerson` + `project_id`)

**Indoklás:**
- Nem duplikálunk infrastruktúrát
- A Spatie már tárolja a `causer`-t (ki csinálta)
- A `properties` JSON-ben `old`/`attributes` before/after adatok mennek (AI-barát)
- Egy helyen van minden audit trail

### Cross-projekt fotó változás: Observer bővítés

A `TeacherArchive.active_photo_id` változásnál **minden érintett projekt** `last_activity_at`-ját frissítjük.

---

## Sprint 1 — Backend: `last_activity_at` + Observer bővítés (~5 óra)

### 1.1 Migráció: `last_activity_at`

```
backend/database/migrations/2026_02_28_000001_add_last_activity_at_to_tablo_projects.php
```

- `last_activity_at` timestamp, nullable, indexed
- Backfill: `GREATEST(updated_at, legutóbbi person updated_at)`

### 1.2 `TabloPerson::getEffectiveMediaId()` metódus

```
backend/app/Models/TabloPerson.php
```

Ugyanaz a lánc mint `getEffectivePhotoUrl()`, de media ID-t ad vissza:
- `override_photo_id` → `override_photo_id`
- `archive.active_photo_id` → `archive.active_photo_id`
- `media_id` → `media_id`

### 1.3 `TabloPersonObserver` bővítés

```
backend/app/Observers/TabloPersonObserver.php
```

A meglévő observer-be (jelenleg csak cache invalidálás):
- `created()` → `last_activity_at = now()` a projekten
- `updated()` → ha `name`, `override_photo_id`, `archive_id`, `media_id`, `photo_type` dirty → `last_activity_at = now()`
- `deleted()` → `last_activity_at = now()` a projekten

A Spatie `LogsActivity` trait AUTOMATIKUSAN logolja a `name`, `type`, `photo_type`, `position` mezőket — ezt nem kell duplán csinálni. Viszont a `last_activity_at` frissítést az observer-nek kell.

### 1.4 `TeacherArchiveObserver` (ÚJ)

```
backend/app/Observers/TeacherArchiveObserver.php
```

```php
public function updated(TeacherArchive $archive): void
{
    if (!$archive->isDirty('active_photo_id')) return;

    // Minden projekt ahol ez a tanár szerepel
    $projectIds = TabloPerson::where('archive_id', $archive->id)
        ->where('type', 'teacher')
        ->pluck('tablo_project_id')
        ->unique();

    TabloProject::whereIn('id', $projectIds)
        ->update(['last_activity_at' => now()]);

    // Spatie activity log: minden érintett person-re
    $persons = TabloPerson::where('archive_id', $archive->id)
        ->where('type', 'teacher')
        ->get();

    foreach ($persons as $person) {
        activity('tablo')
            ->performedOn($person)
            ->withProperties([
                'old' => ['active_photo_id' => $archive->getOriginal('active_photo_id')],
                'attributes' => ['active_photo_id' => $archive->active_photo_id],
                'source' => 'archive_photo_change',
            ])
            ->event('updated')
            ->log("Tanár archív fotó változás: {$person->name}");
    }
}
```

### 1.5 `StudentArchiveObserver` (ÚJ)

Ugyanaz mint a `TeacherArchiveObserver`, de `type = 'student'`.

### 1.6 Observer regisztráció

```
backend/app/Providers/AppServiceProvider.php
```

### 1.7 Spatie LogsActivity bővítés TabloPerson-ön

```php
->logOnly(['name', 'type', 'photo_type', 'position', 'override_photo_id', 'archive_id'])
```

Az `override_photo_id` és `archive_id` változás is logolódjon.

---

## Sprint 2 — Backend: Projekt-szintű Activity API (~3 óra)

### 2.1 Endpoint: `GET /api/partner/projects/{projectId}/activity`

```
backend/app/Http/Controllers/Api/Partner/PartnerProjectActivityController.php
```

A `GetActivityLogAction`-t bővítjük vagy újat csinálunk:
- Szűrés: `subject_type = TabloPerson` ÉS a person `tablo_project_id = $projectId`
- VAGY `subject_type = TabloProject` ÉS `subject_id = $projectId`
- Pagination (20/oldal)

**Response:**
```json
{
  "items": [
    {
      "id": 456,
      "event": "updated",
      "eventLabel": "Módosítva",
      "subjectType": "TabloPerson",
      "subjectName": "Kiss Anna",
      "changes": {
        "old": { "name": "Kiss A." },
        "attributes": { "name": "Kiss Anna" }
      },
      "causer": { "id": 1, "name": "Partner Név" },
      "createdAt": "2026-02-27T18:48:00.000Z"
    }
  ],
  "pagination": { "current_page": 1, "last_page": 3, "total": 54 }
}
```

### 2.2 Endpoint: `POST /api/partner/projects/check-photo-changes`

Az éjszakai szinkronizáció API-ja (most készül, a night job használja majd):

```json
// Request
{
  "projects": [
    {
      "projectId": 418,
      "persons": [
        { "personId": 12837, "mediaId": 11389 },
        { "personId": 12838, "mediaId": 11626 }
      ]
    }
  ]
}

// Response
{
  "changes": [
    {
      "projectId": 418,
      "projectName": "12 D",
      "changedPersons": [
        {
          "personId": 12837,
          "personName": "Nagy Henriett",
          "oldMediaId": 11389,
          "newMediaId": 12500,
          "newPhotoUrl": "https://api.tablostudio.hu/storage/12500/..."
        }
      ]
    }
  ]
}
```

### 2.3 Projekt lista: `last_activity_at` mező + rendezés

```
backend/app/Http/Controllers/Api/Partner/PartnerDashboardController.php
```

- Hozzáadni a `projects()` válaszához: `lastActivityAt`
- Sort opció: `last_activity_at`

### 2.4 FormRequests

- `CheckPhotoChangesRequest`
- Meglévő `ListActivityLogRequest` bővítés `project_id` szűrővel

### 2.5 Route regisztráció

```php
// routes/api/partner.php
Route::get('/projects/{projectId}/activity', [PartnerProjectActivityController::class, 'index']);
Route::post('/projects/check-photo-changes', [PartnerDesktopSyncController::class, 'checkPhotoChanges']);
```

---

## Sprint 3 — Frontend: Lista oszlop + Projekt Activity Tab (~6 óra)

### 3.1 Projekt lista "Módosítva" oszlop

**Fájlok:**
- `frontend/src/app/features/partner/models/partner.models.ts` — `lastActivityAt` mező
- `frontend/src/app/features/partner/pages/project-list/project-list.component.ts` — sort opció
- `frontend/src/app/features/partner/pages/project-list/project-list.component.html` — oszlop

A "HIÁNYZÓ" és "PSD" oszlopok közé kerül. Relatív dátum: "2 napja", "ma 14:30", stb.

### 3.2 Projekt detail: "Aktivitás" tab

**Új fájlok:**
```
frontend/src/app/shared/components/project-detail/
  project-activity-tab/
    project-activity-tab.component.ts     (~150 sor)
    project-activity-tab.component.html   (~80 sor)
    project-activity-tab.component.scss   (~60 sor)
```

**Design:**
- Idővonal nézet (timeline) — bal oldalon dátum, jobb oldalon esemény
- Esemény típus ikon (user-plus, edit, image, trash)
- Ki csinálta (causer neve)
- Before/after adatok (ha van)
- Napi csoportosítás (dátum szeparátorok)
- Pagination alul

**Tab regisztráció:**
- `project-detail-tabs.component.ts` — `PROJECT_DETAIL_TABS` bővítés `'activity'` tab-bal
- `project-detail-wrapper.component.html` — `@case ('activity')` hozzáadása
- `project-detail.types.ts` — `ProjectDetailTab` type bővítés

### 3.3 Service bővítés

```
frontend/src/app/features/partner/services/partner-activity.service.ts
```

```typescript
getProjectActivity(projectId: number, page: number): Observable<ActivityLogResponse> {
  return this.http.get<ActivityLogResponse>(
    `${this.apiUrl}/partner/projects/${projectId}/activity`,
    { params: { page, per_page: 20 } }
  );
}
```

---

## Sprint 4 — Frontend: "Projekt aktivitás" menüpont (~6 óra)

### 4.1 Cross-projekt aktivitás oldal (ÚJ)

A meglévő `ActivityLogComponent`-et BŐVÍTJÜK:
- Projekt szerinti csoportosítás opció
- Szűrő: konkrét projekt kiválasztása
- Az "Összes kategória" mellé: "Projekt változások" szűrő ami csak a `tablo` log_name-et mutatja

**VAGY** új, dedikált oldal:

```
frontend/src/app/features/partner/pages/project-activity/
  project-activity.component.ts    (~200 sor)
  project-activity.component.html  (~120 sor)
  project-activity.component.scss  (~80 sor)
```

**Design:**
- Projekt kártyák csoportosítva (accordion)
- Minden kártya: projekt név + utolsó módosítás dátuma
- Kibontva: az utolsó N esemény timeline-ja
- Szűrők: dátum range, esemény típus, keresés

### 4.2 Sidebar menü

A `partner-shell.component.ts` `navItems`-ben a "Projektek" children alá:

```typescript
{ id: 'project-activity', route: `${base}/project-activity`, label: 'Projekt aktivitás', icon: ICONS.ACTIVITY },
```

### 4.3 Route regisztráció

```
frontend/src/app/app.routes.ts
```

---

## Backup törlés véglegesítésnél

Amikor egy projekt `status = 'done'` (véglegesített):
- Az Electron `discoverLocalProjects()` figyeli a projekt státuszt
- A `night-job.service.ts`-ben (amikor implementáljuk): ha `status === 'done'`, törölje a backup mappát
- VAGY: a `PartnerFinalizationController::markAsDone()` metódusban flag-eljük, és az Electron a következő futáskor takarít

**Megjegyzés:** Ez az éjszakai job feature része lesz, nem ennek a sprintnek.

---

## Összefoglaló — Fájlok

### Backend (ÚJ)
| Fájl | Leírás |
|------|--------|
| `migrations/..._add_last_activity_at.php` | Migráció |
| `Observers/TeacherArchiveObserver.php` | Cross-projekt fotó változás |
| `Observers/StudentArchiveObserver.php` | Cross-projekt fotó változás |
| `Controllers/Partner/PartnerProjectActivityController.php` | Projekt activity API |
| `Controllers/Partner/PartnerDesktopSyncController.php` | Night job check-photo-changes |
| `Requests/Partner/CheckPhotoChangesRequest.php` | Validáció |
| `Actions/Partner/CheckPhotoChangesAction.php` | Üzleti logika |

### Backend (MÓDOSÍTÁS)
| Fájl | Változás |
|------|----------|
| `Models/TabloPerson.php` | `getEffectiveMediaId()` + `logOnly` bővítés |
| `Observers/TabloPersonObserver.php` | `last_activity_at` frissítés |
| `Providers/AppServiceProvider.php` | Observer regisztráció |
| `Controllers/Partner/PartnerDashboardController.php` | `lastActivityAt` mező + sort |
| `routes/api/partner.php` | Új route-ok |

### Frontend (ÚJ)
| Fájl | Leírás |
|------|--------|
| `project-activity-tab/*.{ts,html,scss}` | Projekt detail activity tab |
| `project-activity/*.{ts,html,scss}` | Cross-projekt aktivitás oldal |

### Frontend (MÓDOSÍTÁS)
| Fájl | Változás |
|------|----------|
| `partner.models.ts` | `lastActivityAt` mező |
| `project-list.component.{ts,html}` | "Módosítva" oszlop + sort |
| `project-detail-tabs.component.ts` | `'activity'` tab |
| `project-detail-wrapper.component.html` | Tab content switch |
| `partner-activity.service.ts` | `getProjectActivity()` |
| `partner-shell.component.ts` | Menüpont |
| `app.routes.ts` | Route |
