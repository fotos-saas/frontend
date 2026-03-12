import { test, expect } from '@playwright/test';

/**
 * Smoke tesztek — gyors ellenőrzés, hogy az app egyáltalán él-e.
 * PR-ekhez és gyors lokális ellenőrzéshez.
 *
 * Futtatás: npm run e2e:smoke
 */

test.describe('Smoke @smoke', () => {
  test('Frontend betölt', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Az app renderel (nem white screen)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('Partner regisztráció oldal elérhető', async ({ page }) => {
    await page.goto('/register-app');
    await page.waitForLoadState('networkidle');

    // A csomag választó oldal betölt (1. lépés)
    await expect(page.getByText('Válaszd ki a csomagodat')).toBeVisible({ timeout: 10_000 });
  });

  test('Tabló login oldal elérhető', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Van code input
    const codeInput = page.locator('input#code, input[formControlName="code"]');
    await expect(codeInput).toBeVisible({ timeout: 10_000 });
  });

  test('API health endpoint válaszol', async ({ request }) => {
    const res = await request.get('http://localhost:8000/up');
    expect(res.ok()).toBeTruthy();
  });
});
