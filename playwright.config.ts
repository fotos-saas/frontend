import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E teszt konfiguráció
 *
 * Két teszt mód:
 * 1. Unit tesztek (e2e/tests/) — párhuzamos, gyors, mock-alapú
 * 2. Journey tesztek (e2e/journeys/) — szekvenciális, valós API, egymásra épülő
 *
 * Futtatás:
 *   npm run e2e              → unit tesztek (párhuzamos)
 *   npm run e2e:journey      → journey tesztek (szekvenciális, valós DB)
 *   npm run e2e:smoke        → smoke tesztek (PR-ekhez, gyors)
 *   npm run e2e:ui           → interaktív UI mód
 */
export default defineConfig({
  timeout: 30 * 1000,

  expect: {
    timeout: 10 * 1000,
  },

  use: {
    baseURL: 'http://localhost:4205',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4205',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },

  testDir: './e2e',

  // Unit tesztek + smoke tesztek
  testMatch: ['tests/**/*.spec.ts', 'smoke/**/*.smoke.ts'],

  workers: process.env.CI ? 1 : 3,

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
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],

  globalTimeout: 30 * 60 * 1000,

  retries: process.env.CI ? 2 : 0,

  fullyParallel: true,
});
