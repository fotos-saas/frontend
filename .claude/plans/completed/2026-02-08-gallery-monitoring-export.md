# Galéria Monitoring & Export Feature

## Kontextus

A partner (fotós) jelenleg csak a galéria szerkesztő nézetet látja, ahol képeket tölt fel/töröl. Szüksége van arra, hogy:
1. Lássa, melyik diák hol tart a képválasztási folyamatban
2. Szűrni tudjon státusz alapján
3. Excel-be exportálhassa az eredményt (ABC rendben, szűrővel)
4. ZIP-ben tölthesse le a kiválasztott képeket strukturált mappaszerkezettel
5. Beállíthassa a letöltési preferenciáit (globális + projekt szintű)

**Implementálás chunked workflow-ban, 4 session-ben.**

---

## Session 1: Monitoring Tab (Backend + Frontend alap)

### 1.1 Backend: Monitoring Action

**Új fájl:** `backend/app/Actions/Partner/GetGalleryMonitoringAction.php` (~150 sor)

Adatláncolat:
- `TabloPerson` (project persons) → `guestSession` (hasOne verified) → `last_activity_at`
- `TabloUserProgress` (user_id + tablo_gallery_id) → `steps_data`, `current_step`, `workflow_status`
- Összekapcsolás: `TabloPerson.guestSession.guest_name` ~ `User.name` (a login controller ezt használja)
- VAGY egyszerűbben: `TabloUserProgress` lekérdezés `tablo_gallery_id` alapján, majd User → tabloRegistration/tabloProgress

A legmegbízhatóbb megoldás:
```
1. Persons = TabloPerson::where('tablo_project_id', $projectId)->with('guestSession')->get()
2. AllProgress = TabloUserProgress::where('tablo_gallery_id', $galleryId)->with('user')->get()
3. Összerendelés: Person → guestSession → guest_name/guest_email → User(name/email) → progress
```

**Response formátum:**
```json
{
  "persons": [{
    "personId": 1,
    "name": "Kiss Anna",
    "type": "student",
    "hasOpened": true,
    "lastActivityAt": "2026-02-07T14:30:00Z",
    "currentStep": "retouch",
    "workflowStatus": "in_progress",
    "claimedCount": 12,
    "retouchCount": 3,
    "hasTabloPhoto": false,
    "finalizedAt": null,
    "daysSinceLastActivity": 2,
    "staleWarning": true
  }],
  "summary": {
    "totalPersons": 30,
    "opened": 22,
    "notOpened": 8,
    "finalized": 15,
    "inProgress": 7,
    "staleCount": 3
  }
}
```

**Stale warning szabály:** `current_step === 'tablo'` && `tablo_media_id !== null` && `workflow_status !== 'finalized'` && utolsó aktivitás >5 napja

### 1.2 Backend: Controller + Route

**Új fájl:** `backend/app/Http/Controllers/Api/Partner/PartnerGalleryMonitoringController.php` (~80 sor)
- `getMonitoring(int $projectId)` - monitoring endpoint
- Használja: `PartnerAuthTrait`, `GetGalleryMonitoringAction`

**Módosítás:** `backend/routes/api/partner.php` - 2 sor hozzáadás a gallery csoporthoz:
```php
Route::get('/projects/{projectId}/gallery/monitoring', [PartnerGalleryMonitoringController::class, 'getMonitoring']);
```

### 1.3 Frontend: Tab rendszer

**Új fájl:** `frontend/src/app/features/partner/pages/gallery-detail/components/gallery-tabs/gallery-tabs.component.ts` (~70 sor)
- Ugyanaz a minta mint `project-detail-tabs.component.ts`
- 2 tab: `gallery` (Galéria kezelés) | `monitoring` (Nyomon követés)
- Ikonok: `ICONS.IMAGE` + `ICONS.CHART_BAR` (vagy `ICONS.ACTIVITY`)

**Módosítás:** `gallery-detail.component.ts` + `.html`
- `activeTab` signal hozzáadása a state-hez
- Tab komponens beillesztése a header alá
- Meglévő galéria tartalom `@if (activeTab() === 'gallery')` blokkba
- Monitoring tartalom `@if (activeTab() === 'monitoring')` + `@defer`

**Módosítás:** `gallery-detail.state.ts`
- `activeTab = signal<'gallery' | 'monitoring'>('gallery')` hozzáadása

### 1.4 Frontend: Monitoring komponens

**Új fájl:** `frontend/src/app/features/partner/pages/gallery-detail/components/gallery-monitoring/gallery-monitoring.component.ts` (~120 sor)
**Új fájl:** `...gallery-monitoring.component.html` (~150 sor)
**Új fájl:** `...gallery-monitoring.component.scss` (~100 sor)

Tartalom:
- Összefoglaló kártyák (összesen, megnyitotta, véglegesített, folyamatban, figyelmeztetés)
- Szűrő sáv: szöveges keresés + dropdown (Mindenki / Véglegesített / Folyamatban / Még nem kezdte / Figyelmeztetés)
- Akció gombok: Excel export + ZIP letöltés (ezek majd Session 2-ben működnek)
- Lista `_list-page.scss` mintával: Név | Típus | Státusz | Lépés | Képek | Utolsó aktivitás
- Skeleton loading
- Üres állapot

**Új fájl:** `...gallery-monitoring.state.ts` (~80 sor)
- `loading`, `persons`, `summary`, `searchQuery`, `filterStatus` signal-ök
- `filteredPersons` computed (szűrés + ABC rendezés)

**Új fájl:** `...gallery-monitoring-actions.service.ts` (~100 sor)
- `loadMonitoring(projectId)` - HTTP hívás
- Component-scoped service

### 1.5 Frontend: Models + Service

**Új fájl:** `frontend/src/app/features/partner/models/gallery-monitoring.models.ts` (~50 sor)
- `MonitoringPerson`, `MonitoringSummary` interfészek

**Módosítás:** `frontend/src/app/core/services/partner-gallery.service.ts`
- `getMonitoring(projectId)` metódus hozzáadása

**Módosítás:** `frontend/src/app/shared/constants/icons.constants.ts`
- Szükséges új ikonok: `CHART_BAR` / `ACTIVITY` / `FILE_SPREADSHEET` / `DOWNLOAD`

**Módosítás:** `frontend/src/app/shared/constants/lucide-icons.ts`
- Új ikon import + regisztráció

### Session 1 Fájlok összegzése

| Típus | Fájl | Új/Módosítás |
|-------|------|--------------|
| Backend Action | `Actions/Partner/GetGalleryMonitoringAction.php` | Új |
| Backend Controller | `Controllers/Partner/PartnerGalleryMonitoringController.php` | Új |
| Backend Route | `routes/api/partner.php` | Módosítás |
| Frontend Tab | `gallery-tabs/gallery-tabs.component.ts` | Új |
| Frontend Monitoring | `gallery-monitoring/gallery-monitoring.component.ts` | Új |
| Frontend Monitoring HTML | `gallery-monitoring/gallery-monitoring.component.html` | Új |
| Frontend Monitoring SCSS | `gallery-monitoring/gallery-monitoring.component.scss` | Új |
| Frontend State | `gallery-monitoring/gallery-monitoring.state.ts` | Új |
| Frontend Actions | `gallery-monitoring/gallery-monitoring-actions.service.ts` | Új |
| Frontend Models | `models/gallery-monitoring.models.ts` | Új |
| Frontend Parent | `gallery-detail.component.ts` + `.html` + `.state.ts` | Módosítás |
| Frontend Service | `partner-gallery.service.ts` | Módosítás |
| Frontend Icons | `icons.constants.ts` + `lucide-icons.ts` | Módosítás |

**Összesen: 10 új fájl + 6 módosítás**

---

## Session 2: Excel Export + ZIP Letöltés (Backend)

### 2.1 Excel Export Action

**Új fájl:** `backend/app/Actions/Partner/ExportGalleryMonitoringExcelAction.php` (~200 sor)
- 3 munkalap: "Saját képek", "Retusálandó", "Tablókép"
- Minden munkalapon: Név (ABC rendben!), Osztály/Projekt, Képfájl neve, Státusz, Dátum
- **AutoFilter** fejlécen: `$sheet->setAutoFilter('A1:E1')` - minden oszlopban szűrhető
- ABC sorrend: `$users->sortBy('name')`
- Zebra csíkozás + fejléc formázás (meglévő `ExcelExportService` mintája alapján)
- Újrahasználja: `PhpOffice\PhpSpreadsheet` (már van a projektben)

### 2.2 ZIP Download Action

**Új fájl:** `backend/app/Actions/Partner/GenerateGalleryZipAction.php` (~250 sor)

ZIP struktúra:
```
{Projekt név} ({ID})/
  Kiss Anna/
    retusalt/
      Kiss Anna_retusalt_01.jpg
      Kiss Anna_retusalt_02.jpg
    tablokep/
      Kiss Anna_tablokep_01.jpg
    osszes/
      Kiss Anna_osszes_01.jpg
      Kiss Anna_osszes_02.jpg
      ...
  Nagy Péter/
    retusalt/
    tablokep/
    osszes/
  export.xlsx  (ha include_excel = true)
```

Fájlnevezés (3 opció):
1. **original** - eredeti fájlnév (`BG7A5017.JPG`)
2. **student_name** - `Kiss Anna_retusalt_01.jpg` formátum
3. **student_name_iptc** - eredeti fájlnév, de IPTC Object Name-ben benne a diák neve

**IPTC beágyazás:** `iptcembed()` PHP natív - csak JPEG-re működik, PNG/WebP skip.

**Unicode kezelés:** `Normalizer::normalize($name, Normalizer::FORM_C)` + `ZipArchive::FL_ENC_UTF_8`

Újrahasználja: `PartnerAlbumZipService::resolveUniqueFilename()` logikáját (vagy kiemelhetjük trait-be).

### 2.3 FormRequest-ek

**Új fájl:** `backend/app/Http/Requests/Gallery/DownloadGalleryZipRequest.php` (~40 sor)
```php
'person_ids' => 'array',
'person_ids.*' => 'integer',
'zip_content' => 'required|in:retouch_only,tablo_only,all,retouch_and_tablo',
'file_naming' => 'required|in:original,student_name,student_name_iptc',
'include_excel' => 'boolean',
```

**Új fájl:** `backend/app/Http/Requests/Gallery/ExportGalleryExcelRequest.php` (~30 sor)
```php
'filter' => 'in:all,finalized,in_progress,not_started',
```

### 2.4 Controller bővítés + Route

**Módosítás:** `PartnerGalleryMonitoringController.php` - 2 új metódus:
- `exportExcel(ExportGalleryExcelRequest, int $projectId)`
- `downloadZip(DownloadGalleryZipRequest, int $projectId)`

**Módosítás:** `routes/api/partner.php` - 2 új route:
```php
Route::post('/projects/{projectId}/gallery/monitoring/export-excel', [..., 'exportExcel']);
Route::post('/projects/{projectId}/gallery/monitoring/download-zip', [..., 'downloadZip']);
```

### Session 2 Fájlok összegzése
| Típus | Fájl | Új/Módosítás |
|-------|------|--------------|
| Backend Action | `ExportGalleryMonitoringExcelAction.php` | Új |
| Backend Action | `GenerateGalleryZipAction.php` | Új |
| Backend FormRequest | `DownloadGalleryZipRequest.php` | Új |
| Backend FormRequest | `ExportGalleryExcelRequest.php` | Új |
| Backend Controller | `PartnerGalleryMonitoringController.php` | Módosítás |
| Backend Route | `routes/api/partner.php` | Módosítás |

**Összesen: 4 új fájl + 2 módosítás**

---

## Session 3: Frontend Export + Letöltés Dialog

### 3.1 Download Dialog

**Új fájl:** `...download-dialog/download-dialog.component.ts` (~120 sor)
**Új fájl:** `...download-dialog/download-dialog.component.html` (~100 sor)
**Új fájl:** `...download-dialog/download-dialog.component.scss` (~60 sor)

Tartalom:
- `dialog-backdrop` + `dialog-panel--md` pattern
- `createBackdropHandler` használat
- **ZIP tartalom checkboxok:** Retusált képek / Tablókép / Összes kép
- **Fájlnév radio:** Eredeti fájlnév / Diák neve / Diák neve IPTC-ben
- **Excel mellékelés checkbox**
- Mégsem / Letöltés gombok
- Input: `exportSettings` (alapértelmezett értékek)
- Output: `download` event (DownloadOptions), `close` event

### 3.2 Monitoring komponens bővítés

**Módosítás:** `gallery-monitoring.component.ts` + `.html`
- Excel export gomb → közvetlen letöltés (blob download)
- ZIP letöltés gomb → ha `always_ask` → dialog megjelenítés, egyébként közvetlen letöltés
- Loading indikátor letöltés közben
- `DownloadDialogComponent` import

**Módosítás:** `gallery-monitoring-actions.service.ts`
- `exportExcel(projectId, filter)` - blob letöltés
- `downloadZip(projectId, options)` - blob letöltés
- File save helper (Blob → download link → click → cleanup)

### 3.3 Frontend Service bővítés

**Módosítás:** `partner-gallery.service.ts`
- `exportMonitoringExcel(projectId, filter)` → `responseType: 'blob'`
- `downloadMonitoringZip(projectId, options)` → `responseType: 'blob'`

### Session 3 Fájlok összegzése
| Típus | Fájl | Új/Módosítás |
|-------|------|--------------|
| Frontend Dialog | `download-dialog/*.ts/.html/.scss` | 3 Új |
| Frontend Monitoring | `gallery-monitoring.component.*` | Módosítás |
| Frontend Actions | `gallery-monitoring-actions.service.ts` | Módosítás |
| Frontend Service | `partner-gallery.service.ts` | Módosítás |

**Összesen: 3 új fájl + 3 módosítás**

---

## Session 4: Export Beállítások (Settings)

### 4.1 Backend: Migrációk

**Új fájl:** `backend/database/migrations/XXXX_add_export_settings_to_tablo_partners.php`
```php
$table->string('default_zip_content', 50)->default('all'); // retouch_only, tablo_only, all, retouch_and_tablo
$table->string('default_file_naming', 50)->default('original'); // original, student_name, student_name_iptc
$table->boolean('export_always_ask')->default(true);
```

**Új fájl:** `backend/database/migrations/XXXX_add_export_settings_to_tablo_projects.php`
```php
$table->string('export_zip_content', 50)->nullable(); // null = partner default
$table->string('export_file_naming', 50)->nullable();
$table->boolean('export_always_ask')->nullable();
```

### 4.2 Backend: Model + Settings Controller módosítás

**Módosítás:** `TabloPartner` model - fillable bővítés + cast
**Módosítás:** `TabloProject` model - fillable bővítés + cast + `getEffectiveExportSettings()` metódus
**Módosítás:** `PartnerSettingsController` - export_* mezők hozzáadása get/update-hoz
**Módosítás:** `UpdateGlobalSettingsRequest` - validáció bővítés
**Módosítás:** `UpdateProjectSettingsRequest` - validáció bővítés

### 4.3 Frontend: Settings UI

**Módosítás:** Projekt beállítások tab - export szekció hozzáadása
- ZIP tartalom alapértelmezés (dropdown)
- Fájlnév stratégia (dropdown)
- "Mindig kérdezz rá" toggle
- "Galéria monitoring" gyorslink

**Módosítás:** Globális beállítások oldal - hasonló export szekció
**Módosítás:** Monitoring komponens - settings betöltése + dialog pre-fill

### Session 4 Fájlok összegzése
| Típus | Fájl | Új/Módosítás |
|-------|------|--------------|
| Backend Migration | 2 migráció | 2 Új |
| Backend Model | `TabloPartner.php`, `TabloProject.php` | 2 Módosítás |
| Backend Controller | `PartnerSettingsController.php` | Módosítás |
| Backend FormRequest | 2 settings request | 2 Módosítás |
| Frontend Settings | project-settings-tab + global-settings | 2 Módosítás |
| Frontend Monitoring | beállítások integrálás | Módosítás |

**Összesen: 2 új fájl + 7 módosítás**

---

## Kritikus újrafelhasználandó fájlok

| Fájl | Mit használunk belőle |
|------|----------------------|
| `backend/app/Services/ExcelExportService.php` | PhpSpreadsheet minta, formázás, zebra csíkozás |
| `backend/app/Services/PartnerAlbumZipService.php` | ZipArchive minta, unique filename logic |
| `backend/app/Http/Controllers/Api/PartnerOrderAlbumPhotoController.php` | downloadZip/exportExcel response pattern |
| `frontend/.../project-detail-tabs/project-detail-tabs.component.ts` | Tab UI pattern |
| `frontend/src/app/shared/styles/_list-page.scss` | Lista stílus |
| `backend/app/Actions/Partner/GetGalleryProgressAction.php` | Alap progress query logika |

---

## Verifikáció (Session 1 után)

1. **Backend:** `php -l` szintaxis ellenőrzés az összes új fájlra
2. **Frontend:** `ng build --configuration=production` - 0 hiba
3. **Funkcionális teszt:** Chrome-ban localhost:4205 → partner → projekt → galéria → "Nyomon követés" tab megnyílik, adatok betöltődnek
4. **Vizuális teszt:** Screenshot a monitoring tab-ról - lista stílus, skeleton loading, szűrők működnek
