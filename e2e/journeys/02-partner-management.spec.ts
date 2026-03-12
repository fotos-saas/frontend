import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 2: Partner profil és beállítások
 *
 * Teszteli a partner dashboard navigációt, profil megtekintést,
 * előfizetés állapotot és beállítások oldalakat.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();
});

test.afterAll(async () => {
  await api.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Dashboard navigáció
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Dashboard navigáció', () => {
  test('Partner dashboard betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await expect(page).toHaveURL(/\/partner/);
    await expect(page.getByText('Üdvözöljük')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('E2E Partner').first()).toBeVisible();
  });

  test('Oldal menüpontok elérhetők', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    // Fő menüpontok láthatók a navigációban
    const nav = page.locator('nav');
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('Projektek')).toBeVisible();
    await expect(nav.getByText('Kapcsolatok')).toBeVisible();
    await expect(nav.getByText('Beállítások')).toBeVisible();
  });

  test('Projektek oldal betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // A main content heading-je "Projektek"
    await expect(page.getByRole('heading', { name: 'Projektek', level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Kapcsolatok oldal betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Kapcsolatok')).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Előfizetés ellenőrzés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Előfizetés', () => {
  test('Előfizetés oldal betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/subscription');
    await page.waitForLoadState('networkidle');

    // Alap csomag látszik
    await expect(page.getByText(/alap/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Iskola partner más csomaggal lép be', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('school-partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/subscription');
    await page.waitForLoadState('networkidle');

    // Iskola csomag látszik
    await expect(page.getByText(/iskola/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Beállítások
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Beállítások', () => {
  test('Beállítások oldal betöltődik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/settings');
    await page.waitForLoadState('networkidle');

    // Beállítások tartalom látszik
    await expect(page.locator('body')).not.toContainText('404');
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Kijelentkezés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Kijelentkezés', () => {
  test('Partner ki tud jelentkezni', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    // Kilépés gombra kattintás (a header-ben — aria-label "Kijelentkezés", text "Kilépés")
    await page.getByRole('button', { name: 'Kijelentkezés', exact: true }).click();

    // Confirm dialog megjelenik
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // A dialog-on belüli "Kijelentkezés" gomb
    await dialog.getByRole('button', { name: 'Kijelentkezés', exact: true }).click();

    // Login oldalra kerül
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
