import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 8: Kapcsolattartó kezelés (Contact Management)
 *
 * Teszteli a kontakt lista betöltését, új kontakt létrehozást,
 * szerkesztést, keresést és törlést a partner felületen.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
} = {};

const CONTACT = {
  name: 'E2E Teszt Kontakt',
  email: 'e2e-contact@test.hu',
  phone: '+36 30 111 2233',
  note: 'E2E teszt megjegyzés',
};

const CONTACT_UPDATED = {
  name: 'E2E Módosított Kontakt',
  email: 'e2e-modified@test.hu',
};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés + navigálás a kontaktokhoz
async function goToContacts(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });
  await page.goto('/partner/contacts');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Kapcsolattartók' })).toBeVisible({ timeout: 10_000 });
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Kontakt lista oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Kontakt lista', () => {
  test('Kapcsolattartók oldal betöltődik', async ({ page }) => {
    await goToContacts(page);
    await expect(page.getByRole('heading', { name: 'Kapcsolattartók' })).toBeVisible();
  });

  test('Új kapcsolattartó gomb látható', async ({ page }) => {
    await goToContacts(page);
    // Header-ben lévő gomb (nem az empty state-ben)
    await expect(page.locator('.header-actions').getByRole('button', { name: /új kapcsolattartó/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Kontakt létrehozás (UI-n keresztül)
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új kapcsolattartó modal megnyílik', async ({ page }) => {
    await goToContacts(page);
    await page.locator('.header-actions').getByRole('button', { name: /új kapcsolattartó/i }).click();

    await expect(page.getByText('Új kapcsolattartó').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('ps-input[name="name"]')).toBeVisible();
  });

  test('Kontakt létrehozható kitöltött adatokkal', async ({ page }) => {
    await goToContacts(page);
    await page.locator('.header-actions').getByRole('button', { name: /új kapcsolattartó/i }).click();
    await expect(page.getByText('Új kapcsolattartó').first()).toBeVisible({ timeout: 5_000 });

    // Adatok kitöltése
    await page.locator('ps-input[name="name"] input').fill(CONTACT.name);
    await page.locator('ps-input[name="email"] input').fill(CONTACT.email);
    await page.locator('ps-input[name="phone"] input').fill(CONTACT.phone);
    await page.locator('ps-textarea[name="note"] textarea').fill(CONTACT.note);

    // Mentés
    await page.getByRole('button', { name: /létrehozás/i }).click();

    // Modal bezárul és a kontakt megjelenik a listában
    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(CONTACT.name).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Létrehozott kontakt adatai helyesek a listában', async ({ page }) => {
    await goToContacts(page);

    await expect(page.getByText(CONTACT.name).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(CONTACT.email).first()).toBeVisible();
    await expect(page.getByText(CONTACT.phone).first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Keresés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Keresés', () => {
  test.beforeAll(async () => {
    // Kontakt seedelése a keresés teszteléshez (egyedi név)
    await api.seedContact({
      partnerId: state.partnerId!,
      name: 'Egyedi Keresőnév Xq7z',
      email: 'xq7z-kereses@test.hu',
      phone: '+36 20 555 1234',
    });
  });

  test('Keresés névvel működik', async ({ page }) => {
    await goToContacts(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Xq7z');
    await page.waitForTimeout(600); // Debounce

    await expect(page.getByText('Egyedi Keresőnév Xq7z').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés email alapján működik', async ({ page }) => {
    await goToContacts(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('xq7z-kereses@test.hu');
    await page.waitForTimeout(600);

    await expect(page.getByText('Egyedi Keresőnév Xq7z').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés törlése visszaállítja a teljes listát', async ({ page }) => {
    await goToContacts(page);

    // Keresés beírása
    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Xq7z');
    await page.waitForTimeout(600);
    await expect(page.getByText('Egyedi Keresőnév Xq7z').first()).toBeVisible({ timeout: 10_000 });

    // Keresés törlése
    await searchInput.clear();
    await page.waitForTimeout(600);

    // Az összes kontakt megjelenik (a seeder + UI-n létrehozott)
    await expect(page.getByText('E2E Teszt Kontakt').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Szerkesztés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szerkesztés', () => {
  test.beforeAll(async () => {
    // Szerkesztendő kontakt seedelése
    await api.seedContact({
      partnerId: state.partnerId!,
      name: 'Szerkesztendő Kontakt',
      email: 'szerkesztes@test.hu',
      phone: '+36 70 123 4567',
    });
  });

  test('Kontakt szerkesztés modal megnyílik', async ({ page }) => {
    await goToContacts(page);

    await expect(page.getByText('Szerkesztendő Kontakt').first()).toBeVisible({ timeout: 10_000 });
    const contactRow = page.locator('.contact-row', { hasText: 'Szerkesztendő Kontakt' }).first();
    await contactRow.locator('button[mattooltip="Szerkesztés"]').click();

    await expect(page.getByText('Kapcsolattartó szerkesztése').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Kontakt módosítható', async ({ page }) => {
    await goToContacts(page);

    await expect(page.getByText('Szerkesztendő Kontakt').first()).toBeVisible({ timeout: 10_000 });
    const contactRow = page.locator('.contact-row', { hasText: 'Szerkesztendő Kontakt' }).first();
    await contactRow.locator('button[mattooltip="Szerkesztés"]').click();
    await expect(page.getByText('Kapcsolattartó szerkesztése').first()).toBeVisible({ timeout: 5_000 });

    // Adatok módosítása
    const nameInput = page.locator('ps-input[name="name"] input');
    await nameInput.clear();
    await nameInput.fill(CONTACT_UPDATED.name);

    const emailInput = page.locator('ps-input[name="email"] input');
    await emailInput.clear();
    await emailInput.fill(CONTACT_UPDATED.email);

    // Mentés gomb (footer-ben, "Mentés" szöveggel)
    await page.locator('app-dialog-wrapper').getByRole('button', { name: /^mentés$/i }).click();

    // Modal bezárul
    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });

    // Módosított adatok megjelennek
    await expect(page.getByText(CONTACT_UPDATED.name).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(CONTACT_UPDATED.email).first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Törlés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Törlés', () => {
  test.beforeAll(async () => {
    // Törlendő kontakt seedelése
    await api.seedContact({
      partnerId: state.partnerId!,
      name: 'Törlendő Kontakt',
      email: 'torlendo@test.hu',
    });
  });

  test('Törlés megerősítő dialog megjelenik', async ({ page }) => {
    await goToContacts(page);

    await expect(page.getByText('Törlendő Kontakt').first()).toBeVisible({ timeout: 10_000 });
    const contactRow = page.locator('.contact-row', { hasText: 'Törlendő Kontakt' }).first();
    await contactRow.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Kapcsolattartó törlése')).toBeVisible({ timeout: 5_000 });
    // Confirm dialog tartalmazza a nevet (strict mode: first() kell)
    await expect(page.getByText('Biztosan törölni szeretnéd')).toBeVisible();
  });

  test('Kontakt törölhető', async ({ page }) => {
    await goToContacts(page);

    await expect(page.getByText('Törlendő Kontakt').first()).toBeVisible({ timeout: 10_000 });
    const contactRow = page.locator('.contact-row', { hasText: 'Törlendő Kontakt' }).first();
    await contactRow.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Kapcsolattartó törlése')).toBeVisible({ timeout: 5_000 });

    // Törlés gomb a megerősítő dialógusban
    await page.locator('app-confirm-dialog').getByRole('button', { name: 'Törlés' }).click();

    // A kontakt eltűnik a listából
    await expect(page.locator('.contact-row', { hasText: 'Törlendő Kontakt' })).toBeHidden({ timeout: 10_000 });
  });
});
