/**
 * Ha az apiBaseUrl relatív (pl. "/api"), kiegészíti teljes URL-re.
 * Node.js HTTP kérésekhez kell, mert a `new URL()` nem fogad relatív path-ot.
 *
 * FONTOS: Dev módban is az éles API-t használjuk, mert a token az éles
 * szerverhez tartozik (az Angular dev proxy is oda küld).
 */
const API_BASE = 'https://api.tablostudio.hu/api';

export function resolveApiBaseUrl(apiBaseUrl: string): string {
  if (apiBaseUrl.startsWith('http')) {
    return apiBaseUrl;
  }
  return API_BASE;
}
