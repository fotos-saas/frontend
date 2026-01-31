/**
 * MSW Node Setup
 *
 * Node.js alapú mock unit tesztekhez (Vitest).
 * Network-level API mocking tesztkörnyezetben.
 */
import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

/**
 * MSW Server instance unit tesztekhez
 */
export const server = setupServer(...handlers);

/**
 * Error handler-ek hozzáadása teszteléshez
 * Használd: server.use(...errorHandlers)
 */
export { errorHandlers };

/**
 * Test Utilities - MSW server kezelés
 */
export const mswTestUtils = {
  /**
   * Server indítása beforeAll-ban
   */
  start: () => server.listen({ onUnhandledRequest: 'bypass' }),

  /**
   * Handler-ek resetelése afterEach-ben
   */
  reset: () => server.resetHandlers(),

  /**
   * Server leállítása afterAll-ban
   */
  close: () => server.close(),

  /**
   * Egyedi handler hozzáadása egy teszthez
   */
  use: server.use.bind(server)
};
