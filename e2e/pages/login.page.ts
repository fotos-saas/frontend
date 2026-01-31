/**
 * Login Page Object Model
 *
 * A bejelentkező oldal interakcióinak és lokátorainak összefoglalása.
 * Ez a POM az E2E tesztekben újrahasználható.
 */
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // URL
  readonly url = '/login';

  // Lokátorok
  readonly loginForm: Locator;
  readonly codeInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly logoImage: Locator;
  readonly titleText: Locator;
  readonly instructionText: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elemek
    this.loginForm = page.locator('form');
    this.codeInput = page.locator('input#code');
    this.submitButton = page.getByRole('button', { name: /belépés/i });
    this.errorMessage = page.locator('.login-page__error');
    this.logoImage = page.locator('img[alt*="logo"], .logo');
    this.titleText = page.getByRole('heading', { level: 1 });
    this.instructionText = page.locator('.instruction, .help-text, .description');
    this.loadingIndicator = page.locator('.loading, .spinner, [data-loading]');
  }

  /**
   * Navigálás a login oldalra
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Oldal betöltés megvárása
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Kód megadása és bejelentkezés
   */
  async login(code: string): Promise<void> {
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }

  /**
   * Ellenőrzés, hogy az oldal betöltődött
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.codeInput.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hibamüzenet szöveg lekérése
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Kód input értéke
   */
  async getCodeInputValue(): Promise<string> {
    return await this.codeInput.inputValue();
  }

  /**
   * Submit gomb enabled-e
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Sikeres bejelentkezés utáni navigáció megvárása
   */
  async waitForSuccessfulLogin(): Promise<void> {
    // Ha sikeres, átirányít a /home vagy más oldalra
    await this.page.waitForURL(/\/(home|samples|finalization)/, { timeout: 10000 });
  }

  /**
   * Ellenőrzés, hogy loading van-e
   */
  async isLoading(): Promise<boolean> {
    try {
      await this.loadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Input mező törlése
   */
  async clearCodeInput(): Promise<void> {
    await this.codeInput.clear();
  }
}
