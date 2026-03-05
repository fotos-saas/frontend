import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { ScheduleReminderService } from './schedule-reminder.service';
import { TabloStorageService } from './tablo-storage.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { TabloStorageSessionService } from './tablo-storage-session.service';
import { TabloStorageUiService } from './tablo-storage-ui.service';
import { LoggerService } from './logger.service';

/**
 * Teszt subclass: eagerly init-eli a storage-ot (NG0203 workaround)
 */
@Injectable()
class TestableScheduleReminderService extends ScheduleReminderService {
  constructor() {
    super();
    // Eager init a storage getter-t az injection context-en belul
    void this.storage;
  }
}

describe('ScheduleReminderService', () => {
  let service: ScheduleReminderService;
  const testProjectId = 123;

  // Actual storage key format: tablo:{projectId}:reminder:{suffix}
  const dismissedKey = 'tablo:123:reminder:schedule_dismissed_until';
  const shownKey = 'tablo:123:reminder:schedule_last_shown';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ScheduleReminderService, useClass: TestableScheduleReminderService },
        TabloStorageService,
        TabloStorageCrudService,
        TabloStorageSessionService,
        TabloStorageUiService,
        LoggerService,
      ]
    });
    localStorage.clear();
    service = TestBed.inject(ScheduleReminderService);
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

      // Set dismissal that expired - use new key format
      localStorage.setItem(
        dismissedKey,
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

      // Set as shown yesterday - use new key format
      localStorage.setItem(
        shownKey,
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

      expect(localStorage.getItem(dismissedKey)).toBeTruthy();
    });

    it('should use correct shown key format', () => {
      service.markAsShown(testProjectId);

      expect(localStorage.getItem(shownKey)).toBeTruthy();
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

      expect(localStorage.getItem(dismissedKey)).toBeNull();
      expect(localStorage.getItem(shownKey)).toBeNull();
    });
  });
});
