/**
 * Közös hibaüzenet konstansok
 *
 * Minden legalább 2x ismétlődő magyar hibaüzenet ide kerül.
 * Használat: `import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@shared/constants';`
 */

export const ERROR_MESSAGES = {
  /** Általános hiba (fallback) */
  GENERIC: 'Hiba történt',
  /** Általános hiba újrapróbálkozással */
  GENERIC_RETRY: 'Hiba történt. Próbáld újra!',
  /** Általános hiba - kérés újrapróbálkozással */
  GENERIC_RETRY_POLITE: 'Hiba történt. Kérlek próbáld újra.',

  /** Mentési hiba (pont nélkül) */
  SAVE: 'Hiba történt a mentés során',
  /** Mentési hiba (ponttal) */
  SAVE_DOT: 'Hiba történt a mentés során.',

  /** Feltöltési hiba (pont nélkül) */
  UPLOAD: 'Hiba történt a feltöltés során',
  /** Feltöltési hiba (ponttal) */
  UPLOAD_DOT: 'Hiba történt a feltöltés során.',

  /** Fájl feltöltési hiba */
  FILE_UPLOAD: 'Hiba történt a fájl feltöltésekor',
  /** Fájl törlési hiba */
  FILE_DELETE: 'Hiba történt a fájl törlésekor',

  /** Adatok betöltési hiba (ponttal) */
  LOAD_DATA_DOT: 'Hiba történt az adatok betöltésekor.',
  /** Adatok betöltési hiba (pont nélkül) */
  LOAD_DATA: 'Hiba történt az adatok betöltésekor',

  /** Bejelentkezési hiba */
  LOGIN: 'Hiba történt a bejelentkezés során',
  /** Regisztrációs hiba (pont nélkül) */
  REGISTER: 'Hiba történt a regisztráció során',
  /** Regisztrációs hiba (ponttal) */
  REGISTER_DOT: 'Hiba történt a regisztráció során.',

  /** Létrehozási hiba (ponttal) */
  CREATE_DOT: 'Hiba történt a létrehozás során.',

  /** Projekt létrehozási hiba (pont nélkül) */
  PROJECT_CREATE: 'Hiba történt a projekt létrehozása során',
  /** Projekt létrehozási hiba (ponttal) */
  PROJECT_CREATE_DOT: 'Hiba történt a projekt létrehozása során.',

  /** Meghívó elfogadási hiba */
  INVITE_ACCEPT: 'Hiba történt a meghívó elfogadása során.',

  /** PDF generálási hiba */
  PDF_GENERATE: 'Hiba történt a PDF generálásakor',

  /** Előnézet generálási hiba */
  PREVIEW_GENERATE: 'Hiba történt az előnézet generálásakor',

  /** Megrendelés véglegesítési hiba */
  ORDER_FINALIZE: 'Hiba történt a megrendelés véglegesítésekor',

  /** ABC rendezési hiba */
  SORT_ABC: 'Hiba történt az ABC rendezésnél.',
  /** Nevek besorolási hiba */
  SORT_NAMES: 'Hiba történt a nevek besorolásakor.',
  /** Nevek párosítási hiba */
  SORT_MATCH: 'Hiba történt a nevek párosításakor.',

  /** Reakció mentési hiba */
  REACTION_SAVE: 'Nem sikerült a reakció mentése.',

  /** Jogosultsági hiba */
  FORBIDDEN: 'Nincs jogosultságod ehhez a művelethez',
  /** Jogosultsági hiba (ponttal) */
  FORBIDDEN_DOT: 'Nincs jogosultságod ehhez a művelethez.',

  /** Váratlan hiba történt */
  UNEXPECTED: 'Váratlan hiba történt. Kérlek próbáld újra később.',
} as const;

export const SUCCESS_MESSAGES = {
  /** Toast cím sikeres műveletekhez */
  TITLE: 'Siker',
} as const;

/** Toast cím hibaüzenetekhez */
export const ERROR_TITLE = 'Hiba';
