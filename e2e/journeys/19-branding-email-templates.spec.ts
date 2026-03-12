import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 19: Márkajelzés és Email sablonok (Branding & Email Templates)
 *
 * Teszteli a branding beállítások oldalt és
 * az email sablon listát/szerkesztőt.
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
// FÁZIS 1: Márkajelzés oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Márkajelzés', () => {
  test('Márkajelzés oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/branding');
    await page.waitForLoadState('networkidle');

    // Vagy branding-page megjelenik, vagy access-denied (ha nincs aktiválva)
    const hasBranding = await page.locator('.branding-page').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasAccessDenied = await page.locator('.access-denied').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasBranding || hasAccessDenied).toBeTruthy();
  });

  test('Branding tartalom vagy access denied látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/branding');
    await page.waitForLoadState('networkidle');

    const hasBranding = await page.locator('.branding-page').isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasBranding) {
      // Branding aktív — szekciók láthatók
      await expect(page.locator('.section').first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Access denied — aktiválás gomb látható
      await expect(page.locator('.access-denied')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/aktiválás/i).first()).toBeVisible();
    }
  });

  test('Mentés gomb látható ha branding aktív', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/branding');
    await page.waitForLoadState('networkidle');

    const hasBranding = await page.locator('.branding-page').isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasBranding) {
      await expect(page.locator('button', { hasText: /mentés/i })).toBeVisible({ timeout: 10_000 });
    } else {
      // Access denied — skip test
      test.skip();
    }
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Email sablon lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Email sablonok lista', () => {
  test('Email sablon lista oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /email sablon/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Sablon sorok megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    // Vagy lista sorok, vagy üres állapot
    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('Kategória szűrő látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    // Kategória select
    const categorySelect = page.locator('.category-select, ps-select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés mező működik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('.search-input input, ps-input input').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Email sablon szerkesztő
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Email sablon szerkesztő', () => {
  test('Sablon szerkesztő megnyitható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRows) {
      // Szerkesztés gombra kattintás
      const editBtn = page.locator('.list-row .action-btn').first();
      await editBtn.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.email-template-edit')).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip();
    }
  });

  test('Szerkesztő tartalmazza a tárgy mezőt', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRows) {
      await page.locator('.list-row .action-btn').first().click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.field-input').first()).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip();
    }
  });

  test('Editor tab-ok láthatók', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRows) {
      await page.locator('.list-row .action-btn').first().click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.editor-tabs')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.editor-tab').first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Vissza gomb visszavisz a listára', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRows) {
      await page.locator('.list-row .action-btn').first().click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.back-btn')).toBeVisible({ timeout: 10_000 });
      await page.locator('.back-btn').click();
      await expect(page).toHaveURL(/\/email-templates$/, { timeout: 10_000 });
    } else {
      test.skip();
    }
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Változók panel
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Változók', () => {
  test('Változók sidebar vagy FAB látható a szerkesztőben', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/email-templates');
    await page.waitForLoadState('networkidle');

    const hasRows = await page.locator('.list-row').first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRows) {
      await page.locator('.list-row .action-btn').first().click();
      await page.waitForLoadState('networkidle');

      // Megvárjuk, hogy a szerkesztő tartalom betöltődjön (ne skeleton legyen)
      await expect(page.locator('.editor-tabs, .ql-editor, .field-input').first()).toBeVisible({ timeout: 15_000 });

      // Desktop: sidebar, Mobile: FAB
      const hasSidebar = await page.locator('.variables-column--desktop').isVisible({ timeout: 5_000 }).catch(() => false);
      const hasFab = await page.locator('.variables-fab').isVisible({ timeout: 3_000 }).catch(() => false);

      expect(hasSidebar || hasFab).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
