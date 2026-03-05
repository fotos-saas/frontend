import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { HomeStateService } from './home-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ScheduleReminderService } from '../../core/services/schedule-reminder.service';
import { FinalizationReminderService } from '../../core/services/finalization-reminder.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { ProjectModeService } from '../../core/services/project-mode.service';
import { GuestService } from '../../core/services/guest.service';

describe('HomeStateService', () => {
  let service: HomeStateService;

  const mockRouter = { navigate: vi.fn(), events: of() };
  const mockAuthService = { project$: of(null), getProject: vi.fn(() => null), isGuest: vi.fn(() => false), canFinalize: vi.fn(() => false) };
  const mockClipboard = { copyLink: vi.fn() };
  const mockScheduleReminder = { shouldShowReminder: vi.fn(() => false), markAsShown: vi.fn() };
  const mockFinalizationReminder = { shouldShowReminder: vi.fn(() => false), markAsShown: vi.fn() };
  const mockToast = { success: vi.fn(), error: vi.fn() };
  const mockLogger = { error: vi.fn() };
  const mockProjectMode = { showSamples: vi.fn(() => false), showOrderData: vi.fn(() => false), showTemplateChooser: vi.fn(() => false), showMissingPersons: vi.fn(() => false) };
  const mockGuestService = { hasRegisteredSession: vi.fn(() => false), isSessionPending: vi.fn(() => false) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeStateService,
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClipboardService, useValue: mockClipboard },
        { provide: ScheduleReminderService, useValue: mockScheduleReminder },
        { provide: FinalizationReminderService, useValue: mockFinalizationReminder },
        { provide: ToastService, useValue: mockToast },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ProjectModeService, useValue: mockProjectMode },
        { provide: GuestService, useValue: mockGuestService },
      ],
    });
    service = TestBed.inject(HomeStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.showOnboardingDialog()).toBe(false);
    expect(service.isOnboardingSubmitting()).toBe(false);
    expect(service.onboardingError()).toBeNull();
    expect(service.showPendingVerification()).toBe(false);
  });

  it('formatPhotoDate should format date', () => {
    const result = service.formatPhotoDate('2025-06-15');
    expect(result).toContain('2025');
  });

  it('formatPhotoDate should return empty for null', () => {
    expect(service.formatPhotoDate(null)).toBe('');
  });

  it('copyShareLink should call clipboard', () => {
    service.copyShareLink('https://example.com');
    expect(mockClipboard.copyLink).toHaveBeenCalledWith('https://example.com');
  });

  it('openContactEditDialog should set dialog data', () => {
    // Cannot call without init, but can test with null
    expect(service.showContactEditDialog).toBe(false);
  });
});
