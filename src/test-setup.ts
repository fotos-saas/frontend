/**
 * Vitest Test Setup
 *
 * Ez a fájl fut le minden teszt előtt.
 * - Angular Testing környezet inicializálása
 * - Zone.js (Angular 18+ kötelezően igényli)
 * - Globális test utilities
 *
 * TESZTELÉSI MEGKÖZELÍTÉS:
 * - Unit tesztek: HttpClientTestingModule + async/await + firstValueFrom
 * - E2E tesztek: Playwright + MSW (böngésző környezetben)
 */
import 'zone.js';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Angular testing környezet inicializálása
let hasBootstraped = false;

export function initializeAngularTesting() {
  if (hasBootstraped) {
    return;
  }

  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    {
      teardown: { destroyAfterEach: true },
    }
  );

  hasBootstraped = true;
}

// jsdom polyfill: window.matchMedia (ElectronService használja a konstruktorban)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}

// Automatikus inicializálás ha Vitest globals aktív
if (typeof beforeAll !== 'undefined') {
  beforeAll(() => {
    initializeAngularTesting();
  });
}
