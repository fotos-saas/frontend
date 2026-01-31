import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ScheduleReminderService } from './schedule-reminder.service';

describe('ScheduleReminderService', () => {
  let service: ScheduleReminderService;
  const testProjectId = 123;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScheduleReminderService]
    });
    service = TestBed.inject(ScheduleReminderService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  // ============================================================================
  // shouldShowReminder
  // ============================================================================
  describe('shouldShowReminder', () => {
    it('should return false if photoDate is set', () => {
      const result = service.shouldShowReminder(testProjectId, '2025-02-15');

      expect(result).toBe(false);
    });

    it('should return true if photoDate is null and no dismissal', () => {
      const result = service.shouldShowReminder(testProjectId, null);

      expect(result).toBe(true);
    });

    it('should return true if photoDate is undefined and no dismissal', () => {
      const result = service.shouldShowReminder(testProjectId, undefined);

      expect(result).toBe(true);
    });

    it('should return false if dismissed until future date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));

      // Set dismissal until Jan 20
      service.setDismissal(testProjectId, 5);

      const result = service.shouldShowReminder(testProjectId, null);

      expect(result).toBe(false);
    });

    it('should return true if dismissal has expired', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-25T10:00:00.000Z'));

      // Set dismissal that expired (pretend it was set earlier)
      localStorage.setItem(
        'kv:123:schedule_reminder_dismissed_until',
        '2025-01-20T00:00:00.000Z'
      );

      const result = service.shouldShowReminder(testProjectId, null);

      expect(result).toBe(true);
    });

    it('should return false if already shown today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T14:00:00.000Z'));

      // Mark as shown today
      service.markAsShown(testProjectId);

      const result = service.shouldShowReminder(testProjectId, null);

      expect(result).toBe(false);
    });

    it('should return true if shown yesterday', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-16T10:00:00.000Z'));

      // Set as shown yesterday
      localStorage.setItem(
        'kv:123:schedule_reminder_last_shown',
        '2025-01-15T14:00:00.000Z'
      );

      const result = service.shouldShowReminder(testProjectId, null);

      expect(result).toBe(true);
    });

    it('should return false for invalid project ID', () => {
      expect(service.shouldShowReminder(0, null)).toBe(false);
      expect(service.shouldShowReminder(-1, null)).toBe(false);
    });
  });

  // ============================================================================
  // Storage keys
  // ============================================================================
  describe('storage keys', () => {
    it('should use correct dismissed key format', () => {
      service.setDismissal(testProjectId, 1);

      expect(localStorage.getItem('kv:123:schedule_reminder_dismissed_until')).toBeTruthy();
    });

    it('should use correct shown key format', () => {
      service.markAsShown(testProjectId);

      expect(localStorage.getItem('kv:123:schedule_reminder_last_shown')).toBeTruthy();
    });
  });

  // ============================================================================
  // clearReminder
  // ============================================================================
  describe('clearReminder', () => {
    it('should clear both dismissed and shown keys', () => {
      service.setDismissal(testProjectId, 5);
      service.markAsShown(testProjectId);

      service.clearReminder(testProjectId);

      expect(localStorage.getItem('kv:123:schedule_reminder_dismissed_until')).toBeNull();
      expect(localStorage.getItem('kv:123:schedule_reminder_last_shown')).toBeNull();
    });
  });
});
