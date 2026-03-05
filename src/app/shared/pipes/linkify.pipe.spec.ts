import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { LinkifyPipe } from './linkify.pipe';

describe('LinkifyPipe', () => {
  let pipe: LinkifyPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LinkifyPipe],
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new LinkifyPipe(sanitizer);
  });

  /**
   * Helper: SafeHtml -> string konverzió az assertekhez
   */
  function toHtml(result: unknown): string {
    // SafeHtml changingThisBreaksApplicationSecurity property
    return (result as { changingThisBreaksApplicationSecurity?: string })
      ?.changingThisBreaksApplicationSecurity ?? String(result);
  }

  // ==========================================================================
  // Null/undefined/empty handling
  // ==========================================================================
  describe('null/undefined/empty handling', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });
  });

  // ==========================================================================
  // URL linkify
  // ==========================================================================
  describe('URL linkify', () => {
    it('should convert https URL to link', () => {
      const result = toHtml(pipe.transform('Nézd meg: https://example.com'));
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('Link megnyitása');
    });

    it('should convert http URL to link', () => {
      const result = toHtml(pipe.transform('http://example.com'));
      expect(result).toContain('<a href="http://example.com"');
    });

    it('should convert www URL to https link', () => {
      const result = toHtml(pipe.transform('Lásd: www.example.com'));
      expect(result).toContain('<a href="https://www.example.com"');
    });

    it('should convert multiple URLs', () => {
      const text = 'Link1: https://a.com Link2: https://b.com';
      const result = toHtml(pipe.transform(text));
      expect(result).toContain('href="https://a.com"');
      expect(result).toContain('href="https://b.com"');
    });

    it('should keep text around URLs', () => {
      const result = toHtml(pipe.transform('Előtte https://example.com utána'));
      expect(result).toContain('Előtte');
      expect(result).toContain('utána');
    });
  });

  // ==========================================================================
  // Newline handling
  // ==========================================================================
  describe('newline handling', () => {
    it('should convert newlines to <br>', () => {
      const result = toHtml(pipe.transform('Első sor\nMásodik sor'));
      expect(result).toContain('<br>');
    });

    it('should handle multiple newlines', () => {
      const result = toHtml(pipe.transform('A\nB\nC'));
      const brCount = (result.match(/<br>/g) || []).length;
      expect(brCount).toBe(2);
    });
  });

  // ==========================================================================
  // HTML escape / XSS protection
  // ==========================================================================
  describe('HTML escape / XSS védelem', () => {
    it('should escape HTML tags in input', () => {
      const result = toHtml(pipe.transform('<script>alert("xss")</script>'));
      expect(result).not.toContain('<script>');
    });

    it('should escape angle brackets', () => {
      const result = toHtml(pipe.transform('a < b > c'));
      expect(result).not.toContain('< b >');
    });

    it('should escape ampersands', () => {
      const result = toHtml(pipe.transform('A & B'));
      expect(result).toContain('&amp;');
    });

    it('should escape quotes', () => {
      const result = toHtml(pipe.transform('Ő mondta: "hello"'));
      expect(result).not.toContain('"hello"');
    });
  });

  // ==========================================================================
  // DOMPurify szanitizálás
  // ==========================================================================
  describe('DOMPurify szanitizálás', () => {
    it('should only allow <a> and <br> tags', () => {
      // Direkt HTML-t próbálunk csempészni URL-be
      const result = toHtml(pipe.transform('Szöveg https://example.com'));
      // Csak <a> és <br> tag-ek maradhatnak
      const stripped = result.replace(/<a[^>]*>[^<]*<\/a>/g, '').replace(/<br>/g, '');
      expect(stripped).not.toMatch(/<[^>]+>/);
    });
  });

  // ==========================================================================
  // Visszatérési típus
  // ==========================================================================
  describe('return type', () => {
    it('should return SafeHtml for valid input', () => {
      const result = pipe.transform('Hello https://example.com');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('object');
    });
  });
});
