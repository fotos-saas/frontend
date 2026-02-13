/**
 * Status Label Constants
 *
 * Központosított státusz címke helper-ek.
 * Album, Invoice, Subscription státuszok magyar fordítása.
 */

/**
 * Album státusz címke (magyar)
 * @param status - Album státusz kulcs
 * @param isClient - Kliens nézethez (egyszerűsített)
 */
export function getAlbumStatusLabel(status: string, isClient = false): string {
  if (isClient) {
    const clientLabels: Record<string, string> = {
      draft: 'Előkészítés alatt',
      claiming: 'Képválasztás',
      retouch: 'Retusálás alatt',
      tablo: 'Tablókép készül',
      completed: 'Kész',
    };
    return clientLabels[status] ?? status;
  }

  const labels: Record<string, string> = {
    draft: 'Piszkozat',
    claiming: 'Képválasztás',
    retouch: 'Retusálás',
    tablo: 'Tablókép',
    completed: 'Befejezve',
  };
  return labels[status] ?? status;
}

/**
 * Számla (Invoice) státusz címke (magyar)
 * @param status - Stripe invoice státusz
 */
export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Piszkozat',
    open: 'Nyitott',
    paid: 'Fizetve',
    uncollectible: 'Behajthatatlan',
    void: 'Érvénytelen',
  };
  return labels[status] ?? status;
}

/**
 * Előfizetés státusz címke (magyar)
 * @param status - Stripe subscription státusz
 * @param short - Rövid formátum (badge-hez)
 */
export function getSubscriptionStatusLabel(status: string, short = false): string {
  if (short) {
    const shortLabels: Record<string, string> = {
      active: 'Aktív',
      trialing: 'Próba',
      past_due: 'Lejárt',
      canceled: 'Lemondva',
      unpaid: 'Fizetetlen',
      incomplete: 'Hiányos',
      incomplete_expired: 'Lejárt',
      paused: 'Szüneteltetve',
    };
    return shortLabels[status] ?? status;
  }

  const labels: Record<string, string> = {
    active: 'Aktív előfizetés',
    trialing: 'Próbaidőszak',
    past_due: 'Lejárt fizetés',
    canceled: 'Lemondva',
    unpaid: 'Fizetetlen',
    incomplete: 'Hiányos',
    incomplete_expired: 'Hiányos (lejárt)',
    paused: 'Szüneteltetve',
  };
  return labels[status] ?? status;
}
