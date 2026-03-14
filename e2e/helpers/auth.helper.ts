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

    // Token beállítása a böngészőben (sessionStorage — a rendszer így tárolja)
    await this.page.evaluate((t) => {
      sessionStorage.setItem('client_token', t);
    }, token);

    return token;
  }

  /**
   * Partner bejelentkezés a UI-n keresztül (valódi flow).
   */
  async loginViaUi(email: string, password: string): Promise<void> {
    await this.page.goto('/partner/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input[type="email"], input[formControlName="email"]', email);
    await this.page.fill('input[type="password"], input[formControlName="password"]', password);
    await this.page.getByRole('button', { name: /belépés|bejelentkezés/i }).click();

    // Várakozás a dashboard-ra
    await this.page.waitForURL(/\/partner/, { timeout: 15_000 });
  }

  /**
   * Vendég belépés kóddal (tabló frontend).
   */
  async loginAsGuest(accessCode: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input#code, input[formControlName="code"]', accessCode);
    await this.page.getByRole('button', { name: /belépés/i }).click();

    await this.page.waitForURL(/\/(home|samples|finalization)/, { timeout: 15_000 });
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
