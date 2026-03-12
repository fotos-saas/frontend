import { test, expect, Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { MailpitHelper } from '../helpers/mailpit.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 1: Teljes tablófolyamat
 *
 * Üres DB-ből indulva végigmegy a teljes partner → diák → szülő flow-n.
 * A tesztek SORBAN futnak és egymásra épülnek!
 */

let api: ApiHelper;
let mailpit: MailpitHelper;

// Shared state a tesztek között
const state: {
  partnerToken?: string;
  projectId?: number;
  accessCode?: string;
  schoolId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  mailpit = new MailpitHelper();
  await api.init();
  await mailpit.init();
});

test.afterAll(async () => {
  await api.dispose();
  await mailpit.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Partner belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Partner setup', () => {
  test('Partner be tud lépni', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    // Dashboard betöltődik
    await expect(page).toHaveURL(/\/partner/);
    await expect(page.getByText('Üdvözöljük')).toBeVisible({ timeout: 10_000 });
  });

  test('Partner API tokennel is be tud lépni', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    state.partnerToken = await auth.loginViaApi('partner@e2e.test', 'Partner1234!');

    expect(state.partnerToken).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Projekt létrehozás (API seeder-rel, gyorsabb)
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Projekt és diákok', () => {
  test('Projekt létrehozás seeder-rel', async () => {
    // Partner ID lekérés — a login response-ban partner_id közvetlenül a user-en
    const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
    const userData = loginResult.user as Record<string, unknown>;
    const partnerId = userData.partner_id as number;

    const result = await api.seedProject({
      partnerId,
      schoolName: 'Boronkay György Technikum',
      schoolCity: 'Vác',
      projectName: '2026 Tablófotózás',
      classNames: ['12.A', '12.B'],
      studentsPerClass: 15,
    });

    state.projectId = result.project_id;
    state.accessCode = result.access_code;
    state.schoolId = result.school_id;

    expect(state.projectId).toBeGreaterThan(0);
    expect(state.accessCode).toBeTruthy();
  });

  test('Partner látja a projektet a listában', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    // Navigálás a projekt listára
    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Projekt megjelenik a listában (az iskola neve jelenik meg a listában)
    await expect(page.getByText('Boronkay György Technikum').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Partner meg tudja nyitni a projektet', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    // Navigálás a projekt listára
    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Kattintás az első Boronkay projektre
    await page.getByText('Boronkay György Technikum').first().click();

    // Projekt részletek betöltődnek
    await expect(page).toHaveURL(/\/partner\/projects\/\d+/, { timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Vendég / képválasztó belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Vendég belépés', () => {
  test('Vendég be tud lépni a kóddal', async ({ page }) => {
    test.skip(!state.accessCode, 'Nincs access code — előző teszt nem futott');

    const auth = new AuthHelper(page, api);
    await auth.loginAsGuest(state.accessCode!);

    // Tabló frontend betöltődik
    await expect(page.locator('body')).not.toContainText('Hibás kód');
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Cross-role ellenőrzés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Jogosultság ellenőrzés', () => {
  test('Nem bejelentkezett user nem éri el a partner dashboard-ot', async ({ page }) => {
    await page.goto('/partner/projects');

    // Redirect login-ra
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
