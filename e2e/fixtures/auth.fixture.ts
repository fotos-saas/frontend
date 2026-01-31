import { Page } from '@playwright/test';

/**
 * Authentication Fixture
 *
 * Auth session és login kezelése az E2E tesztek számára
 * Jelenleg: localStorage-ben tárolt auth token (nem valódi login)
 * Future: Mock login endpoint, session cookie
 */

export interface AuthSession {
  token: string;
  userId: string;
  projectId: string;
  email?: string;
  name?: string;
}

/**
 * Alap auth session adat
 */
export const mockAuthSessions = {
  // Teljes session adatok
  valid: {
    token: 'valid-token-123456',
    userId: 'user-1',
    projectId: 'project-123',
    email: 'user@example.com',
    name: 'Test User',
  } as AuthSession,

  // Minimal session
  minimal: {
    token: 'minimal-token',
    userId: 'user-2',
    projectId: 'project-456',
  } as AuthSession,

  // Érvénytelen token
  invalid: {
    token: 'invalid-token',
    userId: 'user-invalid',
    projectId: 'project-invalid',
  } as AuthSession,

  // Lejárt token
  expired: {
    token: 'expired-token-2024',
    userId: 'user-expired',
    projectId: 'project-expired',
  } as AuthSession,
};

/**
 * Auth Fixture Class
 *
 * Session kezelés és auth interceptor-ok
 */
export class AuthFixture {
  constructor(private page: Page) {}

  /**
   * Auth session beállítása localStorage-ben
   *
   * @param {AuthSession} session - Auth session adatok
   * @example
   * ```typescript
   * const auth = new AuthFixture(page);
   * await auth.setSession(mockAuthSessions.valid);
   * await page.goto('/');
   * ```
   */
  async setSession(session: AuthSession): Promise<void> {
    await this.page.evaluate((data) => {
      // Angular AuthService localstorage key-ek
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_session', JSON.stringify({
        userId: data.userId,
        projectId: data.projectId,
        email: data.email,
        name: data.name,
        timestamp: new Date().toISOString(),
      }));

      // Optional: sessionStorage az aktuális session-höz
      sessionStorage.setItem('current_project', data.projectId);
    }, session);
  }

  /**
   * Auth session eltávolítása (logout)
   */
  async clearSession(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_session');
      sessionStorage.removeItem('current_project');
    });
  }

  /**
   * Auth token lekérése localStorage-ből
   *
   * @returns {Promise<string | null>} Auth token vagy null
   */
  async getToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
  }

  /**
   * Session adat lekérése
   *
   * @returns {Promise<AuthSession | null>} Session adatok vagy null
   */
  async getSession(): Promise<AuthSession | null> {
    return await this.page.evaluate(() => {
      const sessionData = localStorage.getItem('auth_session');
      return sessionData ? JSON.parse(sessionData) : null;
    });
  }

  /**
   * Projekt ID lekérése az aktív session-ből
   *
   * @returns {Promise<string | null>} Projekt ID vagy null
   */
  async getProjectId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.projectId || null;
  }

  /**
   * Ellenőrizzük, hogy a felhasználó bejelentkezett-e
   *
   * @returns {Promise<boolean>} true ha van érvényes session
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token && token !== '';
  }

  /**
   * Mock login interceptor
   * (Future: valódi API endpoint mock-kolása)
   *
   * @param {string} email - Email cím
   * @param {string} password - Jelszó
   * @returns {Promise<AuthSession>} Mock auth session
   */
  async mockLogin(email: string, password: string): Promise<AuthSession> {
    // Jelenleg mock - Future implementálás:
    // 1. Intercept POST /api/auth/login
    // 2. Mock response return
    // 3. localStorage update

    const mockSession: AuthSession = {
      token: `token-${Date.now()}`,
      userId: `user-${email.split('@')[0]}`,
      projectId: 'project-mock',
      email,
      name: email.split('@')[0],
    };

    await this.setSession(mockSession);
    return mockSession;
  }

  /**
   * Mock logout interceptor
   * (Future: API endpoint mock-kolása)
   */
  async mockLogout(): Promise<void> {
    // Jelenység mock - Future implementálás:
    // 1. POST /api/auth/logout intercept
    // 2. Token invalidálás
    // 3. localStorage cleanup

    await this.clearSession();
  }

  /**
   * Session refresh mock
   * (Future: token refresh endpoint)
   *
   * @param {string} newToken - Új token
   */
  async mockRefreshToken(newToken: string): Promise<void> {
    const session = await this.getSession();
    if (session) {
      await this.setSession({
        ...session,
        token: newToken,
      });
    }
  }

  /**
   * Authorization header interceptor setup
   * (Future: API request-ek authentikációja)
   *
   * @example
   * ```typescript
   * const auth = new AuthFixture(page);
   * await auth.setupAuthInterceptor();
   * // Összes API request automatikusan kapja az Authorization headert
   * ```
   */
  async setupAuthInterceptor(): Promise<void> {
    const token = await this.getToken();

    if (token) {
      // Minden API request-hez Authorization header hozzáadása
      await this.page.route('**/api/**', async (route) => {
        const request = route.request();
        const headers = {
          ...request.headers(),
          'Authorization': `Bearer ${token}`,
        };

        await route.continue({ headers });
      });
    }
  }

  /**
   * CSRF token setup (ha szükséges)
   *
   * @param {string} token - CSRF token
   */
  async setCSRFToken(token: string): Promise<void> {
    await this.page.evaluate((csrfToken) => {
      document.cookie = `XSRF-TOKEN=${csrfToken}; path=/`;
      localStorage.setItem('csrf_token', csrfToken);
    }, token);
  }

  /**
   * Storage inspection (debugging)
   */
  async inspectStorage(): Promise<{
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  }> {
    return await this.page.evaluate(() => {
      const local: Record<string, string> = {};
      const session: Record<string, string> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) local[key] = localStorage.getItem(key) || '';
      }

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) session[key] = sessionStorage.getItem(key) || '';
      }

      return { localStorage: local, sessionStorage: session };
    });
  }

  /**
   * Storage teljes cleanup
   */
  async clearAllStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Auth Fixture Factory
 *
 * @param {Page} page - Playwright Page
 * @returns {AuthFixture} Auth segédfüggvények
 */
export function createAuthFixture(page: Page): AuthFixture {
  return new AuthFixture(page);
}
