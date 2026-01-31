import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FinalizationReminderService } from './finalization-reminder.service';

describe('FinalizationReminderService', () => {
  let service: FinalizationReminderService;
  const testProjectId = 123;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FinalizationReminderService]
    });
    service = TestBed.inject(FinalizationReminderService);
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
    it('should return false if already finalized', () => {
      const result = service.shouldShowReminder(testProjectId, true, true);

      expect(result).toBe(false);
    });

    it('should return false if cannot finalize (share/preview user)', () => {
      const result = service.shouldShowReminder(testProjectId, false, false);

      expect(result).toBe(false);
    });

    it('should return true if not finalized and can finalize', () => {
      const result = service.shouldShowReminder(testProjectId, false, true);

      expect(result).toBe(true);
    });

    it('should return false if dismissed until future date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));

      // Set dismissal until Jan 22 (7 days default)
      service.setDismissal(testProjectId);

      const result = service.shouldShowReminder(testProjectId, false, true);

      expect(result).toBe(false);
    });

    it('should return true if dismissal has expired', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-30T10:00:00.000Z'));

      // Set dismissal that expired
      localStorage.setItem(
        'kv:123:finalization_reminder_dismissed_until',
        '2025-01-22T00:00:00.000Z'
      );

      const result = service.shouldShowReminder(testProjectId, false, true);

      expect(result).toBe(true);
    });

    it('should return false if already shown today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T14:00:00.000Z'));

      // Mark as shown today
      service.markAsShown(testProjectId);

      const result = service.shouldShowReminder(testProjectId, false, true);

      expect(result).toBe(false);
    });

    it('should return true if shown yesterday', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-16T10:00:00.000Z'));

      // Set as shown yesterday
      localStorage.setItem(
        'kv:123:finalization_reminder_last_shown',
        '2025-01-15T14:00:00.000Z'
      );

      const result = service.shouldShowReminder(testProjectId, false, true);

      expect(result).toBe(true);
    });

    it('should return false for invalid project ID', () => {
      expect(service.shouldShowReminder(0, false, true)).toBe(false);
      expect(service.shouldShowReminder(-1, false, true)).toBe(false);
    });
  });

  // ============================================================================
  // setDismissal
  // ============================================================================
  describe('setDismissal', () => {
    it('should use default 7 days dismissal', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));

      service.setDismissal(testProjectId);

      const stored = localStorage.getItem('kv:123:finalization_reminder_dismissed_until');
      const dismissedDate = new Date(stored!);

      // Should be 7 days from now at midnight (Jan 22)
      expect(dismissedDate.getDate()).toBe(22);
    });

    it('should allow custom dismissal days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));

      service.setDismissal(testProjectId, 3);

      const stored = localStorage.getItem('kv:123:finalization_reminder_dismissed_until');
      const dismissedDate = new Date(stored!);

      // Should be 3 days from now at midnight (Jan 18)
      expect(dismissedDate.getDate()).toBe(18);
    });
  });

  // ============================================================================
  // Storage keys
  // ============================================================================
  describe('storage keys', () => {
    it('should use correct dismissed key format', () => {
      service.setDismissal(testProjectId, 1);

      expect(localStorage.getItem('kv:123:finalization_reminder_dismissed_until')).toBeTruthy();
    });

    it('should use correct shown key format', () => {
      service.markAsShown(testProjectId);

      expect(localStorage.getItem('kv:123:finalization_reminder_last_shown')).toBeTruthy();
    });
  });

  // ============================================================================
  // clearReminder
  // ============================================================================
  describe('clearReminder', () => {
    it('should clear both dismissed and shown keys', () => {
      service.setDismissal(testProjectId);
      service.markAsShown(testProjectId);

      service.clearReminder(testProjectId);

      expect(localStorage.getItem('kv:123:finalization_reminder_dismissed_until')).toBeNull();
      expect(localStorage.getItem('kv:123:finalization_reminder_last_shown')).toBeNull();
    });
  });
});
