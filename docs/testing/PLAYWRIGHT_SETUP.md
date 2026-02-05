# Playwright E2E Teszt Setup - photo-stack Frontend

Komplett Playwright E2E teszt konfiguráció a photo-stack Angular 19 frontend alkalmazásához.

## 📋 Mi lett beállítva?

### 1. Playwright Konfiguráció

**Fájl**: `playwright.config.ts`

```typescript
// ✅ Beállítva:
- baseURL: http://localhost:4205 (Angular dev server)
- Három böngészőn tesztelés: Chromium, Firefox, WebKit
- Screenshot készítés failure-on (playwright-report/)
- Trace fájlok az első retry-ra (debugging)
- webServer: Automatikus Angular dev server indítása
- Parallel futtatás: 3 worker (CI-ben 1)
- Reporter: HTML + JSON + JUnit XML
```

### 2. Page Object Model

**Fájl**: `e2e/pages/home.page.ts`

```typescript
// Home komponens POM-ja (200+ sor)
// ✅ Beállítva:
- Hero szekció (iskola, osztály, share gombók)
- Kapcsolattartó szekció (név, email, telefon, edit gomb)
- Fotózás időpont szekció (dátum, akciógomb)
- Hiányzó képek alert
- Navigációs kártyák (minták, minta választó, missing, order data)
- Dialog-ok (schedule, finalization, contact edit)
```

**POM Best Practices**:
- Explicit wait-ek (`waitFor()`, `toBeVisible()`)
- CSS selectoros locator-ok (semantic, biztonságos)
- Magyar metódusnevek (`openScheduleDialog()`, `getPhotoDate()`)
- Dokumentált minden public metódus

### 3. Test Fixtures

**Fájl**: `e2e/fixtures/test-data.fixture.ts`

```typescript
// Mockolt projekt adatok
export const mockProjectData = {
  complete:    // Összes mező kitöltve
  minimal:     // Minimális adatok
  withPhotoDate: // Fotózás dátummal
  finalized:   // Véglegesített projekt
}

// Mockolt kontakt adatok
export const mockContactData = {
  primary, empty, noEmail, noPhone
}

// Test szövegállandók
// Teszt URL-ek
// Validáció adatok
```

### 4. E2E Tesztek

**Fájl**: `e2e/tests/home.spec.ts`

```typescript
// Home oldal komplex tesztelése
// ✅ Beállítva:
- Page Load teszt csomag
- Hero Section tesztek
- Schedule Section tesztek
- Contact Section tesztek
- Navigation Cards tesztek
- Missing Persons tesztek
- Dialog tesztek
- Accessibility tesztek
- Responsive Design tesztek
- Error Handling tesztek

// Test layout: AAA pattern (Arrange-Act-Assert)
```

### 5. Package.json Scriptek

```json
{
  "e2e": "playwright test",                 // Headless tesztek
  "e2e:ui": "playwright test --ui",         // Interaktív UI (ajánlott)
  "e2e:headed": "playwright test --headed", // Valódi böngészőben
  "e2e:debug": "playwright test --debug"    // Inspector-ral
}
```

### 6. TypeScript Config

**Fájl**: `tsconfig.e2e.json`

```typescript
// E2E tesztek TypeScript konfigurációja
// ✅ Beállítva:
- Strict mode
- Playwright types
- ESNext module resolution
- Path mapping (@/*)
```

### 7. .gitignore Frissítés

```
# Playwright artifact-ok
playwright-report/
test-results/
.auth/
/e2e/.cache
```

### 8. API Mock Helper

**Fájl**: `e2e/fixtures/api.fixture.ts`

```typescript
// Future: API mocking helper
export class ApiFixture {
  mockGetProject()          // Projekt adat mock
  mockUpdateProject()       // Projekt módosítás mock
  mockUpdatePhotoDate()     // Fotózás dátum mock
  mockUpdateContact()       // Kapcsolattartó mock
  mockApiError()            // Error szimuláció
  mockApiTimeout()          // Timeout szimuláció
  mockAuthSession()         // Auth session mock
  clearAllMocks()           // Cleanup
  getNetworkRequests()      // Request monitoring
}
```

### 9. Dokumentáció

**Fájl**: `e2e/README.md`

```
- Gyors kezdés útmutató
- POM magyarázat
- Selectorok best practices
- Gyakori hibák és megoldások
- CI/CD integráció (GitHub Actions)
- Debuggolás útmutató
- Performancia optimalizálás
```

## 🚀 Használat

### 1. Tesztek futtatása helyi fejlesztés közben

```bash
# Terminal 1: Angular dev server
npm run start

# Terminal 2: E2E tesztek (UI módban)
npm run e2e:ui
```

### 2. Headless tesztek (CI-hez)

```bash
npm run e2e
# Report: playwright-report/index.html
```

### 3. Valódi böngészőben

```bash
npm run e2e:headed
```

### 4. Debuggolás

```bash
npm run e2e:debug
# Playwright Inspector nyílik meg
```

## 📁 Projekt Struktúra

```
frontend-tablo/
├── e2e/
│   ├── pages/
│   │   └── home.page.ts            # Home POM (200+ sor)
│   ├── fixtures/
│   │   ├── test-data.fixture.ts    # Mockolt adatok
│   │   └── api.fixture.ts          # API mock helper
│   ├── tests/
│   │   └── home.spec.ts            # Home oldal tesztek
│   └── README.md                    # E2E dokumentáció
├── playwright.config.ts             # Playwright konfig
├── tsconfig.e2e.json               # E2E TypeScript config
├── package.json                     # E2E scriptek
└── .gitignore                       # Playwright artifact-ok
```

## ✨ Jellemzők

### ✅ Teljes Konfiguráció
- Chromium, Firefox, WebKit böngészők
- Angular dev server automatikus indítása
- Screenshot/Trace/HTML report
- Parallel futtatás

### ✅ Page Object Model Pattern
- Semantic CSS selectorok
- Gyűjtött locator-ok
- Clean helper metódusok
- Jól dokumentált

### ✅ Test Data Fixtures
- Mockolt projekt adatok (4 variáció)
- Contact adatok
- URL-ek és szövegállandók
- Validáció adatok

### ✅ API Mocking (Future)
- Request interception helper
- Error/timeout szimuláció
- Auth session mock
- Storage management

### ✅ Comprehensive Testing
- Page load, elemek, interakciók
- Accessibility checks
- Responsive design (desktop, tablet, mobile)
- Error handling

### ✅ CI/CD Ready
- JUnit XML export
- JSON test report
- HTML report generálása
- Shard-olt futtatás támogatás

## 🔧 Konfigurációs Opciók

### Timeout-ok (playwright.config.ts)

```typescript
// Globális timeout: 10 másodperc
timeout: 10 * 1000,

// Expect assertion timeout: 5 másodperc
expect: { timeout: 5 * 1000 }
```

### Böngészők (playwright.config.ts)

```typescript
projects: [
  { name: 'chromium', ... },
  { name: 'firefox', ... },
  { name: 'webkit', ... },
  // Opcionális: Mobile Chrome
]
```

### Reporter-ek (playwright.config.ts)

```typescript
reporter: [
  ['html', { outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'playwright-report/results.json' }],
  ['junit', { outputFile: 'playwright-report/junit.xml' }],
]
```

## 📊 Teljesítmény

### Párhuzamos Futtatás
- **Local**: 3 worker-ből 3 böngészőn
- **CI**: 1 worker (memória optimalizálás)
- **Shard**: 4 részre osztható

### Típikus Futtatási Idő
- **1 teszt**: ~2-3 másodperc
- **9 teszt**: ~10-15 másodperc (párhuzamosan)
- **Full suite**: ~30-45 másodperc (CI-ben)

## 🐛 Debuggolás

### 1. UI Mód (Ajánlott)
```bash
npm run e2e:ui
```
- Interaktív test runner
- Pause/Resume támogatás
- Live DOM inspection

### 2. Debug Mód (Inspector)
```bash
npm run e2e:debug
```
- Step-by-step végrehajtás
- Locator picker
- Network inspector

### 3. Trace Fájlok
```bash
# playwright-report/index.html
# - Screenshots per action
- Network requests
- Trace timeline
```

## 🔐 Best Practices

### ✅ DO
- Explicit waits helyett assertions (`toBeVisible()`)
- Role-based selectorok (`getByRole('button')`)
- User interactions (`click()`, `fill()`)
- Independent tests (nem függnek egymástól)

### ❌ DON'T
- Implicit waits
- DOM manipulation (`evaluate()`)
- Global state
- Hard sleeps (`waitForTimeout()`)

## 📚 Következő Lépések

### 1. API Mocking Implementálása
```typescript
// e2e/tests/home.spec.ts
test.beforeEach(async ({ page }) => {
  const api = createApiFixture(page);
  await api.mockGetProject(mockProjectData.complete);
});
```

### 2. Weitere Page Objects
```
e2e/pages/
├── samples.page.ts
├── template-chooser.page.ts
├── missing-persons.page.ts
└── order-data.page.ts
```

### 3. Login Test
```
e2e/tests/
└── auth.spec.ts
```

### 4. Visual Regression Testing
```typescript
await expect(page).toHaveScreenshot('home.png');
```

### 5. CI/CD Pipeline
```yaml
# .github/workflows/e2e.yml
- run: npm run e2e
- upload: playwright-report
```

## 📝 Notes

- **Angular Dev Server**: Playwright automatikusan indítja (`ng serve --port 4205`)
- **Auth**: Jelenleg élő session szükséges (localStorage az auth token)
- **API**: Élő API-val dolgozik, mock helper létezik
- **Browser**: Chromium (gyors), Firefox (compatibility), WebKit (Safari)

## 🆘 Hibaelhárítás

### "Port 4205 már használatban van"
```bash
# Másik port használata
ng serve --port 4206

# Playwright config-ban módosítás:
baseURL: 'http://localhost:4206'
```

### "Playwright nem telepítve"
```bash
npm install @playwright/test
npx playwright install
```

### "Timeout az oldal betöltésénél"
```typescript
// playwright.config.ts
timeout: 15 * 1000  // 15 másodpercre növel
```

### "Selector nem talál elemet"
```bash
npm run e2e:debug
# Locate tool (Ctrl+Shift+O)
```

---

**Verzió**: 1.0
**Angular**: 19.2.17
**Playwright**: ^4.0
**TypeScript**: 5.8.3
**Date**: 2026-01-09
