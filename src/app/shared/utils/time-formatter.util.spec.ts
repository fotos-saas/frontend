import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo } from './time-formatter.util';

describe('time-formatter.util', () => {

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // Null/undefined/invalid handling
  // ==========================================================================
  describe('null/undefined/invalid', () => {
    it('null → üres string', () => {
      expect(formatTimeAgo(null)).toBe('');
    });

    it('undefined → üres string', () => {
      expect(formatTimeAgo(undefined)).toBe('');
    });

    it('üres string → üres string', () => {
      expect(formatTimeAgo('')).toBe('');
    });

    it('érvénytelen dátum string → üres string', () => {
      expect(formatTimeAgo('not-a-date')).toBe('');
    });

    it('érvénytelen Date objektum → üres string', () => {
      expect(formatTimeAgo(new Date('invalid'))).toBe('');
    });
  });

  // ==========================================================================
  // Múltbeli idő
  // ==========================================================================
  describe('múltbeli idő', () => {
    it('most (kevesebb mint 60 mp)', () => {
      expect(formatTimeAgo(new Date('2026-03-05T11:59:30Z'))).toBe('most');
      expect(formatTimeAgo(new Date('2026-03-05T12:00:00Z'))).toBe('most');
    });

    it('percek (1-59)', () => {
      expect(formatTimeAgo(new Date('2026-03-05T11:59:00Z'))).toBe('1 perce');
      expect(formatTimeAgo(new Date('2026-03-05T11:30:00Z'))).toBe('30 perce');
      expect(formatTimeAgo(new Date('2026-03-05T11:01:00Z'))).toBe('59 perce');
    });

    it('órák (1-23)', () => {
      expect(formatTimeAgo(new Date('2026-03-05T11:00:00Z'))).toBe('1 órája');
      expect(formatTimeAgo(new Date('2026-03-05T00:00:00Z'))).toBe('12 órája');
    });

    it('napok (1-6)', () => {
      expect(formatTimeAgo(new Date('2026-03-04T12:00:00Z'))).toBe('1 napja');
      expect(formatTimeAgo(new Date('2026-02-27T12:00:00Z'))).toBe('6 napja');
    });

    it('hetek (1-3)', () => {
      expect(formatTimeAgo(new Date('2026-02-26T12:00:00Z'))).toBe('1 hete');
      expect(formatTimeAgo(new Date('2026-02-12T12:00:00Z'))).toBe('3 hete');
    });

    it('hónapok (1-11)', () => {
      expect(formatTimeAgo(new Date('2026-02-01T12:00:00Z'))).toBe('1 hónapja');
      expect(formatTimeAgo(new Date('2025-09-01T12:00:00Z'))).toBe('6 hónapja');
    });

    it('évek (1+)', () => {
      expect(formatTimeAgo(new Date('2025-01-01T12:00:00Z'))).toBe('1 éve');
      expect(formatTimeAgo(new Date('2024-01-01T12:00:00Z'))).toBe('2 éve');
    });

    it('ISO string input', () => {
      expect(formatTimeAgo('2026-03-05T11:59:00Z')).toBe('1 perce');
      expect(formatTimeAgo('2026-03-05T11:30:00Z')).toBe('30 perce');
    });
  });

  // ==========================================================================
  // Jövőbeli idő
  // ==========================================================================
  describe('jövőbeli idő', () => {
    it('percek', () => {
      expect(formatTimeAgo(new Date('2026-03-05T12:05:00Z'))).toBe('5 perc múlva');
    });

    it('órák', () => {
      expect(formatTimeAgo(new Date('2026-03-05T15:00:00Z'))).toBe('3 óra múlva');
    });

    it('napok', () => {
      expect(formatTimeAgo(new Date('2026-03-07T12:00:00Z'))).toBe('2 nap múlva');
    });

    it('hetek', () => {
      expect(formatTimeAgo(new Date('2026-03-19T12:00:00Z'))).toBe('2 hét múlva');
    });
  });

  // ==========================================================================
  // fallbackToDate opció
  // ==========================================================================
  describe('fallbackToDate opció', () => {
    it('7 napon belül: normál relatív szöveg', () => {
      expect(formatTimeAgo(new Date('2026-03-04T12:00:00Z'), { fallbackToDate: true })).toBe('1 napja');
      expect(formatTimeAgo(new Date('2026-03-05T11:00:00Z'), { fallbackToDate: true })).toBe('1 órája');
    });

    it('7+ nap: formázott dátum', () => {
      expect(formatTimeAgo(new Date('2026-01-15T12:00:00Z'), { fallbackToDate: true })).toBe('2026.01.15.');
      expect(formatTimeAgo(new Date('2025-06-01T12:00:00Z'), { fallbackToDate: true })).toBe('2025.06.01.');
    });

    it('7+ nap fallbackToDate nélkül: hete/hónapja/éve', () => {
      expect(formatTimeAgo(new Date('2026-02-26T12:00:00Z'))).toBe('1 hete');
      expect(formatTimeAgo(new Date('2025-09-01T12:00:00Z'))).toBe('6 hónapja');
    });
  });
});
