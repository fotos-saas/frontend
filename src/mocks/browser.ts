/**
 * MSW Browser Setup
 *
 * Service Worker alapú mock a böngészőben.
 * Fejlesztés és manuális tesztelés közben használható.
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Worker instance
 * Böngészőben intercept-eli a network kéréseket
 */
export const worker = setupWorker(...handlers);

/**
 * MSW indítása fejlesztési módban
 * Hívd meg az app inicializáláskor ha mock API-t akarsz
 */
export async function startMockServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined') {
    await worker.start({
      onUnhandledRequest: 'bypass', // Nem mockolt kérések átmennek
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
    console.log('[MSW] Mock Service Worker started');
  }
}
