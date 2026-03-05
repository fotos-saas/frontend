import { describe, it, expect } from 'vitest';
import { formatTimeAgo } from './time-formatter.util';

describe('time-formatter.util', () => {

  describe('formatTimeAgo', () => {
    it('most (kevesebb mint 1 perc)', () => {
      const now = new Date().toISOString();
      expect(formatTimeAgo(now)).toBe('most');
    });

    it('percek', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatTimeAgo(fiveMinAgo)).toBe('5 perce');
    });

    it('1 perc', () => {
      const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      expect(formatTimeAgo(oneMinAgo)).toBe('1 perce');
    });

    it('órák', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(twoHoursAgo)).toBe('2 órája');
    });

    it('napok', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(threeDaysAgo)).toBe('3 napja');
    });

    it('hetek', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(twoWeeksAgo)).toBe('2 hete');
    });

    it('hónapok', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(twoMonthsAgo)).toBe('2 hónapja');
    });

    it('59 perc még perce', () => {
      const fiftyNineMin = new Date(Date.now() - 59 * 60 * 1000).toISOString();
      expect(formatTimeAgo(fiftyNineMin)).toBe('59 perce');
    });

    it('23 óra még órája', () => {
      const twentyThreeHours = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(twentyThreeHours)).toBe('23 órája');
    });

    it('6 nap még napja', () => {
      const sixDays = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(sixDays)).toBe('6 napja');
    });
  });
});
