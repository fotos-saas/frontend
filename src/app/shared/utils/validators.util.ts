/**
 * Validators Utilities
 *
 * Központi validációs függvények.
 * Újrafelhasználható validátorok a teljes alkalmazásban.
 */

/**
 * Email regex pattern
 * RFC 5322 egyszerűsített verzió
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Telefonszám regex pattern
 * Számok, szóközök, +, -, () megengedett
 */
const PHONE_REGEX = /^[\d\s+\-()]+$/;

/**
 * Email cím validálása
 * @param email - Email cím
 * @returns true ha érvényes email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Telefonszám validálása
 * @param phone - Telefonszám
 * @returns true ha érvényes telefonszám formátum
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Név validálása
 * @param name - Név
 * @param minLength - Minimum hossz (alapértelmezett: 2)
 * @param maxLength - Maximum hossz (alapértelmezett: 100)
 * @returns Validációs eredmény objektum
 */
export function validateName(
  name: string,
  minLength = 2,
  maxLength = 100
): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'A név megadása kötelező.' };
  }

  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: 'A név megadása kötelező.' };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `A név legalább ${minLength} karakter legyen.` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `A név maximum ${maxLength} karakter lehet.` };
  }

  return { valid: true };
}

/**
 * Szám tartomány validálása
 * @param value - Érték
 * @param min - Minimum érték
 * @param max - Maximum érték
 * @param integerOnly - Csak egész szám megengedett
 * @returns Validációs eredmény objektum
 */
export function validateNumberRange(
  value: number | null | undefined,
  min: number,
  max: number,
  integerOnly = false
): { valid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { valid: false, error: 'Az érték megadása kötelező.' };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Érvényes számot adj meg.' };
  }

  if (integerOnly && !Number.isInteger(value)) {
    return { valid: false, error: 'Egész számot adj meg.' };
  }

  if (value < min) {
    return { valid: false, error: `Minimum ${min} lehet az érték.` };
  }

  if (value > max) {
    return { valid: false, error: `Maximum ${max} lehet az érték.` };
  }

  return { valid: true };
}

/**
 * URL validálása
 * @param url - URL string
 * @returns true ha érvényes URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Üres string ellenőrzése
 * @param value - String érték
 * @returns true ha üres vagy csak whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}
