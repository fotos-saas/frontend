/**
 * Formatters Utility
 *
 * Általános formázó függvények újrafelhasználásra.
 */

// ============================================
// PÉNZNEM FORMÁZÓK
// ============================================

/**
 * Ár formázása HUF-ban (alapértelmezett pénznem)
 *
 * @param amount - Összeg (Ft-ban, nem fillérben!)
 * @returns Formázott string (pl. "4 990 Ft")
 *
 * @example
 * formatPrice(4990) // => "4 990 Ft"
 * formatPrice(0) // => "0 Ft"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Összeg formázása tetszőleges pénznemben
 * FONTOS: Stripe-ból érkező értékek esetén 100-zal kell osztani!
 *
 * @param amount - Összeg (a legkisebb egységben, pl. fillér/cent)
 * @param currency - Pénznem kód (pl. 'HUF', 'EUR', 'USD')
 * @param divideBy100 - Ha true, automatikusan 100-zal osztja az összeget (Stripe formátum)
 * @returns Formázott string
 *
 * @example
 * formatAmount(499000, 'HUF', true) // => "4 990 Ft" (Stripe-ból)
 * formatAmount(4990, 'HUF') // => "4 990 Ft"
 * formatAmount(1999, 'EUR', true) // => "19,99 €"
 */
export function formatAmount(
  amount: number,
  currency: string,
  divideBy100 = false
): string {
  const value = divideBy100 ? amount / 100 : amount;

  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: currency.toUpperCase() === 'HUF' ? 0 : 2,
  }).format(value);
}

/**
 * Ár formázása számlázási ciklussal
 *
 * @param price - Ár (Ft-ban)
 * @param cycle - 'monthly' | 'yearly'
 * @returns Formázott string (pl. "4 990 Ft/hó")
 *
 * @example
 * formatPriceWithCycle(4990, 'monthly') // => "4 990 Ft/hó"
 * formatPriceWithCycle(49900, 'yearly') // => "49 900 Ft/év"
 */
export function formatPriceWithCycle(
  price: number,
  cycle: 'monthly' | 'yearly'
): string {
  const suffix = cycle === 'yearly' ? '/év' : '/hó';
  return formatPrice(price) + suffix;
}

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

// ============================================
// FÁJLMÉRET FORMÁZÓ
// ============================================

/**
 * Fájlméret formázása olvasható formátumban
 *
 * @param bytes - Méret byte-ban
 * @returns Formázott string (pl. "2.5 MB")
 *
 * @example
 * formatFileSize(0) // => "0 B"
 * formatFileSize(500) // => "500 B"
 * formatFileSize(1024) // => "1 KB"
 * formatFileSize(2560) // => "2.5 KB"
 * formatFileSize(1024 * 1024) // => "1 MB"
 * formatFileSize(5.5 * 1024 * 1024) // => "5.5 MB"
 * formatFileSize(1024 * 1024 * 1024) // => "1 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
