# Vendég Felhasználó E2E Tesztek

Komplett tesztcsalád a vendég felhasználó (share token) flow-hoz.

## Fájl Szerkezet

```
e2e/
├── tests/
│   └── guest-user.spec.ts          # Fő teszt fájl (27 teszt)
├── pages/
│   └── guest.page.ts               # Page Object Model (4 klasz)
├── fixtures/
│   └── guest.fixture.ts            # API mock-ok és session setup
└── GUEST-USER-TESTS.md             # Ez a dokumentáció
```

## Tesztelendő Flow-k

### 1. Vendég Belépés Share Token-nel
- **Path:** `/share/{shareToken}`
- **Elvárt:** Sikeres belépés, átirányítás `/samples`-re
- **Badge:** Sárga "Vendég" badge a navbar-ban
- **Tesztek:** 5 db

### 2. Vendég Korlátozások
- **Minta Választó:** NEM elérhető (`/template-chooser`)
- **Véglegesítés:** NEM elérhető (`/order-finalization`)
- **Navbar:** Tiltott linkek rejtve vannak
- **Egyéb:** Kapcsolattartó módosítás letiltva
- **Tesztek:** 5 db

### 3. Kódos Belépés vs Vendég
- **Kódas:** `tokenType = 'code'`, `canFinalize = true`
- **Vendég:** `tokenType = 'share'`, `canFinalize = false`
- **Megkülönböztetés:** Navbar badge, elérhető linkek
- **Tesztek:** 3 db

### 4. Navbar UI Elemek
- **Badge szín:** Amber (sárga)
- **Logo navigáció:** Működik
- **Logout:** Kitörlödik a session
- **Responsive:** Mobil, tablet, desktop
- **Tesztek:** 5 db

### 5. Oldal Hozzáférés Kontroll
- **Elérhető:** `/home`, `/samples`
- **Nem elérhető:** `/template-chooser`, `/order-finalization`
- **Átirányítás:** Automatikusan `/samples`-re
- **Tesztek:** 4 db

### 6. Responsive Design
- **Mobil:** 375x667 - Vendég badge és menu
- **Tablet:** 768x1024 - Badge látható
- **Desktop:** 1280x800 - Összes elem látható
- **Tesztek:** 4 db

### 7. Accessibility
- **Aria-labels:** Badge és gomboknak
- **Keyboard nav:** Tab, Shift+Tab működik
- **Screen reader:** Érthető szövegek
- **Tesztek:** 4 db

### 8. Edge Cases
- **Üres token:** `/share/` feldolgozása
- **Lejárt token:** 401 response
- **Session lejárata:** Automatikus logout
- **Tesztek:** 3 db

## Teszt Futtatása

### Az Összes Teszt Futtatása

```bash
# Lokál futtatás (ui mód)
npx playwright test e2e/tests/guest-user.spec.ts --ui

# Headless módban (CI)
npx playwright test e2e/tests/guest-user.spec.ts

# Specifikus teszt futtatása
npx playwright test e2e/tests/guest-user.spec.ts -g "vendég belépés sikeres"

# Debug módban (lépésről-lépésre)
npx playwright test e2e/tests/guest-user.spec.ts --debug
```

### Teszt Csoportok Futtatása

```bash
# Csak share token belépés tesztek
npx playwright test guest-user.spec.ts -g "Share Token Belépés"

# Csak vendég korlátozás tesztek
npx playwright test guest-user.spec.ts -g "Vendég Korlátozások"

# Csak navbar tesztek
npx playwright test guest-user.spec.ts -g "Navbar UI Elemek"

# Csak responsive tesztek
npx playwright test guest-user.spec.ts -g "Responsive"
```

## Konfigurálás

### env Fájl (`.env` vagy `playwright.config.ts`)

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  webServer: {
    command: 'npm run dev',
    port: 4200,
    reuseExistingServer: !process.env.CI
  }
});
```

### API Mock-ok Konfigurálása

Az összes teszt az `e2e/fixtures/guest.fixture.ts`-ből beállított mock API végpontokat használja:

```typescript
// Vendég fixture setup
const fixture = new GuestFixture(page);
await fixture.setupFullGuestEnvironment();

// Kódos felhasználó setup
const fixture = new GuestFixture(page);
await fixture.setupFullCodeUserEnvironment();
```

## Page Object Model-ek

### GuestSharePage
Vendég belépés és session kezelés.

```typescript
// Share token-nel belépés
await guestPage.navigateWithToken('valid-share-token');

// Token típus ellenőrzése
const tokenType = await guestPage.getTokenType();
expect(tokenType).toBe('share');

// Session kitörlése
await guestPage.clearSession();
```

### NavbarAccessPage
Navbar linkek és hozzáférés ellenőrzés.

```typescript
// Vendég badge ellenőrzése
const isVisible = await navbar.isGuestBadgeVisible();
expect(isVisible).toBe(true);

// Tiltott linkek ellenőrzése
const hasFinalization = await navbar.isFinalizationLinkVisible();
expect(hasFinalization).toBe(false);

// Navbar linkek lekérése
const links = await navbar.getNavbarLinksText();
```

### RoutingGuardTester
Oldal hozzáférés tesztelése.

```typescript
// Ellenőrzés: Oldalhoz hozzáfér-e?
const hasAccess = await guard.canAccessPage('/samples', ['/samples']);
expect(hasAccess).toBe(true);

// Vendég korlátozások ellenőrzése
const restrictions = await guard.verifyGuestRestrictions();
expect(restrictions.canAccessTemplateChooser).toBe(false);
```

### ContactModifierTester
Kapcsolattartó szerkesztő tesztelése.

```typescript
// Ellenőrzés: Vendég nem módosíthatja
const canModify = await contactTester.verifyGuestCannotModifyContact();
expect(canModify).toBe(true);
```

## Mock API Végpontok

Az összes teszt ezeket a mock végpontokat használja:

| Végpont | Metódus | Teszt |
|---------|---------|-------|
| `/api/auth/login-tablo-share` | POST | Share token belépés |
| `/api/auth/login-tablo-code` | POST | Kódos belépés (összehasonlításhoz) |
| `/api/tablo-frontend/validate-session` | GET | Session validálás |
| `/api/samples` | GET | Minták lista |
| `/api/tablo-frontend/project-info` | GET | Projekt info |
| `/api/tablo-frontend/logout` | POST | Kijelentkezés |

## Hibaelhárítás

### "Timeout waiting for selector" Hiba

```typescript
// Probléma: Element nem jelenik meg időben
// Megoldás: Várakozási idő növelése

await page.locator('.navbar__guest-badge').waitFor({
  state: 'visible',
  timeout: 5000  // 3000 helyett 5000ms
});
```

### "Navigation URL did not match" Hiba

```typescript
// Probléma: Az oldal nem irányít át az elvárt URL-re
// Megoldás: Regexp helyett string ellenőrzés

await page.waitForURL('**/samples', { timeout: 5000 });
// Helyett:
expect(page.url()).toContain('/samples');
```

### Mock API Nem Aktiválódik

```typescript
// Probléma: Az API mock nem fog működni
// Megoldás: Setup az oldal megnyitása ELŐTT

await page.route('**/api/**', route => { ... });
// EZUTÁN:
await page.goto('/samples');
```

### "Selector resolution failed"

```typescript
// Probléma: A selector nem talál elemet
// Megoldás: Szükség szerint módosítsd a selector-t

// Próbáld ki a browser DevTools-ban:
document.querySelectorAll('.navbar__guest-badge')
```

## Debug Tippek

### 1. Screenshot Rögzítés Hibánál

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `failure-${Date.now()}.png` });
  }
});
```

### 2. Console Log Rögzítés

```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error));
```

### 3. Network Kérések Nyomon Követése

```typescript
const requests = [];
page.on('request', request => {
  if (request.url().includes('/api/')) {
    requests.push({
      url: request.url(),
      method: request.method()
    });
  }
});
```

### 4. Lokális Storage Ellenőrzése

```typescript
const storage = await page.evaluate(() => {
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    items[key] = localStorage.getItem(key);
  }
  return items;
});
console.log('LocalStorage:', storage);
```

## Teszt Pokol - Gyakori Hibák

| Hiba | Ok | Megoldás |
|------|----|---------|
| "Vendég badge nincs" | Navbar nem töltődött be | `waitForLoadState('networkidle')` |
| "Finalization link látszik" | Kódos session van beállítva | `clearSession()` majd `setGuestSessionLocally()` |
| "Session token null" | localStorage nem állított be | `setupFullGuestEnvironment()` használata |
| "Oldal nem irányít át" | Routing guard nincs | Ellenőrizd az app routing konfigot |
| "API 404 hiba" | Mock nincs regisztrálva | `setupGuestApiMocks()` futtatása előtte |

## CI/CD Integráció

### GitHub Actions

```yaml
name: E2E Tests - Guest User

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install

      - name: Start dev server
        run: npm run dev &
        env:
          PORT: 4200

      - name: Run guest user tests
        run: npx playwright test e2e/tests/guest-user.spec.ts

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Teljesítmény Célok

- **Page Load:** < 2.5s
- **API Response:** < 500ms
- **Test Execution:** < 60s per test file
- **Memory:** < 200MB per test

## Jövőbeni Fejlesztések

- [ ] E2E tesztek a képmegosztáshoz
- [ ] Teljes share link lifecycle tesztek
- [ ] Performance benchmarking
- [ ] Visual regression tesztek (Playwright Trace)
- [ ] Multi-browser tesztelés (Firefox, WebKit)
- [ ] Mobile device emulation tesztek

## Támogatás és Hozzájárulás

Ha új tesztet szeretnél hozzáadni:

1. **Page Object:** Adj hozzá új method-ot `e2e/pages/guest.page.ts`-hez
2. **Fixture:** Frissítsd `e2e/fixtures/guest.fixture.ts`-t ha új mock kell
3. **Teszt:** Új teszt `e2e/tests/guest-user.spec.ts`-ben
4. **Dokumentáció:** Ezt a fájlt frissítsd

## Verziók

- **Playwright:** ^1.40.0
- **Angular:** 20.x
- **TypeScript:** 5.x
- **Node:** 20.x+

## Licenc

MIT - Tablo Kiraly Photo Stack Project
