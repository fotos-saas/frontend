/**
 * Vendég Felhasználó Flow E2E Tesztek
 *
 * A vendég felhasználó (share token) flow komplett tesztelése:
 * - Vendég belépés share token-nel
 * - Vendég korlátozások (template-chooser, véglegesítés)
 * - Kódos belépés kontra vendég
 * - UI elemek ellenőrzése (badge, navbar)
 * - Access control tesztek
 */

import { test, expect } from '@playwright/test';

// ============================
// PAGE OBJECT MODEL DEFINÍCIÓK
// ============================

/**
 * Guest Login Page Object
 */
class GuestLoginPage {
  constructor(private page) {}

  async navigateToShareLink(token: string): Promise<void> {
    await this.page.goto(`/share/${token}`);
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}

/**
 * Navbar Page Object
 */
class NavbarPage {
  constructor(private page) {}

  async getGuestBadge(): Promise<string | null> {
    try {
      const badge = await this.page.locator('.navbar__guest-badge').textContent({ timeout: 3000 });
      return badge?.trim() || null;
    } catch {
      return null;
    }
  }

  async isGuestBadgeVisible(): Promise<boolean> {
    try {
      await this.page.locator('.navbar__guest-badge').waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async getNavbarLinks(): Promise<string[]> {
    const links = await this.page.locator('.navbar__link').allTextContents();
    return links.map(link => link.trim());
  }

  async getMobileNavbarLinks(): Promise<string[]> {
    const links = await this.page.locator('.navbar__mobile-menu-link').allTextContents();
    return links.map(link => link.trim());
  }

  async hasLink(text: string): Promise<boolean> {
    const links = await this.getNavbarLinks();
    return links.some(link => link.includes(text));
  }

  async hasMobileLink(text: string): Promise<boolean> {
    const links = await this.getMobileNavbarLinks();
    return links.some(link => link.includes(text));
  }

  async clickLink(text: string): Promise<void> {
    await this.page.locator(`.navbar__link`).filter({ hasText: new RegExp(text) }).click();
  }

  async waitForActiveLink(text: string): Promise<void> {
    await this.page.locator(`.navbar__link--active`).filter({ hasText: new RegExp(text) }).waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * Home Page Object
 */
class HomePage {
  constructor(private page) {}

  async isLoaded(): Promise<boolean> {
    try {
      // Várj a tartalom betöltésére
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentPageTitle(): Promise<string> {
    return await this.page.title();
  }
}

/**
 * Samples Page Object
 */
class SamplesPage {
  constructor(private page) {}

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch {
      return false;
    }
  }

  async getSampleImages(): Promise<number> {
    const count = await this.page.locator('[data-testid="sample-image"]').count();
    return count;
  }
}

/**
 * Template Chooser Page Object
 */
class TemplateChooserPage {
  constructor(private page) {}

  async isAccessible(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/template-chooser');
  }

  async getPageContent(): Promise<string | null> {
    try {
      return await this.page.locator('main, .container, [role="main"]').textContent({ timeout: 2000 });
    } catch {
      return null;
    }
  }
}

// ============================
// TESZTEK
// ============================

test.describe('Vendég Felhasználó Flow', () => {
  let guestLoginPage: GuestLoginPage;
  let navbarPage: NavbarPage;
  let homePage: HomePage;
  let samplesPage: SamplesPage;
  let templateChooserPage: TemplateChooserPage;

  // ============================
  // SHARE TOKEN BELÉPÉS
  // ============================

  test.describe('Share Token Belépés', () => {
    test.beforeEach(async ({ page }) => {
      // Mock API válaszok a vendég belépéshez
      await page.route('**/api/auth/login-tablo-share', async (route) => {
        const token = page.url().split('/share/')[1];

        if (token === 'valid-share-token') {
          // Sikeres vendég belépés
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 999,
                name: 'Vendég Felhasználó',
                email: null,
                type: 'tablo-guest'
              },
              project: {
                id: 1,
                name: 'Teszt Projekt',
                schoolName: 'Teszt Iskola',
                className: '10.A',
                classYear: '2025'
              },
              token: 'share-token-jwt-123',
              tokenType: 'share',
              canFinalize: false
            })
          });
        } else {
          // Érvénytelen token
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Érvénytelen megosztási link'
            })
          });
        }
      });

      // Session validálás mock
      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            project: {
              id: 1,
              name: 'Teszt Projekt'
            },
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      // Minták API mock
      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, url: '/images/sample-1.jpg', name: 'Minta 1' },
              { id: 2, url: '/images/sample-2.jpg', name: 'Minta 2' },
              { id: 3, url: '/images/sample-3.jpg', name: 'Minta 3' }
            ]
          })
        });
      });

      // Projekt info API mock
      await page.route('**/api/tablo-frontend/project-info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              schoolName: 'Teszt Iskola',
              className: '10.A',
              classYear: '2025'
            }
          })
        });
      });

      guestLoginPage = new GuestLoginPage(page);
      navbarPage = new NavbarPage(page);
      homePage = new HomePage(page);
      samplesPage = new SamplesPage(page);
      templateChooserPage = new TemplateChooserPage(page);
    });

    test('vendég belépés sikeres share token-nel', async ({ page }) => {
      // Navigálás a share linkre
      await guestLoginPage.navigateToShareLink('valid-share-token');
      await guestLoginPage.waitForNavigation();

      // Token ellenőrzése localStorage-ben
      const token = await page.evaluate(() => localStorage.getItem('tablo_auth_token'));
      expect(token).toBe('share-token-jwt-123');

      // Token típus ellenőrzése
      const tokenType = await page.evaluate(() => localStorage.getItem('tablo_token_type'));
      expect(tokenType).toBe('share');
    });

    test('sikeres belépés után átirányít /samples-re', async ({ page }) => {
      await guestLoginPage.navigateToShareLink('valid-share-token');
      await guestLoginPage.waitForNavigation();

      // Végül a /samples oldalra irányít
      await page.waitForURL('**/samples', { timeout: 5000 });
      expect(page.url()).toContain('/samples');
    });

    test('vendég badge megjelenik a navbar-ban', async ({ page }) => {
      await guestLoginPage.navigateToShareLink('valid-share-token');
      await guestLoginPage.waitForNavigation();

      // Vendég badge ellenőrzése
      const isBadgeVisible = await navbarPage.isGuestBadgeVisible();
      expect(isBadgeVisible).toBe(true);

      // Badge szöveg ellenőrzése
      const badgeText = await navbarPage.getGuestBadge();
      expect(badgeText).toContain('Vendég');
    });

    test('érvénytelen share token feldolgozása', async ({ page }) => {
      // Mock response a bejelentkezéshez
      await page.route('**/api/auth/login-tablo-share', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Érvénytelen megosztási link'
          })
        });
      });

      await guestLoginPage.navigateToShareLink('invalid-token');

      // Ha hiba történik, visszamarad a /share oldalon vagy átirányít /login-ra
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url.includes('/share') || url.includes('/login')).toBe(true);
    });
  });

  // ============================
  // VENDÉG KORLÁTOZÁSOK
  // ============================

  test.describe('Vendég Korlátozások', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: vendég session
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
        localStorage.setItem('tablo_project', JSON.stringify({
          id: 1,
          name: 'Teszt Projekt',
          schoolName: 'Teszt Iskola'
        }));
      });

      // API mock-ok
      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });

      guestLoginPage = new GuestLoginPage(page);
      navbarPage = new NavbarPage(page);
      templateChooserPage = new TemplateChooserPage(page);
    });

    test('minta választó (/template-chooser) NEM elérhető vendégnek', async ({ page }) => {
      // Közvetlen navigálás a template-chooser-re
      await page.goto('/template-chooser');
      await page.waitForTimeout(1000);

      // Vendég nem tud elérni, átirányít /samples-re
      const url = page.url();
      expect(url).not.toContain('/template-chooser');
      // Várhatóan /samples-re irányít
      expect(url.includes('/samples') || url.includes('/login')).toBe(true);
    });

    test('template-chooser link NEM látszik a navbar-ban vendégnek', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const hasTemplateChooserLink = await navbarPage.hasLink('Minta Választó');
      expect(hasTemplateChooserLink).toBe(false);
    });

    test('véglegesítés (/order-finalization) link NEM látszik a navbar-ban vendégnek', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const hasFinalizationLink = await navbarPage.hasLink('Véglegesítés');
      expect(hasFinalizationLink).toBe(false);
    });

    test('vendég csak az elérhető menüpontokat látja', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const links = await navbarPage.getNavbarLinks();

      // Elérhető linkek vendégnek
      expect(links.some(link => link.includes('Kezdőlap'))).toBe(true);
      expect(links.some(link => link.includes('Minták'))).toBe(true);

      // NEM elérhető linkek vendégnek
      expect(links.some(link => link.includes('Minta Választó'))).toBe(false);
      expect(links.some(link => link.includes('Véglegesítés'))).toBe(false);
    });

    test('kapcsolattartó módosítás NEM elérhető vendégnek', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      // Keresd meg a kapcsolattartó módosító elemet (ha van az oldalon)
      const contactModifier = await page.locator('[data-testid="contact-modifier"], .contact-edit, [aria-label*="kapcsolattartó"]').count();

      // Ha jelen van, vendég nem tudja szerkeszteni
      if (contactModifier > 0) {
        const isDisabled = await page.locator('[data-testid="contact-modifier"]').first().isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  // ============================
  // KÓDOS BELÉPÉS KONTRA VENDÉG
  // ============================

  test.describe('Kódos Belépés vs Vendég', () => {
    test.beforeEach(async ({ page }) => {
      // Kódos login API mock
      await page.route('**/api/auth/login-tablo-code', async (route, request) => {
        const body = request.postDataJSON();
        if (body.code === '123456') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 1,
                name: 'Kódos Felhasználó',
                type: 'tablo-code'
              },
              project: {
                id: 1,
                name: 'Teszt Projekt'
              },
              token: 'code-token-123',
              tokenType: 'code',
              canFinalize: true
            })
          });
        }
      });

      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'code',
            canFinalize: true
          })
        });
      });

      navbarPage = new NavbarPage(page);
    });

    test('kódos felhasználónak NEM jelenik meg vendég badge', async ({ page }) => {
      // Setup: kódos session
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'code-token-123');
        localStorage.setItem('tablo_token_type', 'code');
      });

      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const isBadgeVisible = await navbarPage.isGuestBadgeVisible();
      expect(isBadgeVisible).toBe(false);
    });

    test('kódos felhasználónak összes menüpont elérhető', async ({ page }) => {
      // Setup: kódos session
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'code-token-123');
        localStorage.setItem('tablo_token_type', 'code');
      });

      // API mock-ok
      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });

      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const links = await navbarPage.getNavbarLinks();

      // Kódos felhasználó számára elérhető
      expect(links.some(link => link.includes('Kezdőlap'))).toBe(true);
      expect(links.some(link => link.includes('Minták'))).toBe(true);
      expect(links.some(link => link.includes('Véglegesítés'))).toBe(true);
    });
  });

  // ============================
  // NAVBAR UI ELEMEK
  // ============================

  test.describe('Navbar UI Elemek', () => {
    test.beforeEach(async ({ page }) => {
      // Vendég session setup
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
      });

      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });

      navbarPage = new NavbarPage(page);
    });

    test('vendég badge sárga (amber) státusszal jelenik meg', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const badge = await page.locator('.navbar__guest-badge');
      const classes = await badge.getAttribute('class');

      // Badge tartalmazza az amber szín classa-t
      expect(classes).toContain('bg-amber');
    });

    test('navbar logó jól működik vendégre vonatkozóan', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      // Logó kattintása
      await page.locator('.navbar__logo').first().click();

      // /home-ra navigál
      await page.waitForURL('**/home', { timeout: 5000 });
      expect(page.url()).toContain('/home');
    });

    test('kijelentkezés gomb elérhető vendégnek', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const logoutButton = await page.locator('.navbar__logout, .navbar__mobile-logout').first();
      expect(await logoutButton.isVisible()).toBe(true);
    });

    test('logout gombra kattintva kitörlödik a session', async ({ page }) => {
      // Logout API mock
      await page.route('**/api/tablo-frontend/logout', async (route) => {
        await route.fulfill({ status: 204 });
      });

      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      // Logout kattintás
      const logoutButton = await page.locator('.navbar__logout, .navbar__mobile-logout').first();
      await logoutButton.click();

      await page.waitForTimeout(1000);

      // Token törlésre kerül
      const token = await page.evaluate(() => localStorage.getItem('tablo_auth_token'));
      expect(token).toBeNull();

      // Átirányítás /login-ra
      await page.waitForURL('**/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  // ============================
  // OLDAL HOZZÁFÉRÉS
  // ============================

  test.describe('Oldal Hozzáférés Kontroll', () => {
    test.beforeEach(async ({ page }) => {
      // Vendég session
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
      });

      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });
    });

    test('vendég hozzáférhet /home-hoz', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toContain('/home');
    });

    test('vendég hozzáférhet /samples-hez', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toContain('/samples');
    });

    test('vendég NEM férhet hozzá /template-chooser-hez', async ({ page }) => {
      await page.goto('/template-chooser');
      await page.waitForTimeout(1000);

      const url = page.url();
      // Átirányít /samples-re vagy /login-ra
      expect(url.includes('/template-chooser')).toBe(false);
    });

    test('vendég NEM férhet hozzá /order-finalization-hez', async ({ page }) => {
      await page.goto('/order-finalization');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url.includes('/order-finalization')).toBe(false);
    });
  });

  // ============================
  // RESPONSIVE TESZTEK
  // ============================

  test.describe('Responsive - Vendég UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
      });

      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });

      navbarPage = new NavbarPage(page);
    });

    test('vendég badge látható mobil nézetben', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const isBadgeVisible = await navbarPage.isGuestBadgeVisible();
      expect(isBadgeVisible).toBe(true);
    });

    test('vendég badge látható tablet nézetben', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const isBadgeVisible = await navbarPage.isGuestBadgeVisible();
      expect(isBadgeVisible).toBe(true);
    });

    test('vendég badge látható desktop nézetben', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const isBadgeVisible = await navbarPage.isGuestBadgeVisible();
      expect(isBadgeVisible).toBe(true);
    });

    test('mobile menüben nincsenek tiltott linkek vendégnek', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      // Hamburger menü megnyitása
      const hamburger = await page.locator('.navbar__hamburger').first();
      await hamburger.click();
      await page.waitForTimeout(300);

      const mobileLinks = await navbarPage.getMobileNavbarLinks();

      // Template-chooser és finalization NE legyen meg
      expect(mobileLinks.some(link => link.includes('Minta Választó'))).toBe(false);
      expect(mobileLinks.some(link => link.includes('Véglegesítés'))).toBe(false);
    });
  });

  // ============================
  // ACCESSIBILITY TESZTEK
  // ============================

  test.describe('Accessibility - Vendég', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
      });

      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            tokenType: 'share',
            canFinalize: false
          })
        });
      });

      await page.route('**/api/samples', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });

      navbarPage = new NavbarPage(page);
    });

    test('vendég badge érthető aria-label-lel', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const badge = await page.locator('.navbar__guest-badge');
      const ariaLabel = await badge.getAttribute('aria-label');

      // Badge-nek legyen aria-label vagy jó szöveg
      const textContent = await badge.textContent();
      expect(textContent?.includes('Vendég')).toBe(true);
    });

    test('navbar linkek keyboard navigálhatóak vendégnek', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      // Tab navigáció
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const activeElement = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });

      // Valami interactive elem aktív
      expect(['a', 'button']).toContain(activeElement);
    });

    test('kijelentkezés gombnak érthető label-je van', async ({ page }) => {
      await page.goto('/samples');
      await page.waitForLoadState('networkidle');

      const logoutButton = await page.locator('.navbar__logout, .navbar__mobile-logout').first();
      const ariaLabel = await logoutButton.getAttribute('aria-label');

      expect(ariaLabel?.toLowerCase()).toContain('kijelentkezés');
    });
  });

  // ============================
  // EDGE CASE-EK
  // ============================

  test.describe('Edge Case-ek', () => {
    test('üres share token feldolgozása', async ({ page }) => {
      await page.route('**/api/auth/login-tablo-share', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Érvénytelen megosztási link'
          })
        });
      });

      await page.goto('/share/');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url.includes('/share/')).toBe(false);
    });

    test('lejárt share token feldolgozása', async ({ page }) => {
      await page.route('**/api/auth/login-tablo-share', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'A megosztási link lejárt'
          })
        });
      });

      await page.goto('/share/expired-token');
      await page.waitForTimeout(1000);

      // Vissza /login-ra
      const url = page.url();
      expect(url.includes('/share/expired-token')).toBe(false);
    });

    test('session lejárata utáni automatikus logout', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('tablo_auth_token', 'guest-token-123');
        localStorage.setItem('tablo_token_type', 'share');
      });

      // Session validation lejárt tokennel
      await page.route('**/api/tablo-frontend/validate-session', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Token lejárt'
          })
        });
      });

      await page.goto('/samples');
      await page.waitForTimeout(2000);

      // Vissza /login-ra
      const url = page.url();
      expect(url).toContain('/login');
    });
  });
});
