import { environment } from '../../../environments/environment';

/**
 * URL Validation Utility
 *
 * Biztonságos URL validáció - XSS és javascript: protocol elleni védelem
 */

/**
 * Engedélyezett protokollok
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/**
 * Veszélyes protokollok (blacklist)
 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

/**
 * Ellenőrzi, hogy az URL biztonságos-e megnyitásra
 *
 * @param url - Az ellenőrizendő URL
 * @returns true ha biztonságos, false ha nem
 */
export function isSecureUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim és lowercase
  const trimmedUrl = url.trim().toLowerCase();

  // Üres URL nem biztonságos
  if (!trimmedUrl) {
    return false;
  }

  // Ellenőrizzük a veszélyes protokollokat
  for (const dangerous of DANGEROUS_PROTOCOLS) {
    if (trimmedUrl.startsWith(dangerous)) {
      return false;
    }
  }

  try {
    const parsed = new URL(url, window.location.origin);

    // Csak engedélyezett protokollok
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    return true;
  } catch {
    // Relatív URL-ek is megengedettek
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }

    return false;
  }
}

/**
 * Ellenőrzi, hogy az URL a saját API-nkhoz tartozik-e
 *
 * @param url - Az ellenőrizendő URL
 * @returns true ha saját API URL, false ha nem
 */
export function isOwnApiUrl(url: string | null | undefined): boolean {
  if (!isSecureUrl(url)) {
    return false;
  }

  const apiUrl = environment.apiUrl;

  // Relatív URL-ek (/api/...) mindig engedélyezettek
  if (url!.startsWith('/')) {
    return true;
  }

  // Abszolút URL-ek csak ha a saját API-nk
  try {
    const parsed = new URL(url!, window.location.origin);
    const apiParsed = new URL(apiUrl, window.location.origin);

    return parsed.origin === apiParsed.origin;
  } catch {
    return false;
  }
}

/**
 * Biztonságos URL megnyitás új ablakban
 *
 * @param url - A megnyitandó URL
 * @returns true ha sikerült, false ha nem biztonságos
 */
export function openSecureUrl(url: string | null | undefined): boolean {
  if (!isSecureUrl(url)) {
    return false;
  }

  // Biztonságos megnyitás noopener és noreferrer-rel
  window.open(url!, '_blank', 'noopener,noreferrer');
  return true;
}
