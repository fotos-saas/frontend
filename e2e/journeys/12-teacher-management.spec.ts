import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 12: Tanár kezelés (Teacher Management)
 *
 * Teszteli a tanár lista betöltését, új tanár létrehozást,
 * szerkesztést, keresést, részletek oldalt és törlést.
 */

let api: ApiHelper;

const state: {
  partnerId?: number;
  seededSchoolId?: number;
  seededTeacherId?: number;
} = {};

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  const loginResult = await api.login('partner@e2e.test', 'Partner1234!');
  const userData = loginResult.user as Record<string, unknown>;
  state.partnerId = userData.partner_id as number;

  // Iskola + projekt seedelése
  const projectResult = await api.seedProject({
    partnerId: state.partnerId!,
    schoolName: 'Tanár Teszt Iskola',
    schoolCity: 'Debrecen',
    projectName: 'Tanár Teszt Projekt',
    classNames: ['12.A'],
    studentsPerClass: 0,
    classYear: '2025-2026',
  });
  state.seededSchoolId = projectResult.school_id;

  // Tanár archívum rekordok seedelése
  const teacherResult = await api.seedTeacher({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Seeder Tanár Péter',
    titlePrefix: 'Dr.',
    position: 'igazgató',
  });
  state.seededTeacherId = teacherResult.teacher_id;

  // Szerkesztendő + törlendő tanár seedelése
  await api.seedTeacher({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Szerkesztendő Tanár',
    position: 'matematika tanár',
  });
  await api.seedTeacher({
    partnerId: state.partnerId!,
    schoolId: state.seededSchoolId!,
    canonicalName: 'Törlendő Tanár',
    position: 'testnevelő',
  });
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés + navigálás a tanárokhoz
async function goToTeachers(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /email/i }).click();
  await page.locator('ps-input[formcontrolname="email"] input').fill('partner@e2e.test');
  await page.locator('ps-input[formcontrolname="password"] input').fill('Partner1234!');
  await page.getByRole('button', { name: /bejelentkezés/i }).click();
  await expect(page).toHaveURL(/\/partner/, { timeout: 15_000 });
  await page.goto('/partner/projects/teachers');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Tanárok' })).toBeVisible({ timeout: 10_000 });

  // Guided Tour bezárása ha megjelenik
  const skipBtn = page.getByRole('button', { name: /kihagyás/i });
  if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ════════════════════════════════════════════════════════════
// FÁZIS 1: Tanár lista
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Lista', () => {
  test('Tanár lista oldal betöltődik', async ({ page }) => {
    await goToTeachers(page);
    await expect(page.getByRole('heading', { name: 'Tanárok' })).toBeVisible();
  });

  test('Seeder tanár megjelenik a listában', async ({ page }) => {
    await goToTeachers(page);
    await expect(page.getByText('Seeder Tanár Péter').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Tanár pozíció megjelenik', async ({ page }) => {
    await goToTeachers(page);
    await expect(page.getByText('igazgató').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Új tanár gomb látható', async ({ page }) => {
    await goToTeachers(page);
    await expect(page.locator('.header-actions').getByRole('button', { name: /új tanár/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Tanár létrehozás
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Létrehozás', () => {
  test('Új tanár modal megnyílik', async ({ page }) => {
    await goToTeachers(page);
    await page.locator('.header-actions').getByRole('button', { name: /új tanár/i }).click();

    await expect(page.getByText('Új tanár').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('form#archiveForm')).toBeVisible();
  });

  test('Tanár létrehozható', async ({ page }) => {
    await goToTeachers(page);
    await page.locator('.header-actions').getByRole('button', { name: /új tanár/i }).click();
    await expect(page.getByText('Új tanár').first()).toBeVisible({ timeout: 5_000 });

    const form = page.locator('form#archiveForm');

    // Titulus mező (form-field--sm, első ps-input a form-row-ban)
    await form.locator('.form-field--sm ps-input input').fill('PhD');

    // Név mező (form-field--lg, második ps-input a form-row-ban)
    await form.locator('.form-field--lg ps-input input').fill('E2E Teszt Gábor');

    // Pozíció mező (a form-row utáni önálló ps-input)
    const allInputs = form.locator(':scope > ps-input input');
    await allInputs.first().fill('angol tanár');

    // Iskola kiválasztás
    await form.locator('ps-searchable-select').click();
    await page.waitForTimeout(500);
    await page.locator('.ps-dropdown__option', { hasText: 'Tanár Teszt Iskola' }).first().click();

    // Létrehozás
    await page.getByRole('button', { name: /létrehozás/i }).click();

    // Modal bezárul
    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });

    // A tanár megjelenik a listában
    await expect(page.getByText('E2E Teszt Gábor').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Keresés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Keresés', () => {
  test('Keresés névvel működik', async ({ page }) => {
    await goToTeachers(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Tanár');
    await page.waitForTimeout(600);

    await expect(page.getByText('Seeder Tanár Péter').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Keresés törlése visszaadja a teljes listát', async ({ page }) => {
    await goToTeachers(page);

    const searchInput = page.locator('app-smart-filter-bar ps-input input');
    await searchInput.fill('Seeder Tanár');
    await page.waitForTimeout(600);
    await expect(page.getByText('Seeder Tanár Péter').first()).toBeVisible({ timeout: 10_000 });

    // Törlés
    await searchInput.clear();
    await page.waitForTimeout(600);

    // Más tanár is megjelenik
    await expect(page.getByText('Szerkesztendő Tanár').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Szerkesztés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Szerkesztés', () => {
  test('Tanár szerkesztés modal megnyílik', async ({ page }) => {
    await goToTeachers(page);

    await expect(page.getByText('Szerkesztendő Tanár').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.teacher-row', { hasText: 'Szerkesztendő Tanár' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();

    await expect(page.getByText('tanár szerkesztése').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Tanár módosítható', async ({ page }) => {
    await goToTeachers(page);

    await expect(page.getByText('Szerkesztendő Tanár').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.teacher-row', { hasText: 'Szerkesztendő Tanár' }).first();
    await row.locator('button[mattooltip="Szerkesztés"]').click();
    await expect(page.getByText('tanár szerkesztése').first()).toBeVisible({ timeout: 5_000 });

    // Név mező (form-field--lg)
    const form = page.locator('form#archiveForm');
    const nameInput = form.locator('.form-field--lg ps-input input');
    await nameInput.clear();
    await nameInput.fill('Módosított Tanár Név');

    await page.locator('app-dialog-wrapper').getByRole('button', { name: /^mentés$/i }).click();

    await expect(page.locator('app-dialog-wrapper')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText('Módosított Tanár Név').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 5: Tanár részletek
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 5: Részletek', () => {
  test('Tanár részletek oldal megnyitható', async ({ page }) => {
    await goToTeachers(page);

    await expect(page.getByText('Seeder Tanár Péter').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.teacher-row', { hasText: 'Seeder Tanár Péter' }).first();
    await row.locator('.teacher-info').click();
    await page.waitForLoadState('networkidle');

    // Részletek oldal betöltődik
    await expect(page.getByText('Seeder Tanár Péter').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Vissza')).toBeVisible();
  });

  test('Tanár adatok megjelennek a részleteken', async ({ page }) => {
    await goToTeachers(page);

    const row = page.locator('.teacher-row', { hasText: 'Seeder Tanár Péter' }).first();
    await row.locator('.teacher-info').click();
    await page.waitForLoadState('networkidle');

    // Profil adatok
    await expect(page.locator('.profile-name').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('igazgató')).toBeVisible();
    await expect(page.getByText('Tanár Teszt Iskola')).toBeVisible();

    // Fotók szekció
    await expect(page.getByText('Fotók').first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 6: Törlés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 6: Törlés', () => {
  test('Törlés megerősítő dialog megjelenik', async ({ page }) => {
    await goToTeachers(page);

    await expect(page.getByText('Törlendő Tanár').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.teacher-row', { hasText: 'Törlendő Tanár' }).first();
    await row.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Tanár törlése')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Biztosan törölni szeretnéd')).toBeVisible();
  });

  test('Tanár törölhető', async ({ page }) => {
    await goToTeachers(page);

    await expect(page.getByText('Törlendő Tanár').first()).toBeVisible({ timeout: 10_000 });
    const row = page.locator('.teacher-row', { hasText: 'Törlendő Tanár' }).first();
    await row.locator('button[mattooltip="Törlés"]').click();

    await expect(page.getByText('Tanár törlése')).toBeVisible({ timeout: 5_000 });
    await page.locator('app-confirm-dialog').getByRole('button', { name: 'Törlés' }).click();

    // A tanár eltűnik a listából
    await expect(page.locator('.teacher-row', { hasText: 'Törlendő Tanár' })).toHaveCount(0, { timeout: 10_000 });
  });
});
