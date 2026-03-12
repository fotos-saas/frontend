import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 10: Iskola kezelés (School Management)
 *
 * Teszteli az iskola lista betöltését, új iskola létrehozást,
 * szerkesztést, keresést, részletek oldalt és törlést.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  seededProjectId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;

  // Projekt + iskola seedelése (ez az iskola nem törölhető mert van projektje)
  const result = await api.seedProject({
    partnerId: state.partnerId!,
    schoolName: 'Seeder Iskola Pécs',
    schoolCity: 'Pécs',
    projectName: 'Iskola Teszt Projekt',
    classNames: ['12.A'],
    studentsPerClass: 3,
    classYear: '2025-2026',
  });
  state.seededProjectId = result.project_id;
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés + navigálás az iskolákhoz
async function goToSchools(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });
  await page.goto('/partner/projects/schools');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Iskolák', exact: true })).toBeVisible({ timeout: 10_000 });

  // Guided Tour bezárása ha megjelenik
  const skipBtn = page.getByRole('button', { name: /kihagyás/i });
  if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }

  // Évszám szűrő törlése (clear-all gomb) — hogy projekt nélküli iskolák is megjelenjenek
  const clearAllBtn = page.locator('app-expandable-filters .clear-all-btn');
  if (await clearAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await clearAllBtn.click();
    await page.waitForTimeout(500);
  }
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Iskola lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Lista', () => {
  test('Iskola lista oldal betöltődik', async ({ page }) => {
    await goToSchools(page);
    await expect(page.getByRole('heading', { name: 'Iskolák', exact: true })).toBeVisible();
  });

  test('Seeder iskola megjelenik a listában', async ({ page }) => {
    await goToSchools(page);
    await expect(page.getByText('Seeder Iskola Pécs').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Új iskola gomb látható', async ({ page }) => {
    await goToSchools(page);
    await expect(page.locator('.header-actions').getByRole('button', { name: /új iskola/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Iskola létrehozás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új iskola modal megnyílik', async ({ page }) => {
    await goToSchools(page);
    await page.locator('.header-actions').getByRole('button', { name: /új iskola/i }).click();

    await expect(page.getByText('Új iskola').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('ps-input[name="name"]')).toBeVisible();
  });

  test('Iskola létrehozható', async ({ page }) => {
    await goToSchools(page);
    await page.locator('.header-actions').getByRole('button', { name: /új iskola/i }).click();
    await expect(page.getByText('Új iskola').first()).toBeVisible({ timeout: 5_000 });

    await page.locator('ps-input[name="name"] input').fill('E2E Teszt Gimnázium');
    await page.locator('ps-input[name="city"] input').fill('Szeged');

    await page.getByRole('button', { name: /létrehozás/i }).click();

    // Modal bezárul
    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });

    // Az iskola megjelenik a listában
    await expect(page.getByText('E2E Teszt Gimnázium').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Keresés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Keresés', () => {
  test('Keresés névvel működik', async ({ page }) => {
    await goToSchools(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Iskola');
    await page.waitForTimeout(600);

    await expect(page.getByText('Seeder Iskola Pécs').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés törlése visszaadja a teljes listát', async ({ page }) => {
    await goToSchools(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Iskola');
    await page.waitForTimeout(600);
    await expect(page.getByText('Seeder Iskola Pécs').first()).toBeVisible({ timeout: 10_000 });

    // Törlés
    await searchInput.clear();
    await page.waitForTimeout(600);

    // A többi iskola is megjelenik
    await expect(page.getByText('E2E Teszt Gimnázium').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Szerkesztés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szerkesztés', () => {
  test('Iskola szerkesztés modal megnyílik', async ({ page }) => {
    await goToSchools(page);

    await expect(page.getByText('E2E Teszt Gimnázium').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.school-row, .list-row', { hasText: 'E2E Teszt Gimnázium' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();

    await expect(page.getByText('Iskola szerkesztése').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Iskola módosítható', async ({ page }) => {
    await goToSchools(page);

    await expect(page.getByText('E2E Teszt Gimnázium').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.school-row, .list-row', { hasText: 'E2E Teszt Gimnázium' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();
    await expect(page.getByText('Iskola szerkesztése').first()).toBeVisible({ timeout: 5_000 });

    const nameInput = page.locator('ps-input[name="name"] input');
    await nameInput.clear();
    await nameInput.fill('E2E Módosított Gimnázium');

    await page.locator('app-dialog-wrapper').getByRole('button', { name: /^mentés$/i }).click();

    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText('E2E Módosított Gimnázium').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Iskola részletek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Részletek', () => {
  test('Iskola részletek oldal megnyitható', async ({ page }) => {
    await goToSchools(page);

    // Kattintás az iskola nevére (a school-info linkre)
    const schoolLink = page.locator('.school-row .school-info a, .school-row .school-name a', { hasText: 'Seeder Iskola Pécs' }).first();
    // Ha nincs link, használjuk az iskola nevét
    const clickTarget = await schoolLink.isVisible({ timeout: 3_000 }).catch(() => false)
      ? schoolLink
      : page.getByText('Seeder Iskola Pécs').first();
    await clickTarget.click();
    await page.waitForLoadState('networkidle');

    // Részletek oldal betöltődik
    await expect(page.getByText('Seeder Iskola Pécs').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Vissza')).toBeVisible();
  });

  test('Iskola statisztikák megjelennek', async ({ page }) => {
    await goToSchools(page);
    const schoolLink = page.locator('.school-row .school-info a, .school-row .school-name a', { hasText: 'Seeder Iskola Pécs' }).first();
    const clickTarget = await schoolLink.isVisible({ timeout: 3_000 }).catch(() => false)
      ? schoolLink
      : page.getByText('Seeder Iskola Pécs').first();
    await clickTarget.click();
    await page.waitForLoadState('networkidle');

    // Statisztika blokk
    await expect(page.getByText('Projekt').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 6: Törlés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 6: Törlés', () => {
  test('Projekt nélküli iskola törölhető', async ({ page }) => {
    await goToSchools(page);

    await expect(page.getByText('E2E Módosított Gimnázium').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.school-row, .list-row', { hasText: 'E2E Módosított Gimnázium' }).first();
    await row.locator('button[mattooltip="Törlés"]').click();

    // Megerősítő dialog
    await expect(page.getByText('iskola törlése', { exact: false })).toBeVisible({ timeout: 5_000 });
    await page.locator('app-confirm-dialog').getByRole('button', { name: 'Törlés' }).click();

    // Az iskola eltűnik
    await expect(page.locator('.school-row, .list-row', { hasText: 'E2E Módosított Gimnázium' })).toBeHidden({ timeout: 10_000 });
  });

  test('Projektes iskola törlés gombja inaktív', async ({ page }) => {
    await goToSchools(page);

    await expect(page.getByText('Seeder Iskola Pécs').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.school-row, .list-row', { hasText: 'Seeder Iskola Pécs' }).first();
    // A törlés gomb disabled ha van projekt
    await expect(row.locator('button[mattooltip="Törlés"]')).toBeDisabled();
  });
});
