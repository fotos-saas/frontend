import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCurrentGraduationYear, generateYearOptions } from './year-options.util';

describe('year-options.util', () => {

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // getCurrentGraduationYear
  // ============================================================================
  describe('getCurrentGraduationYear', () => {
    it('szeptemberben a következő évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 8, 1)); // szeptember = 8 (0-indexed)
      expect(getCurrentGraduationYear()).toBe(2026);
    });

    it('októberben a következő évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 9, 15)); // október
      expect(getCurrentGraduationYear()).toBe(2026);
    });

    it('decemberben a következő évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 11, 31)); // december
      expect(getCurrentGraduationYear()).toBe(2026);
    });

    it('januárban az aktuális évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 15)); // január
      expect(getCurrentGraduationYear()).toBe(2026);
    });

    it('augusztusban az aktuális évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 31)); // augusztus
      expect(getCurrentGraduationYear()).toBe(2026);
    });

    it('júniusban az aktuális évet adja', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15)); // június
      expect(getCurrentGraduationYear()).toBe(2026);
    });
  });

  // ============================================================================
  // generateYearOptions
  // ============================================================================
  describe('generateYearOptions', () => {
    it('alapértelmezetten 10 opciót generál', () => {
      const options = generateYearOptions();
      expect(options).toHaveLength(10);
    });

    it('egyedi darabszámot generál', () => {
      const options = generateYearOptions(5);
      expect(options).toHaveLength(5);
    });

    it('csökkenő sorrendben adja az éveket', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 15)); // január 2026
      const options = generateYearOptions(3);

      expect(options[0].value).toBe('2026');
      expect(options[1].value).toBe('2025');
      expect(options[2].value).toBe('2024');
    });

    it('value és label formátuma helyes', () => {
      const options = generateYearOptions(1);
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('label');
      expect(typeof options[0].value).toBe('string');
      expect(typeof options[0].label).toBe('string');
    });

    it('label megegyezik a value-val', () => {
      const options = generateYearOptions(3);
      options.forEach(opt => {
        expect(opt.label).toBe(opt.value);
      });
    });

    it('0 darab üres tömböt ad', () => {
      expect(generateYearOptions(0)).toHaveLength(0);
    });
  });
});
