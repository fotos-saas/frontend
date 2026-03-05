import { TestBed } from '@angular/core/testing';
import { TabloStorageService } from './tablo-storage.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { TabloStorageSessionService } from './tablo-storage-session.service';
import { TabloStorageUiService } from './tablo-storage-ui.service';

describe('TabloStorageService (Facade)', () => {
  let service: TabloStorageService;
  let sessionSpy: Record<string, ReturnType<typeof vi.fn>>;
  let uiSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    sessionSpy = {
      getActiveSession: vi.fn().mockReturnValue(null),
      setActiveSession: vi.fn(),
      clearActiveSession: vi.fn(),
      getAuthToken: vi.fn(),
      setAuthToken: vi.fn(),
      getProject: vi.fn(),
      setProject: vi.fn(),
      getCanFinalize: vi.fn(),
      setCanFinalize: vi.fn(),
      clearSessionAuth: vi.fn(),
      clearCurrentSessionAuth: vi.fn(),
      clearAllProjectData: vi.fn(),
      getStoredSessions: vi.fn().mockReturnValue([]),
      addSession: vi.fn(),
      removeSession: vi.fn(),
      updateSessionLastUsed: vi.fn(),
      updateSessionUserName: vi.fn(),
      findSession: vi.fn(),
      getGuestSession: vi.fn(),
      setGuestSession: vi.fn(),
      clearGuestSession: vi.fn(),
      getGuestName: vi.fn(),
      setGuestName: vi.fn(),
      getGuestId: vi.fn(),
      setGuestId: vi.fn(),
      getVerificationStatus: vi.fn(),
      setVerificationStatus: vi.fn(),
      clearGuestData: vi.fn(),
      migrateFromLegacy: vi.fn(),
    };

    uiSpy = {
      getCurrentStep: vi.fn().mockReturnValue(0),
      setCurrentStep: vi.fn(),
      getScheduleReminderDismissedUntil: vi.fn(),
      setScheduleReminderDismissedUntil: vi.fn(),
      getScheduleReminderLastShown: vi.fn(),
      setScheduleReminderLastShown: vi.fn(),
      clearScheduleReminder: vi.fn(),
      getFinalizationReminderDismissedUntil: vi.fn(),
      setFinalizationReminderDismissedUntil: vi.fn(),
      getFinalizationReminderLastShown: vi.fn(),
      setFinalizationReminderLastShown: vi.fn(),
      clearFinalizationReminder: vi.fn(),
      getReminderValue: vi.fn(),
      setReminderValue: vi.fn(),
      removeReminderValue: vi.fn(),
      clearAllReminders: vi.fn(),
      isStepInfoShown: vi.fn(),
      setStepInfoShown: vi.fn(),
      resetStepInfoShown: vi.fn(),
      resetAllStepInfoShown: vi.fn(),
      getGlobalSetting: vi.fn(),
      setGlobalSetting: vi.fn(),
      removeGlobalSetting: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TabloStorageService,
        { provide: TabloStorageCrudService, useValue: {} },
        { provide: TabloStorageSessionService, useValue: sessionSpy },
        { provide: TabloStorageUiService, useValue: uiSpy },
      ],
    });

    service = TestBed.inject(TabloStorageService);
  });

  // === DELEGATION TESTS ===

  describe('session delegálás', () => {
    it('getActiveSession a session service-re delegál', () => {
      service.getActiveSession();
      expect(sessionSpy['getActiveSession']).toHaveBeenCalled();
    });

    it('setActiveSession a session service-re delegál', () => {
      service.setActiveSession(1, 'code');
      expect(sessionSpy['setActiveSession']).toHaveBeenCalledWith(1, 'code');
    });

    it('getProject a session service-re delegál', () => {
      service.getProject(1, 'code');
      expect(sessionSpy['getProject']).toHaveBeenCalledWith(1, 'code');
    });

    it('setProject a session service-re delegál', () => {
      const project = { id: 1 } as any;
      service.setProject(1, 'code', project);
      expect(sessionSpy['setProject']).toHaveBeenCalledWith(1, 'code', project);
    });

    it('addSession a session service-re delegál', () => {
      const session = { projectId: 1, sessionType: 'code' as const, projectName: 'P', lastUsed: '' };
      service.addSession(session);
      expect(sessionSpy['addSession']).toHaveBeenCalledWith(session);
    });
  });

  describe('UI delegálás', () => {
    it('getCurrentStep a ui service-re delegál', () => {
      service.getCurrentStep(1);
      expect(uiSpy['getCurrentStep']).toHaveBeenCalledWith(1);
    });

    it('setCurrentStep a ui service-re delegál', () => {
      service.setCurrentStep(1, 2);
      expect(uiSpy['setCurrentStep']).toHaveBeenCalledWith(1, 2);
    });

    it('isStepInfoShown a ui service-re delegál', () => {
      service.isStepInfoShown(1, 'claiming');
      expect(uiSpy['isStepInfoShown']).toHaveBeenCalledWith(1, 'claiming');
    });

    it('getGlobalSetting a ui service-re delegál', () => {
      service.getGlobalSetting('theme');
      expect(uiSpy['getGlobalSetting']).toHaveBeenCalledWith('theme');
    });
  });

  describe('guest session delegálás', () => {
    it('getGuestSession a session service-re delegál', () => {
      service.getGuestSession(1, 'share');
      expect(sessionSpy['getGuestSession']).toHaveBeenCalledWith(1, 'share');
    });

    it('setGuestSession a session service-re delegál', () => {
      service.setGuestSession(1, 'share', 'token');
      expect(sessionSpy['setGuestSession']).toHaveBeenCalledWith(1, 'share', 'token');
    });

    it('clearGuestData a session service-re delegál', () => {
      service.clearGuestData(1, 'share');
      expect(sessionSpy['clearGuestData']).toHaveBeenCalledWith(1, 'share');
    });
  });

  describe('clearAllProjectData', () => {
    it('session és ui service-t is hívja', () => {
      service.clearAllProjectData(99);
      expect(sessionSpy['clearAllProjectData']).toHaveBeenCalledWith(99);
      expect(uiSpy['setCurrentStep']).toHaveBeenCalledWith(99, 0);
      expect(uiSpy['clearAllReminders']).toHaveBeenCalledWith(99);
    });
  });

  describe('migrateFromLegacy', () => {
    it('a session service-re delegál', () => {
      service.migrateFromLegacy();
      expect(sessionSpy['migrateFromLegacy']).toHaveBeenCalled();
    });
  });
});
