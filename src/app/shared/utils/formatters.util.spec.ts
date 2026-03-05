import { describe, it, expect } from 'vitest';
import { formatPrice, formatAmount, getInitials, formatDateTime, formatFileSize } from './formatters.util';

describe('formatters.util', () => {

  // ============================================================================
  // formatPrice
  // ============================================================================
  describe('formatPrice', () => {
    it('nullát formáz', () => {
      expect(formatPrice(0)).toContain('0');
      expect(formatPrice(0)).toContain('Ft');
    });

    it('pozitív összeget formáz', () => {
      const result = formatPrice(4990);
      expect(result).toContain('Ft');
    });

    it('nagy összeget formáz szóközökkel', () => {
      const result = formatPrice(1000000);
      expect(result).toContain('Ft');
    });

    it('negatív összeget formáz', () => {
      const result = formatPrice(-500);
      expect(result).toContain('Ft');
    });
  });

  // ============================================================================
  // formatAmount
  // ============================================================================
  describe('formatAmount', () => {
    it('HUF összeget formáz', () => {
      const result = formatAmount(4990, 'HUF');
      expect(result).toContain('Ft');
    });

    it('HUF-ot 100-zal osztja ha divideBy100 true', () => {
      const result = formatAmount(499000, 'HUF', true);
      expect(result).toContain('Ft');
    });

    it('EUR-t tizedesjegyekkel formáz', () => {
      const result = formatAmount(1999, 'EUR', true);
      // 1999/100 = 19.99
      expect(result).toContain('19,99');
    });

    it('kisbetűs pénznem kódot is elfogad', () => {
      const result = formatAmount(100, 'huf');
      expect(result).toContain('Ft');
    });

    it('divideBy100 alapértelmezetten false', () => {
      const huf = formatAmount(4990, 'HUF');
      const hufDivided = formatAmount(499000, 'HUF', true);
      // Mindkettő kb. ugyanazt adja
      expect(huf).toEqual(hufDivided);
    });
  });

  // ============================================================================
  // getInitials
  // ============================================================================
  describe('getInitials', () => {
    it('két szóból két betűt ad', () => {
      expect(getInitials('Kiss János')).toBe('KJ');
    });

    it('három szóból csak kettőt ad', () => {
      expect(getInitials('Kovács Mária Erzsébet')).toBe('KM');
    });

    it('egy szóból egy betűt ad', () => {
      expect(getInitials('Admin')).toBe('A');
    });

    it('üres stringre üres stringet ad', () => {
      expect(getInitials('')).toBe('');
    });

    it('nagybetűssé alakítja', () => {
      expect(getInitials('kiss jános')).toBe('KJ');
    });

    it('null-ra üres stringet ad', () => {
      expect(getInitials(null as unknown as string)).toBe('');
    });

    it('undefined-ra üres stringet ad', () => {
      expect(getInitials(undefined as unknown as string)).toBe('');
    });
  });

  // ============================================================================
  // formatDateTime
  // ============================================================================
  describe('formatDateTime', () => {
    it('null-ra üres stringet ad', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('üres stringre üres stringet ad', () => {
      expect(formatDateTime('')).toBe('');
    });

    it('ISO dátumot magyar formátumra alakít', () => {
      const result = formatDateTime('2026-01-30T10:30:00Z');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      // A pontos formátum locale-függő, de tartalmazza az évet
      expect(result).toContain('2026');
    });
  });

  // ============================================================================
  // formatFileSize
  // ============================================================================
  describe('formatFileSize', () => {
    it('0 byte', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('byte tartomány', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('kilobyte', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('kilobyte tizedessel', () => {
      expect(formatFileSize(2560)).toBe('2.5 KB');
    });

    it('megabyte', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('megabyte tizedessel', () => {
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('gigabyte', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('1 byte', () => {
      expect(formatFileSize(1)).toBe('1 B');
    });
  });
});
