import { describe, it, expect } from 'vitest';
import { cleanPhoneInput, formatHungarianPhone, validatePhone } from './phone-formatter.util';

describe('phone-formatter.util', () => {

  // ============================================================================
  // cleanPhoneInput
  // ============================================================================
  describe('cleanPhoneInput', () => {
    it('csak számokat és + jelet hagy meg', () => {
      expect(cleanPhoneInput('+36 30 123 4567')).toBe('+36301234567');
    });

    it('betűket eltávolítja', () => {
      expect(cleanPhoneInput('abc123')).toBe('123');
    });

    it('speciális karaktereket eltávolítja', () => {
      expect(cleanPhoneInput('(06)-30/123-4567')).toBe('06301234567');
    });

    it('üres string-re üres stringet ad', () => {
      expect(cleanPhoneInput('')).toBe('');
    });

    it('+ jelet megtartja', () => {
      expect(cleanPhoneInput('+36')).toBe('+36');
    });
  });

  // ============================================================================
  // formatHungarianPhone
  // ============================================================================
  describe('formatHungarianPhone', () => {
    it('+36 prefix-et felismeri', () => {
      expect(formatHungarianPhone('+36301234567')).toBe('+36 30 123 4567');
    });

    it('+36 szóközzel is működik', () => {
      expect(formatHungarianPhone('+36 30 123 4567')).toBe('+36 30 123 4567');
    });

    it('36 prefix-et +36-ra alakítja', () => {
      expect(formatHungarianPhone('36301234567')).toBe('+36 30 123 4567');
    });

    it('06 prefix-et +36-ra alakítja', () => {
      expect(formatHungarianPhone('06301234567')).toBe('+36 30 123 4567');
    });

    it('prefix nélküli számot magyar előhívóként kezel', () => {
      expect(formatHungarianPhone('301234567')).toBe('+36 30 123 4567');
    });

    it('rövid számot kezel (részleges bemenet)', () => {
      expect(formatHungarianPhone('+3630')).toBe('+36 30');
    });

    it('nagyon rövid számot kezel', () => {
      expect(formatHungarianPhone('+36')).toBe('+36');
    });

    it('üres stringet kezel', () => {
      expect(formatHungarianPhone('')).toBe('+36');
    });

    it('csak területi kódot kezel', () => {
      expect(formatHungarianPhone('06301')).toBe('+36 30 1');
    });

    it('más nemzetközi prefix-et is kezel', () => {
      // +49 nem 36-tal kezdődik és nem 06-tal, de + jellel igen
      const result = formatHungarianPhone('+491234567890');
      expect(result.startsWith('+49')).toBe(true);
    });
  });

  // ============================================================================
  // validatePhone
  // ============================================================================
  describe('validatePhone', () => {
    it('üres string valid (opcionális mező)', () => {
      expect(validatePhone('')).toEqual({ valid: true });
    });

    it('csak szóközök valid (opcionális)', () => {
      expect(validatePhone('   ')).toEqual({ valid: true });
    });

    it('érvényes magyar szám valid', () => {
      expect(validatePhone('+36 30 123 4567')).toEqual({ valid: true });
    });

    it('túl rövid szám invalid', () => {
      const result = validatePhone('123');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('5 számjegy invalid', () => {
      const result = validatePhone('12345');
      expect(result.valid).toBe(false);
    });

    it('6 számjegy valid', () => {
      expect(validatePhone('123456').valid).toBe(true);
    });

    it('15 számjegy valid', () => {
      expect(validatePhone('123456789012345').valid).toBe(true);
    });

    it('16 számjegy invalid', () => {
      const result = validatePhone('1234567890123456');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('formázott szám jegyeit számolja (szóközök nélkül)', () => {
      // +36 30 123 4567 = 11 számjegy (36301234567)
      expect(validatePhone('+36 30 123 4567').valid).toBe(true);
    });
  });
});
