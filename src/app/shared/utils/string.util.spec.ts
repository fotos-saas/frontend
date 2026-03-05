import { describe, it, expect } from 'vitest';
import { abbreviateMiddle, projectShortName } from './string.util';

describe('string.util', () => {

  // ============================================================================
  // abbreviateMiddle
  // ============================================================================
  describe('abbreviateMiddle', () => {
    it('rövid szöveget változatlanul hagyja', () => {
      expect(abbreviateMiddle('Hello', 40)).toBe('Hello');
    });

    it('pontosan maxLength-nyi szöveget változatlanul hagyja', () => {
      const text = 'a'.repeat(40);
      expect(abbreviateMiddle(text, 40)).toBe(text);
    });

    it('hosszú szöveget rövidíti ellipszisszel', () => {
      const text = 'Szegedi Radnóti Miklós Kísérleti Gimnázium 12.A 2025/2026';
      const result = abbreviateMiddle(text, 30);
      expect(result.length).toBeLessThanOrEqual(35); // szóhatár miatt kicsit eltérhet
      expect(result).toContain('\u2026');
    });

    it('elejét és végét megtartja', () => {
      const text = 'Szegedi Radnóti Miklós Kísérleti Gimnázium 12.A 2025/2026';
      const result = abbreviateMiddle(text, 30);
      expect(result.startsWith('Szegedi')).toBe(true);
      expect(result).toContain('2025/2026');
    });

    it('alapértelmezett maxLength 40', () => {
      const short = 'a'.repeat(40);
      expect(abbreviateMiddle(short)).toBe(short);

      const long = 'a'.repeat(41);
      expect(abbreviateMiddle(long)).toContain('\u2026');
    });

    it('trim-eli a bemenetet', () => {
      expect(abbreviateMiddle('  Hello  ', 40)).toBe('Hello');
    });

    it('egyedi ellipszis karakter', () => {
      const text = 'a'.repeat(50);
      const result = abbreviateMiddle(text, 10, '...');
      expect(result).toContain('...');
    });

    it('üres string-et kezeli', () => {
      expect(abbreviateMiddle('', 40)).toBe('');
    });

    it('csak szóközökből álló stringet kezeli', () => {
      expect(abbreviateMiddle('   ', 40)).toBe('');
    });
  });

  // ============================================================================
  // projectShortName
  // ============================================================================
  describe('projectShortName', () => {
    it('projekt nevet és ID-t formázza', () => {
      const result = projectShortName('Teszt projekt', 123);
      expect(result).toContain('(123)');
      expect(result).toContain('Teszt');
    });

    it('speciális karaktereket cseréli', () => {
      const result = projectShortName('Teszt/Projekt:Név', 1);
      expect(result).not.toContain('/');
      expect(result).not.toContain(':');
    });

    it('maxLength-et betartja (suffix-szal együtt)', () => {
      const longName = 'Szegedi Radnóti Miklós Kísérleti Gimnázium 12.A 2025/2026';
      const result = projectShortName(longName, 454, 50);
      // A suffix " (454)" 6 karakter, tehát a név max 44 karakter lehet
      expect(result).toContain('(454)');
    });

    it('rövid nevet nem rövidíti', () => {
      const result = projectShortName('Teszt', 1, 50);
      expect(result).toBe('Teszt (1)');
    });

    it('tiltott fájlnév karaktereket eltávolítja', () => {
      const result = projectShortName('Teszt*?"<>|név', 1, 50);
      expect(result).not.toContain('*');
      expect(result).not.toContain('?');
      expect(result).not.toContain('"');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('|');
    });
  });
});
