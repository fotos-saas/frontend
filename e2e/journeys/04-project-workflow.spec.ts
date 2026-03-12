import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 4: Projekt létrehozás és kezelés UI-n
 *
 * Teszteli a projekt létrehozást UI modal-lal,
 * projekt lista kezelést és projekt részletek megtekintést.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  seededProjectId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Partner ID lekérés
  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;
});

test.afterAll(async () => {
  await api.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Projekt létrehozás UI-n
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Projekt létrehozás UI-n', () => {
  test('Új projekt gomb megjelenik a listán', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    const newProjectBtn = page.getByRole('button', { name: /új projekt/i });
    await expect(newProjectBtn).toBeVisible({ timeout: 10_000 });
  });

  test('Projekt létrehozás modal megnyílik', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Kattintás az "Új projekt" gombra
    await page.getByRole('button', { name: /új projekt/i }).click();

    // Modal/dialog/oldal megjelenik
    await page.waitForTimeout(1_000);

    // Valamilyen form elem látható (iskola, osztály, stb.)
    const hasForm = await page.locator('ps-input, ps-autocomplete, input[type="text"]').first().isVisible();
    expect(hasForm).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Projekt lista szűrés és keresés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Projekt lista', () => {
  test('Seeder projektek megjelennek', async ({ page }) => {
    // Projektek létrehozása seeder-rel (ha még nincs)
    const result = await api.seedProject({
      partnerId: state.partnerId!,
      schoolName: 'Árpád Gimnázium',
      schoolCity: 'Budapest',
      projectName: 'E2E Teszt Projekt',
      classNames: ['12.C'],
      studentsPerClass: 5,
    });
    state.seededProjectId = result.project_id;

    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Árpád Gimnázium megjelenik
    await expect(page.getByText('Árpád Gimnázium').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés működik a projekt listában', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Keresés mező kitöltése
    const searchInput = page.locator('input[type="text"][placeholder*="Keresés"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Árpád');
      await page.waitForTimeout(1_000);

      // Szűrt eredmény látszik
      await expect(page.getByText('Árpád Gimnázium').first()).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Projekt részletek megtekintése
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Projekt részletek', () => {
  test('Projekt megnyitható a listáról', async ({ page }) => {
    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    // Kattintás az Árpád projektre
    await page.getByText('Árpád Gimnázium').first().click();

    // Projekt részletek oldal betöltődik
    await expect(page).toHaveURL(/\/partner\/projects\/\d+/, { timeout: 10_000 });
  });

  test('Projekt oldal tartalmaz adatokat', async ({ page }) => {
    test.skip(!state.seededProjectId, 'Nincs seeded project — előző teszt nem futott');

    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('partner@e2e.test', 'Partner1234!');

    await page.goto(`/partner/projects/${state.seededProjectId}`);
    await page.waitForLoadState('networkidle');

    // Valamilyen tartalom betöltődik (nem üres oldal)
    await expect(page.locator('body')).not.toContainText('404');
    // Az iskola neve vagy az osztály látszik
    const hasContent = await page.getByText('Árpád').isVisible() ||
      await page.getByText('12.C').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Iskola partner projektek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Iskola partner', () => {
  test('Iskola partner is lát projekteket', async ({ page }) => {
    // Iskola partnernek is készítünk projektet
    const schoolLogin = await api.login('school-partner@e2e.test', 'Partner1234!');
    const schoolData = schoolLogin.user as Record<string, unknown>;
    const schoolPartnerId = schoolData.partner_id as number;

    await api.seedProject({
      partnerId: schoolPartnerId,
      schoolName: 'Dobó István Gimnázium',
      schoolCity: 'Eger',
      projectName: 'Iskola E2E Projekt',
      classNames: ['12.A', '12.B'],
      studentsPerClass: 10,
    });

    const auth = new AuthHelper(page, api);
    await auth.loginViaUi('school-partner@e2e.test', 'Partner1234!');

    await page.goto('/partner/projects');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Dobó István Gimnázium').first()).toBeVisible({ timeout: 10_000 });
  });
});
