import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Journey teszt konfiguráció
 *
 * Journey tesztek = egymásra épülő, valós API-val dolgozó tesztek.
 * SZEKVENCIÁLISAN futnak (1 worker), mert az adatok egymásra épülnek.
 *
 * Futtatás:
 *   npm run e2e:journey
 *
 * Előfeltétel:
 *   - Docker backend fut (docker compose -f docker-compose.dev.yml up -d)
 *   - E2E adatbázis resetelve (docker exec photostack-app php artisan e2e:reset --seed)
 *   - Angular dev server fut (npm run start)
 */
export default defineConfig({
  timeout: 60 * 1000,

  expect: {
    timeout: 15 * 1000,
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
  testMatch: 'journeys/**/*.spec.ts',

  // FONTOS: Journey tesztek SORBAN futnak!
  workers: 1,
  fullyParallel: false,

  // Journey-knél csak Chromium (gyorsabb feedback)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [
    ['html', { outputFolder: 'playwright-report-journey' }],
    ['json', { outputFile: 'playwright-report-journey/results.json' }],
  ],

  globalTimeout: 60 * 60 * 1000, // 1 óra max

  retries: 1,

  // Global setup: DB reset + seed a journey futás elején
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
