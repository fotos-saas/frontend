import { HttpError } from '../types/http-error.types';

export interface HandleErrorOptions {
  notFoundMessage?: string;
}

/**
 * Közös HTTP hibakezelő utility (A-változat: forum/newsfeed service-ek)
 *
 * Status kód alapján magyar hibaüzenet generálás.
 * @returns Error objektum a megfelelő üzenettel
 */
export function handleHttpError(error: HttpError, options?: HandleErrorOptions): Error {
  let message = 'Ismeretlen hiba történt';
  if (error.error?.message) {
    message = error.error.message;
  } else if (error.status === 401) {
    message = 'Nincs jogosultságod ehhez a művelethez';
  } else if (error.status === 403) {
    message = 'A hozzáférés megtagadva';
  } else if (error.status === 404) {
    message = options?.notFoundMessage || 'A keresett elem nem található';
  } else if (error.status === 422) {
    message = 'Érvénytelen adatok';
  } else if (error.status === 429) {
    message = 'Túl sok kérés, kérlek várj egy kicsit';
  }
  return new Error(message);
}

/**
 * Közös HTTP hibakezelő utility (B-változat: voting service-ek)
 *
 * Voting-specifikus hibák (internet, requires_class_size).
 * @returns Error objektum a megfelelő üzenettel
 */
export function handleVotingError(error: {
  error?: { message?: string; requires_class_size?: boolean };
  status?: number;
}): Error {
  let message = 'Hiba történt. Próbáld újra!';

  if (error.error?.message) {
    message = error.error.message;
  } else if (error.status === 0) {
    message = 'Nincs internetkapcsolat.';
  } else if (error.status === 422 && error.error?.requires_class_size) {
    message = 'Először állítsd be az osztálylétszámot!';
  }

  return new Error(message);
}

/**
 * Közös HTTP hibakezelő utility (C-változat: auth service-ek)
 *
 * Auth-specifikus hibák status kód alapú lookup tábla + ErrorEvent kezelés.
 * @param statusMessages - Status kód => üzenet mapping (service-specifikus)
 * @param fallbackMessage - Alap hibaüzenet ha nincs match
 * @returns Error objektum a megfelelő üzenettel
 */
export function handleAuthError(
  error: { error?: { message?: string } | ErrorEvent; status?: number },
  statusMessages: Record<number, string>,
  fallbackMessage = 'Hiba történt'
): Error {
  let errorMessage: string;

  if (error.error instanceof ErrorEvent) {
    errorMessage = 'Hálózati hiba. Ellenőrizd az internetkapcsolatot.';
  } else {
    const err = error.error as { message?: string } | undefined;
    errorMessage = err?.message || (error.status ? statusMessages[error.status] : undefined) || fallbackMessage;
  }

  return new Error(errorMessage);
}

/**
 * Közös HTTP hibakezelő utility (D-változat: client service-ek)
 *
 * Client-specifikus hibák: 401 esetén logoutot triggerel.
 * @param onUnauthorized - Callback 401 esetén (tipikusan logout)
 * @returns Error objektum a megfelelő üzenettel
 */
export function handleClientError(
  error: { status: number; error?: { message?: string; errors?: Record<string, string[]> } },
  onUnauthorized?: () => void
): Error {
  if (error.status === 401 && onUnauthorized) {
    onUnauthorized();
    return new Error('A munkamenet lejárt. Kérlek jelentkezz be újra.');
  }

  const message = error.error?.message ?? 'Hiba történt. Kérlek próbáld újra.';
  return new Error(message);
}
