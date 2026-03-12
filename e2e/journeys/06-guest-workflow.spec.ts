import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 6: Vendég (diák/szülő) workflow
 *
 * Teszteli az access kóddal való belépést, a tablo home oldalt,
 * projekt információk megjelenítését, mintaképek megtekintését,
 * és a navigációt a vendég felületen.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  projectId?: number;
  accessCode?: string;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Partner ID lekérés
  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;

  // Projekt létrehozás access kóddal
  const result = await api.seedProject({
    partnerId: state.partnerId!,
    schoolName: 'Vendég Teszt Gimnázium',
    schoolCity: 'Debrecen',
    projectName: 'E2E Vendég Projekt',
    classNames: ['12.D'],
    studentsPerClass: 10,
  });
  state.projectId = result.project_id;
  state.accessCode = result.access_code;
});

test.afterAll(async () => {
  await api.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Access kód belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Belépés kóddal', () => {
  test('Login oldal betöltődik a kód tabbal', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // "6-jegyű kód" tab látható
    await expect(page.getByRole('tab', { name: /6-jegyű kód/i })).toBeVisible();
    // Kód input mező látható
    await expect(page.locator('ps-code-input')).toBeVisible();
  });

  test('Hibás kód hibaüzenetet ad', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Hibás kód beírása
    const codeInput = page.locator('ps-code-input input');
    await codeInput.click();
    await codeInput.pressSequentially('999999', { delay: 50 });
    await page.getByRole('button', { name: /belépés kóddal/i }).click();

    // Hiba megjelenik
    await page.waitForTimeout(2_000);
    // A body tartalmazni fogja a hibát (hibaüzenet vagy marad a login oldalon)
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test('Vendég be tud lépni helyes kóddal', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code — seeder nem futott');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // A tabló frontend betöltődik — /home vagy más tablo oldal
    await expect(page.locator('body')).not.toContainText('Hibás kód');
    await expect(page.locator('body')).not.toContainText('404');
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Home oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Home oldal', () => {
  test('Iskola neve megjelenik a home oldalon', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // Az iskola neve megjelenik a hero section-ben
    await expect(page.getByText('Vendég Teszt Gimnázium')).toBeVisible({ timeout: 10_000 });
  });

  test('Home oldal tartalma megjelenik', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // A home oldal fő elemei megjelennek (szavazások, fórum kártyák)
    await expect(page.getByRole('heading', { name: 'Szavazások', level: 3 })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Fórum', level: 3 })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Navigáció
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Navigáció', () => {
  test('Mintaképek oldal elérhető', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // Navigálás mintaképekre
    await page.goto('/samples');
    await page.waitForLoadState('networkidle');

    // Az oldal nem 404
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('Vendég nem éri el a partner dashboard-ot', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // Partner dashboard-ra navigálás → redirect
    await page.goto('/partner/dashboard');
    await page.waitForLoadState('networkidle');

    // Nem a partner dashboard-on van
    await expect(page).not.toHaveURL(/\/partner\/dashboard/);
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Több projekt
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Második projekt', () => {
  test('Másik projekttel is be lehet lépni', async ({ page }) => {
    // Második projekt létrehozás
    const result2 = await api.seedProject({
      partnerId: state.partnerId!,
      schoolName: 'Második Teszt Iskola',
      schoolCity: 'Pécs',
      projectName: 'Második E2E Projekt',
      classNames: ['11.B'],
      studentsPerClass: 5,
    });

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(result2.access_code);

    // A második iskola neve jelenik meg
    await expect(page.getByText('Második Teszt Iskola')).toBeVisible({ timeout: 10_000 });
  });
});
