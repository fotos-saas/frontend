import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 16: Hibajelentések (Bug Reports)
 *
 * Teszteli a hibajelentés listát, létrehozást,
 * részletezést és szűréseket.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Bug reportok seedelése
  await api.seedBugReport({
    reporterEmail: 'partner@e2e.test',
    title: 'Tabló szerkesztő nem tölt be',
    description: 'A tabló szerkesztő oldal üres marad betöltés után.',
    status: 'new',
    priority: 'high',
  });
  await api.seedBugReport({
    reporterEmail: 'partner@e2e.test',
    title: 'Képfeltöltés hibát dob',
    description: 'JPEG fájlok feltöltésekor 500-as hiba.',
    status: 'in_progress',
    priority: 'critical',
  });
  await api.seedBugReport({
    reporterEmail: 'partner@e2e.test',
    title: 'Régi megoldott hiba',
    description: 'Ez a hiba már korábban megoldódott.',
    status: 'resolved',
    priority: 'low',
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
// FÁZIS 1: Hibajelentés lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Lista', () => {
  test('Hibajelentés lista oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Hibajelentések' })).toBeVisible({ timeout: 10_000 });
  });

  test('Seedelt hibajelentések megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Tabló szerkesztő nem tölt be').first()).toBeVisible();
    await expect(page.getByText('Képfeltöltés hibát dob').first()).toBeVisible();
  });

  test('Státusz badge-ek megjelennek', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    // Legalább egy státusz badge látható
    await expect(page.locator('.cell-status .badge').first()).toBeVisible();
  });

  test('Új hibajelentés gomb látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button.btn-primary', { hasText: /hibajelentés/i })).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Hibajelentés létrehozás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új hibajelentés dialógus megnyílik és elküldhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Új hibajelentés' }).click();
    await expect(page.getByRole('dialog', { name: 'Új hibajelentés' })).toBeVisible({ timeout: 5_000 });

    // Cím kitöltése
    const dialog = page.getByRole('dialog', { name: 'Új hibajelentés' });
    await dialog.locator('ps-input input').fill('E2E teszt hibajelentés');

    // Leírás kitöltése — kattintás a Quill-re és billentyűzet gépelés
    await page.locator('.ql-editor').click();
    await page.keyboard.type('E2E tesztbol letrehozott hiba leiras', { delay: 5 });
    await page.waitForTimeout(800);

    // Bejelentés küldése gomb (engedélyezetté válik)
    await expect(page.getByRole('button', { name: 'Bejelentés küldése' })).toBeEnabled({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Bejelentés küldése' }).click();

    // Dialógus bezáródik
    await expect(page.getByRole('dialog', { name: 'Új hibajelentés' })).toBeHidden({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Hibajelentés részletek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Részletek', () => {
  test('Hibajelentés részlet oldal megnyílik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await page.locator('.list-row').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.bug-report-detail')).toBeVisible({ timeout: 10_000 });
  });

  test('Részlet oldal tartalmazza a cím és leírás szekciót', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await page.locator('.list-row').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.detail-title-row')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.detail-section').first()).toBeVisible();
  });

  test('Vissza gomb működik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await page.locator('.list-row').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.back-btn')).toBeVisible({ timeout: 10_000 });
    await page.locator('.back-btn').click();
    await expect(page).toHaveURL(/\/partner\/bugs$/, { timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Szűrés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szűrés', () => {
  test('Keresés mező látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    // Keresés input (ps-input vagy .search-input)
    const searchInput = page.locator('ps-input input').first();
    await expect(searchInput).toBeVisible();
  });

  test('Keresés szűri a listát', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });

    const searchInput = page.locator('ps-input input').first();
    await searchInput.fill('Tabló szerkesztő');
    await page.waitForTimeout(600);

    await expect(page.getByText('Tabló szerkesztő nem tölt be').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Státusz szűrő látható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/bugs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 10_000 });
    // Státusz select
    const statusFilter = page.locator('ps-select').first();
    await expect(statusFilter).toBeVisible();
  });
});
