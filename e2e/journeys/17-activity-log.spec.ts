import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 17: Tevékenységnapló (Activity Log)
 *
 * Teszteli a tevékenységnapló oldalt, tab váltást,
 * szűrőket és az összesítő nézetet.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés
async function loginAsPartner(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });

  // Guided Tour bezárása ha megjelenik
  const skipBtn = page.getByRole('button', { name: /kihagyás/i });
  if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Oldal betöltés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Betöltés', () => {
  test('Tevékenységnapló oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.activity-log')).toBeVisible({ timeout: 10_000 });
  });

  test('Tab navigáció látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tabs-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.tab-btn').first()).toBeVisible();
  });

  test('Részletes tab alapértelmezett', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tab-btn--active')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.tab-btn--active')).toContainText(/részletes/i);
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Részletes tab
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Részletes tab', () => {
  test('Részletes nézet tartalom betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    // Vagy lista sorok, vagy üres állapot jelenik meg
    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('Szűrő sáv látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    // SmartFilterBar vagy egyszerű szűrő
    const hasFilterBar = await page.locator('app-smart-filter-bar').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasDateFilter = await page.locator('.date-filter-btn').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasFilterBar || hasDateFilter).toBeTruthy();
  });

  test('Dátum szűrő gomb látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.date-filter-btn')).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Összesítő tab
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Összesítő tab', () => {
  test('Összesítő tab-ra váltás működik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await page.locator('.tab-btn', { hasText: /összesítve|összesítő/i }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.tab-btn--active')).toContainText(/összesítve|összesítő/i);
  });

  test('Összesítő kártyák megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log?tab=summary');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.summary-cards')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.summary-card').first()).toBeVisible();
  });

  test('Összesítő tartalom betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log?tab=summary');
    await page.waitForLoadState('networkidle');

    // Vagy projekt sorok, vagy üres állapot
    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Tab váltás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Navigáció', () => {
  test('Visszaváltás Részletes tab-ra', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log?tab=summary');
    await page.waitForLoadState('networkidle');

    await page.locator('.tab-btn', { hasText: /részletes/i }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.tab-btn--active')).toContainText(/részletes/i);
  });

  test('URL query param frissül tab váltáskor', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/activity-log');
    await page.waitForLoadState('networkidle');

    await page.locator('.tab-btn', { hasText: /összesítve|összesítő/i }).click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/tab=summary/);
  });
});
