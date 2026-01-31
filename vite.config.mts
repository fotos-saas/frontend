/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

/**
 * Vite + Vitest konfiguráció Angular projekthez
 *
 * @analogjs/vite-plugin-angular: Angular SFC support
 * Vitest: Fast unit testing with native ES modules
 */
export default defineConfig({
  plugins: [angular()],
  test: {
    // Vitest globális API automatikus importja (describe, it, expect, etc.)
    globals: true,

    // JSDOM environment az Angular DOM teszteléséhez
    environment: 'jsdom',

    // Test setup fájl - Angular testing module + MSW
    setupFiles: ['src/test-setup.ts'],

    // Coverage beállítások
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/public-api.ts',
        'src/mocks/**',
        'e2e/**',
      ],
    },

    // Tesztek elérési útja
    include: ['src/**/*.spec.ts'],

    // Kizárások
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],

    // Timeout (ms)
    testTimeout: 10000,

    // Reporter
    reporters: ['verbose'],

    // Browser tesztek depjei
    deps: {
      optimizer: {
        web: {
          include: ['@angular/core/testing', '@angular/platform-browser-dynamic/testing'],
        },
      },
    },
  },
});
