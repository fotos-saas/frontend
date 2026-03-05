import { TestBed } from '@angular/core/testing';
import { PhotoSelectionReminderService, STEP_REMINDER_MESSAGES } from './photo-selection-reminder.service';
import { TabloStorageService } from './tablo-storage.service';

describe('PhotoSelectionReminderService', () => {
  let service: PhotoSelectionReminderService;
  const mockStorage = {
    getReminderValue: vi.fn().mockReturnValue(null),
    setReminderValue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: TabloStorageService, useValue: mockStorage },
      ],
    });
    service = TestBed.inject(PhotoSelectionReminderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shouldShowReminder', () => {
    it('false ha nincs galéria', () => {
      expect(service.shouldShowReminder(1, false, 'claiming')).toBe(false);
    });

    it('false ha nincs step', () => {
      expect(service.shouldShowReminder(1, true, null)).toBe(false);
    });

    it('false ha completed', () => {
      expect(service.shouldShowReminder(1, true, 'completed')).toBe(false);
    });

    it('false ha érvénytelen projectId', () => {
      expect(service.shouldShowReminder(-1, true, 'claiming')).toBe(false);
    });

    it('true ha minden feltétel teljesül', () => {
      expect(service.shouldShowReminder(1, true, 'claiming')).toBe(true);
    });

    it('false ha halasztva van', () => {
      const future = new Date(Date.now() + 60000).toISOString();
      mockStorage.getReminderValue.mockReturnValue(future);
      expect(service.shouldShowReminder(1, true, 'claiming')).toBe(false);
    });
  });

  describe('getMessageForStep', () => {
    it('claiming üzenetet ad vissza', () => {
      const msg = service.getMessageForStep('claiming');
      expect(msg).toBeTruthy();
      expect(msg!.title).toBe(STEP_REMINDER_MESSAGES.claiming.title);
    });

    it('null completed step-re', () => {
      expect(service.getMessageForStep('completed')).toBeNull();
    });
  });

  describe('getEffectiveStep', () => {
    it('claiming ha nincs claimed kép', () => {
      expect(service.getEffectiveStep(null, { claimedCount: 0, retouchCount: 0, hasTabloPhoto: false })).toBe('claiming');
    });

    it('retouch ha van claimed de nincs retouch', () => {
      expect(service.getEffectiveStep(null, { claimedCount: 5, retouchCount: 0, hasTabloPhoto: false })).toBe('retouch');
    });

    it('tablo ha van retouch de nincs tabló', () => {
      expect(service.getEffectiveStep(null, { claimedCount: 5, retouchCount: 3, hasTabloPhoto: false })).toBe('tablo');
    });

    it('finalization ha van tablókép de nincs véglegesítve', () => {
      expect(service.getEffectiveStep(null, { claimedCount: 5, retouchCount: 3, hasTabloPhoto: true }, false)).toBe('finalization');
    });

    it('completed ha minden kész', () => {
      expect(service.getEffectiveStep(null, { claimedCount: 5, retouchCount: 3, hasTabloPhoto: true }, true)).toBe('completed');
    });

    it('currentStep-et használja ha nincs progress', () => {
      expect(service.getEffectiveStep('retouch', null)).toBe('retouch');
    });
  });

  describe('markAsShownForStep', () => {
    it('storage-ba ment', () => {
      service.markAsShownForStep(1, 'claiming');
      expect(mockStorage.setReminderValue).toHaveBeenCalledWith(
        1, 'photo_selection:claiming:last_shown', expect.any(String)
      );
    });
  });

  describe('setDismissalForStep', () => {
    it('storage-ba ment halasztási dátumot', () => {
      service.setDismissalForStep(1, 'claiming', 1);
      expect(mockStorage.setReminderValue).toHaveBeenCalledWith(
        1, 'photo_selection:claiming:dismissed_until', expect.any(String)
      );
    });
  });

  describe('snoozeForHalfDayForStep', () => {
    it('fél napos halasztást ment', () => {
      service.snoozeForHalfDayForStep(1, 'retouch');
      expect(mockStorage.setReminderValue).toHaveBeenCalled();
    });
  });
});
