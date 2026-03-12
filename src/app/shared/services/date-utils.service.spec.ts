import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from './date-utils.service';

describe('DateUtilsService', () => {
  let service: DateUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateUtilsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // isExpired
  // ==========================================================================
  describe('isExpired', () => {
    it('lejárt dátumra true-t ad', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 nappal ezelőtt
      expect(service.isExpired(pastDate)).toBe(true);
    });

    it('jövőbeli dátumra false-t ad', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      expect(service.isExpired(futureDate)).toBe(false);
    });

    it('null/undefined/üres stringre false-t ad', () => {
      expect(service.isExpired(null)).toBe(false);
      expect(service.isExpired(undefined)).toBe(false);
      expect(service.isExpired('')).toBe(false);
    });
  });

  // ==========================================================================
  // getRemainingMs
  // ==========================================================================
  describe('getRemainingMs', () => {
    it('pozitív értéket ad jövőbeli dátumra', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const result = service.getRemainingMs(futureDate);
      expect(result).not.toBeNull();
      expect(result!).toBeGreaterThan(0);
    });

    it('negatív értéket ad múltbeli dátumra', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const result = service.getRemainingMs(pastDate);
      expect(result).not.toBeNull();
      expect(result!).toBeLessThan(0);
    });

    it('null-t ad null/undefined/üres stringre', () => {
      expect(service.getRemainingMs(null)).toBeNull();
      expect(service.getRemainingMs(undefined)).toBeNull();
      expect(service.getRemainingMs('')).toBeNull();
    });
  });

  // ==========================================================================
  // getRemainingDays
  // ==========================================================================
  describe('getRemainingDays', () => {
    it('helyes napok számát adja jövőbeli dátumra', () => {
      const threeDaysLater = new Date(Date.now() + 3 * 86400000 + 1000).toISOString();
      expect(service.getRemainingDays(threeDaysLater)).toBe(3);
    });

    it('0-t ad ha ma jár le (kevesebb mint 24 óra)', () => {
      const laterToday = new Date(Date.now() + 3600000).toISOString(); // +1 óra
      expect(service.getRemainingDays(laterToday)).toBe(0);
    });

    it('negatív értéket ad lejárt dátumra', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(service.getRemainingDays(twoDaysAgo)).toBeLessThan(0);
    });

    it('null-t ad null inputra', () => {
      expect(service.getRemainingDays(null)).toBeNull();
    });
  });

  // ==========================================================================
  // getRemainingHours
  // ==========================================================================
  describe('getRemainingHours', () => {
    it('helyes órák számát adja (nap levonása után)', () => {
      // 1 nap + 5 óra + pár másodperc
      const future = new Date(Date.now() + 86400000 + 5 * 3600000 + 1000).toISOString();
      expect(service.getRemainingHours(future)).toBe(5);
    });

    it('0-t ad ha kevesebb mint 1 óra van hátra az adott napban', () => {
      const future = new Date(Date.now() + 1800000).toISOString(); // +30 perc
      expect(service.getRemainingHours(future)).toBe(0);
    });

    it('null-t ad null inputra', () => {
      expect(service.getRemainingHours(null)).toBeNull();
    });
  });

  // ==========================================================================
  // getDeadlineText
  // ==========================================================================
  describe('getDeadlineText', () => {
    it('"Lejárt" szöveget ad múltbeli dátumra', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(service.getDeadlineText(past)).toBe('Lejárt');
    });

    it('"X nap van hátra" szöveget ad több napos határidőre', () => {
      const threeDays = new Date(Date.now() + 3 * 86400000 + 1000).toISOString();
      expect(service.getDeadlineText(threeDays)).toBe('3 nap van hátra');
    });

    it('"X óra van hátra" szöveget ad ha kevesebb mint 1 nap', () => {
      const fiveHours = new Date(Date.now() + 5 * 3600000 + 1000).toISOString();
      expect(service.getDeadlineText(fiveHours)).toBe('5 óra van hátra');
    });

    it('"Hamarosan lejár" szöveget ad ha kevesebb mint 1 óra', () => {
      const soon = new Date(Date.now() + 30 * 60000).toISOString(); // +30 perc
      expect(service.getDeadlineText(soon)).toBe('Hamarosan lejár');
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.getDeadlineText(null)).toBe('');
      expect(service.getDeadlineText(undefined)).toBe('');
      expect(service.getDeadlineText('')).toBe('');
    });
  });

  // ==========================================================================
  // formatDate
  // ==========================================================================
  describe('formatDate', () => {
    it('magyar locale-lel formáz dátumot', () => {
      const result = service.formatDate('2024-01-15T12:00:00Z');
      // hu-HU locale: "2024. jan. 15."
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.formatDate(null)).toBe('');
      expect(service.formatDate(undefined)).toBe('');
      expect(service.formatDate('')).toBe('');
    });
  });

  // ==========================================================================
  // formatDateTime
  // ==========================================================================
  describe('formatDateTime', () => {
    it('dátumot és időt is tartalmaz', () => {
      const result = service.formatDateTime('2024-01-15T14:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('15');
      // Az idő rész jelenléte (óra:perc)
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.formatDateTime(null)).toBe('');
      expect(service.formatDateTime(undefined)).toBe('');
      expect(service.formatDateTime('')).toBe('');
    });
  });

  // ==========================================================================
  // formatTime
  // ==========================================================================
  describe('formatTime', () => {
    it('csak időt ad vissza', () => {
      const result = service.formatTime('2024-01-15T14:30:00Z');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.formatTime(null)).toBe('');
      expect(service.formatTime(undefined)).toBe('');
      expect(service.formatTime('')).toBe('');
    });
  });

  // ==========================================================================
  // calculateDeadline
  // ==========================================================================
  describe('calculateDeadline', () => {
    it('ISO stringet ad vissza', () => {
      const result = service.calculateDeadline(7);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('a deadline a megadott nappal később 23:59:59-re áll', () => {
      const result = service.calculateDeadline(3);
      const date = new Date(result);
      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
      expect(date.getSeconds()).toBe(59);
    });

    it('jövőbeli dátumot generál pozitív napokra', () => {
      const result = service.calculateDeadline(5);
      const deadline = new Date(result);
      expect(deadline.getTime()).toBeGreaterThan(Date.now());
    });

    it('0 napra a mai napot adja (23:59:59)', () => {
      const result = service.calculateDeadline(0);
      const deadline = new Date(result);
      const today = new Date();
      expect(deadline.getDate()).toBe(today.getDate());
    });
  });

  // ==========================================================================
  // daysBetween
  // ==========================================================================
  describe('daysBetween', () => {
    it('helyes napkülönbséget ad string inputokkal', () => {
      const start = '2024-01-01T00:00:00Z';
      const end = '2024-01-11T00:00:00Z';
      expect(service.daysBetween(start, end)).toBe(10);
    });

    it('helyes napkülönbséget ad Date inputokkal', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-06');
      expect(service.daysBetween(start, end)).toBe(5);
    });

    it('negatív értéket ad ha a start későbbi mint az end', () => {
      const start = '2024-01-15T00:00:00Z';
      const end = '2024-01-10T00:00:00Z';
      expect(service.daysBetween(start, end)).toBeLessThan(0);
    });

    it('0-t ad ha ugyanaz a dátum', () => {
      const date = '2024-06-15T12:00:00Z';
      expect(service.daysBetween(date, date)).toBe(0);
    });

    it('kevert string és Date input is működik', () => {
      const start = '2024-01-01T00:00:00Z';
      const end = new Date('2024-01-04T00:00:00Z');
      expect(service.daysBetween(start, end)).toBe(3);
    });
  });

  // ==========================================================================
  // isToday
  // ==========================================================================
  describe('isToday', () => {
    it('true-t ad a mai dátumra', () => {
      const now = new Date().toISOString();
      expect(service.isToday(now)).toBe(true);
    });

    it('false-t ad tegnapi dátumra', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      expect(service.isToday(yesterday)).toBe(false);
    });

    it('false-t ad holnapi dátumra', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      expect(service.isToday(tomorrow)).toBe(false);
    });

    it('false-t ad null/undefined/üres inputra', () => {
      expect(service.isToday(null)).toBe(false);
      expect(service.isToday(undefined)).toBe(false);
      expect(service.isToday('')).toBe(false);
    });
  });

  // ==========================================================================
  // isFuture
  // ==========================================================================
  describe('isFuture', () => {
    it('true-t ad jövőbeli dátumra', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(service.isFuture(future)).toBe(true);
    });

    it('false-t ad múltbeli dátumra', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(service.isFuture(past)).toBe(false);
    });

    it('false-t ad null/undefined/üres inputra', () => {
      expect(service.isFuture(null)).toBe(false);
      expect(service.isFuture(undefined)).toBe(false);
      expect(service.isFuture('')).toBe(false);
    });
  });

  // ==========================================================================
  // isPast
  // ==========================================================================
  describe('isPast', () => {
    it('true-t ad múltbeli dátumra', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(service.isPast(past)).toBe(true);
    });

    it('false-t ad jövőbeli dátumra', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(service.isPast(future)).toBe(false);
    });

    it('false-t ad null/undefined/üres inputra', () => {
      expect(service.isPast(null)).toBe(false);
      expect(service.isPast(undefined)).toBe(false);
      expect(service.isPast('')).toBe(false);
    });
  });

  // ==========================================================================
  // getRelativeTime (múlt)
  // ==========================================================================
  describe('getRelativeTime', () => {
    it('"most" szöveget ad kevesebb mint 1 perc múltbeli dátumra', () => {
      const justNow = new Date(Date.now() - 10000).toISOString(); // 10 mp
      expect(service.getRelativeTime(justNow)).toBe('most');
    });

    it('"X perce" szöveget ad pár perccel ezelőttre', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(service.getRelativeTime(fiveMinsAgo)).toBe('5 perce');
    });

    it('"X órája" szöveget ad pár órával ezelőttre', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(service.getRelativeTime(threeHoursAgo)).toBe('3 órája');
    });

    it('"X napja" szöveget ad pár nappal ezelőttre', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(service.getRelativeTime(twoDaysAgo)).toBe('2 napja');
    });

    it('formázott dátumot ad 7+ nappal ezelőttre', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
      const result = service.getRelativeTime(twoWeeksAgo);
      // Nem relatív, hanem formázott dátum
      expect(result).not.toMatch(/napja/);
      expect(result).toContain('.');
    });

    it('formázott dátumot ad jövőbeli dátumra', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const result = service.getRelativeTime(future);
      expect(result).toContain('.');
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.getRelativeTime(null)).toBe('');
      expect(service.getRelativeTime(undefined)).toBe('');
      expect(service.getRelativeTime('')).toBe('');
    });
  });

  // ==========================================================================
  // getRelativeTimeFuture (jövő)
  // ==========================================================================
  describe('getRelativeTimeFuture', () => {
    it('"most" szöveget ad kevesebb mint 1 perc jövőbeli dátumra', () => {
      const justSoon = new Date(Date.now() + 10000).toISOString(); // +10 mp
      expect(service.getRelativeTimeFuture(justSoon)).toBe('most');
    });

    it('"X perc múlva" szöveget ad pár perc múlvára', () => {
      const fiveMinsLater = new Date(Date.now() + 5 * 60000).toISOString();
      expect(service.getRelativeTimeFuture(fiveMinsLater)).toBe('5 perc múlva');
    });

    it('"X óra múlva" szöveget ad pár óra múlvára', () => {
      const threeHoursLater = new Date(Date.now() + 3 * 3600000).toISOString();
      expect(service.getRelativeTimeFuture(threeHoursLater)).toBe('3 óra múlva');
    });

    it('"X nap múlva" szöveget ad pár nap múlvára', () => {
      const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString();
      expect(service.getRelativeTimeFuture(twoDaysLater)).toBe('2 nap múlva');
    });

    it('formázott dátumot ad 7+ nap múlvára', () => {
      const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString();
      const result = service.getRelativeTimeFuture(twoWeeksLater);
      expect(result).not.toMatch(/múlva/);
      expect(result).toContain('.');
    });

    it('múltbeli dátumra a getRelativeTime-ot delegálja', () => {
      const past = new Date(Date.now() - 5 * 60000).toISOString();
      expect(service.getRelativeTimeFuture(past)).toBe('5 perce');
    });

    it('üres stringet ad null/undefined/üres inputra', () => {
      expect(service.getRelativeTimeFuture(null)).toBe('');
      expect(service.getRelativeTimeFuture(undefined)).toBe('');
      expect(service.getRelativeTimeFuture('')).toBe('');
    });
  });
});
