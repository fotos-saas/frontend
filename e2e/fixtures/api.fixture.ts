import { Page, APIRequestContext } from '@playwright/test';

/**
 * API Mock / Stubbing Helper
 *
 * Future: Mock API responses az E2E tesztek számára
 * Jelenleg: Segédfüggvények az API interception-hez
 */

export class ApiFixture {
  constructor(
    private page: Page,
    private request?: APIRequestContext
  ) {}

  /**
   * Projekt adatok API endpoint mockkolása
   *
   * @param {any} projectData - Mockolt projekt adat
   * @example
   * ```typescript
   * const api = new ApiFixture(page);
   * await api.mockGetProject(mockProjectData.complete);
   * ```
   */
  async mockGetProject(projectData: any): Promise<void> {
    await this.page.route('**/api/projects/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projectData),
      });
    });
  }

  /**
   * Projekt módosítás API endpoint mockkolása
   *
   * @param {any} responseData - API válasz adat
   */
  async mockUpdateProject(responseData: any): Promise<void> {
    await this.page.route('**/api/projects/**', (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responseData),
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Fotózási dátum frissítés mockkolása
   *
   * @param {string} projectId - Projekt ID
   * @param {string} photoDate - Fotózási dátum
   */
  async mockUpdatePhotoDate(projectId: string, photoDate: string): Promise<void> {
    await this.page.route(`**/api/projects/${projectId}/**`, (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: projectId,
            photoDate,
            success: true,
          }),
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Kapcsolattartó frissítés mockkolása
   *
   * @param {any} contactData - Módosított kontakt adat
   */
  async mockUpdateContact(contactData: any): Promise<void> {
    await this.page.route('**/api/contacts/**', (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(contactData),
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * API hiba szimuláció
   *
   * @param {number} statusCode - HTTP status kód (pl. 500, 403)
   * @param {string} [pattern='**/api/**'] - URL pattern
   */
  async mockApiError(statusCode: number = 500, pattern: string = '**/api/**'): Promise<void> {
    await this.page.route(pattern, (route) => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({
          error: `API Error: ${statusCode}`,
          message: 'Request failed',
        }),
      });
    });
  }

  /**
   * API request timeout szimuláció
   *
   * @param {string} [pattern='**/api/**'] - URL pattern
   * @param {number} [delay=3000] - Delay milliszekundumban
   */
  async mockApiTimeout(pattern: string = '**/api/**', delay: number = 3000): Promise<void> {
    await this.page.route(pattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      route.abort('timedout');
    });
  }

  /**
   * Összes API route eltávolítása (cleanup)
   */
  async clearAllMocks(): Promise<void> {
    await this.page.unroute('**');
  }

  /**
   * Network request-ek monitorozása
   *
   * @returns {Promise<string[]>} API endpoint-ok listája
   */
  async getNetworkRequests(): Promise<string[]> {
    const requests: string[] = [];

    this.page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });

    return requests;
  }

  /**
   * Auth session mockkolása (localStorage)
   *
   * @param {any} sessionData - Session adat
   */
  async mockAuthSession(sessionData: any): Promise<void> {
    await this.page.evaluate((data) => {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_session', JSON.stringify(data));
    }, sessionData);
  }

  /**
   * LocalStorage cleanup
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * API Fixture Factory
 *
 * @param {Page} page - Playwright Page objektum
 * @returns {ApiFixture} API segédfüggvények
 *
 * @example
 * ```typescript
 * const api = createApiFixture(page);
 * await api.mockGetProject(mockProjectData);
 * ```
 */
export function createApiFixture(page: Page): ApiFixture {
  return new ApiFixture(page);
}
