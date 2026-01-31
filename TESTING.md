# Frontend-Tablo Tesztelési Dokumentáció

## Áttekintés

A frontend-tablo projekt kétszintű tesztelési stratégiát használ:

1. **Unit tesztek** - Vitest + Angular Testing Library
2. **E2E tesztek** - Playwright

---

## Unit Tesztek (Vitest)

### Telepített csomagok

- `vitest` - Modern test runner
- `@vitest/ui` - Vitest UI dashboard
- `@analogjs/vite-plugin-angular` - Angular support Vite-hoz
- `@testing-library/angular` - Angular Testing Library
- `@testing-library/dom` - DOM Testing Library
- `jsdom` - DOM szimuláció

### Parancsok

```bash
# Tesztek futtatása (egyszeri)
npm run test

# Tesztek futtatása watch módban
npm run test:watch

# Tesztek coverage riporttal
npm run test:coverage

# Vitest UI (böngészőben)
npm run test:ui
```

### Konfiguráció

A konfiguráció a `vite.config.mts` fájlban van:

```typescript
export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,           // describe, it, expect globálisan
    environment: 'jsdom',    // DOM szimuláció
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Teszt fájl struktúra

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts    # ✅ Unit teszt
│   │   └── guards/
│   │       ├── auth.guard.ts
│   │       ├── auth.guard.spec.ts      # ✅ Unit teszt
│   │       ├── finalization.guard.ts
│   │       └── finalization.guard.spec.ts  # ✅ Unit teszt
│   └── features/
│       └── ...
├── mocks/                               # MSW mock handler-ek (E2E-hez)
│   ├── handlers.ts
│   ├── browser.ts
│   └── node.ts
└── test-setup.ts                        # Vitest setup
```

### Teszt írási minta

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', async () => {
    const promise = firstValueFrom(service.getData());

    const req = httpMock.expectOne('/api/data');
    req.flush({ data: 'test' });

    const result = await promise;
    expect(result.data).toBe('test');
  });
});
```

---

## E2E Tesztek (Playwright)

### Telepített csomagok

- `@playwright/test` - Playwright test framework
- `msw` - Mock Service Worker (API mocking böngészőben)

### Parancsok

```bash
# E2E tesztek futtatása (headless)
npm run e2e

# E2E tesztek UI módban
npm run e2e:ui

# E2E tesztek böngészővel (headed)
npm run e2e:headed

# E2E tesztek debug módban
npm run e2e:debug
```

### Konfiguráció

A konfiguráció a `playwright.config.ts` fájlban van:

```typescript
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
  },
});
```

### E2E fájl struktúra

```
e2e/
├── pages/                    # Page Object Models
│   ├── home.page.ts
│   └── login.page.ts
├── fixtures/                 # Test data és fixtures
│   ├── test-data.fixture.ts
│   ├── api.fixture.ts
│   └── auth.fixture.ts
└── tests/                    # E2E tesztek
    ├── home.spec.ts
    └── login.spec.ts
```

### Page Object Model minta

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly codeInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.codeInput = page.getByPlaceholder(/kód/i);
    this.submitButton = page.getByRole('button', { name: /belépés/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(code: string): Promise<void> {
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
```

### E2E teszt minta

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // API mock
    await page.route('**/api/auth/login-tablo-code', async (route, request) => {
      const body = request.postDataJSON();
      if (body.code === '123456') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ token: 'mock-token', project: { id: 1 } })
        });
      } else {
        await route.fulfill({ status: 401, body: '{"message": "Invalid code"}' });
      }
    });

    await loginPage.goto();
  });

  test('should login with valid code', async ({ page }) => {
    await loginPage.login('123456');
    await page.waitForURL(/\/(home|samples)/);
    expect(page.url()).not.toContain('/login');
  });
});
```

---

## MSW (Mock Service Worker)

Az MSW a `src/mocks/` mappában van konfigurálva:

- `handlers.ts` - API endpoint mock definíciók
- `browser.ts` - Böngésző környezethez (fejlesztés)
- `node.ts` - Node.js környezethez (unit tesztek, ha kell)

### MSW használata fejlesztésben (opcionális)

```typescript
// main.ts-ben (csak development módban)
import { startMockServiceWorker } from './mocks/browser';

if (!environment.production) {
  startMockServiceWorker().then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule);
  });
}
```

---

## Coverage Report

Coverage riport generálása:

```bash
npm run test:coverage
```

A riport a `coverage/` mappában lesz:
- `coverage/index.html` - HTML riport
- `coverage/lcov-report/` - LCOV formátum

---

## CI/CD Integráció

GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-tablo/package-lock.json
      - run: npm ci
        working-directory: frontend-tablo
      - run: npm run test:coverage
        working-directory: frontend-tablo

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: frontend-tablo
      - run: npx playwright install --with-deps
        working-directory: frontend-tablo
      - run: npm run e2e
        working-directory: frontend-tablo
```

---

## Best Practices

### Unit tesztek

1. **Izolált tesztek** - Minden teszt független legyen
2. **Async kezelés** - Használj `firstValueFrom()` + async/await
3. **Mock HTTP** - Használj `HttpClientTestingModule`-t
4. **AAA pattern** - Arrange, Act, Assert

### E2E tesztek

1. **Page Object Model** - Minden oldalhoz POM
2. **API mocking** - Playwright route interception
3. **Wait for** - Ne használj fix `waitForTimeout()`-ot
4. **Szelektorok** - Preferáld a `getByRole()`, `getByText()` szelektorokat

---

## Hibaelhárítás

### Zone.js hiba

Ha "Zone.js required" hiba jön:

```typescript
// test-setup.ts-ben
import 'zone.js';
```

### MSW TransformStream hiba

MSW nem működik jsdom-mal (unit tesztekben). Használj `HttpClientTestingModule`-t helyette.

### Playwright böngésző hiányzik

```bash
npx playwright install chromium
```
