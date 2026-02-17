export type SortDirection = 'asc' | 'desc';
export type ColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn {
  /** Egyedi kulcs - sortChange emit-elésnél ez kerül kiküldésre */
  key: string;

  /** Megjelenített felirat (üres string = icon-only cella) */
  label: string;

  /** CSS grid oszlopszélesség, pl. '1fr', '120px', '2fr'. Default: '1fr' */
  width?: string;

  /** Vízszintes igazítás. Default: 'left' */
  align?: ColumnAlign;

  /** Kattintható rendezés. Default: false */
  sortable?: boolean;

  /** Lucide ikon neve (ICONS konstansból) - label helyett vagy mellett */
  icon?: string;

  /** matTooltip szöveg */
  tooltip?: string;
}
