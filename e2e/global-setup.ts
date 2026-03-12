import { ApiHelper } from './helpers/api.helper';
import { MailpitHelper } from './helpers/mailpit.helper';

/**
 * Global setup a Journey tesztekhez.
 *
 * Lefut EGYSZER a teljes teszt suite előtt:
 * 1. Ellenőrzi, hogy a backend elérhető-e (e2e env)
 * 2. Reseteli az adatbázist (migrate:fresh + E2ESeeder)
 * 3. Törli a Mailpit inbox-ot
 */
export default async function globalSetup(): Promise<void> {
  const api = new ApiHelper();
  const mailpit = new MailpitHelper();

  try {
    await api.init();
    await mailpit.init();

    // 1. Health check — e2e környezet-e?
    console.log('[E2E Setup] Backend health check...');
    const health = await api.health();

    if (health.env !== 'e2e') {
      throw new Error(
        `Backend NEM e2e környezetben fut! (env: ${health.env}). ` +
          'Használj .env.e2e-t a backend-hez!'
      );
    }
    console.log('[E2E Setup] Backend OK (env: e2e)');

    // 2. DB reset + seed
    console.log('[E2E Setup] Adatbázis resetelése...');
    await api.resetDatabase();
    console.log('[E2E Setup] Adatbázis kész!');

    // 3. Mailpit inbox törlése
    console.log('[E2E Setup] Mailpit inbox törlése...');
    await mailpit.clearInbox();
    console.log('[E2E Setup] Mailpit OK');

    console.log('[E2E Setup] Minden kész, tesztek indulhatnak!');
  } catch (error) {
    console.error('[E2E Setup] HIBA:', error);
    throw error;
  } finally {
    await api.dispose();
    await mailpit.dispose();
  }
}
