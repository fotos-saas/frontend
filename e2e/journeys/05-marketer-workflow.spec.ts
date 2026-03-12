import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 5: Marketinges/Ügyintéző workflow
 *
 * Teszteli a marketinges belépést, dashboard-ot, projekt listát,
 * iskola listát és a marketer-specifikus felületet.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  seededProjectId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Partner ID lekérés (a marketinges ugyanahhoz a partnerhez tartozik)
  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;
});

test.afterAll(async () => {
  await api.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Marketinges belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Belépés', () => {
  test('Marketinges be tud lépni', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();

    // Marketinges → /marketer/dashboard VAGY /partner/dashboard
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });
  });

  test('Partner dashboard betöltődik marketingesnek', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    // Dashboard tartalom megjelenik
    await expect(page.getByText('Üdvözöljük')).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Marketer felület
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Marketer dashboard', () => {
  test('Marketer dashboard elérhető', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    // Navigálás a marketer dashboard-ra
    await page.goto('/marketer/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard betöltődik (nem 404)
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.getByText(/irányítópult|dashboard/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Marketer navigáció elemek láthatók', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigációs menüpontok
    const nav = page.locator('nav');
    await expect(nav.getByText('Dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(nav.getByText('Projektek')).toBeVisible();
    await expect(nav.getByText('Iskolák')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Projektek kezelés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Projektek', () => {
  test('Seeder projekt létrehozás', async () => {
    // Létrehozunk egy projektet, amit a marketinges láthat
    const result = await api.seedProject({
      partnerId: state.partnerId!,
      schoolName: 'Marketinges Teszt Iskola',
      schoolCity: 'Szeged',
      projectName: 'Marketinges E2E Projekt',
      classNames: ['11.A'],
      studentsPerClass: 5,
    });
    state.seededProjectId = result.project_id;
    expect(result.project_id).toBeGreaterThan(0);
  });

  test('Marketer projekt lista betöltődik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/projects');
    await page.waitForLoadState('networkidle');

    // Projekt lista heading
    await expect(page.getByRole('heading', { name: /projektek/i, level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Seeder projekt megjelenik a listában', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/projects');
    await page.waitForLoadState('networkidle');

    // A seeder-rel létrehozott iskola megjelenik
    await expect(page.getByText('Marketinges Teszt Iskola').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Projekt részletek megnyithatók', async ({ page }) => {
    test.skip(!state.seededProjectId, 'Nincs seeded project');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/projects');
    await page.waitForLoadState('networkidle');

    // Kattintás a projektre
    await page.getByText('Marketinges Teszt Iskola').first().click();

    // Projekt részletek oldal betöltődik
    await expect(page).toHaveURL(/\/marketer\/projects\/\d+/, { timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Iskolák
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Iskolák', () => {
  test('Iskola lista betöltődik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/schools');
    await page.waitForLoadState('networkidle');

    // Iskola lista heading
    await expect(page.getByRole('heading', { name: /iskolák/i, level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Seeder iskola megjelenik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    await page.goto('/marketer/schools');
    await page.waitForLoadState('networkidle');

    // A seeder iskola megjelenik a listában
    await expect(page.getByText('Marketinges Teszt Iskola').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Kijelentkezés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Kijelentkezés', () => {
  test('Marketinges ki tud jelentkezni', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('marketer@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Marketer1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/(partner|marketer)/, { timeout: 15_000 });

    // Navigálás marketer felületre
    await page.goto('/marketer/dashboard');
    await page.waitForLoadState('networkidle');

    // Kilépés gomb a header-ben
    await page.getByRole('button', { name: 'Kijelentkezés', exact: true }).click();

    // Confirm dialog megjelenik
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: 'Kijelentkezés', exact: true }).click();

    // Login oldalra kerül
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
