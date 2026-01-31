/**
 * Form Constants
 *
 * Közös form validációs konstansok.
 * Használat: newsfeed-card, forum komponensek
 */

/** Maximum komment hossz karakterben */
export const MAX_COMMENT_LENGTH = 1000;

/** Maximum poszt tartalom hossz karakterben */
export const MAX_POST_CONTENT_LENGTH = 10000;

/** Maximum cím hossz karakterben */
export const MAX_TITLE_LENGTH = 255;

/** Sikeres üzenet megjelenítési idő (ms) */
export const SUCCESS_MESSAGE_DURATION = 3000;

/** Minimum keresési szöveg hossz */
export const MIN_SEARCH_LENGTH = 2;

/** Debounce idő kereséshez (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Maximum média fájlok száma egy posztban */
export const MAX_MEDIA_FILES = 10;

/** Maximum fájlméret MB-ban */
export const MAX_FILE_SIZE_MB = 10;
