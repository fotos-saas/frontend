import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSecureUrl, isOwnApiUrl, openSecureUrl } from './url-validator.util';

describe('url-validator.util', () => {

  // ============================================================================
  // isSecureUrl
  // ============================================================================
  describe('isSecureUrl', () => {
    it('should return true for https URLs', () => {
      expect(isSecureUrl('https://example.com')).toBe(true);
      expect(isSecureUrl('https://example.com/path')).toBe(true);
      expect(isSecureUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should return true for http URLs', () => {
      expect(isSecureUrl('http://example.com')).toBe(true);
      expect(isSecureUrl('http://localhost:4200')).toBe(true);
    });

    it('should return true for relative URLs starting with /', () => {
      expect(isSecureUrl('/api/data')).toBe(true);
      expect(isSecureUrl('/path/to/resource')).toBe(true);
    });

    it('should return false for javascript: protocol', () => {
      expect(isSecureUrl('javascript:alert(1)')).toBe(false);
      expect(isSecureUrl('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isSecureUrl('  javascript:void(0)  ')).toBe(false);
    });

    it('should return false for data: protocol', () => {
      expect(isSecureUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should return false for vbscript: protocol', () => {
      expect(isSecureUrl('vbscript:msgbox("xss")')).toBe(false);
    });

    it('should return false for file: protocol', () => {
      expect(isSecureUrl('file:///etc/passwd')).toBe(false);
    });

    it('should return true for protocol-relative URLs (parsed as absolute)', () => {
      // Protocol-relative URLs are parsed by new URL() with the current origin
      // which makes them valid https/http URLs
      expect(isSecureUrl('//example.com')).toBe(true);
    });

    it('should return false for null, undefined, empty values', () => {
      expect(isSecureUrl(null)).toBe(false);
      expect(isSecureUrl(undefined)).toBe(false);
      expect(isSecureUrl('')).toBe(false);
      expect(isSecureUrl('   ')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isSecureUrl(123 as unknown as string)).toBe(false);
      expect(isSecureUrl({} as unknown as string)).toBe(false);
    });

    it('should return false for ftp: protocol', () => {
      expect(isSecureUrl('ftp://files.example.com')).toBe(false);
    });
  });

  // ============================================================================
  // isOwnApiUrl
  // ============================================================================
  describe('isOwnApiUrl', () => {
    it('should return true for relative URLs', () => {
      expect(isOwnApiUrl('/api/data')).toBe(true);
      expect(isOwnApiUrl('/tablo-frontend/voting')).toBe(true);
    });

    it('should return false for dangerous protocols', () => {
      expect(isOwnApiUrl('javascript:alert(1)')).toBe(false);
      expect(isOwnApiUrl('data:text/html')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isOwnApiUrl(null)).toBe(false);
      expect(isOwnApiUrl(undefined)).toBe(false);
    });
  });

  // ============================================================================
  // openSecureUrl
  // ============================================================================
  describe('openSecureUrl', () => {
    let windowOpenSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      windowOpenSpy.mockRestore();
    });

    it('should open secure URL with noopener,noreferrer', () => {
      const result = openSecureUrl('https://example.com');

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should return false and not open for javascript: URL', () => {
      const result = openSecureUrl('javascript:alert(1)');

      expect(result).toBe(false);
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should return false for null/undefined', () => {
      expect(openSecureUrl(null)).toBe(false);
      expect(openSecureUrl(undefined)).toBe(false);
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should open relative URLs', () => {
      const result = openSecureUrl('/path/to/page');

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();
    });
  });
});
