/**
 * Formatters Utility
 *
 * Általános formázó függvények újrafelhasználásra.
 */

/**
 * Név kezdőbetűinek kinyerése
 *
 * @param name - Teljes név
 * @returns Maximum 2 karakteres monogram (nagybetűs)
 *
 * @example
 * getInitials('Kiss János') // => "KJ"
 * getInitials('Kovács Mária Erzsébet') // => "KM"
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Dátum formázása magyar locale-al
 *
 * @param date - ISO dátum string vagy null
 * @returns Formázott dátum (pl. "2026. jan. 30. 10:30")
 *
 * @example
 * formatDateTime('2026-01-30T10:30:00Z') // => "2026. jan. 30. 10:30"
 * formatDateTime(null) // => ""
 */
export function formatDateTime(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Dátum formázása idő nélkül
 *
 * @param date - ISO dátum string vagy null
 * @returns Formázott dátum (pl. "2026. jan. 30.")
 */
export function formatDate(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
