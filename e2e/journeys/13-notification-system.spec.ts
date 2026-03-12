import { test, expect } from '@playwright/test';
import { ApiHelper } from '../helpers/api.helper';

/**
 * Journey 13: Értesítési rendszer (Notification System)
 *
 * Teszteli az értesítés csengőt (badge, dropdown),
 * a lista oldalt, szűrőket és az olvasottnak jelölést.
 */

let api: ApiHelper;

test.beforeAll(async () => {
  api = new ApiHelper();
  await api.init();

  // Olvasatlan értesítések seedelése
  await api.seedNotification({
    userEmail: 'partner@e2e.test',
    title: 'Teszt feladat kiosztva',
    message: 'Egy új feladatot kaptál a projektben.',
    emoji: '📋',
    type: 'task_assigned',
  });
  await api.seedNotification({
    userEmail: 'partner@e2e.test',
    title: 'Kérdés megválaszolva',
    message: 'A feltett kérdésedre érkezett válasz.',
    emoji: '💬',
    type: 'question_answered',
  });
  await api.seedNotification({
    userEmail: 'partner@e2e.test',
    title: 'Kapcsolódási kérelem',
    message: 'Egy nyomda csatlakozni szeretne.',
    emoji: '🤝',
    type: 'connection_requested',
  });

  // Olvasott értesítés
  await api.seedNotification({
    userEmail: 'partner@e2e.test',
    title: 'Régi olvasott értesítés',
    message: 'Ez már korábban olvasva lett.',
    emoji: '✅',
    type: 'task_completed',
    isRead: true,
  });
});

test.afterAll(async () => {
  await api.dispose();
});

// Helper: partner bejelentkezés + partner dashboard
async function goToPartner(page: import('@playwright/test').Page): Promise<void> {
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
// FÁZIS 1: Értesítés csengő (Bell)
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 1: Csengő', () => {
  test('Értesítés csengő megjelenik', async ({ page }) => {
    await goToPartner(page);
    await expect(page.locator('.notification-bell__trigger')).toBeVisible({ timeout: 10_000 });
  });

  test('Olvasatlan badge látható', async ({ page }) => {
    await goToPartner(page);
    await expect(page.locator('.notification-bell__badge')).toBeVisible({ timeout: 10_000 });
  });

  test('Csengő dropdown megnyílik', async ({ page }) => {
    await goToPartner(page);
    await page.locator('.notification-bell__trigger').click();
    await expect(page.locator('.notification-bell__dropdown')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.notification-bell__title')).toHaveText('Értesítések');
  });

  test('Dropdown tartalmazza a seedelt értesítéseket', async ({ page }) => {
    await goToPartner(page);
    await page.locator('.notification-bell__trigger').click();
    await expect(page.locator('.notification-bell__dropdown')).toBeVisible({ timeout: 5_000 });

    await expect(page.locator('.notification-bell__item').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Teszt feladat kiosztva').first()).toBeVisible();
  });

  test('Összes értesítés link működik', async ({ page }) => {
    await goToPartner(page);
    await page.locator('.notification-bell__trigger').click();
    await expect(page.locator('.notification-bell__dropdown')).toBeVisible({ timeout: 5_000 });

    await page.locator('.notification-bell__view-all').click();
    await expect(page).toHaveURL(/\/partner\/notifications/, { timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 2: Értesítés lista oldal
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 2: Lista oldal', () => {
  test('Értesítés lista oldal betöltődik', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Értesítések' })).toBeVisible({ timeout: 10_000 });
  });

  test('Seedelt értesítések megjelennek', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt feladat kiosztva').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Kérdés megválaszolva').first()).toBeVisible();
    await expect(page.getByText('Kapcsolódási kérelem').first()).toBeVisible();
  });

  test('Olvasatlan értesítések vizuálisan megkülönböztethetők', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    // Olvasatlan soroknak van --unread osztály
    const unreadRows = page.locator('.notification-row--unread');
    await expect(unreadRows.first()).toBeVisible({ timeout: 10_000 });
    expect(await unreadRows.count()).toBeGreaterThanOrEqual(3);
  });

  test('Szűrő tab-ok láthatók', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.filter-tab', { hasText: 'Összes' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.filter-tab', { hasText: 'Olvasatlan' })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 3: Szűrés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 3: Szűrés', () => {
  test('Olvasatlan szűrő működik', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    // Kattintás az "Olvasatlan" tab-ra
    await page.locator('.filter-tab', { hasText: 'Olvasatlan' }).click();
    await page.waitForTimeout(600);

    // Csak olvasatlan értesítések jelennek meg
    await expect(page.getByText('Teszt feladat kiosztva').first()).toBeVisible({ timeout: 10_000 });
    // Olvasott értesítés nem jelenik meg
    await expect(page.getByText('Régi olvasott értesítés')).toBeHidden({ timeout: 5_000 });
  });

  test('Összes szűrő visszaadja a teljes listát', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    // Olvasatlan szűrő
    await page.locator('.filter-tab', { hasText: 'Olvasatlan' }).click();
    await page.waitForTimeout(600);

    // Vissza az "Összes"-re
    await page.locator('.filter-tab', { hasText: 'Összes' }).click();
    await page.waitForTimeout(600);

    // Olvasott értesítés is megjelenik
    await expect(page.getByText('Régi olvasott értesítés').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════
// FÁZIS 4: Olvasottnak jelölés
// ════════════════════════════════════════════════════════════

test.describe.serial('Fázis 4: Olvasottnak jelölés', () => {
  test('Összes olvasottnak jelölés gomb látható', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.btn-mark-all')).toBeVisible({ timeout: 10_000 });
  });

  test('Összes olvasottnak jelölhető', async ({ page }) => {
    await goToPartner(page);
    await page.goto('/partner/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.notification-row--unread').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('.btn-mark-all').click();
    await page.waitForTimeout(1_000);

    // Nincs több olvasatlan sor
    await expect(page.locator('.notification-row--unread')).toHaveCount(0, { timeout: 10_000 });
  });

  test('Olvasottnak jelölés után a badge eltűnik', async ({ page }) => {
    await goToPartner(page);

    // Badge nem látható (vagy nem létezik, mert nincs olvasatlan)
    await expect(page.locator('.notification-bell__badge')).toBeHidden({ timeout: 10_000 });
  });
});
