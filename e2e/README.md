# E2E Tesztek - Playwright

Playwright E2E teszt framework a photo-stack frontend alkalmazásához.

## Gyors Kezdés

### 1. Playwright telepítése

```bash
npm install @playwright/test
```

### 2. Angular dev server indítása

```bash
npm run start
# vagy külön terminálban:
ng serve --port 4205
```

### 3. E2E tesztek futtatása

```bash
# Headless mód (CI/CD pipeline-hoz)
npm run e2e

# UI mód (interaktív - ajánlott fejlesztéshez)
npm run e2e:ui

# Headed mód (valódi böngészőben látható)
npm run e2e:headed

# Debug mód (Playwright Inspector-ral)
npm run e2e:debug
```

## Projekt Struktúra

```
e2e/
├── pages/                       # Page Object Model-ek
│   ├── home.page.ts            # Home oldal POM
│   ├── login.page.ts           # Login oldal POM
│   └── guest.page.ts           # Vendég felhasználó POM-ek
├── fixtures/                    # Test adatok és segédfüggvények
│   ├── test-data.fixture.ts    # Alap teszt adatok
│   ├── auth.fixture.ts         # Auth session mock-ok
│   └── guest.fixture.ts        # Vendég user API mock-ok
├── tests/                       # E2E tesztek
│   ├── home.spec.ts            # Home oldal tesztek
│   ├── login.spec.ts           # Login flow tesztek
│   └── guest-user.spec.ts      # Vendég felhasználó tesztek (33 teszt)
├── GUEST-USER-TESTS.md         # Vendég tesztek dokumentáció
├── QUICK-START-GUEST.md        # Gyors indítás vendég tesztekhez
└── README.md                    # Ez a fájl
```

## Page Object Model

A POM pattern használatával teszteljük az oldalakat:

```typescript
// e2e/pages/home.page.ts
export class HomePage {
  readonly page: Page;
  readonly schoolName: Locator;
  readonly scheduleButton: Locator;

  async goto(): Promise<void> { ... }
  async getSchoolName(): Promise<string> { ... }
}
```

### Előnyei:
- **Karbantarthatóság**: Egy helyről frissíthetünk selectorokat
- **Olvashatóság**: A tesztek érthető, üzleti logika szerinti
- **Újrafelhasználhatóság**: Több teszt között megosztott elemek

## Test Fixtures

Szokásos teszt adatok a `test-data.fixture.ts`-ben:

```typescript
import { mockProjectData } from '../fixtures/test-data.fixture';

test('test name', async () => {
  // Projekt adatok
  const project = mockProjectData.complete;
  const contact = mockProjectData.complete.contacts[0];
});
```

## API Mocking (Future)

Jelenleg a tesztek élő API-val dolgoznak. A mocking implementálásához:

```typescript
// e2e/tests/home.spec.ts
test.beforeEach(async ({ page }) => {
  // Route interception
  await page.route('**/api/projects/**', (route) => {
    route.abort('failed');
  });

  // Response mock
  await page.route('**/api/projects/**', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify(mockProjectData.complete),
    });
  });
});
```

## Selectors és Best Practices

### Selector Típusok (Preferencia sorrendje)

1. **Role selectors** (ajánlott - accessibility)
   ```typescript
   page.getByRole('button', { name: 'Megosztás' })
   ```

2. **CSS selectors** (modern, tiszta)
   ```typescript
   page.locator('.schedule__card')
   ```

3. **XPath** (utolsó megoldás, lassú)
   ```typescript
   page.locator('xpath=//button[@class="btn"]')
   ```

### AVOID: Data Test IDs
- Kerüljük a `data-testid` attributumokat
- A HTML szenior-tól való függést csökkenti
- Helyette: CSS classes vagy role-based selectors

## Tesztek Írása

### Template

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Feature Name', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('mit teszteljünk', async () => {
    // Elrendezés (Arrange)
    await homePage.openScheduleDialog();

    // Cselekvés (Act)
    await homePage.scheduleActionButton.click();

    // Ellenőrzés (Assert)
    await expect(homePage.scheduleReminderDialog).toBeVisible();
  });
});
```

### AAA Pattern (Arrange-Act-Assert)

1. **Arrange**: Teszt felépítése
2. **Act**: Akció végrehajtása
3. **Assert**: Eredmény ellenőrzése

## Gyakori Hibaok

### "Waiting for locator" timeout

```typescript
// ❌ ROSSZ - 30 másodperc várakozás
await homePage.element.waitFor({ timeout: 30000 });

// ✅ HELYES - Szükség szerinti timeout
await homePage.element.waitFor({ timeout: 2000 });
```

### "Page not ready"

```typescript
// ✅ HELYES - Megvárjuk, hogy az oldal betöltődjön
test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.goto();
  await homePage.waitForPageLoad();
});
```

### Network isolation

```typescript
// ✅ HELYES - Page context izolálása
test('isolated test', async ({ context }) => {
  const page = await context.newPage();
  // Ez az oldal nem érinti a többi teszt állapotát
});
```

## CI/CD Integráció

### GitHub Actions Workflow

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx playwright install
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Screenshots és Traces

### Screenshot készítés

```typescript
// Automatikus failure esetén (playwright.config.ts)
use: {
  screenshot: 'only-on-failure',
}

// Manual screenshot
await page.screenshot({ path: 'screenshot.png' });
```

### Trace fájl

```typescript
// Trace készítés replay-hez
await page.context().tracing.start({ screenshots: true });
await homePage.goto();
await page.context().tracing.stop({ path: 'trace.zip' });

// Megtekintés:
# npx playwright show-trace trace.zip
```

## Performancia Optimalizálás

### Parallel Futtatás

```bash
# 3 böngészőn párhuzamosan
npm run e2e

# Custom worker count
npx playwright test --workers 5
```

### Shard-olt Futtatás (nagy teszt suite)

```bash
# Worker 1 / 4
npx playwright test --shard 1/4

# Worker 2 / 4
npx playwright test --shard 2/4
```

## Debuggolás

### 1. UI Mód

```bash
npm run e2e:ui
```

Interaktív UI-ban futnak a tesztek, stop/resume lehetőséggel.

### 2. Debug Mód

```bash
npm run e2e:debug
```

Playwright Inspector nyit meg - step-by-step végrehajtás.

### 3. Browser Dev Tools

```typescript
// Manual pause
await page.pause();

// Screenshot szerteágazása
await page.screenshot({ path: 'debug.png' });
```

## Best Practices

### ✅ DO

- **Explicit waits**: `waitFor()` helyett `toBeVisible()`
- **User actions**: `click()`, `fill()`, nem `evaluate()`
- **Role-based selectors**: `getByRole('button')`
- **Independent tests**: Tesztek nem függenek egymástól
- **Descriptive names**: `test('felhasználó bejelentkezhet')`

### ❌ DON'T

- **Implicit waits**: Nehéz debugolni
- **Private DOM manipulation**: Nem realisztikus
- **Global state**: Teszteket instabil teszi
- **Hard sleeps**: `await page.waitForTimeout(1000)`
- **Brittle selectors**: XPath, véletlenszerű indexek

## Fájlok Szerkezete

### Új oldal tesztje

```bash
# 1. Page Object Model
e2e/pages/new-page.page.ts

# 2. Test suite
e2e/tests/new-page.spec.ts

# 3. Fixtures (szükség szerint)
e2e/fixtures/new-page.fixture.ts
```

## Útmutatók

### Login Test (Future)

```typescript
// Jelenleg a login nincs E2E-ben tesztelve
// Szükség van:
// 1. Mock API endpoint-ok
// 2. Auth state cache-ből betöltés
// 3. Session management
```

### Image Comparison (Future)

```typescript
// Visual regression tesztek
await expect(page).toHaveScreenshot('home-page.png');
```

## Hasznos Linkek

- [Playwright Dokumentáció](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Munkafolyamat

### Helyi Fejlesztés

```bash
# Terminal 1: Angular dev server
npm run start

# Terminal 2: E2E tesztek (UI módban)
npm run e2e:ui
```

### Commit Előtt

```bash
# Tesztek futtatása
npm run e2e

# Ha sikeres, commit
git add . && git commit -m "feat: ..."
```

### CI Pipeline

```bash
# GitHub Actions automatikusan futtatja
npm run e2e
# Report: playwright-report/index.html
```

## Vendég Felhasználó E2E Tesztek

### 🎯 Mit Tesztelünk?

A **vendég felhasználó** (share token alapú) flow komplett tesztelése:

1. **Share Token Belépés** - Vendég automatikus bejelentkezés
2. **Navbar Megjelenítés** - "Vendég" badge és korlátozott linkek
3. **Hozzáférés Kontroll** - Tiltott oldalakra nem lehet belépni
4. **UI Elemek** - Navbar funkciók és responsiveness
5. **Accessibility** - Keyboard nav és screen reader support

### 📊 Teszt Statisztika

| Terület | Tesztek | Status |
|---------|---------|--------|
| Share Token Belépés | 5 | ✅ |
| Vendég Korlátozások | 5 | ✅ |
| Kódos vs Vendég | 3 | ✅ |
| Navbar UI | 5 | ✅ |
| Hozzáférés Kontroll | 4 | ✅ |
| Responsive Design | 4 | ✅ |
| Accessibility | 4 | ✅ |
| Edge Cases | 3 | ✅ |
| **Összesen** | **33** | **✅** |

### 🚀 Gyors Start (Vendég Tesztek)

```bash
# 1. Dev szerver indítása
npm run dev

# 2. Vendég tesztek futtatása (UI mód)
npm run e2e:ui -- e2e/tests/guest-user.spec.ts

# 3. Specifikus teszt
npm run e2e -- e2e/tests/guest-user.spec.ts -g "Share Token"
```

### 📚 Dokumentáció

- **Részletes útmutató**: `e2e/GUEST-USER-TESTS.md`
- **Gyors indítás**: `e2e/QUICK-START-GUEST.md`
- **Page Objects**: `e2e/pages/guest.page.ts`
- **API Mock-ok**: `e2e/fixtures/guest.fixture.ts`

---

**Megjegyzés**: Ez a setup Angular 19 + Playwright 4-hez optimalizálva.
Vendég tesztek: 33 komplett E2E teszt a share token flow-hoz.
