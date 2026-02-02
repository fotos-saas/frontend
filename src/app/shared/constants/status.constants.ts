/**
 * Status Constants
 *
 * Központi státusz definíciók - Single Source of Truth.
 * Tartalmazza a label-eket és CSS osztályokat.
 */

// ============================================
// SUBSCRIPTION STATUS (Előfizetés)
// ============================================

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'paused'
  | 'canceling'
  | 'canceled'
  | 'pending';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Aktív',
  trial: 'Próbaidőszak',
  paused: 'Szüneteltetve',
  canceling: 'Lemondva',
  canceled: 'Lejárt',
  pending: 'Függőben',
};

export const SUBSCRIPTION_STATUS_LABELS_SHORT: Record<SubscriptionStatus, string> = {
  active: 'Aktív',
  trial: 'Próba',
  paused: 'Szünetel',
  canceling: 'Lemondva',
  canceled: 'Törölve',
  pending: 'Függőben',
};

export const SUBSCRIPTION_STATUS_CLASSES: Record<SubscriptionStatus, string> = {
  active: 'status--active',
  trial: 'status--trial',
  paused: 'status--paused',
  canceling: 'status--canceling',
  canceled: 'status--canceled',
  pending: 'status--pending',
};

/**
 * Előfizetés státusz label lekérése
 * @param status Státusz kulcs
 * @param short Rövid verzió használata (pl. "Próba" vs "Próbaidőszak")
 */
export function getSubscriptionStatusLabel(
  status: string,
  short = false
): string {
  const labels = short
    ? SUBSCRIPTION_STATUS_LABELS_SHORT
    : SUBSCRIPTION_STATUS_LABELS;
  return labels[status as SubscriptionStatus] ?? status;
}

/**
 * Előfizetés státusz CSS osztály lekérése
 */
export function getSubscriptionStatusClass(status: string): string {
  return SUBSCRIPTION_STATUS_CLASSES[status as SubscriptionStatus] ?? '';
}

// ============================================
// ALBUM STATUS (Album/Megrendelés)
// ============================================

export type AlbumStatus =
  | 'draft'
  | 'claiming'
  | 'retouch'
  | 'tablo'
  | 'completed';

export const ALBUM_STATUS_LABELS: Record<AlbumStatus, string> = {
  draft: 'Piszkozat',
  claiming: 'Kiválasztás',
  retouch: 'Retusálás',
  tablo: 'Tablókép',
  completed: 'Befejezett',
};

export const ALBUM_STATUS_LABELS_CLIENT: Record<AlbumStatus, string> = {
  draft: 'Előkészítés',
  claiming: 'Kiválasztás',
  retouch: 'Retusálás',
  tablo: 'Tablókép',
  completed: 'Lezárva',
};

export const ALBUM_STATUS_CLASSES: Record<AlbumStatus, string> = {
  draft: 'status--draft',
  claiming: 'status--claiming',
  retouch: 'status--retouch',
  tablo: 'status--tablo',
  completed: 'status--completed',
};

/**
 * Album státusz label lekérése
 * @param status Státusz kulcs
 * @param isClientView Kliens nézet (más szövegezés)
 */
export function getAlbumStatusLabel(
  status: string,
  isClientView = false
): string {
  const labels = isClientView
    ? ALBUM_STATUS_LABELS_CLIENT
    : ALBUM_STATUS_LABELS;
  return labels[status as AlbumStatus] ?? status;
}

/**
 * Album státusz CSS osztály lekérése
 */
export function getAlbumStatusClass(status: string): string {
  return ALBUM_STATUS_CLASSES[status as AlbumStatus] ?? '';
}

// ============================================
// INVOICE STATUS (Számla)
// ============================================

export type InvoiceStatus =
  | 'draft'
  | 'paid'
  | 'open'
  | 'void'
  | 'uncollectible';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Piszkozat',
  paid: 'Fizetve',
  open: 'Nyitott',
  void: 'Érvénytelen',
  uncollectible: 'Behajtható',
};

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: 'status--draft',
  paid: 'status--paid',
  open: 'status--open',
  void: 'status--void',
  uncollectible: 'status--uncollectible',
};

/**
 * Számla státusz label lekérése
 */
export function getInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status as InvoiceStatus] ?? status;
}

/**
 * Számla státusz CSS osztály lekérése
 */
export function getInvoiceStatusClass(status: string): string {
  return INVOICE_STATUS_CLASSES[status as InvoiceStatus] ?? '';
}
