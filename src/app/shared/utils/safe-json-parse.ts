/**
 * Biztonságos JSON parse utility
 * Malformed JSON esetén nem dob hibát, hanem fallback értéket ad vissza.
 *
 * @param json - A parse-olandó JSON string (vagy null)
 * @param fallback - Alapértelmezett érték hiba esetén
 * @returns A parse-olt objektum vagy a fallback érték
 *
 * @example
 * const user = safeJsonParse<AuthUser>(localStorage.getItem('user'), null);
 * const settings = safeJsonParse<Settings>(stored, { theme: 'light' });
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('[SafeJsonParse] Invalid JSON:', e);
    return fallback;
  }
}
