/**
 * Timeout konstansok
 *
 * Központi helyen definiált timeout értékek a magic number-ök elkerüléséhez.
 * Csak az ismétlődő, azonos célú timeout-ok vannak itt.
 */
export const TIMEOUTS = {
  /** Másolás visszajelzés megjelenítési idő (pl. "Másolva!" felirat) */
  COPY_FEEDBACK: 2000,

  /** ID/rövid szöveg másolás visszajelzés (kisebb elem, gyorsabb eltűnés) */
  ID_COPY_FEEDBACK: 1500,

  /** Mentés visszajelzés megjelenítési idő (pl. "Mentve" felirat) */
  SAVE_FEEDBACK: 3000,

  /** Hibaüzenet automatikus eltűnési idő */
  ERROR_AUTO_HIDE: 5000,

  /** Keresés debounce idő (setTimeout-os manuális debounce) */
  SEARCH_DEBOUNCE: 300,

  /** Focus késleltetés renderelés/animáció után */
  FOCUS_DELAY: 100,

  /** Képváltás animáció tick (imageChanging flag reset) */
  IMAGE_TRANSITION_TICK: 30,
} as const;
