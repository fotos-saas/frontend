/**
 * Szűrő opció interface
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Szűrő konfiguráció interface
 */
export interface FilterConfig {
  /** Egyedi azonosító */
  id: string;
  /** Placeholder/default szöveg */
  label: string;
  /** Elérhető opciók */
  options: FilterOption[];
  /** Opcionális Lucide ikon neve */
  icon?: string;
}

/**
 * Szűrő változás event interface
 */
export interface FilterChangeEvent {
  id: string;
  value: string;
}
