# E2E Tesztek - Gyors Kezdés

## 1️⃣ Telepítés

```bash
npm install @playwright/test
npx playwright install
```

## 2️⃣ Futtatás

### Ajánlott: Interaktív UI (fejlesztés közben)
```bash
# Terminal 1: Dev server
npm run start

# Terminal 2: E2E tesztek UI-val
npm run e2e:ui
```

### CI/CD (automata)
```bash
npm run e2e
```

### Debuggolás
```bash
npm run e2e:debug
```

## 3️⃣ Projekt Struktúra

```
e2e/
├── pages/              # Page Object Models
│   └── home.page.ts
├── fixtures/           # Test adatok és helper-ek
│   ├── test-data.fixture.ts
│   ├── api.fixture.ts
│   └── auth.fixture.ts
├── tests/              # E2E teszt suite-ok
│   └── home.spec.ts
└── README.md
```

## 4️⃣ Tesztek Írása

### Template
```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Feature', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('cselekvés eredménye ellenőrzése', async () => {
    await homePage.openScheduleDialog();
    await expect(homePage.scheduleReminderDialog).toBeVisible();
  });
});
```

## 5️⃣ Page Object Használat

```typescript
// HomePage elemei
homePage.schoolName;           // <h1 class="hero__school">
homePage.shareButton;          // Share gomb
homePage.editContactButton;    // Kontakt edit gomb
homePage.scheduleActionButton; // Fotózás időpont gomb

// HomePage metódusai
await homePage.goto();                      // Oldal megnyitása
await homePage.getSchoolName();             // Iskola név lekérése
await homePage.openScheduleDialog();        // Dialog megnyitása
await homePage.getPhotoDate();              // Fotózás dátum lekérése
await homePage.isTemplateChooserVisible();  // Card látható?
```

## 6️⃣ Selectorok - Best Practices

### ✅ Preferált
```typescript
// Role-based (accessibility)
page.getByRole('button', { name: 'Megosztás' })

// CSS class
page.locator('.schedule__card')

// Test ID (ha van)
page.locator('[data-testid="schedule-button"]')
```

### ❌ Elkerülendő
```typescript
// XPath (lassú, törékeny)
page.locator('xpath=//button[text()="..."]')

// Index-based (véletlen)
page.locator('button').nth(5)

// Teljes szöveg (i18n problémák)
page.locator('text=Megosztás')
```

## 7️⃣ Assertions

```typescript
// Elem látható
await expect(element).toBeVisible();

// Elem nem látható
await expect(element).not.toBeVisible();

// Szöveg tartalom
await expect(element).toContainText('szöveg');

// Attribute érték
await expect(element).toHaveAttribute('href', 'https://...');

// Classname
await expect(element).toHaveClass('active');

// Enabled/disabled
await expect(button).toBeEnabled();
await expect(input).toBeDisabled();

// Csekk
await expect(checkbox).toBeChecked();

// Focal (keyboard accessibility)
await expect(button).toBeFocused();
```

## 8️⃣ Intarakcióók

```typescript
// Kattintás
await button.click();

// Szöveg beírása
await input.fill('szöveg');

// Fokusz
await input.focus();

// Hover
await element.hover();

// Keyboard
await page.keyboard.press('Enter');

// Select dropdown
await select.selectOption('option-value');

// Check/uncheck
await checkbox.check();
await checkbox.uncheck();
```

## 9️⃣ Waiting

```typescript
// Element megjelenésére vár
await element.waitFor({ state: 'visible' });

// Text megjelenésére vár
await page.waitForFunction(() => {
  return document.body.innerText.includes('szöveg');
});

// Navigation
await page.waitForURL('/expected-path');

// Request
await page.waitForResponse(url => url.includes('/api/'));
```

## 🔟 Debuggolás

```bash
# Inspector elindítása
npm run e2e:debug

# Screenshot készítése
await page.screenshot({ path: 'debug.png' });

# Pause
await page.pause();

# Console
const result = await page.evaluate(() => {
  return document.title;
});

# Network
const requests = await page.waitForResponse(url =>
  url.includes('/api/')
);
```

## 📋 API Mocking (Future)

```typescript
import { createApiFixture } from '../fixtures/api.fixture';
import { mockProjectData } from '../fixtures/test-data.fixture';

test('test with mock API', async ({ page }) => {
  const api = createApiFixture(page);
  await api.mockGetProject(mockProjectData.complete);

  await page.goto('/');
  await expect(page.locator('.hero__school')).toHaveText('Iskola');
});
```

## 🔐 Auth Session (Future)

```typescript
import { createAuthFixture, mockAuthSessions } from '../fixtures/auth.fixture';

test('authenticated user', async ({ page }) => {
  const auth = createAuthFixture(page);
  await auth.setSession(mockAuthSessions.valid);

  await page.goto('/');
  // User bejelentkezett
});
```

## 📊 Report Megtekintése

```bash
# HTML report
npx playwright show-report

# Trace fájl lejátszása
npx playwright show-trace test-results/trace.zip
```

## 🚀 CI Pipeline (GitHub Actions)

```yaml
name: E2E Tests
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🆘 Gyakori Problémák

### ❌ "TimeoutError: waiting for selector"
```typescript
// ✅ Megoldás: Hosszabb timeout
await element.waitFor({ timeout: 5000 });

// Vagy: Ellenőrizd, hogy létezik-e az elem
try {
  await element.waitFor({ state: 'visible', timeout: 2000 });
} catch {
  console.log('Element nem találva');
}
```

### ❌ "Failed: connecting to 127.0.0.1:4205"
```bash
# ✅ Megoldás: Dev server futtatása
npm run start

# Vagy: Port módosítása
# playwright.config.ts:
baseURL: 'http://localhost:4206'
```

### ❌ "Page crashed"
```typescript
// ✅ Megoldás: Async/await helyesen
// Nem: page.goto('/'); (no await)
// Igen: await page.goto('/');

// Network isolation
await context.setExtraHTTPHeaders({
  'User-Agent': 'Playwright'
});
```

### ❌ "Selector nem talál elemet"
```bash
# ✅ Debug módban IntelliSense selector pick
npm run e2e:debug

# Ctrl+Shift+O : Locate tool
# Elem kattintás → selector generálódik
```

## 📚 Dokumentáció

- **Full Guide**: `/e2e/README.md`
- **Setup Details**: `/PLAYWRIGHT_SETUP.md`
- **Playwright Docs**: https://playwright.dev

## 📝 Parancsok Röviden

```bash
npm run start           # Dev server (4205)
npm run e2e             # Headless tesztek
npm run e2e:ui          # Interaktív UI (ajánlott)
npm run e2e:headed      # Valódi böngészőben
npm run e2e:debug       # Inspector-ral
```

## ✅ Checklist - Első Teszt

- [ ] `npm install @playwright/test`
- [ ] `npx playwright install`
- [ ] `npm run start` futtatása
- [ ] `npm run e2e:ui` futtatása másik terminálban
- [ ] Browser megnyílik, teszt fut
- [ ] Sikeresen! ✨

---

**Verzig**: 1.0 | **Última frissítés**: 2026-01-09
