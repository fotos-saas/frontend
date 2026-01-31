import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseReminderService, ReminderState } from './base-reminder.service';
import { TabloStorageService } from './tablo-storage.service';

/**
 * Test implementation of BaseReminderService
 */
class TestReminderService extends BaseReminderService {
  protected readonly DISMISSED_SUFFIX = 'test_reminder_dismissed_until';
  protected readonly SHOWN_SUFFIX = 'test_reminder_last_shown';

  // Expose protected methods for testing
  public testGetReminderState(projectId: number): ReminderState {
    return this.getReminderState(projectId);
  }

  public testShouldSkipByState(projectId: number): boolean {
    return this.shouldSkipByState(projectId);
  }

  public testParseAndValidateDate(value: string | null): Date | null {
    return this.parseAndValidateDate(value);
  }
}

describe('BaseReminderService', () => {
  let service: TestReminderService;
  let storage: TabloStorageService;
  const testProjectId = 123;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TabloStorageService]
    });

    storage = TestBed.inject(TabloStorageService);
    service = TestBed.runInInjectionContext(() => new TestReminderService());
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  // ============================================================================
  // markAsShown
  // ============================================================================
  describe('markAsShown', () => {
    it('should store current date via TabloStorageService', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      service.markAsShown(testProjectId);

      // Az új formátum: tablo:{projectId}:reminder:{suffix}
      const stored = storage.getReminderValue(testProjectId, 'test_reminder_last_shown');
      expect(stored).toBe(now.toISOString());
    });
  });

  // ============================================================================
  // setDismissal
  // ============================================================================
  describe('setDismissal', () => {
    it('should store dismissal date for specified days', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      service.setDismissal(testProjectId, 7);

      const stored = storage.getReminderValue(testProjectId, 'test_reminder_dismissed_until');
      expect(stored).toBeTruthy();

      const dismissedDate = new Date(stored!);
      // Should be 7 days from now, at midnight
      expect(dismissedDate.getDate()).toBe(22);
      expect(dismissedDate.getHours()).toBe(0);
      expect(dismissedDate.getMinutes()).toBe(0);
    });

    it('should handle 0 days dismissal', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      service.setDismissal(testProjectId, 0);

      const stored = storage.getReminderValue(testProjectId, 'test_reminder_dismissed_until');
      const dismissedDate = new Date(stored!);
      // Should be today at midnight
      expect(dismissedDate.getDate()).toBe(15);
    });
  });

  // ============================================================================
  // clearReminder
  // ============================================================================
  describe('clearReminder', () => {
    it('should remove both dismissed and shown values', () => {
      storage.setReminderValue(testProjectId, 'test_reminder_dismissed_until', '2025-01-20T00:00:00.000Z');
      storage.setReminderValue(testProjectId, 'test_reminder_last_shown', '2025-01-15T10:00:00.000Z');

      service.clearReminder(testProjectId);

      expect(storage.getReminderValue(testProjectId, 'test_reminder_dismissed_until')).toBeNull();
      expect(storage.getReminderValue(testProjectId, 'test_reminder_last_shown')).toBeNull();
    });
  });

  // ============================================================================
  // getReminderState
  // ============================================================================
  describe('getReminderState', () => {
    it('should return null values when no state exists', () => {
      const state = service.testGetReminderState(testProjectId);

      expect(state.dismissedUntil).toBeNull();
      expect(state.lastShown).toBeNull();
    });

    it('should return valid dates from storage', () => {
      // Use dates within valid range (not too far in past/future)
      const now = new Date();
      const dismissedDate = new Date(now);
      dismissedDate.setDate(dismissedDate.getDate() + 5);
      const shownDate = new Date(now);
      shownDate.setDate(shownDate.getDate() - 1);

      storage.setReminderValue(testProjectId, 'test_reminder_dismissed_until', dismissedDate.toISOString());
      storage.setReminderValue(testProjectId, 'test_reminder_last_shown', shownDate.toISOString());

      const state = service.testGetReminderState(testProjectId);

      expect(state.dismissedUntil).toBeTruthy();
      expect(state.lastShown).toBeTruthy();
      expect(state.dismissedUntil?.getDate()).toBe(dismissedDate.getDate());
      expect(state.lastShown?.getDate()).toBe(shownDate.getDate());
    });
  });

  // ============================================================================
  // parseAndValidateDate
  // ============================================================================
  describe('parseAndValidateDate', () => {
    it('should return null for null input', () => {
      expect(service.testParseAndValidateDate(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.testParseAndValidateDate('')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(service.testParseAndValidateDate('not-a-date')).toBeNull();
      expect(service.testParseAndValidateDate('2025/01/15')).toBeNull();
      expect(service.testParseAndValidateDate('15-01-2025')).toBeNull();
    });

    it('should return null for too long strings', () => {
      const longString = '2025-01-15T10:00:00.000Z' + 'a'.repeat(50);
      expect(service.testParseAndValidateDate(longString)).toBeNull();
    });

    it('should return null for dates too far in the past', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      expect(service.testParseAndValidateDate(twoYearsAgo.toISOString())).toBeNull();
    });

    it('should return null for dates too far in the future', () => {
      const now = new Date();
      const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
      expect(service.testParseAndValidateDate(twoYearsFromNow.toISOString())).toBeNull();
    });

    it('should return valid date for correct ISO string', () => {
      const validDate = new Date();
      const result = service.testParseAndValidateDate(validDate.toISOString());
      expect(result).toEqual(validDate);
    });

    it('should reject dates without milliseconds (strict ISO format required)', () => {
      // The regex requires exactly .xxx before Z (milliseconds)
      const dateString = '2025-01-15T10:00:00Z';
      const result = service.testParseAndValidateDate(dateString);
      // This format doesn't match the strict regex pattern
      expect(result).toBeNull();
    });

    it('should accept dates with milliseconds', () => {
      const now = new Date();
      const result = service.testParseAndValidateDate(now.toISOString());
      expect(result).toBeTruthy();
      expect(result?.getTime()).toBe(now.getTime());
    });
  });

  // ============================================================================
  // shouldSkipByState
  // ============================================================================
  describe('shouldSkipByState', () => {
    it('should return true for invalid project ID', () => {
      expect(service.testShouldSkipByState(0)).toBe(true);
      expect(service.testShouldSkipByState(-1)).toBe(true);
      expect(service.testShouldSkipByState(1.5)).toBe(true);
    });

    it('should return false when no state exists', () => {
      expect(service.testShouldSkipByState(testProjectId)).toBe(false);
    });

    it('should return true when dismissed until future date', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Dismissed until Jan 20
      storage.setReminderValue(
        testProjectId,
        'test_reminder_dismissed_until',
        '2025-01-20T00:00:00.000Z'
      );

      expect(service.testShouldSkipByState(testProjectId)).toBe(true);
    });

    it('should return false when dismissal has expired', () => {
      const now = new Date('2025-01-25T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Dismissed until Jan 20 (past)
      storage.setReminderValue(
        testProjectId,
        'test_reminder_dismissed_until',
        '2025-01-20T00:00:00.000Z'
      );

      expect(service.testShouldSkipByState(testProjectId)).toBe(false);
    });

    it('should return true when already shown today', () => {
      const now = new Date('2025-01-15T14:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Shown earlier today
      storage.setReminderValue(
        testProjectId,
        'test_reminder_last_shown',
        '2025-01-15T09:00:00.000Z'
      );

      expect(service.testShouldSkipByState(testProjectId)).toBe(true);
    });

    it('should return false when shown yesterday', () => {
      const now = new Date('2025-01-16T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Shown yesterday
      storage.setReminderValue(
        testProjectId,
        'test_reminder_last_shown',
        '2025-01-15T09:00:00.000Z'
      );

      expect(service.testShouldSkipByState(testProjectId)).toBe(false);
    });
  });

  // ============================================================================
  // Migration from old kv: keys
  // ============================================================================
  describe('migration from old kv: keys', () => {
    it('should migrate old kv: key when reading state', () => {
      // Simulate old key format
      const oldKey = `kv:${testProjectId}:test_reminder_last_shown`;
      localStorage.setItem(oldKey, '2025-01-15T09:00:00.000Z');

      // Reading state should migrate the old key
      const state = service.testGetReminderState(testProjectId);

      expect(state.lastShown).toBeTruthy();
      // Old key should be removed
      expect(localStorage.getItem(oldKey)).toBeNull();
      // New format should have the value
      expect(storage.getReminderValue(testProjectId, 'test_reminder_last_shown')).toBe('2025-01-15T09:00:00.000Z');
    });
  });
});
