import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Journey 7: Nyomda (Print Shop) workflow
 *
 * Teszteli a nyomda belépést, dashboard-ot, projekt listát,
 * kapcsolatok kezelését és a nyomda-specifikus felületet.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  printShopEmail: string;
  printShopPassword: string;
  seededProjectId?: number;
} = {
  printShopEmail: `printshop-${Date.now()}@e2e.test`,
  printShopPassword: 'PrintShop1234!',
};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Partner ID lekérés (a stúdió partnerhez kapcsolódunk)
  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;

  // Nyomda setup: user + partner + TabloPartner + connection a stúdióhoz
  await api.seedPrintShop({
    name: 'E2E Nyomda',
    email: state.printShopEmail,
    password: state.printShopPassword,
    companyName: 'E2E Teszt Nyomda Kft.',
    connectToPartnerId: state.partnerId,
  });

  // In-print projekt létrehozás (amit a nyomda lát)
  const result = await api.seedProject({
    partnerId: state.partnerId!,
    schoolName: 'Nyomda Teszt Iskola',
    schoolCity: 'Miskolc',
    projectName: 'Nyomda E2E Projekt',
    classNames: ['12.C'],
    studentsPerClass: 5,
    status: 'in_print',
    classYear: '2025-2026',
  });
  state.seededProjectId = result.project_id;
});

test.afterAll(async () => {
  await api.dispose();
});

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Nyomda belépés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Belépés', () => {
  test('Nyomda be tud lépni', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();

    // Nyomda → /print-shop/dashboard
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });
  });

  test('Dashboard betöltődik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    // Dashboard tartalom: üdvözlő szöveg
    await expect(page.getByText('Üdvözöljük')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Nyomdai vezérlőpult')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Dashboard tartalom
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Dashboard', () => {
  test('Statisztika kártyák megjelennek', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    // Statisztika kártyák
    await expect(page.getByText('Nyomdában lévő projekt')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Befejezett (hónap)')).toBeVisible();
    await expect(page.getByText('Kapcsolt stúdió')).toBeVisible();
    await expect(page.getByText('Függő kapcsolatkérés')).toBeVisible();
  });

  test('Navigáció elemek láthatók', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    // Navigációs menüpontok a sidebar-ban
    const nav = page.locator('nav');
    await expect(nav.getByText('Vezérlőpult')).toBeVisible({ timeout: 10_000 });
    await expect(nav.getByText('Projektek')).toBeVisible();
    await expect(nav.getByText('Kapcsolatok')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Projektek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Projektek', () => {
  test('Projekt lista betöltődik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    await page.goto('/print-shop/projects');
    await page.waitForLoadState('networkidle');

    // Az oldal nem 404
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('Seeder projekt megjelenik a listában', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    await page.goto('/print-shop/projects');
    await page.waitForLoadState('networkidle');

    // A seeder-rel létrehozott iskola megjelenik
    await expect(page.getByText('Nyomda Teszt Iskola').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Kapcsolatok
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Kapcsolatok', () => {
  test('Kapcsolatok oldal betöltődik', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    await page.goto('/print-shop/connections');
    await page.waitForLoadState('networkidle');

    // Az oldal nem 404
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('Aktív kapcsolat nem jelenik meg a kérelmek között', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    await page.goto('/print-shop/connections');
    await page.waitForLoadState('networkidle');

    // Az aktív kapcsolat nem jelenik meg a pending kérelmek oldalon
    // → "Nincs függőben lévő kérelem" üzenet kell
    await expect(page.getByText('Nincs függőben lévő kérelem')).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Jogosultság ellenőrzés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Jogosultság', () => {
  test('Nyomda nem éri el a partner dashboard-ot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /email/i }).click();
    await page.locator('ps-input[formcontrolname="email"] input').fill(state.printShopEmail);
    await page.locator('ps-input[formcontrolname="password"] input').fill(state.printShopPassword);
    await page.getByRole('button', { name: /bejelentkezés/i }).click();
    await expect(page).toHaveURL(/\/print-shop/, { timeout: 15_000 });

    // Partner dashboard-ra navigálás → redirect
    await page.goto('/partner/dashboard');
    await page.waitForLoadState('networkidle');

    // Nem a partner dashboard-on van
    await expect(page).not.toHaveURL(/\/partner\/dashboard/);
  });
});
