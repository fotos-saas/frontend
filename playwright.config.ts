import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E teszt konfiguráció
 *
 * Három böngészőn (chromium, firefox, webkit) futó tesztek
 * Angular dev server szükséges: ng serve --port 4205
 */
export default defineConfig({
  // Tesztek alapértelmezett időkorlátja (10 másodperc)
  timeout: 10 * 1000,

  // Expect assertion timeout (5 másodperc)
  expect: {
    timeout: 5 * 1000,
  },

  /**
   * Futtatási beállítások
   */
  use: {
    // Alapszintű URL - minden nav() automatikusan ide relatív
    baseURL: 'http://localhost:4205',

    // Screenshot készítése sikertelen teszt után
    screenshot: 'only-on-failure',

    // Trace fájl készítése első retry-ra
    trace: 'on-first-retry',

    // Videó felvétel (opcionális, kommentezettük ki a teljesítmény miatt)
    // video: 'retain-on-failure',
  },

  /**
   * Angular dev server indítása teszt előtt
   *
   * A teszt automatikusan megvárja a szervert, nem kell külön terminálban indítani
   * reuseExistingServer: true - ha már fut a szerver, használja azt
   */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4205',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120000,
  },

  /**
   * Teszt fájlok konfigurációja
   *
   * - e2e/tests/** : E2E teszt fájlok helye
   * - Ne futasson .page.ts vagy .fixture.ts fájlokat
   */
  testMatch: 'e2e/tests/**/*.spec.ts',

  /**
   * Szerializációs beállítások
   */
  testDir: './e2e',

  /**
   * Párhuzamos futtatás: 3 dolgozó
   *
   * CI környezetben 1 dolgozóval futunk (kevesebb memória)
   */
  workers: process.env.CI ? 1 : 3,

  /**
   * Böngészők konfigurációja
   *
   * CI: Csak Chromium (gyorsabb)
   * Local: Chromium, Firefox, WebKit - teljes cross-browser kompatibilitas
   */
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },

        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },

        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  /**
   * Reporter beállítások
   *
   * - html: Interaktív HTML report
   * - json: JSON export CI integrációhoz
   * - junit: JUnit XML a CI/CD pipeline-hez
   */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],

  /**
   * Globális timeout (máx. 30 másodperc per teszt)
   */
  globalTimeout: 30 * 60 * 1000,

  /**
   * Sikertelen tesztek újrapróbálása
   *
   * Elsődleges futtatás sikertelen → 1x újra (trace=on-first-retry)
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Fejléc beállítások (CI illetve local detektálás)
   *
   * GitHub Actions / GitLab CI detektálása
   */
  fullyParallel: true,
});
