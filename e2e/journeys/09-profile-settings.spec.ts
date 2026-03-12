import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 9: Profil és beállítások
 *
 * Teszteli a partner profil oldalt, jelszó form validációt,
 * beállítások/márkajelzés/számlázás oldal navigációt.
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
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Profil oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Profil', () => {
  test('Profil oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Fiókom' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Profil adatok és jelszó módosítása')).toBeVisible();
  });

  test('Profil form tartalmazza a felhasználó adatait', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    // Szekció címek
    await expect(page.getByRole('heading', { name: 'Profil adatok' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Jelszó módosítása' })).toBeVisible();

    // Név mező nem üres (a seeder kitöltötte)
    const nameInput = page.locator('ps-input[formcontrolname="name"] input');
    await expect(nameInput).not.toHaveValue('');

    // Email mező tartalmazza a partner emailjét
    const emailInput = page.locator('ps-input[formcontrolname="email"] input');
    await expect(emailInput).toHaveValue('partner@e2e.test');
  });

  test('Profil név módosítható', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Profil adatok' })).toBeVisible({ timeout: 10_000 });

    const nameInput = page.locator('ps-input[formcontrolname="name"] input');
    await nameInput.clear();
    await nameInput.fill('E2E Partner Módosított');

    // Mentés gomb (profil szekcióban)
    const profileSection = page.locator('.settings-section').first();
    await profileSection.getByRole('button', { name: 'Mentés' }).click();

    // Sikeres mentés üzenet
    await expect(page.getByText('sikeresen frissítve')).toBeVisible({ timeout: 10_000 });
  });

  test('Profil név visszaállítása', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Profil adatok' })).toBeVisible({ timeout: 10_000 });

    const nameInput = page.locator('ps-input[formcontrolname="name"] input');
    await nameInput.clear();
    await nameInput.fill('E2E Partner');

    const profileSection = page.locator('.settings-section').first();
    await profileSection.getByRole('button', { name: 'Mentés' }).click();

    await expect(page.getByText('sikeresen frissítve')).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Jelszó form és validáció
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Jelszó', () => {
  test('Jelszó form mezők láthatók', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Jelszó módosítása' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('ps-input[formcontrolname="current_password"]')).toBeVisible();
    await expect(page.locator('ps-input[formcontrolname="password"]')).toBeVisible();
    await expect(page.locator('ps-input[formcontrolname="password_confirmation"]')).toBeVisible();
  });

  test('Hibás jelenlegi jelszó hibaüzenetet ad', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Jelszó módosítása' })).toBeVisible({ timeout: 10_000 });

    await page.locator('ps-input[formcontrolname="current_password"] input').fill('HibasJelszo123!');
    await page.locator('ps-input[formcontrolname="password"] input').fill('UjJelszo1234!');
    await page.locator('ps-input[formcontrolname="password_confirmation"] input').fill('UjJelszo1234!');

    const passwordSection = page.locator('.settings-section').nth(1);
    await passwordSection.getByRole('button', { name: 'Jelszó módosítása' }).click();

    // Hiba üzenet megjelenik
    await expect(page.locator('.error-banner').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Jelszó módosítása gomb inaktív üres form-mal', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Jelszó módosítása' })).toBeVisible({ timeout: 10_000 });

    // A gomb disabled ha a form üres
    const passwordSection = page.locator('.settings-section').nth(1);
    await expect(passwordSection.getByRole('button', { name: 'Jelszó módosítása' })).toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Beállítások oldalak navigáció
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Beállítások', () => {
  test('Beállítások oldal betöltődik', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/projects/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Beállítások', exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('Márkajelzés oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/customization/branding');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.getByText('Márkajelzés').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Számlázás oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/settings/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.getByText('Számlázás és fizetés').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Előfizetés oldal elérhető', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/subscription/overview');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.getByText('Előfizetés').first()).toBeVisible({ timeout: 10_000 });
  });
});
