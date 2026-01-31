/**
 * Guest User Test Fixtures
 *
 * Mock API válaszok és session adatok vendég felhasználó teszteléshez
 */

import { Page } from '@playwright/test';

/**
 * Guest User Mock Responses
 */
export const guestMockResponses = {
  // Sikeres share token belépés
  shareLoginSuccess: {
    user: {
      id: 999,
      name: 'Vendég Felhasználó',
      email: null,
      type: 'tablo-guest'
    },
    project: {
      id: 1,
      name: 'Teszt Projekt 2026',
      schoolName: 'Teszt Iskola',
      className: '10.A',
      classYear: '2025'
    },
    token: 'share-token-jwt-' + Date.now(),
    tokenType: 'share',
    canFinalize: false
  },

  // Érvénytelen share token
  shareLoginInvalid: {
    message: 'Érvénytelen megosztási link'
  },

  // Lejárt share token
  shareLoginExpired: {
    message: 'A megosztási link lejárt'
  },

  // Session validálás - vendég
  validateSessionGuest: {
    valid: true,
    project: {
      id: 1,
      name: 'Teszt Projekt'
    },
    tokenType: 'share',
    canFinalize: false
  },

  // Session validálás - kódos felhasználó
  validateSessionCode: {
    valid: true,
    project: {
      id: 1,
      name: 'Teszt Projekt'
    },
    tokenType: 'code',
    canFinalize: true
  },

  // Session lejárt
  validateSessionExpired: {
    message: 'Token lejárt'
  },

  // Minták lista
  samplesList: {
    success: true,
    data: [
      {
        id: 1,
        url: '/images/sample-1.jpg',
        name: 'Minta 1',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        url: '/images/sample-2.jpg',
        name: 'Minta 2',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        url: '/images/sample-3.jpg',
        name: 'Minta 3',
        createdAt: new Date().toISOString()
      }
    ]
  },

  // Projekt info
  projectInfo: {
    success: true,
    data: {
      schoolName: 'Teszt Iskola',
      className: '10.A',
      classYear: '2025',
      hasOrderData: false,
      hasOrderAnalysis: false,
      hasMissingPersons: false,
      hasTemplateChooser: false,
      selectedTemplatesCount: 0,
      samplesCount: 3
    }
  }
};

/**
 * Guest User Test Fixture Class
 *
 * Beállítja a mock API válaszokat és session adatokat
 */
export class GuestFixture {
  constructor(private page: Page) {}

  /**
   * Setup összes mock API végpont vendég felhasználóhoz
   */
  async setupGuestApiMocks(): Promise<void> {
    // Share token login
    await this.page.route('**/api/auth/login-tablo-share', async (route) => {
      const token = this.page.url().split('/share/')[1];

      if (token === 'valid-share-token') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.shareLoginSuccess)
        });
      } else if (token === 'expired-token') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.shareLoginExpired)
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.shareLoginInvalid)
        });
      }
    });

    // Session validálás
    await this.page.route('**/api/tablo-frontend/validate-session', async (route) => {
      const tokenType = await this.page.evaluate(() => localStorage.getItem('tablo_token_type'));

      if (tokenType === 'share') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.validateSessionGuest)
        });
      } else if (tokenType === 'code') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.validateSessionCode)
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(guestMockResponses.validateSessionExpired)
        });
      }
    });

    // Minták betöltése
    await this.page.route('**/api/samples', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestMockResponses.samplesList)
      });
    });

    // Projekt info
    await this.page.route('**/api/tablo-frontend/project-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestMockResponses.projectInfo)
      });
    });

    // Logout
    await this.page.route('**/api/tablo-frontend/logout', async (route) => {
      await route.fulfill({ status: 204 });
    });
  }

  /**
   * Setup mock API válaszok kódos felhasználóhoz
   */
  async setupCodeUserApiMocks(): Promise<void> {
    // Kódos login
    await this.page.route('**/api/auth/login-tablo-code', async (route, request) => {
      const body = request.postDataJSON();

      if (body.code === '123456') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 1,
              name: 'Kódos Felhasználó',
              email: 'user@example.com',
              type: 'tablo-code'
            },
            project: {
              id: 1,
              name: 'Teszt Projekt 2026',
              schoolName: 'Teszt Iskola',
              className: '10.A',
              classYear: '2025'
            },
            token: 'code-token-jwt-' + Date.now(),
            tokenType: 'code',
            canFinalize: true
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Érvénytelen belépési kód'
          })
        });
      }
    });

    // Session validálás
    await this.page.route('**/api/tablo-frontend/validate-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestMockResponses.validateSessionCode)
      });
    });

    // Minták betöltése
    await this.page.route('**/api/samples', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestMockResponses.samplesList)
      });
    });

    // Projekt info
    await this.page.route('**/api/tablo-frontend/project-info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestMockResponses.projectInfo)
      });
    });

    // Logout
    await this.page.route('**/api/tablo-frontend/logout', async (route) => {
      await route.fulfill({ status: 204 });
    });
  }

  /**
   * Mock session adatok előre beállítása (localStorage)
   */
  async setGuestSessionLocally(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem('tablo_auth_token', 'guest-token-' + Date.now());
      localStorage.setItem('tablo_token_type', 'share');
      localStorage.setItem('tablo_project', JSON.stringify({
        id: 1,
        name: 'Teszt Projekt 2026',
        schoolName: 'Teszt Iskola',
        className: '10.A',
        classYear: '2025'
      }));
    });
  }

  /**
   * Mock session adatok előre beállítása kódos felhasználóhoz
   */
  async setCodeSessionLocally(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem('tablo_auth_token', 'code-token-' + Date.now());
      localStorage.setItem('tablo_token_type', 'code');
      localStorage.setItem('tablo_project', JSON.stringify({
        id: 1,
        name: 'Teszt Projekt 2026',
        schoolName: 'Teszt Iskola',
        className: '10.A',
        classYear: '2025'
      }));
    });
  }

  /**
   * Session kitörlése
   */
  async clearSession(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('tablo_auth_token');
      localStorage.removeItem('tablo_token_type');
      localStorage.removeItem('tablo_project');
    });
  }

  /**
   * Teljes setup: API mock-ok + session (vendég)
   */
  async setupFullGuestEnvironment(): Promise<void> {
    await this.setupGuestApiMocks();
    await this.setGuestSessionLocally();
  }

  /**
   * Teljes setup: API mock-ok + session (kódos)
   */
  async setupFullCodeUserEnvironment(): Promise<void> {
    await this.setupCodeUserApiMocks();
    await this.setCodeSessionLocally();
  }
}

/**
 * Fixture factory
 */
export function createGuestFixture(page: Page): GuestFixture {
  return new GuestFixture(page);
}
