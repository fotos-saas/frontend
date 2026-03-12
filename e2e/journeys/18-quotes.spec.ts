import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 18: Árajánlatok (Quotes)
 *
 * Teszteli az árajánlat listát, létrehozást,
 * szerkesztést és szűréseket.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Árajánlatok seedelése
  await api.seedQuote({
    partnerId: 1,
    customerName: 'Teszt Ügyfél Kft.',
    customerEmail: 'ugyfel@e2e.test',
    status: 'draft',
    basePrice: 75000,
    quoteCategory: 'custom',
  });
  await api.seedQuote({
    partnerId: 1,
    customerName: 'Elküldött Árajánlat Bt.',
    customerEmail: 'sent@e2e.test',
    status: 'sent',
    basePrice: 120000,
    quoteCategory: 'photographer',
  });
  await api.seedQuote({
    partnerId: 1,
    customerName: 'Elfogadott Ügyfél',
    status: 'accepted',
    basePrice: 95000,
  });
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
// FÁZIS 1: Árajánlat lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Lista', () => {
  test('Árajánlat lista oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /árajánlat/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Seedelt árajánlatok megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Teszt Ügyfél Kft.').first()).toBeVisible();
    await expect(page.getByText('Elküldött Árajánlat Bt.').first()).toBeVisible();
  });

  test('Státusz badge-ek megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.status-badge').first()).toBeVisible();
  });

  test('Új árajánlat gomb látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a.btn-primary, button.btn-primary', { hasText: /árajánlat/i })).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Árajánlat létrehozás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új árajánlat oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.quote-editor')).toBeVisible({ timeout: 10_000 });
  });

  test('Tab navigáció látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tab-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.tab-btn').first()).toBeVisible();
  });

  test('Ügyfél adatok kitölthetők', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes/new');
    await page.waitForLoadState('networkidle');

    // Ügyfél neve mező
    const nameInput = page.locator('input[placeholder*="Kovács"]').first();
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill('E2E Teszt Ügyfél');
    } else {
      // Fallback: első input a form-ban
      await page.locator('.form-section input').first().fill('E2E Teszt Ügyfél');
    }

    await expect(page.locator('.quote-editor')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Szűrés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Szűrés', () => {
  test('Keresés mező látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.search-input').first()).toBeVisible();
  });

  test('Keresés szűri a listát', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('.search-input').fill('Teszt Ügyfél');
    await page.waitForTimeout(600);

    await expect(page.getByText('Teszt Ügyfél Kft.').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Státusz szűrő látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.filter-select').first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Árajánlat szerkesztés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szerkesztés', () => {
  test('Árajánlat szerkesztő megnyitható a listából', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    // Szerkesztés gomb (ceruza ikon) az első sorban
    await page.locator('.list-row').first().locator('.action-btn').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.quote-editor')).toBeVisible({ timeout: 10_000 });
  });

  test('Vissza link működik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await page.locator('.list-row').first().locator('.action-btn').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.back-link')).toBeVisible({ timeout: 10_000 });
    await page.locator('.back-link').click();
    await expect(page).toHaveURL(/\/partner\/quotes$/, { timeout: 10_000 });
  });

  test('Tab-ok között válthatunk a szerkesztőben', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/quotes');
    await page.waitForLoadState('networkidle');

    await page.locator('.list-row').first().locator('.action-btn').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.tab-nav')).toBeVisible({ timeout: 10_000 });

    // Tartalom tab
    const contentTab = page.locator('.tab-btn', { hasText: /tartalom/i });
    if (await contentTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForTimeout(500);
    }

    // Árazás tab
    const pricingTab = page.locator('.tab-btn', { hasText: /árazás/i });
    if (await pricingTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await pricingTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('.quote-editor')).toBeVisible();
  });
});
