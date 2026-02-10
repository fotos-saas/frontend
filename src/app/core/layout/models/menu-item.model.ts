/**
 * MenuItem Model
 *
 * Menüelem interface a sidebar és mobile navigációhoz.
 */
export interface MenuItem {
  /** Egyedi azonosító */
  id: string;

  /** Megjelenített címke (lowercase, Gen Z stílusú) */
  label: string;

  /** Lucide ikon neve (pl. 'home', 'image', 'shopping-cart') */
  icon?: string;

  /** Route path (ha nincs children) */
  route?: string;

  /** Gyermek menüelemek (szekció esetén) */
  children?: MenuItem[] | null;

  /** Badge szám vagy szöveg (pl. értesítések: 5, figyelmeztetés: "!") */
  badge?: string | number;

  /** Letiltott állapot */
  disabled?: boolean;

  /** Pozíció: top (normál) vagy bottom (footer) */
  position?: 'top' | 'bottom';

  /** Láthatósági feltétel callback (opcionális) */
  visible?: () => boolean;

  /** DEV badge megjelenítése (fejlesztés alatt álló menüpont jelölés) */
  devBadge?: boolean;
}
