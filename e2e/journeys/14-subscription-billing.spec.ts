import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 14: Előfizetés és számlázás (Subscription & Billing)
 *
 * Teszteli az előfizetés áttekintés oldalt, limiteket,
 * számlázási beállításokat és a billing tab-okat.
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
// FÁZIS 1: Előfizetés áttekintés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Előfizetés áttekintés', () => {
  test('Előfizetés oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/overview');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.subscription-overview')).toBeVisible({ timeout: 10_000 });
  });

  test('Jelenlegi csomag megjelenik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/overview');
    await page.waitForLoadState('networkidle');

    // Csomag kártya látható
    await expect(page.locator('.plan-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Tárhely kártya megjelenik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/overview');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.storage-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Limit sávok megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/overview');
    await page.waitForLoadState('networkidle');

    // Legalább egy limit item létezik
    await expect(page.locator('.limit-item').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Marketplace
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Marketplace', () => {
  test('Marketplace oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/marketplace');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.marketplace-page')).toBeVisible({ timeout: 10_000 });
  });

  test('Modul kártyák megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/marketplace');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.module-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Kategória szűrők megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/marketplace');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.category-pill').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Számlázási beállítások
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Számlázás', () => {
  test('Számlázás oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/settings/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.billing-page')).toBeVisible({ timeout: 10_000 });
  });

  test('Tab navigáció látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/settings/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tabs-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.tab-btn').first()).toBeVisible();
  });

  test('Beállítások tab tartalom megjelenik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/settings/billing');
    await page.waitForLoadState('networkidle');

    // Az alapértelmezett tab (settings) tartalom betöltődik
    await expect(page.locator('.settings-section').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Számlák tab elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/settings/billing');
    await page.waitForLoadState('networkidle');

    // Számlák tab-ra kattintás
    const invoicesTab = page.locator('.tab-btn', { hasText: /szám/i });
    if (await invoicesTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await invoicesTab.click();
      await page.waitForTimeout(500);
      // Valami tartalom betöltődik (lista vagy empty state)
      await expect(page.locator('.billing-page')).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Előfizetés navigáció
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Navigáció', () => {
  test('Kiegészítők oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/addons');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.addons-page')).toBeVisible({ timeout: 10_000 });
  });

  test('Szüneteltetés oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/pause');
    await page.waitForLoadState('networkidle');

    // Az oldal betöltődik (szüneteltetés form vagy info)
    await expect(page.locator('.page-card')).toBeVisible({ timeout: 10_000 });
  });

  test('Fiók törlése oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/account');
    await page.waitForLoadState('networkidle');

    // Az oldal betöltődik (törlés info)
    await expect(page.locator('.page-card')).toBeVisible({ timeout: 10_000 });
  });
});
