export const WEBSHOP_STATUS_LABELS: Record<string, string> = {
  pending: 'Függőben',
  paid: 'Fizetve',
  processing: 'Feldolgozás',
  shipped: 'Szállítás alatt',
  completed: 'Kész',
  cancelled: 'Visszamondva',
};

export const NEXT_STATUS: Record<string, string> = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'completed',
};

export const NEXT_STATUS_LABELS: Record<string, string> = {
  paid: 'Feldolgozás megkezdése',
  processing: 'Szállításra adás',
  shipped: 'Lezárás',
};
