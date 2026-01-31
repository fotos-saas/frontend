# Vendég E2E Tesztek - Gyors Indítás

## Telepítés

```bash
# 1. Függőségek telepítése
npm install

# 2. Playwright browsers telepítése
npx playwright install
```

## Futtatás

### Fejlesztés Közben (UI)

```bash
# Az összes vendég teszt - interaktív UI-val
npm run e2e:ui -- e2e/tests/guest-user.spec.ts

# Specifikus teszt futtatása
npm run e2e:ui -- e2e/tests/guest-user.spec.ts -g "Share Token"
```

### CI/CD (Headless)

```bash
# Az összes vendég teszt - headless módban
npm run e2e -- e2e/tests/guest-user.spec.ts

# Debug módban (lépésről lépésre)
npm run e2e:debug -- e2e/tests/guest-user.spec.ts
```

## Teszt Fájlok

| Fájl | Leírás | Tesztek |
|------|--------|---------|
| `e2e/tests/guest-user.spec.ts` | Fő test file | 33 teszt |
| `e2e/pages/guest.page.ts` | Page Objects | 4 klasz |
| `e2e/fixtures/guest.fixture.ts` | API mock-ok | Session setup |

## Tesztek Listája

```
✓ Share Token Belépés (5)
  ✓ vendég belépés sikeres share token-nel
  ✓ sikeres belépés után átirányít /samples-re
  ✓ vendég badge megjelenik a navbar-ban
  ✓ érvénytelen share token feldolgozása

✓ Vendég Korlátozások (5)
  ✓ minta választó (/template-chooser) NEM elérhető vendégnek
  ✓ template-chooser link NEM látszik a navbar-ban vendégnek
  ✓ véglegesítés link NEM látszik a navbar-ban vendégnek
  ✓ vendég csak az elérhető menüpontokat látja
  ✓ kapcsolattartó módosítás NEM elérhető vendégnek

✓ Kódos Belépés vs Vendég (3)
  ✓ kódos felhasználónak NEM jelenik meg vendég badge
  ✓ kódos felhasználónak összes menüpont elérhető

✓ Navbar UI Elemek (5)
  ✓ vendég badge sárga státusszal jelenik meg
  ✓ navbar logó jól működik vendégre vonatkozóan
  ✓ kijelentkezés gomb elérhető vendégnek
  ✓ logout gombra kattintva kitörlödik a session

✓ Oldal Hozzáférés Kontroll (4)
  ✓ vendég hozzáférhet /home-hoz
  ✓ vendég hozzáférhet /samples-hez
  ✓ vendég NEM férhet hozzá /template-chooser-hez
  ✓ vendég NEM férhet hozzá /order-finalization-hez

✓ Responsive Design (4)
  ✓ vendég badge látható mobil nézetben
  ✓ vendég badge látható tablet nézetben
  ✓ vendég badge látható desktop nézetben
  ✓ mobile menüben nincsenek tiltott linkek vendégnek

✓ Accessibility (4)
  ✓ vendég badge érthető aria-label-lel
  ✓ navbar linkek keyboard navigálhatóak vendégnek
  ✓ kijelentkezés gombnak érthető label-je van

✓ Edge Cases (3)
  ✓ üres share token feldolgozása
  ✓ lejárt share token feldolgozása
  ✓ session lejárata utáni automatikus logout
```

## Gyakorlati Példák

### Egy Teszt Futtatása

```bash
# Vendég belépés teszt futtatása
npm run e2e:ui -- e2e/tests/guest-user.spec.ts -g "vendég belépés sikeres"
```

### Teszt Csoport Futtatása

```bash
# Csak Navbar UI tesztek
npm run e2e -- e2e/tests/guest-user.spec.ts -g "Navbar UI"

# Csak Responsive tesztek
npm run e2e -- e2e/tests/guest-user.spec.ts -g "Responsive"
```

### Debug Egy Tesztet

```bash
# Interactive debugger nyitása
npm run e2e:debug -- e2e/tests/guest-user.spec.ts -g "Share Token Belépés"
```

### Fejlesztés Közben

```bash
# Watch módban - automatikus újrafuttatás
npm run e2e:headed -- e2e/tests/guest-user.spec.ts
```

## Common Issues

### Problem: "Timeout waiting for selector"
```bash
# Próbáld meg az UI-val lásd mi történik:
npm run e2e:ui -- e2e/tests/guest-user.spec.ts
```

### Problem: "Cannot find module"
```bash
# Frissítsd a dependencies-eket
npm install && npx playwright install
```

### Problem: "Port 4200 már használatban van"
```bash
# Állítsd le az egyéb dev szervereket
lsof -i :4200
kill -9 <PID>
```

## Page Object Használat

```typescript
import { GuestSharePage, NavbarAccessPage } from './pages/guest.page';
import { GuestFixture } from './fixtures/guest.fixture';

test('example', async ({ page }) => {
  // Setup
  const fixture = new GuestFixture(page);
  await fixture.setupFullGuestEnvironment();

  // Belépés
  const guestPage = new GuestSharePage(page);
  await guestPage.navigateWithToken('valid-share-token');

  // Ellenőrzés
  const navbar = new NavbarAccessPage(page);
  expect(await navbar.isGuestBadgeVisible()).toBe(true);
});
```

## Fixture Használat

```typescript
import { createGuestFixture } from './fixtures/guest.fixture';

test('guest login', async ({ page }) => {
  const fixture = createGuestFixture(page);

  // Teljes setup: API mock-ok + session
  await fixture.setupFullGuestEnvironment();

  // Vagy csak API mock-ok
  await fixture.setupGuestApiMocks();

  // Vagy csak session
  await fixture.setGuestSessionLocally();
});
```

## Playwright UI Navigálás

```
1. npm run e2e:ui futtatása
2. Bal panel: tesztek listája
3. Jobb panel: browser preview
4. Lépésenkénti futtatás: "Step" gomb
5. Elemek szelektor módja: "Pick locator" gomb
6. Console: DevTools-hoz hasonló output
```

## Hasznos Parancsok

```bash
# Összes teszt futtatása
npm run e2e

# Csak vendég tesztek (UI-val)
npm run e2e:ui -- e2e/tests/guest-user.spec.ts

# Debug módban
npm run e2e:debug -- e2e/tests/guest-user.spec.ts

# Fejléces (nem headless)
npm run e2e:headed -- e2e/tests/guest-user.spec.ts

# Specifikus teszt
npm run e2e -- e2e/tests/guest-user.spec.ts -g "pattern"

# Teszt lista (nincs futtatás)
npm run e2e -- e2e/tests/guest-user.spec.ts --list
```

## HTML Report

```bash
# Teszt futtatása report generálásával
npm run e2e

# Report megnyitása böngészőben
npx playwright show-report
```

## Environment Beállítás

Szükséges a `playwright.config.ts` fájlban:

```typescript
export default defineConfig({
  webServer: {
    command: 'npm run dev',
    port: 4200,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:4200'
  }
});
```

## Tipikus Workflow

```bash
# 1. Dev szerver indítása (külön terminal)
npm run dev

# 2. Tesztek futtatása (másik terminal)
npm run e2e:ui -- e2e/tests/guest-user.spec.ts

# 3. UI-ban megfigyeled a tesztek futtatását
# 4. Ha hiba van, debug módban futtatod:
npm run e2e:debug -- e2e/tests/guest-user.spec.ts -g "sikertelen-teszt"

# 5. Kijavítod a tesztet
# 6. Újra futtatod: npm run e2e
```

## Több Böngésző Tesztelése

```bash
# playwright.config.ts-ben add hozzá:
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]

# Futtatás:
npm run e2e -- e2e/tests/guest-user.spec.ts
```

## Mobil Emulálás

```typescript
test.use({
  ...devices['iPhone 12'],
});

test('mobile test', async ({ page }) => {
  // Ez már iPhone 12 viewport-on fut
});
```

## Videó Rögzítés (Debug)

```typescript
test.use({
  video: 'on-failure'  // csak hibánál
});

// Vagy:
test.use({
  video: 'retain-on-failure'  // megmarad hibánál
});
```

## GitHub Actions CI

```yaml
- name: Run Playwright tests
  run: npm run e2e -- e2e/tests/guest-user.spec.ts

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Verzió Check

```bash
# Playwright verzió
npx playwright --version

# Node verzió
node --version

# npm verzió
npm --version
```

## Támogatás

- **Playwright Docs:** https://playwright.dev
- **E2E Guide:** `e2e/GUEST-USER-TESTS.md`
- **Issue Reports:** Készíts issue-t a GitHub repo-ban

---

**Segítség:** Ha bármi probléma van, nézd meg az `e2e/GUEST-USER-TESTS.md` hibaelhárítási szekciót!
