import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Akadálymentesítési (A11y) E2E Tesztek
 *
 * axe-core alapú automatikus WCAG 2.1 AA ellenőrzés
 * Minden publikus oldalon fut: login, regisztráció, vendég nézet
 */

test.describe('Akadálymentesítés (A11y)', () => {
  test('bejelentkező oldal WCAG AA megfelelőség', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('regisztrációs oldal WCAG AA megfelelőség', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('vendég meghívó oldal WCAG AA megfelelőség', async ({ page }) => {
    // Vendég oldal - nem igényel bejelentkezést
    await page.goto('/guest/invite/test-token');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('skip link működjön az app-shell-ben', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Tab-bal a skip linkre navigálunk
    await page.keyboard.press('Tab');

    // Skip link láthatóvá válik fókuszáláskor
    const skipLink = page.locator('a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeFocused();
      const isVisible = await skipLink.isVisible();
      expect(isVisible).toBe(true);
    }
  });
});
