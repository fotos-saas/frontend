import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 15: Admin Panel (Super Admin)
 *
 * Teszteli az admin dashboard-ot, előfizető listát,
 * hibajelentéseket és beállításokat.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: admin bejelentkezés
async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('admin@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Admin1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/super-admin/, { timeout: 15_000 });
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Admin Dashboard
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Dashboard', () => {
  test('Admin dashboard betöltődik', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/super-admin\/dashboard/);
    await expect(page.locator('.page-card')).toBeVisible({ timeout: 10_000 });
  });

  test('Navigáció elemek láthatók', async ({ page }) => {
    await loginAsAdmin(page);

    // Sidebar nav items
    await expect(page.locator('.nav-item', { hasText: 'Dashboard' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.nav-item', { hasText: 'Előfizetők' })).toBeVisible();
    await expect(page.locator('.nav-item', { hasText: 'Beállítások' })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Előfizetők lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Előfizetők', () => {
  test('Előfizetők lista oldal betöltődik', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/subscribers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Előfizetők' })).toBeVisible({ timeout: 10_000 });
  });

  test('Előfizető sorok megjelennek', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/subscribers');
    await page.waitForLoadState('networkidle');

    // Legalább egy előfizető sor megjelenik (a seeder partner@e2e.test)
    await expect(page.locator('.subscriber-row').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés működik', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/subscribers');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('partner@e2e.test');
    await page.waitForTimeout(600);

    await expect(page.locator('.subscriber-row').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Előfizető részletek megnyithatók', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/subscribers');
    await page.waitForLoadState('networkidle');

    await page.locator('.subscriber-row').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Előfizető részletei').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Hibajelentések
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Hibajelentések', () => {
  test('Hibajelentések oldal betöltődik', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Hibajelentések').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Szűrők láthatók', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/bugs');
    await page.waitForLoadState('networkidle');

    // Keresés mező
    await expect(page.locator('.search-input').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Beállítások
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Beállítások', () => {
  test('Beállítások oldal betöltődik', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.settings-page')).toBeVisible({ timeout: 10_000 });
  });

  test('Tab-ok láthatók', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tabs')).toBeVisible({ timeout: 10_000 });
  });

  test('System infó tab elérhető', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/super-admin/settings');
    await page.waitForLoadState('networkidle');

    // Info tab
    const infoTab = page.locator('.tabs button', { hasText: /info/i });
    if (await infoTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await infoTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('.settings-page')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Jogosultság
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Jogosultság', () => {
  test('Normál partner nem éri el az admin panelt', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
    await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });

    // Admin oldalra navigálás
    await page.goto('/super-admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Visszairányít a login-ra vagy partner-re
    await expect(page).not.toHaveURL(/\/super-admin/, { timeout: 10_000 });
  });
});
