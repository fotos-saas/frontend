import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FinalizationReminderService } from './finalization-reminder.service';
import { TabloStorageService } from './tablo-storage.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { TabloStorageSessionService } from './tablo-storage-session.service';
import { TabloStorageUiService } from './tablo-storage-ui.service';
import { LoggerService } from './logger.service';
import { Injectable, runInInjectionContext, EnvironmentInjector } from '@angular/core';

/**
 * Teszt subclass: eagerly init-eli a storage-ot (NG0203 workaround)
 */
@Injectable()
class TestableFinalizationReminderService extends FinalizationReminderService {
  constructor() {
    super();
    // Eager init a storage getter-t az injection context-en belul
    void this.storage;
  }
}

describe('FinalizationReminderService', () => {
  let service: FinalizationReminderService;
  const testProjectId = 123;

  // Actual storage key format: tablo:{projectId}:reminder:{suffix}
  const dismissedKey = 'tablo:123:reminder:finalization_dismissed_until';
  const shownKey = 'tablo:123:reminder:finalization_last_shown';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FinalizationReminderService, useClass: TestableFinalizationReminderService },
        TabloStorageService,
        TabloStorageCrudService,
        TabloStorageSessionService,
        TabloStorageUiService,
        LoggerService,
      ]
    });
    localStorage.clear();
    service = TestBed.inject(FinalizationReminderService);
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

      // Set dismissal that expired - use new key format
      localStorage.setItem(
        dismissedKey,
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

      // Set as shown yesterday - use new key format
      localStorage.setItem(
        shownKey,
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

      const stored = localStorage.getItem(dismissedKey);
      const dismissedDate = new Date(stored!);

      // Should be 7 days from now at midnight (Jan 22)
      expect(dismissedDate.getDate()).toBe(22);
    });

    it('should allow custom dismissal days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));

      service.setDismissal(testProjectId, 3);

      const stored = localStorage.getItem(dismissedKey);
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
      service.setDismissal(testProjectId);
      service.markAsShown(testProjectId);

      service.clearReminder(testProjectId);

      expect(localStorage.getItem(dismissedKey)).toBeNull();
      expect(localStorage.getItem(shownKey)).toBeNull();
    });
  });
});
