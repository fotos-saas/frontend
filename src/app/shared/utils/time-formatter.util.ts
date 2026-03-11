/**
 * Time Formatter Utility
 *
 * Relatív időformázás magyar nyelven — SINGLE SOURCE OF TRUTH.
 * Használható: pipe, komponens, service, util — MINDIG ezt hívd!
 */

export interface FormatTimeAgoOptions {
  /**
   * Ha true, 7+ napos dátumnál formázott dátumot ad vissza (pl. "2026.01.15.")
   * Ha false (alapértelmezett), hete/hónapja/éve szöveget ad.
   */
  fallbackToDate?: boolean;
}

/**
 * Relatív idő formázás magyar nyelven
 *
 * @param value - ISO dátum string, Date objektum, null vagy undefined
 * @param options - Opcionális beállítások
 * @returns Magyar nyelvű relatív idő (pl. "most", "5 perce", "2 órája", "3 napja")
 *
 * @example
 * formatTimeAgo('2024-01-15T10:30:00Z')                    // => "2 órája"
 * formatTimeAgo(new Date())                                  // => "most"
 * formatTimeAgo('2024-01-15T10:30:00Z', { fallbackToDate: true }) // => "2024.01.15."
 */
export function formatTimeAgo(
  value: string | Date | null | undefined,
  options?: FormatTimeAgoOptions,
): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  // Érvénytelen dátum ellenőrzés
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Jövőbeli dátum
  if (diffMs < 0) {
    return formatFuture(Math.abs(diffMs));
  }

  return formatPast(diffMs, date, options);
}

/**
 * Múltbeli idő formázás
 */
function formatPast(diffMs: number, date: Date, options?: FormatTimeAgoOptions): string {
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSecs < 60) return 'most';
  if (diffMins < 60) return `${diffMins} perce`;
  if (diffHours < 24) return `${diffHours} órája`;
  if (diffDays < 7) return `${diffDays} napja`;

  // 7+ napos dátum: vagy formázott dátum, vagy relatív szöveg
  if (options?.fallbackToDate) {
    return formatHungarianDate(date);
  }

  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffWeeks < 4) return `${diffWeeks} hete`;
  if (diffMonths < 12) return `${diffMonths} hónapja`;
  return `${diffYears} éve`;
}

/**
 * Jövőbeli idő formázás (pl. szavazás határideje)
 */
function formatFuture(diffMs: number): string {
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} perc múlva`;
  if (diffHours < 24) return `${diffHours} óra múlva`;
  if (diffDays < 7) return `${diffDays} nap múlva`;
  return `${Math.floor(diffDays / 7)} hét múlva`;
}

/**
 * Magyar formázott dátum: "YYYY.MM.DD."
 */
function formatHungarianDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}.`;
}
