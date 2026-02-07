# PhotoStack SaaS - Fotós Platform

> **Részletes dokumentáció:** [`docs/`](docs/README.md)

## Projekt Infó

| | |
|---|---|
| **Projekt neve** | PhotoStack SaaS (tablóstúdió + képválasztó) |
| **Domének** | tablostudio.hu, kepvalaszto.hu |
| **Szerver** | 89.167.19.19 (Hetzner CPX22, Helsinki) |
| **Hosting** | Coolify (self-hosted PaaS) |
| **GitHub** | github.com/fotos-saas |

---

## 🧠 PROJECT MEMORY (ÚJ SESSION ELEJÉN!)

```
⚠️ MINDEN ÚJ BESZÉLGETÉS ELEJÉN:

1. OLVASD BE az aktív terveket:
   ls .claude/plans/active/
   → Ha van fájl, olvasd be mindegyiket!

2. KÉRDEZD MEG a usert:
   "Van aktív terv: [fájlnevek]. Folytatjuk valamelyiket?"

3. Ha TERVET készítesz (>30 perc munka):
   → MENTSD: .claude/plans/active/[feature-name].md
   → Használd a template-et: .claude/plans/README.md

4. Ha BEFEJEZTED a tervet:
   → MOZGASD: .claude/plans/completed/[date]-[name].md
   → Állítsd át: Státusz: ✅ Completed
```

### Plan Mentési Kötelezettség

| Feladat típus | Kell plan fájl? |
|---------------|-----------------|
| Gyors fix (<20 sor) | ❌ Nem |
| Közepes feature | ✅ Igen, `active/` |
| Nagy refactor | ✅ Igen, `active/` + ADR |
| Architektúra döntés | ✅ `decisions/` (ADR formátum) |

### Fájl Elnevezés

```
active/
  electron-mac-app.md          ← Feature neve
  filament-removal.md          ← Tervezett munka

completed/
  2025-02-05-onpush-refactor.md  ← Dátum + név

decisions/
  001-electron-over-tauri.md     ← Sorszám + döntés
  002-signals-over-rxjs.md
```

### 🔄 CHUNKED WORKFLOW (NAGY REFAKTOROKHOZ!)

```
⚠️ Ha a terv >1 óra munka VAGY >10 fájl érintett:

1. BONTSD SZÉT session-méretű taskokra:
   → Használd: .claude/plans/active/_TEMPLATE_CHUNKED.md
   → 1 task = ~15-30 perc, 1-3 fájl

2. MINDEN SESSION:
   a) Olvasd be a chunked plan-t
   b) Keresd az ELSŐ [ ] (üres) taskot
   c) CSAK AZT CSINÁLD, ne többet!
   d) Ha kész → [x] jelölés + session log
   e) MONDD: "TASK-XXX kész! Clearelj és folytatjuk."

3. NE CSINÁLJ TÖBBET 1 TASKNÁL!
   → A user CLEAR-el a session között
   → Így friss context marad
   → Hatékonyabb mint 1 nagy session

4. MINDEN TASK VÉGÉN FRISSÍTSD:
   - [ ] → [x] a taskra
   - Session log bejegyzés
   - "Összesen: X task | ✅ Y kész | ⏳ Z hátra"
```

| Feladat | Chunked kell? |
|---------|---------------|
| Kis fix (<30 perc) | ❌ Nem |
| Közepes feature (30-60 perc) | ⚠️ Opcionális |
| Nagy refaktor (>1 óra) | ✅ KÖTELEZŐ |
| Service szétbontás | ✅ KÖTELEZŐ |

---

## 🔄 DEFAULT WORKFLOW

### ⚡ GYORS MÓD (kis javításokhoz)

Ha a feladat **egyszerű** (1-2 fájl, <20 sor változás):
- Typo javítás
- Egyszerű bug fix
- Szöveg módosítás
- Meglévő komponens kis módosítása

**→ SKIP:** Registry ellenőrzés, Ref MCP, Review subagent
**→ CSAK:** Implementálj + rövid összegzés

### 📂 SMART CONTEXT LOADING

Feladat típusa alapján töltsd be a megfelelő context fájlt:

| Ha a feladat... | Töltsd be |
|-----------------|-----------|
| Electron/IPC | `.claude/context/electron.md` |
| UI komponens | `.claude/context/ui-components.md` |
| API/HTTP hívás | `.claude/context/api.md` |
| Űrlap/Form | `.claude/context/forms.md` |

**Több is releváns lehet!** Pl. UI komponens + Form → mindkettő

---

### 🔨 TELJES WORKFLOW (új feature, refactor, >20 sor)

**Kövesd ezt ha:**
- Új komponens/service kell
- Több fájl érintett
- >20 sor változás
- Bizonytalan vagy a megoldásban

### 0️⃣ KOMPONENS REGISTRY ELLENŐRZÉS (KÖTELEZŐ!)
```
⚠️ MIELŐTT bármit létrehoznál, OLVASD BE:
- COMPONENT_REGISTRY.md
- PROJECT_INDEX.json
- LESSONS_LEARNED.md (gyakori hibák!)

Kérdezd meg magadtól:
□ Van már ilyen komponens/service?
□ Bővíthető a meglévő?
□ TILOS újat létrehozni ha van megfelelő!

Ha új komponenst hozol létre:
→ ADD HOZZÁ a COMPONENT_REGISTRY.md-hez!
```

### 0️⃣.25 IMPACT ANALYSIS (SERVICE/CORE MÓDOSÍTÁSNÁL!)
```
⚠️ Ha MEGLÉVŐ service-t vagy core komponenst módosítasz:

Spawolj IMPACT ANALYZER subagent-et:
"Elemezd a [fájl] módosításának hatását:
 - Mely fájlok importálják?
 - Breaking change lesz?
 - Milyen migrációs lépések kellenek?"

HA breaking change → VÁRD MEG a jóváhagyást!
```

### 0️⃣.5 ELŐRETEKINTŐ TERVEZÉS (ÚJ KOMPONENSNÉL!)
```
⚠️ Ha MÉGIS új komponenst/service-t kell létrehozni:

GONDOLKODJ ELŐRE - Kérdezd meg:
□ Hol lehetne még használni a projektben?
□ Milyen paramétereket kellene konfigurálhatóvá tenni?
□ Hogyan lenne általánosítható?

TERVEZÉSI ELVEK:
1. GENERIKUS > Specifikus
   ❌ ProjectDeleteConfirmDialog
   ✅ ConfirmDialog (data: { title, message, confirmText })

2. KONFIGURÁLHATÓ
   ❌ Hardcoded értékek
   ✅ @Input() paraméterek, config object

3. KOMPOZÍCIÓ
   ❌ Egy nagy monolitikus komponens
   ✅ Kisebb, összerakható részek

4. SINGLE RESPONSIBILITY
   ❌ Service ami 5 dolgot csinál
   ✅ Egy service = egy felelősség

PÉLDA - Rossz vs Jó:

❌ ROSSZ (egyszer használható):
@Component({ selector: 'app-project-image-upload' })
export class ProjectImageUploadComponent {
  uploadToProject(projectId: string) { ... }
}

✅ JÓ (újrahasználható):
@Component({ selector: 'app-file-upload' })
export class FileUploadComponent {
  @Input() acceptedTypes = ['image/*'];
  @Input() maxSize = 10 * 1024 * 1024;
  @Input() multiple = true;
  @Input() uploadUrl!: string;
  @Output() uploaded = new EventEmitter<UploadResult>();
  @Output() error = new EventEmitter<UploadError>();
}

ELLENŐRZÉS IMPLEMENTÁCIÓ ELŐTT:
□ Legalább 2 másik helyen is használható lenne?
□ A paraméterek lefedik a lehetséges use-case-eket?
□ Könnyen bővíthető később?
```

### 1️⃣ MEGÉRTÉS
- Olvasd be az érintett fájlokat
- Értsd meg a jelenlegi működést
- Ellenőrizd a COMPONENT_REGISTRY.md-t hasonló megoldásokért
- **Ha library/API dokumentáció kell → használd a Ref MCP-t!**

### 1️⃣.5 REF MCP HASZNÁLAT (DOKUMENTÁCIÓHOZ!)
```
⚠️ MIELŐTT library-t/API-t használnál, KERESD MEG a dokumentációt!

MIKOR HASZNÁLD a Ref MCP-t:
□ Új Angular feature (pl. signal, standalone)
□ Angular Material komponens API
□ RxJS operátorok
□ Laravel API / Eloquent
□ Electron API
□ Capacitor plugin
□ Bármilyen npm package

HOGYAN:
1. ref_search_documentation("angular standalone component")
2. ref_search_documentation("rxjs switchMap vs mergeMap")
3. ref_search_documentation("electron ipcMain handle")
4. ref_read_url("https://angular.io/api/core/signal")

ELŐNYÖK:
✅ Pontos, naprakész dokumentáció
✅ Nem találsz ki nem létező API-t
✅ Token-hatékony (csak releváns részek)

NE TALÁLJ KI SEMMIT - ha nem biztos, keresd meg a doksiban!
```

### 2️⃣ TERVEZÉS (ha nem triviális)
- Rövid terv (max 5 pont)
- Ha nagy változás: várd meg a jóváhagyást
- Listázd melyik MEGLÉVŐ komponenseket/service-eket használod
- **Dokumentáció alapján** (Ref MCP) - ne találj ki API-t!

### 3️⃣ IMPLEMENTÁCIÓ
- Kövesd a KRITIKUS SZABÁLYOKAT
- TypeScript strict (NO any)
- Cleanup pattern (takeUntil + destroy$)
- Error handling (try/catch)
- **HASZNÁLD a meglévő komponenseket** (COMPONENT_REGISTRY.md)
- **ELLENŐRIZD a dokumentációt** (Ref MCP) ha bizonytalan vagy

### 4️⃣ REVIEW (AUTOMATIKUS - MINDIG!)
```
Implementáció után MINDIG spawolj REVIEWER subagent-et:

"Review-zd szigorúan a módosított kódot:

 CHECKLIST:
 □ Memory leak? (subscription cleanup, event listener)
 □ Type safety? (any típus használat)
 □ Error handling? (try/catch async-nál)
 □ Input validation? (IPC handler-eknél)
 □ CLAUDE.md szabályok? (magyar szöveg, page-card, ICONS, stb.)
 □ Max 300 sor/fájl?
 □ Duplikált kód?
 □ ÚJRAHASZNÁLHATÓSÁG? (ha új komponens)
   - Van @Input() a konfigurációhoz?
   - Máshol is használható lenne?
   - COMPONENT_REGISTRY.md-be hozzáadva?

 NE JAVÍTS! Csak listázd a problémákat:
 🔴 KRITIKUS - kötelező javítani
 🟡 FIGYELMEZTETÉS - ajánlott javítani
 🟢 JAVASLAT - opcionális"
```

### 5️⃣ JAVÍTÁS
- Javítsd a 🔴 KRITIKUS hibákat
- Javítsd a 🟡 FIGYELMEZTETÉS hibákat
- 🟢 JAVASLAT opcionális

### 6️⃣ SECURITY CHECK (ha IPC/auth érintett)
```
Ha IPC handler vagy autentikáció érintett, spawolj SECURITY subagent-et:

"Security audit:
 □ IPC input validation (típus + méret)
 □ Error message nem leak-el infót
 □ Credentials biztonságosan kezelve"
```

### 6️⃣.5 VISUAL SMOKE TEST (ha UI változott)
```
Ha vizuális változtatás történt ÉS Claude in Chrome MCP elérhető:

1. Nyisd meg a localhost:4205/[érintett route]
2. Screenshot
3. Ellenőrizd:
   □ Nincs console error
   □ Layout rendben
   □ Responsive (resize 375px)

HA probléma → javítsd mielőtt lezárod!
```

### 6️⃣.75 PERFORMANCE CHECK (ha nagy változás)
```
Ha >5 fájl változott VAGY új dependency hozzáadva:

Ellenőrizd:
□ ng build lefut hiba nélkül
□ Bundle size nem nőtt >50KB-tal
□ Lazy loading megmaradt

HA probléma → optimalizálj!
```

### 7️⃣ POST-IMPLEMENTATION (AUTO-UPDATE!)
```
⚠️ Implementáció után FRISSÍTSD ezeket ha releváns:

□ COMPONENT_REGISTRY.md
  - Új komponens/service → ADD hozzá!
  - Új használati minta → ADD példát!

□ LESSONS_LEARNED.md
  - Trükkös bugot találtál → ADD a megoldást!
  - Új pattern kellett → ADD példakódot!

□ PROJECT_INDEX.json
  - Új service → ADD a services listához
  - Új pattern → ADD az architecture.patterns-hez
```

### 8️⃣ ÖSSZEGZÉS
- Módosított fájlok listája
- Mi változott (röviden)
- Időbecslés Clockify-hoz
- Registry/Lessons frissült? (igen/nem)

---

## 🚨 KRITIKUS SZABÁLYOK

| # | Szabály | Részletek |
|---|---------|-----------|
| 1 | **BACKUP** adatbázis műveletek előtt | |
| 2 | **MINDEN UI szöveg MAGYAR** | |
| 3 | **Fájlméret limit** | Komponens max 300 sor |
| 4 | **Redundancia csökkentés** | Duplikált kód → service/helper |
| 5 | **ConfirmDialog törléshez** | Destruktív műveleteknél `ConfirmDialogComponent` |
| 6 | **FormData ID→intval** | `array_map('intval', $ids)` mert FormData stringet küld |
| 7 | **`page-card` class MINDEN oldalon** | Fő container-hez: `<div class="my-page page-card">` |
| 8 | **Dialógusok page-card KÍVÜL** | backdrop-filter stacking context miatt! |
| 9 | **`dialog-backdrop` + `dialog-panel` class** | Egységes dialógus stílus |
| 10 | **Lucide ikonok `ICONS` konstanssal** | NEM emoji! `import { ICONS } from '@shared/constants'` |
| 11 | **`matTooltip` tooltiphez** | Angular Material tooltip |
| 12 | **`createBackdropHandler` dialógusokhoz** | Szöveg kijelölés közben NE záródjon be! |

---

## 🏗️ TECH STACK

| Layer | Technológia |
|-------|-------------|
| **Backend** | Laravel 11 + PHP 8.3 |
| **Frontend** | Angular 17+ Standalone + Tailwind CSS |
| **Database** | PostgreSQL 17 |
| **Cache/Queue** | Redis 7.2 |
| **Hosting** | Coolify + Docker |
| **DNS/CDN** | Cloudflare |

---

## 🚀 DEPLOYMENT (Coolify)

### URLs
| Komponens | URL |
|-----------|-----|
| Frontend | https://tablostudio.hu |
| Backend API | https://api.tablostudio.hu |
| Coolify Dashboard | http://89.167.19.19:8000 |

### Deploy folyamat
1. Git push → GitHub
2. Coolify webhookkal automatikusan deployol VAGY
3. Coolify Dashboard → Redeploy gomb

### Parancsok
```bash
# SSH a szerverre
ssh root@89.167.19.19

# Coolify logok
docker logs -f <container_name>
```

---

## 💬 TOOLTIP RENDSZER (ANGULAR MATERIAL)

```typescript
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [MatTooltipModule],
})
```

```html
<button matTooltip="Mentés">Save</button>
<button matTooltip="Szöveg" matTooltipPosition="above">Felül</button>
```

⚠️ **NE használd:** `data-tooltip` - ELAVULT!

---

## 🎨 IKON RENDSZER (LUCIDE)

```typescript
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  imports: [LucideAngularModule],
})
export class MyComponent {
  readonly ICONS = ICONS;
}
```

```html
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
```

⚠️ **NE használd:** Emojikat (`📱`, `✕`) - Lucide ikont használj!

---

## 🪟 DIALOG RENDSZER

```typescript
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({...})
export class MyDialogComponent {
  @Output() close = new EventEmitter<void>();
  backdropHandler = createBackdropHandler(() => this.close.emit());
}
```

### Panel méretek
| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR modal |
| `dialog-panel--lg` | 600px | Részletes form |

---

## ✨ UI/UX ANIMÁCIÓK

### Loading States
- **Skeleton loading** spinner helyett (shimmer effekttel)

### Lista Animációk
- **Staggered entry**: Kártyák egymás után (0.05s delay)
- **Hover**: translateY(-2px) + shadow növelés

### Dialog/Modal
- **Backdrop**: fadeIn 0.2s
- **Content**: slideUp 0.3s cubic-bezier

### A11y - KÖTELEZŐ!
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📦 PAGE-CARD LAYOUT

```html
<div class="my-component page-card">
  <!-- Tartalom -->
</div>
```

---

## 🔧 LOKÁLIS FEJLESZTÉS

```bash
# Frontend
cd frontend && npm run start

# Backend (ha lokálisan fut)
cd backend && php artisan serve
```

---

## Megjegyzések
- Multi-brand architektúra (több domain, egy rendszer)
- Magyar nyelv elsődleges
- GDPR kompatibilis

---

## 🤖 MULTI-AGENT WORKFLOW

### Agent Szerepek

| Agent | Szerep | Mikor használd |
|-------|--------|----------------|
| **Architect** | Tervezés, struktúra, interface-ek | Feature kezdetekor |
| **Implementer** | Kód írás | Terv után |
| **Reviewer** | Kód review, hibakeresés | Implementáció után |
| **Security** | Biztonsági audit | IPC, auth, input handling |
| **Performance** | Optimalizálás, bundle size | Refactor, nagy listák |

### Workflow: Új Feature

```
1. ARCHITECT AGENT
   "Tervezd meg a [feature] architektúráját:
    - Milyen service-ek kellenek?
    - Milyen IPC handler-ek?
    - Interface-ek/típusok?"

2. IMPLEMENTER AGENT (subagent)
   "Implementáld a terv alapján. Követelmények:
    - TypeScript strict mode
    - Cleanup minden listener-nél
    - Error handling try/catch"

3. REVIEWER AGENT (subagent)
   "Review-zd a kódot:
    - Memory leak? (missing unsubscribe)
    - Type safety? (any használat)
    - Input validation?
    - Edge case-ek?"

4. SECURITY AGENT (ha IPC/auth érintett)
   "Security audit:
    - IPC handler input validation?
    - ALLOWED_ORIGINS ellenőrzés?
    - Sensitive data exposure?"
```

### Workflow: Bug Fix

```
1. INVESTIGATOR AGENT
   "Derítsd ki a bug okát:
    - Hol a hiba? (file, line)
    - Mi a root cause?
    - Milyen edge case okozza?"

2. IMPLEMENTER AGENT
   "Javítsd a hibát + adj hozzá tesztet"

3. REVIEWER AGENT
   "Ellenőrizd:
    - A javítás megoldja a problémát?
    - Nem okoz regressziót?
    - Van teszt a bug-ra?"
```

### Workflow: Refactor

```
1. ANALYZER AGENT
   "Elemezd a [komponens]-t:
    - Code smell-ek?
    - Duplikáció?
    - Fájlméret (max 300 sor)?
    - Komplexitás?"

2. ARCHITECT AGENT
   "Tervezd meg a refactor-t:
    - Mi kerüljön külön service-be?
    - Milyen helper function-ök kellenek?"

3. IMPLEMENTER AGENT
   "Hajtsd végre a refactor-t lépésről lépésre"

4. PERFORMANCE AGENT (ha szükséges)
   "Ellenőrizd:
    - Bundle size változás?
    - Change detection optimális?
    - Lazy loading működik?"
```

---

## 🎯 MASTER PROMPT SABLON

```markdown
## Feladat
[Rövid leírás]

## Kontextus
- Érintett fájlok: [lista]
- Kapcsolódó service-ek: [lista]

## Követelmények
- [ ] TypeScript strict (no any)
- [ ] Cleanup pattern (takeUntil)
- [ ] Error handling
- [ ] Input validation (IPC)
- [ ] Magyar UI szövegek

## Workflow
1. Olvasd be az érintett fájlokat
2. Tervezd meg a megoldást (ARCHITECT)
3. Implementáld (IMPLEMENTER)
4. Spawolj REVIEWER subagent-et
5. Javítsd a review alapján
6. [Ha IPC érintett] Spawolj SECURITY subagent-et

## Output
- Módosított fájlok listája
- Rövid összefoglaló a változásokról
```

---

## 🔒 ELECTRON SPECIFIKUS SZABÁLYOK

### IPC Biztonsági Checklist

```typescript
// ✅ KÖTELEZŐ minden IPC handler-ben:
ipcMain.handle('handler-name', async (_event, params) => {
  // 1. Típus validáció
  if (typeof params.key !== 'string') {
    return { success: false, error: 'Invalid params' };
  }

  // 2. Hossz/méret limit
  if (params.key.length > 100) {
    return { success: false, error: 'Key too long' };
  }

  // 3. try/catch + logging
  try {
    // ... logika
    return { success: true, data };
  } catch (error) {
    log.error('Handler failed:', error);
    captureMainException(error);
    return { success: false, error: 'Operation failed' };
  }
});
```

### ElectronService Használat

```typescript
// Platform check
if (this.electronService.isElectron) {
  // Desktop-only kód
}

// Cleanup pattern
private destroy$ = new Subject<void>();

ngOnInit() {
  this.electronService.darkModeChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(isDark => this.handleTheme(isDark));
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## 📱 CAPACITOR SPECIFIKUS SZABÁLYOK

```typescript
// Platform detection
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Mobile-only kód
}

if (Capacitor.getPlatform() === 'ios') {
  // iOS-only
}
```

---

## 🧪 TESZTELÉSI KÖVETELMÉNYEK

| Típus | Tool | Coverage cél |
|-------|------|--------------|
| Unit | Vitest + Testing Library | >80% core |
| E2E | Playwright | Kritikus flow-k |
| Visual | Storybook | Komponensek |

```bash
npm run test           # Unit tesztek
npm run test:coverage  # Coverage report
npm run e2e            # E2E tesztek
```

---

## 📚 REF MCP - DOKUMENTÁCIÓ KERESÉS

A [Ref MCP](https://ref.tools/) egy dokumentáció-kereső szerver ami segít:
- ✅ Pontos, naprakész API dokumentációt találni
- ✅ Nem létező API-k kitalálása helyett a valódit használni
- ✅ Token-hatékonyan (csak releváns részek)

### Mikor Használd?

| Helyzet | Ref MCP Parancs |
|---------|-----------------|
| Angular API | `ref_search_documentation("angular signal")` |
| Angular Material | `ref_search_documentation("angular material dialog")` |
| RxJS operátor | `ref_search_documentation("rxjs switchMap")` |
| Electron API | `ref_search_documentation("electron ipcMain")` |
| Laravel | `ref_search_documentation("laravel eloquent relationship")` |
| Capacitor | `ref_search_documentation("capacitor push notifications")` |
| Konkrét URL | `ref_read_url("https://angular.io/api/...")` |

### Példák

```
# Új Angular feature
ref_search_documentation("angular 17 standalone component signals")

# Material komponens használat
ref_search_documentation("angular material mat-table pagination")

# RxJS pattern
ref_search_documentation("rxjs combineLatest vs forkJoin difference")

# Electron specifikus
ref_search_documentation("electron contextBridge exposeInMainWorld")

# Laravel API
ref_search_documentation("laravel policy authorization")
```

### ⚠️ FONTOS SZABÁLY

```
NE TALÁLJ KI API-T!

❌ ROSSZ: "Szerintem van egy useSignal() hook..."
✅ JÓ: ref_search_documentation("angular signal") → dokumentáció alapján

❌ ROSSZ: "A mat-table-nek biztosan van pagination inputja..."
✅ JÓ: ref_search_documentation("angular material table pagination") → pontos API

Ha bizonytalan vagy → MINDIG keresd meg a dokumentációt!
```

---

## 📂 PROJEKT FÁJLOK REFERENCIA

### Workflow & Agent Fájlok

| Fájl | Leírás | Mikor olvasd |
|------|--------|--------------|
| `CLAUDE.md` | Fő projekt kontextus + workflow | MINDIG |
| `COMPONENT_REGISTRY.md` | Komponens/service katalógus | Új komponens előtt |
| `PROJECT_INDEX.json` | Gépi projekt struktúra | Kereséshez |
| `LESSONS_LEARNED.md` | Gyakori hibák + megoldások | Tanulságokért |
| `.claude/AGENTS.md` | Agent prompt sablonok | Subagent spawoláshoz |
| `.claude/WORKFLOWS.md` | Workflow példák | Komplex feladatokhoz |

### Smart Context Fájlok

| Fájl | Mikor töltsd be |
|------|-----------------|
| `.claude/context/electron.md` | Electron/IPC feladat |
| `.claude/context/ui-components.md` | UI komponens |
| `.claude/context/api.md` | API/HTTP hívás |
| `.claude/context/forms.md` | Űrlap/Form |

### Workflow Összefoglaló

```
📋 TELJES WORKFLOW (>20 sor változás)

0.   REGISTRY CHECK       → COMPONENT_REGISTRY.md + LESSONS_LEARNED.md
0.25 IMPACT ANALYSIS      → Ha meglévőt módosítasz (IMPACT ANALYZER agent)
0.5  ELŐRETEKINTŐ TERV    → Ha új komponens kell
1.   MEGÉRTÉS             → Fájlok beolvasása
1.5  REF MCP              → Dokumentáció keresés
2.   TERVEZÉS             → Terv készítés
3.   IMPLEMENTÁCIÓ        → Kód írás
4.   REVIEW               → REVIEWER subagent (AUTO!)
5.   JAVÍTÁS              → Review alapján
6.   SECURITY             → Ha IPC/auth érintett
6.5  VISUAL SMOKE TEST    → Ha UI változott (Claude in Chrome)
6.75 PERFORMANCE CHECK    → Ha nagy változás
7.   POST-IMPLEMENTATION  → Registry/Lessons frissítés
8.   ÖSSZEGZÉS            → Módosított fájlok + Clockify becslés

⚡ GYORS MÓD (<20 sor): Skip 0-2, 4-7 → Csak implementálj!
```

## ACE Learned Strategies

<!-- ACE:START - Do not edit manually -->
skills[2	]{id	section	content	helpful	harmful	neutral}:
  angular_dialog_patterns-00001	angular_dialog_patterns	Place Angular dialogs outside page-card containers for backdrop-filter	1	0	0
  tooling_workarounds-00002	tooling_workarounds	Use ace-learn --lines N flag after /resume sessions	1	0	0
<!-- ACE:END -->
