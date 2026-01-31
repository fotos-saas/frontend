# Workflow Service Refactoring - God Object Split

> **Dátum:** 2026-01-25
> **Típus:** Refactoring - Single Responsibility Principle
> **Érintett:** `photo-selection/services/`

---

## 🎯 PROBLÉMA

A `tablo-workflow.service.ts` God Object volt (575 sor):
- ❌ Túl sok felelősség (SRP megsértése)
- ❌ HTTP API hívások
- ❌ Security validáció (IDOR védelem)
- ❌ State management (signals)
- ❌ Error handling
- ❌ Response mapping

---

## ✅ MEGOLDÁS - 3 Kisebb Service

### 1️⃣ `workflow-api.service.ts` (ÚJ) - HTTP Layer
**Felelősség:** Tiszta HTTP kommunikáció, semmi más!

```typescript
@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly http = inject(HttpClient);

  // 9 endpoint metódus
  loadStepData$(galleryId: number, step?: WorkflowStep): Observable<StepDataResponse>
  loadStepDataForViewing$(galleryId: number, step: WorkflowStep): Observable<StepDataResponse>
  saveClaimingSelection$(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse>
  autoSaveRetouchSelection$(galleryId: number, photoIds: number[]): Observable<AutoSaveResponse>
  autoSaveTabloSelection$(galleryId: number, photoId: number): Observable<{ message: string }>
  finalizeTabloSelection$(galleryId: number, photoId: number): Observable<{ message: string }>
  nextStep$(galleryId: number): Observable<StepDataResponse>
  previousStep$(galleryId: number): Observable<StepDataResponse>
  moveToStep$(galleryId: number, targetStep: WorkflowStep): Observable<StepDataResponse>
}
```

**NEM tartalmaz:**
- ❌ State management (signals)
- ❌ Security validáció
- ❌ Error handling
- ❌ Response mapping

---

### 2️⃣ `workflow-security.service.ts` (ÚJ) - Security Layer
**Felelősség:** IDOR védelem (Insecure Direct Object Reference)

```typescript
@Injectable({ providedIn: 'root' })
export class WorkflowSecurityService {
  private readonly authService = inject(AuthService);

  // Gallery ID validáció
  validateGalleryAccess(galleryId: number): void { throws Error }

  // Photo ID-k tisztítása (negatív/NaN/duplikáció szűrés)
  sanitizePhotoIds(photoIds: number[]): number[]

  // Single photo ID validáció
  isValidPhotoId(photoId: number): boolean
}
```

**FONTOS:**
- Minden gallery ID és photo ID validáció itt történik
- Frontend védelmi réteg (backend is validál!)
- throws Error ha nincs jogosultság

---

### 3️⃣ `tablo-workflow.service.ts` (REFAKTORÁLT) - Facade
**Felelősség:** Orchestration - kombinálja az API + Security service-eket

```typescript
@Injectable({ providedIn: 'root' })
export class TabloWorkflowService {
  private readonly apiService = inject(WorkflowApiService);
  private readonly securityService = inject(WorkflowSecurityService);

  // Minden metódus:
  // 1. Security validáció (validateGalleryAccess)
  // 2. Photo ID tisztítás (sanitizePhotoIds)
  // 3. API hívás (apiService)
  // 4. Response mapping (mapStepDataResponse)
  // 5. Error handling (handleError)
}
```

**State management NEM itt van!**
- ➡️ A `photo-selection.state.ts` kezeli!
- ➡️ A komponens frissíti a state-et a service response-ból

---

## 📁 FÁJLSTRUKTÚRA

```
frontend-tablo/src/app/features/photo-selection/services/
├── index.ts                           # Exportok (ÚJ)
├── tablo-workflow.service.ts          # Facade (REFAKTORÁLT 575→278 sor)
├── workflow-api.service.ts            # HTTP layer (ÚJ 161 sor)
├── workflow-security.service.ts       # Security layer (ÚJ 100 sor)
├── workflow-navigation.service.ts     # Navigációs helper (MEGLÉVŐ)
└── selection-queue.service.ts         # Auto-save queue (MEGLÉVŐ)
```

---

## 🔄 KOMPONENS HASZNÁLAT (NEM VÁLTOZOTT!)

```typescript
// photo-selection.component.ts
import { TabloWorkflowService } from './services/tablo-workflow.service';

// Ugyanúgy használható, mint eddig!
this.workflowService.loadStepData(galleryId).subscribe(data => {
  this.state.updateFromStepData(data);
});
```

**FONTOS:**
- Az importok NEM változtak
- A komponens API-ja UGYANAZ
- A facade ugyanúgy működik, mint előtte

---

## ✅ ELŐNYÖK

### 1. Single Responsibility Principle (SRP)
- ✅ Minden service-nek 1 felelőssége van
- ✅ Könnyebb tesztelni (unit test per service)
- ✅ Könnyebb megérteni (tiszta felelősségi körök)

### 2. Maintainability
- ✅ Kisebb fájlok (278 vs 575 sor)
- ✅ Könnyebb módosítani (ne kelljen 575 sort olvasni)

### 3. Reusability
- ✅ WorkflowSecurityService használható máshol is
- ✅ WorkflowApiService mockable unit test-ben

### 4. Testability
```typescript
// Unit test example
it('should sanitize photo IDs', () => {
  const service = new WorkflowSecurityService(mockAuthService);
  const result = service.sanitizePhotoIds([1, -1, 2, 2, NaN]);
  expect(result).toEqual([1, 2]); // Negatív, NaN, duplikáció szűrve
});
```

---

## 🎯 KÖVETKEZŐ LÉPÉSEK

1. ✅ Refactoring kész
2. ⏭️ TypeScript build ellenőrzés
3. ⏭️ Unit tesztek írása (WorkflowSecurityService)
4. ⏭️ Integration teszt (komponens + services)

---

## 📊 METRIKÁK

| Metrika | Előtte | Utána | Változás |
|---------|--------|-------|----------|
| Fájlok száma | 1 | 3 | +2 |
| Legnagyobb fájl | 575 sor | 278 sor | -51.7% |
| Felelősségek | 5 | 1/service | ✅ |
| Testability | Nehéz | Könnyű | ✅ |

---

## 🛡️ IDOR VÉDELEM (Változatlan)

A security logika **NEM VÁLTOZOTT**, csak külön service-be került!

```typescript
// Előtte (tablo-workflow.service.ts)
private validateGalleryId(galleryId: number): boolean { }

// Utána (workflow-security.service.ts)
validateGalleryAccess(galleryId: number): void { }
```

**Backend is validál!** Ez csak frontend védelmi réteg.

---

## 📚 REFERENCIÁK

- [Single Responsibility Principle (SRP)](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [God Object Anti-pattern](https://en.wikipedia.org/wiki/God_object)
- [Angular Service Best Practices](https://angular.dev/guide/di/service-overview)

---

**Refactoring by:** Claude (Sonnet 4.5)
**Review:** ✅ Kész, tesztelésre vár
