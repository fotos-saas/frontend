/**
 * Guest User Page Object Model
 *
 * Vendég felhasználó flow PageObject helper-ek
 * Share token belépés, navbar ellenőrzés, access control
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Guest Share Link Page Object
 */
export class GuestSharePage {
  readonly page: Page;
  readonly url = '/share';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigálás share token-nel
   */
  async navigateWithToken(token: string): Promise<void> {
    await this.page.goto(`${this.url}/${token}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Session ellenőrzése localStorage-ben
   */
  async getSessionToken(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('tablo_auth_token'));
  }

  /**
   * Token típus ellenőrzése (share vs code)
   */
  async getTokenType(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('tablo_token_type'));
  }

  /**
   * Session teljes kitörlése
   */
  async clearSession(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('tablo_auth_token');
      localStorage.removeItem('tablo_token_type');
      localStorage.removeItem('tablo_project');
    });
  }

  /**
   * Mock vendég session beállítása
   */
  async setupGuestSession(token: string = 'guest-token-123'): Promise<void> {
    await this.page.evaluate((sessionToken) => {
      localStorage.setItem('tablo_auth_token', sessionToken);
      localStorage.setItem('tablo_token_type', 'share');
      localStorage.setItem('tablo_project', JSON.stringify({
        id: 1,
        name: 'Teszt Projekt',
        schoolName: 'Teszt Iskola'
      }));
    }, token);
  }

  /**
   * Mock kódos session beállítása
   */
  async setupCodeSession(token: string = 'code-token-123'): Promise<void> {
    await this.page.evaluate((sessionToken) => {
      localStorage.setItem('tablo_auth_token', sessionToken);
      localStorage.setItem('tablo_token_type', 'code');
      localStorage.setItem('tablo_project', JSON.stringify({
        id: 1,
        name: 'Teszt Projekt',
        schoolName: 'Teszt Iskola'
      }));
    }, token);
  }
}

/**
 * Navbar Access Control Page Object
 */
export class NavbarAccessPage {
  readonly page: Page;

  // Navbar lokátorok
  readonly guestBadge: Locator;
  readonly navbar: Locator;
  readonly navbarLinks: Locator;
  readonly mobileNavbarLinks: Locator;
  readonly finalizationLink: Locator;
  readonly templateChooserLink: Locator;
  readonly samplesLink: Locator;
  readonly homeLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.guestBadge = page.locator('.navbar__guest-badge');
    this.navbar = page.locator('nav[role="navigation"]');
    this.navbarLinks = page.locator('.navbar__link');
    this.mobileNavbarLinks = page.locator('.navbar__mobile-menu-link');
    this.finalizationLink = page.locator('.navbar__link').filter({ hasText: /Véglegesítés/ });
    this.templateChooserLink = page.locator('.navbar__link').filter({ hasText: /Minta Választó/ });
    this.samplesLink = page.locator('.navbar__link').filter({ hasText: /Minták/ });
    this.homeLink = page.locator('.navbar__link').filter({ hasText: /Kezdőlap/ });
  }

  /**
   * Ellenőrzés: Vendég badge látható-e?
   */
  async isGuestBadgeVisible(): Promise<boolean> {
    try {
      await this.guestBadge.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vendég badge szöveg lekérése
   */
  async getGuestBadgeText(): Promise<string | null> {
    try {
      return await this.guestBadge.textContent({ timeout: 2000 });
    } catch {
      return null;
    }
  }

  /**
   * Navbar összes link szövege
   */
  async getNavbarLinksText(): Promise<string[]> {
    const links = await this.navbarLinks.allTextContents();
    return links.map(text => text.trim()).filter(text => text.length > 0);
  }

  /**
   * Mobile navbar összes link szövege
   */
  async getMobileNavbarLinksText(): Promise<string[]> {
    const links = await this.mobileNavbarLinks.allTextContents();
    return links.map(text => text.trim()).filter(text => text.length > 0);
  }

  /**
   * Ellenőrzés: Véglegesítés link látható-e?
   */
  async isFinalizationLinkVisible(): Promise<boolean> {
    try {
      await this.finalizationLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ellenőrzés: Template Választó link látható-e?
   */
  async isTemplateChooserLinkVisible(): Promise<boolean> {
    try {
      await this.templateChooserLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ellenőrzés: Minták link látható-e?
   */
  async isSamplesLinkVisible(): Promise<boolean> {
    try {
      await this.samplesLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ellenőrzés: Kezdőlap link látható-e?
   */
  async isHomeLinkVisible(): Promise<boolean> {
    try {
      await this.homeLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Link kattintása szöveg alapján
   */
  async clickLinkByText(text: string): Promise<void> {
    await this.navbarLinks.filter({ hasText: new RegExp(text, 'i') }).first().click();
  }

  /**
   * Logout gomb kattintása
   */
  async clickLogout(): Promise<void> {
    const logoutButton = this.page.locator('.navbar__logout, .navbar__mobile-logout').first();
    await logoutButton.click();
  }

  /**
   * Ellenőrzés: Badge-en van-e amber (sárga) szín?
   */
  async hasBadgeAmberColor(): Promise<boolean> {
    const classes = await this.guestBadge.getAttribute('class');
    return classes?.includes('bg-amber') || classes?.includes('amber') || false;
  }

  /**
   * Logo kattintása
   */
  async clickLogo(): Promise<void> {
    await this.page.locator('.navbar__logo').first().click();
  }

  /**
   * Mobile hamburger megnyitása
   */
  async openMobileMenu(): Promise<void> {
    const hamburger = this.page.locator('.navbar__hamburger').first();
    const isOpen = await hamburger.evaluate((el) => el.classList.contains('navbar__hamburger--open'));

    if (!isOpen) {
      await hamburger.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Mobile hamburger bezárása
   */
  async closeMobileMenu(): Promise<void> {
    const hamburger = this.page.locator('.navbar__hamburger').first();
    const isOpen = await hamburger.evaluate((el) => el.classList.contains('navbar__hamburger--open'));

    if (isOpen) {
      await hamburger.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Navbar betöltési ellenőrzés
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.navbar.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Routing Guard Tester
 */
export class RoutingGuardTester {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Ellenőrzés: Oldalhoz hozzáfér-e a vendég?
   * Ha átirányít más oldalra, false-t ad vissza
   */
  async canAccessPage(path: string, allowedRedirects: string[] = []): Promise<boolean> {
    const originalUrl = this.page.url();

    try {
      await this.page.goto(path);
      await this.page.waitForLoadState('networkidle');
      const finalUrl = this.page.url();

      // Ha az URL megváltozott, nincs hozzáférés
      if (!finalUrl.includes(path)) {
        const isRedirectAllowed = allowedRedirects.some(redirect => finalUrl.includes(redirect));
        return isRedirectAllowed;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ellenőrzés: Vendégre vonatkozó korlátozások
   */
  async verifyGuestRestrictions(): Promise<{
    canAccessHome: boolean;
    canAccessSamples: boolean;
    canAccessTemplateChooser: boolean;
    canAccessFinalization: boolean;
  }> {
    return {
      canAccessHome: await this.canAccessPage('/home', ['/home']),
      canAccessSamples: await this.canAccessPage('/samples', ['/samples']),
      canAccessTemplateChooser: await this.canAccessPage('/template-chooser', ['/samples', '/login']),
      canAccessFinalization: await this.canAccessPage('/order-finalization', ['/samples', '/login'])
    };
  }

  /**
   * Ellenőrzés: Kódos felhasználóra vonatkozó teljes hozzáférés
   */
  async verifyCodeUserFullAccess(): Promise<{
    canAccessHome: boolean;
    canAccessSamples: boolean;
    canAccessTemplateChooser: boolean;
    canAccessFinalization: boolean;
  }> {
    return {
      canAccessHome: await this.canAccessPage('/home', ['/home']),
      canAccessSamples: await this.canAccessPage('/samples', ['/samples']),
      canAccessTemplateChooser: await this.canAccessPage('/template-chooser', ['/template-chooser']),
      canAccessFinalization: await this.canAccessPage('/order-finalization', ['/order-finalization'])
    };
  }
}

/**
 * Contact Modifier Accessibility Tester
 */
export class ContactModifierTester {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Ellenőrzés: Kapcsolattartó szerkesztő elérhető-e?
   */
  async isContactModifierAvailable(): Promise<boolean> {
    try {
      const contactElements = await this.page.locator(
        '[data-testid="contact-modifier"], .contact-edit, [aria-label*="kapcsolattartó"], [aria-label*="contact"]'
      ).count();

      return contactElements > 0;
    } catch {
      return false;
    }
  }

  /**
   * Ellenőrzés: Kapcsolattartó szerkesztő disabled-e?
   */
  async isContactModifierDisabled(): Promise<boolean> {
    try {
      const modifier = this.page.locator('[data-testid="contact-modifier"]').first();
      return await modifier.isDisabled();
    } catch {
      return false;
    }
  }

  /**
   * Ellenőrzés: Vendég nem módosíthatja a kapcsolattartót
   */
  async verifyGuestCannotModifyContact(): Promise<boolean> {
    const isAvailable = await this.isContactModifierAvailable();

    if (!isAvailable) {
      // Ha nincs elérhetô, jó
      return true;
    }

    // Ha van, de disabled, szintén jó
    return await this.isContactModifierDisabled();
  }
}
