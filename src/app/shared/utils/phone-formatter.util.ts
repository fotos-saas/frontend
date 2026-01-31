/**
 * Magyar telefonszám formázó és validáló utility.
 * Formátum: +36 XX XXX XXXX
 */

export interface PhoneValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Tisztítja az inputot, csak számokat és + jelet hagy meg.
 */
export function cleanPhoneInput(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

/**
 * Szóközökkel formázza a számjegyeket: prefix XX XXX XXXX
 */
function formatWithSpaces(prefix: string, digits: string): string {
  if (!digits) return prefix;

  let formatted = prefix;
  // Területi előhívó (2 számjegy)
  if (digits.length > 0) {
    formatted += ' ' + digits.slice(0, 2);
  }
  // Első csoport (3 számjegy)
  if (digits.length > 2) {
    formatted += ' ' + digits.slice(2, 5);
  }
  // Második csoport (4 számjegy)
  if (digits.length > 5) {
    formatted += ' ' + digits.slice(5, 9);
  }
  return formatted;
}

/**
 * Magyar telefonszám formázás: +36 XX XXX XXXX
 * Elfogadja: +36..., 36..., 06..., vagy csak számjegyeket (magyar előhívóként kezelve)
 */
export function formatHungarianPhone(input: string): string {
  const digits = cleanPhoneInput(input);

  // Ha +36-tal kezdődik
  if (digits.startsWith('+36')) {
    const rest = digits.slice(3);
    return formatWithSpaces('+36', rest);
  }
  // Ha 36-tal kezdődik (+ nélkül)
  if (digits.startsWith('36') && digits.length > 2) {
    const rest = digits.slice(2);
    return formatWithSpaces('+36', rest);
  }
  // Ha 06-tal kezdődik
  if (digits.startsWith('06') && digits.length > 2) {
    const rest = digits.slice(2);
    return formatWithSpaces('+36', rest);
  }
  // Ha más nemzetközi számmal kezdődik (+XX)
  if (digits.startsWith('+')) {
    const countryCode = digits.slice(0, 3); // pl. +36, +49
    const rest = digits.slice(3);
    return formatWithSpaces(countryCode, rest);
  }
  // Egyéb - magyar előhívóként kezeljük
  return formatWithSpaces('+36', digits);
}

/**
 * Telefonszám validáció.
 * Minimum 6 számjegy, maximum 15 (nemzetközi szabvány).
 */
export function validatePhone(phone: string): PhoneValidationResult {
  const trimmed = phone.trim();

  if (!trimmed) {
    return { valid: true }; // Üres megengedett (opcionális mező)
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 6) {
    return { valid: false, error: 'Legalább 6 számjegy szükséges' };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Maximum 15 számjegy lehet' };
  }

  return { valid: true };
}

/**
 * Input event handler: formázza a telefon mezőt valós időben.
 * Használat: (input)="onPhoneInput($event)"
 */
export function handlePhoneInput(
  event: Event,
  updateValue: (value: string) => void,
  updateError: (error: string | null) => void
): void {
  const input = event.target as HTMLInputElement;
  const formatted = formatHungarianPhone(input.value);

  updateValue(formatted);
  input.value = formatted;

  const validation = validatePhone(formatted);
  updateError(validation.error ?? null);
}
