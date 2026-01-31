import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  validateName,
  validateNumberRange,
  isValidUrl,
  isEmpty
} from './validators.util';

describe('validators.util', () => {

  // ============================================================================
  // isValidEmail
  // ============================================================================
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should return true for email with whitespace (trimmed)', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidEmail(123 as unknown as string)).toBe(false);
      expect(isValidEmail({} as unknown as string)).toBe(false);
    });
  });

  // ============================================================================
  // isValidPhone
  // ============================================================================
  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('+36 30 123 4567')).toBe(true);
      expect(isValidPhone('06-30-123-4567')).toBe(true);
      expect(isValidPhone('(06) 30 1234567')).toBe(true);
      expect(isValidPhone('123456789')).toBe(true);
    });

    it('should return true for phone with whitespace (trimmed)', () => {
      expect(isValidPhone('  +36301234567  ')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('+36 30 abc 4567')).toBe(false);
      expect(isValidPhone('test@test.com')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null as unknown as string)).toBe(false);
      expect(isValidPhone(undefined as unknown as string)).toBe(false);
    });
  });

  // ============================================================================
  // validateName
  // ============================================================================
  describe('validateName', () => {
    it('should return valid for correct names', () => {
      expect(validateName('Teszt Név')).toEqual({ valid: true });
      expect(validateName('AB')).toEqual({ valid: true });
      expect(validateName('A'.repeat(100))).toEqual({ valid: true });
    });

    it('should return error for empty names', () => {
      expect(validateName('')).toEqual({
        valid: false,
        error: 'A név megadása kötelező.'
      });
      expect(validateName('   ')).toEqual({
        valid: false,
        error: 'A név megadása kötelező.'
      });
    });

    it('should return error for too short names', () => {
      expect(validateName('A')).toEqual({
        valid: false,
        error: 'A név legalább 2 karakter legyen.'
      });
    });

    it('should return error for too long names', () => {
      expect(validateName('A'.repeat(101))).toEqual({
        valid: false,
        error: 'A név maximum 100 karakter lehet.'
      });
    });

    it('should support custom min/max length', () => {
      expect(validateName('AB', 3)).toEqual({
        valid: false,
        error: 'A név legalább 3 karakter legyen.'
      });
      expect(validateName('ABCDEF', 2, 5)).toEqual({
        valid: false,
        error: 'A név maximum 5 karakter lehet.'
      });
    });

    it('should return error for null/undefined', () => {
      expect(validateName(null as unknown as string)).toEqual({
        valid: false,
        error: 'A név megadása kötelező.'
      });
      expect(validateName(undefined as unknown as string)).toEqual({
        valid: false,
        error: 'A név megadása kötelező.'
      });
    });
  });

  // ============================================================================
  // validateNumberRange
  // ============================================================================
  describe('validateNumberRange', () => {
    it('should return valid for numbers in range', () => {
      expect(validateNumberRange(10, 5, 20)).toEqual({ valid: true });
      expect(validateNumberRange(5, 5, 20)).toEqual({ valid: true });
      expect(validateNumberRange(20, 5, 20)).toEqual({ valid: true });
    });

    it('should return error for null/undefined values', () => {
      expect(validateNumberRange(null, 5, 20)).toEqual({
        valid: false,
        error: 'Az érték megadása kötelező.'
      });
      expect(validateNumberRange(undefined, 5, 20)).toEqual({
        valid: false,
        error: 'Az érték megadása kötelező.'
      });
    });

    it('should return error for NaN', () => {
      expect(validateNumberRange(NaN, 5, 20)).toEqual({
        valid: false,
        error: 'Érvényes számot adj meg.'
      });
    });

    it('should return error for non-number types', () => {
      expect(validateNumberRange('10' as unknown as number, 5, 20)).toEqual({
        valid: false,
        error: 'Érvényes számot adj meg.'
      });
    });

    it('should return error for values below minimum', () => {
      expect(validateNumberRange(4, 5, 20)).toEqual({
        valid: false,
        error: 'Minimum 5 lehet az érték.'
      });
    });

    it('should return error for values above maximum', () => {
      expect(validateNumberRange(21, 5, 20)).toEqual({
        valid: false,
        error: 'Maximum 20 lehet az érték.'
      });
    });

    it('should validate integer-only when specified', () => {
      expect(validateNumberRange(10.5, 5, 20, true)).toEqual({
        valid: false,
        error: 'Egész számot adj meg.'
      });
      expect(validateNumberRange(10, 5, 20, true)).toEqual({ valid: true });
    });

    it('should allow decimals when integerOnly is false', () => {
      expect(validateNumberRange(10.5, 5, 20, false)).toEqual({ valid: true });
    });
  });

  // ============================================================================
  // isValidUrl
  // ============================================================================
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null as unknown as string)).toBe(false);
      expect(isValidUrl(undefined as unknown as string)).toBe(false);
    });
  });

  // ============================================================================
  // isEmpty
  // ============================================================================
  describe('isEmpty', () => {
    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t\n')).toBe(true);
    });

    it('should return true for null/undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty('  test  ')).toBe(false);
      expect(isEmpty('0')).toBe(false);
    });
  });
});
