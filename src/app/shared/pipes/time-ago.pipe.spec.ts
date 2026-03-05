import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
    // Fix "now" to 2026-03-05T12:00:00Z for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // Null/undefined/invalid handling
  // ==========================================================================
  describe('null/undefined/invalid handling', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should return empty string for invalid date string', () => {
      expect(pipe.transform('not-a-date')).toBe('');
    });

    it('should return empty string for invalid Date object', () => {
      expect(pipe.transform(new Date('invalid'))).toBe('');
    });
  });

  // ==========================================================================
  // Múltbeli idő (past)
  // ==========================================================================
  describe('past dates', () => {
    it('should return "most" for less than 60 seconds ago', () => {
      const date = new Date('2026-03-05T11:59:30Z'); // 30 sec ago
      expect(pipe.transform(date)).toBe('most');
    });

    it('should return "most" for 0 seconds ago', () => {
      const date = new Date('2026-03-05T12:00:00Z');
      expect(pipe.transform(date)).toBe('most');
    });

    it('should return minutes for 1-59 minutes ago', () => {
      const oneMinAgo = new Date('2026-03-05T11:59:00Z');
      expect(pipe.transform(oneMinAgo)).toBe('1 perce');

      const thirtyMinAgo = new Date('2026-03-05T11:30:00Z');
      expect(pipe.transform(thirtyMinAgo)).toBe('30 perce');

      const fiftyNineMinAgo = new Date('2026-03-05T11:01:00Z');
      expect(pipe.transform(fiftyNineMinAgo)).toBe('59 perce');
    });

    it('should return hours for 1-23 hours ago', () => {
      const oneHourAgo = new Date('2026-03-05T11:00:00Z');
      expect(pipe.transform(oneHourAgo)).toBe('1 órája');

      const twelveHoursAgo = new Date('2026-03-05T00:00:00Z');
      expect(pipe.transform(twelveHoursAgo)).toBe('12 órája');
    });

    it('should return days for 1-6 days ago', () => {
      const oneDayAgo = new Date('2026-03-04T12:00:00Z');
      expect(pipe.transform(oneDayAgo)).toBe('1 napja');

      const sixDaysAgo = new Date('2026-02-27T12:00:00Z');
      expect(pipe.transform(sixDaysAgo)).toBe('6 napja');
    });

    it('should return weeks for 1-3 weeks ago', () => {
      const oneWeekAgo = new Date('2026-02-26T12:00:00Z');
      expect(pipe.transform(oneWeekAgo)).toBe('1 hete');

      const threeWeeksAgo = new Date('2026-02-12T12:00:00Z');
      expect(pipe.transform(threeWeeksAgo)).toBe('3 hete');
    });

    it('should return months for 1-11 months ago', () => {
      const oneMonthAgo = new Date('2026-02-01T12:00:00Z'); // ~32 days
      expect(pipe.transform(oneMonthAgo)).toBe('1 hónapja');

      const sixMonthsAgo = new Date('2025-09-01T12:00:00Z');
      expect(pipe.transform(sixMonthsAgo)).toBe('6 hónapja');
    });

    it('should return years for 1+ years ago', () => {
      const oneYearAgo = new Date('2025-01-01T12:00:00Z');
      expect(pipe.transform(oneYearAgo)).toBe('1 éve');

      const twoYearsAgo = new Date('2024-01-01T12:00:00Z');
      expect(pipe.transform(twoYearsAgo)).toBe('2 éve');
    });

    it('should accept ISO string input', () => {
      expect(pipe.transform('2026-03-05T11:59:00Z')).toBe('1 perce');
    });
  });

  // ==========================================================================
  // Jövőbeli idő (future)
  // ==========================================================================
  describe('future dates', () => {
    it('should return minutes for future within 60 minutes', () => {
      const fiveMinLater = new Date('2026-03-05T12:05:00Z');
      expect(pipe.transform(fiveMinLater)).toBe('5 perc múlva');
    });

    it('should return hours for future within 24 hours', () => {
      const threeHoursLater = new Date('2026-03-05T15:00:00Z');
      expect(pipe.transform(threeHoursLater)).toBe('3 óra múlva');
    });

    it('should return days for future within 7 days', () => {
      const twoDaysLater = new Date('2026-03-07T12:00:00Z');
      expect(pipe.transform(twoDaysLater)).toBe('2 nap múlva');
    });

    it('should return weeks for future beyond 7 days', () => {
      const twoWeeksLater = new Date('2026-03-19T12:00:00Z');
      expect(pipe.transform(twoWeeksLater)).toBe('2 hét múlva');
    });
  });
});
