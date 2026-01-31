/**
 * Voting Constants
 *
 * Szavazás modul konstansai.
 * Központosított helyen a magic values-ok, hogy könnyű legyen módosítani.
 */

// === TIME CONSTANTS ===

/** Milliseconds in one day */
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Milliseconds in one hour */
export const MS_PER_HOUR = 1000 * 60 * 60;

/** Milliseconds in one minute */
export const MS_PER_MINUTE = 1000 * 60;

// === POLL VALIDATION ===

/** Minimum poll title length */
export const POLL_TITLE_MIN_LENGTH = 3;

/** Maximum poll title length */
export const POLL_TITLE_MAX_LENGTH = 255;

/** Maximum poll description length */
export const POLL_DESCRIPTION_MAX_LENGTH = 1000;

/** Minimum number of options required */
export const POLL_OPTIONS_MIN_COUNT = 2;

/** Maximum number of options allowed */
export const POLL_OPTIONS_MAX_COUNT = 10;

/** Minimum votes per guest */
export const POLL_VOTES_MIN = 1;

/** Maximum votes per guest */
export const POLL_VOTES_MAX = 10;

// === API ENDPOINTS ===

export const VOTING_API = {
  /** Base path for polls */
  POLLS: '/tablo-frontend/polls',

  /** Single poll path */
  poll: (id: number) => `/tablo-frontend/polls/${id}`,

  /** Poll results path */
  results: (id: number) => `/tablo-frontend/polls/${id}/results`,

  /** Vote on poll path */
  vote: (id: number) => `/tablo-frontend/polls/${id}/vote`,

  /** Close poll path */
  close: (id: number) => `/tablo-frontend/polls/${id}/close`,

  /** Reopen poll path */
  reopen: (id: number) => `/tablo-frontend/polls/${id}/reopen`,

  /** Class size setting path */
  CLASS_SIZE: '/tablo-frontend/admin/class-size',

  /** Participants list (public - everyone can see) */
  PARTICIPANTS: '/tablo-frontend/participants',

  /** Toggle extra status (admin only) */
  toggleExtra: (id: number) => `/tablo-frontend/admin/guests/${id}/extra`,
} as const;

// === UI CONSTANTS ===

/** Number of columns on desktop for poll grid */
export const GRID_COLUMNS_DESKTOP = 3;

/** Number of columns on tablet for poll grid */
export const GRID_COLUMNS_TABLET = 2;

/** Number of columns on mobile for poll grid */
export const GRID_COLUMNS_MOBILE = 1;

// === POLL TYPE VALUES ===

export const POLL_TYPE = {
  TEMPLATE: 'template',
  CUSTOM: 'custom',
} as const;

export type PollType = typeof POLL_TYPE[keyof typeof POLL_TYPE];
