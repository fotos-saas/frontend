import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 11: Diák kezelés (Student Management)
 *
 * Teszteli a diák lista betöltését, új diák létrehozást,
 * szerkesztést, keresést, részletek oldalt és törlést.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  seededSchoolId?: number;
  seededStudentId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;

  // Iskola + projekt seedelése (diák listához kell iskola)
  const projectResult = await api.seedProject({
    partnerId: state.partnerId!,
    schoolName: 'Diák Teszt Iskola',
    schoolCity: 'Budapest',
    projectName: 'Diák Teszt Projekt',
    classNames: ['12.A'],
    studentsPerClass: 0,
    classYear: '2025-2026',
  });
  state.seededSchoolId = projectResult.school_id;

  // Diák archívum rekordok seedelése
  const studentResult = await api.seedStudentArchive({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Seeder Diák Petra',
    className: '12.A',
  });
  state.seededStudentId = studentResult.student_id;

  // Szerkesztendő + törlendő diák seedelése (Fázis 4 és 6 számára)
  await api.seedStudentArchive({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Szerkesztendő Diák',
    className: '11.C',
  });
  await api.seedStudentArchive({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Törlendő Diák',
    className: '10.A',
  });
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés + navigálás a diákokhoz
async function goToStudents(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });
  await page.goto('/partner/projects/students');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Diákok' })).toBeVisible({ timeout: 10_000 });

  // Guided Tour bezárása ha megjelenik
  const skipBtn = page.getByRole('button', { name: /kihagyás/i });
  if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Diák lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Lista', () => {
  test('Diák lista oldal betöltődik', async ({ page }) => {
    await goToStudents(page);
    await expect(page.getByRole('heading', { name: 'Diákok' })).toBeVisible();
  });

  test('Seeder diák megjelenik a listában', async ({ page }) => {
    await goToStudents(page);
    await expect(page.getByText('Seeder Diák Petra').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Új diák gomb látható', async ({ page }) => {
    await goToStudents(page);
    await expect(page.getByRole('button', { name: /új diák/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Diák létrehozás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új diák modal megnyílik', async ({ page }) => {
    await goToStudents(page);
    await page.getByRole('button', { name: /új diák/i }).click();

    await expect(page.getByText('Új diák').first()).toBeVisible({ timeout: 5_000 });
    // A form tartalmazza a Név és Osztály mezőket
    await expect(page.locator('form#archiveForm')).toBeVisible();
  });

  test('Diák létrehozható', async ({ page }) => {
    await goToStudents(page);
    await page.getByRole('button', { name: /új diák/i }).click();
    await expect(page.getByText('Új diák').first()).toBeVisible({ timeout: 5_000 });

    const form = page.locator('form#archiveForm');

    // Név mező (első ps-input a form-ban)
    await form.locator('ps-input').first().locator('input').fill('E2E Teszt Gábor');

    // Osztály mező (második ps-input)
    await form.locator('ps-input').nth(1).locator('input').fill('11.B');

    // Iskola kiválasztás (searchable select)
    await form.locator('ps-searchable-select').click();
    await page.waitForTimeout(500);
    await page.locator('.ps-dropdown__option', { hasText: 'Diák Teszt Iskola' }).first().click();

    // Létrehozás
    await page.getByRole('button', { name: /létrehozás/i }).click();

    // Modal bezárul
    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });

    // A diák megjelenik a listában
    await expect(page.getByText('E2E Teszt Gábor').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Keresés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Keresés', () => {
  test('Keresés névvel működik', async ({ page }) => {
    await goToStudents(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Diák');
    await page.waitForTimeout(600);

    await expect(page.getByText('Seeder Diák Petra').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés törlése visszaadja a teljes listát', async ({ page }) => {
    await goToStudents(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Diák');
    await page.waitForTimeout(600);
    await expect(page.getByText('Seeder Diák Petra').first()).toBeVisible({ timeout: 10_000 });

    // Törlés
    await searchInput.clear();
    await page.waitForTimeout(600);

    // A seedelt diák is megjelenik (Szerkesztendő Diák — mindig létezik)
    await expect(page.getByText('Szerkesztendő Diák').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Szerkesztés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szerkesztés', () => {
  test('Diák szerkesztés modal megnyílik', async ({ page }) => {
    await goToStudents(page);

    await expect(page.getByText('Szerkesztendő Diák').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.student-row', { hasText: 'Szerkesztendő Diák' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();

    await expect(page.getByText('diák szerkesztése').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Diák módosítható', async ({ page }) => {
    await goToStudents(page);

    await expect(page.getByText('Szerkesztendő Diák').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.student-row', { hasText: 'Szerkesztendő Diák' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();
    await expect(page.getByText('diák szerkesztése').first()).toBeVisible({ timeout: 5_000 });

    // Név mező (első ps-input a form-ban)
    const form = page.locator('form#archiveForm');
    const nameInput = form.locator('ps-input').first().locator('input');
    await nameInput.clear();
    await nameInput.fill('Módosított Diák Név');

    await page.locator('app-dialog-wrapper').getByRole('button', { name: /^mentés$/i }).click();

    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText('Módosított Diák Név').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Diák részletek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Részletek', () => {
  test('Diák részletek oldal megnyitható', async ({ page }) => {
    await goToStudents(page);

    await expect(page.getByText('Seeder Diák Petra').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.student-row', { hasText: 'Seeder Diák Petra' }).first();
    await row.locator('.student-info').click();
    await page.waitForLoadState('networkidle');

    // Részletek oldal betöltődik
    await expect(page.getByText('Seeder Diák Petra').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Vissza')).toBeVisible();
  });

  test('Diák adatok megjelennek a részleteken', async ({ page }) => {
    await goToStudents(page);

    const row = page.locator('.student-row', { hasText: 'Seeder Diák Petra' }).first();
    await row.locator('.student-info').click();
    await page.waitForLoadState('networkidle');

    // Profil adatok
    await expect(page.locator('.profile-name', { hasText: 'Seeder Diák Petra' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('12.A')).toBeVisible();
    await expect(page.getByText('Diák Teszt Iskola')).toBeVisible();

    // Fotók szekció
    await expect(page.getByRole('heading', { name: 'Fotók' })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 6: Törlés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 6: Törlés', () => {
  test('Törlés megerősítő dialog megjelenik', async ({ page }) => {
    await goToStudents(page);

    await expect(page.getByText('Törlendő Diák').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.student-row', { hasText: 'Törlendő Diák' }).first();
    await row.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Diák törlése')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Biztosan törölni szeretnéd')).toBeVisible();
  });

  test('Diák törölhető', async ({ page }) => {
    await goToStudents(page);

    await expect(page.getByText('Törlendő Diák').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.student-row', { hasText: 'Törlendő Diák' }).first();
    await row.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Diák törlése')).toBeVisible({ timeout: 5_000 });
    await page.locator('app-confirm-dialog').getByRole('button', { name: 'Törlés' }).click();

    // A diák eltűnik a listából
    await expect(page.locator('.student-row', { hasText: 'Törlendő Diák' })).toHaveCount(0, { timeout: 10_000 });
  });
});
