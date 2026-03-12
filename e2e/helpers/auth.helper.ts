import { Page } from '@playwright/test';
import { ApiHelper } from './api.helper';

/**
 * Auth helper — bejelentkezés és session kezelés E2E tesztekhez.
 *
 * Két módot támogat:
 * 1. API login — közvetlenül a backend-en keresztül (gyors, seeder-ekhez)
 * 2. UI login — a böngészőn keresztül (valódi user flow tesztelés)
 */
export class AuthHelper {
  constructor(
    private page: Page,
    private api: ApiHelper
  ) {}

  /**
   * API-n keresztüli bejelentkezés, majd a token beállítása a böngészőben.
   * Gyors — nem kell a login UI-t végigkattintani.
   */
  async loginViaApi(email: string, password: string): Promise<string> {
    const result = await this.api.login(email, password);
    const token = result.token;

    // Navigálni kell egy oldalra, mert about:blank-on nincs sessionStorage hozzáférés
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');

    // Token beállítása a böngészőben (sessionStorage — a rendszer így tárolja)
    await this.page.evaluate((t) => {
      sessionStorage.setItem('client_token', t);
    }, token);

    return token;
  }

  /**
   * Partner bejelentkezés a UI-n keresztül (valódi flow).
   * A /login oldalon az "Email/Jelszó" tabre kell váltani.
   */
  async loginViaUi(email: string, password: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // "Email/Jelszó" tabra váltás
    await this.page.getByRole('tab', { name: /email/i }).click();

    // Form kitöltése (ps-input komponens, benne input)
    await this.page.locator('ps-input[formcontrolname="email"] input').fill(email);
    await this.page.locator('ps-input[formcontrolname="password"] input').fill(password);
    await this.page.getByRole('button', { name: /bejelentkezés/i }).click();

    // Várakozás a dashboard-ra
    await this.page.waitForURL(/\/partner/, { timeout: 15_000 });
  }

  /**
   * Vendég belépés kóddal (tabló frontend).
   */
  async loginAsGuest(accessCode: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // A "6-jegyű kód" tab alapértelmezetten aktív
    // pressSequentially kell a ps-code-input-hoz (onInput event triggerelés)
    const codeInput = this.page.locator('ps-code-input input');
    await codeInput.click();
    await codeInput.pressSequentially(accessCode, { delay: 50 });

    await this.page.getByRole('button', { name: /belépés kóddal/i }).click();

    await this.page.waitForURL(/\/(home|samples|finalization|session-chooser|choose-session)/, { timeout: 15_000 });
  }

  /** Kijelentkezés — sessionStorage törlése + navigálás. */
  async logout(): Promise<void> {
    await this.page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await this.page.goto('/');
  }

  /** Ellenőrzés, hogy be van-e jelentkezve. */
  async isLoggedIn(): Promise<boolean> {
    return this.page.evaluate(() => {
      return !!sessionStorage.getItem('client_token') ||
             !!sessionStorage.getItem('marketer_token');
    });
  }
}
