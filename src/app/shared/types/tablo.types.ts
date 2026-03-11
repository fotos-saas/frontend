/**
 * Tablo Status interface
 * Központi definíció - MINDEN helyen innen importálandó.
 */
export interface TabloStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}
