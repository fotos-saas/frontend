import { SelectOption } from '../searchable-select/searchable-select.component';
import { FilterConfig } from '../expandable-filters';

export { FilterConfig, SelectOption };

export interface SearchConfig {
  placeholder: string;
  features?: {
    id?: boolean;       // #123 → ID keresés
    assignee?: boolean; // @név → ügyintéző
    exact?: boolean;    // "szöveg" → pontos kifejezés
  };
}

export interface SearchableFilterDef {
  /** filterState filter key */
  id: string;
  /** Input placeholder */
  placeholder: string;
  /** "Minden" opció label */
  allLabel: string;
  /** Opciók */
  options: SelectOption[];
}

export interface SortDef {
  options: { value: string; label: string }[];
  /** Megjelenik-e 640px alatt (default: true) */
  showMobileSort?: boolean;
}
