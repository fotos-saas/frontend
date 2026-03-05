import { TestBed } from '@angular/core/testing';
import { TabloStorageUiService } from './tablo-storage-ui.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { LoggerService } from './logger.service';

describe('TabloStorageUiService', () => {
  let service: TabloStorageUiService;
  let crudSpy: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    crudSpy = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        TabloStorageUiService,
        { provide: TabloStorageCrudService, useValue: crudSpy },
        { provide: LoggerService, useValue: { warn: vi.fn() } },
      ],
    });

    service = TestBed.inject(TabloStorageUiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // === UI STATE ===

  describe('getCurrentStep / setCurrentStep', () => {
    it('0-t ad vissza ha nincs tárolt érték', () => {
      expect(service.getCurrentStep(1)).toBe(0);
    });

    it('tárolt step-et olvas', () => {
      crudSpy.getItem.mockReturnValue('2');
      expect(service.getCurrentStep(1)).toBe(2);
    });

    it('0-3 közé clamp-eli az értéket', () => {
      crudSpy.getItem.mockReturnValue('5');
      expect(service.getCurrentStep(1)).toBe(3);

      crudSpy.getItem.mockReturnValue('-1');
      expect(service.getCurrentStep(1)).toBe(0);
    });

    it('0-t ad vissza NaN esetén', () => {
      crudSpy.getItem.mockReturnValue('abc');
      expect(service.getCurrentStep(1)).toBe(0);
    });

    it('step-et ment a crud service-en keresztül', () => {
      service.setCurrentStep(1, 2);
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:1:ui:current_step', '2');
    });
  });

  // === REMINDER STATE ===

  describe('schedule reminder', () => {
    it('dismissed until-t ment és olvas', () => {
      service.setScheduleReminderDismissedUntil(10, '2025-06-01');
      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:10:reminder:schedule_dismissed_until',
        '2025-06-01'
      );
    });

    it('last shown-t ment és olvas', () => {
      service.setScheduleReminderLastShown(10, '2025-05-01');
      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:10:reminder:schedule_last_shown',
        '2025-05-01'
      );
    });

    it('clearScheduleReminder mindkét kulcsot törli', () => {
      service.clearScheduleReminder(10);
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:reminder:schedule_dismissed_until');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:reminder:schedule_last_shown');
    });
  });

  describe('finalization reminder', () => {
    it('dismissed until-t ment', () => {
      service.setFinalizationReminderDismissedUntil(10, '2025-06-01');
      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:10:reminder:finalization_dismissed_until',
        '2025-06-01'
      );
    });

    it('last shown-t olvas', () => {
      crudSpy.getItem.mockReturnValue('2025-05-15');
      expect(service.getFinalizationReminderLastShown(10)).toBe('2025-05-15');
    });

    it('clearFinalizationReminder mindkét kulcsot törli', () => {
      service.clearFinalizationReminder(10);
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:reminder:finalization_dismissed_until');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:reminder:finalization_last_shown');
    });
  });

  describe('generic reminder methods', () => {
    it('getReminderValue a reminder kulcs alapján olvas', () => {
      crudSpy.getItem.mockReturnValue('some-value');
      expect(service.getReminderValue(5, 'custom_suffix')).toBe('some-value');
      expect(crudSpy.getItem).toHaveBeenCalledWith('tablo:5:reminder:custom_suffix');
    });

    it('setReminderValue a reminder kulcs alapján ment', () => {
      service.setReminderValue(5, 'custom_suffix', 'val');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:5:reminder:custom_suffix', 'val');
    });

    it('removeReminderValue a reminder kulcs alapján töröl', () => {
      service.removeReminderValue(5, 'custom_suffix');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:reminder:custom_suffix');
    });

    it('clearAllReminders törli a schedule és finalization reminder-eket', () => {
      service.clearAllReminders(5);
      expect(crudSpy.removeItem).toHaveBeenCalledTimes(4);
    });
  });

  // === STEP INFO DIALOG STATE ===

  describe('step info dialog', () => {
    it('isStepInfoShown false ha nincs beállítva', () => {
      expect(service.isStepInfoShown(1, 'claiming')).toBe(false);
    });

    it('isStepInfoShown true ha "true" van tárolva', () => {
      crudSpy.getItem.mockReturnValue('true');
      expect(service.isStepInfoShown(1, 'claiming')).toBe(true);
    });

    it('setStepInfoShown "true"-t ment', () => {
      service.setStepInfoShown(1, 'claiming');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:claiming', 'true');
    });

    it('resetStepInfoShown törli az adott step-et', () => {
      service.resetStepInfoShown(1, 'claiming');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:claiming');
    });

    it('resetAllStepInfoShown mind a 4 step-et törli', () => {
      service.resetAllStepInfoShown(1);
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:claiming');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:retouch');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:tablo');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:ui:step_info_shown:completed');
    });
  });

  // === GLOBAL SETTINGS ===

  describe('global settings', () => {
    it('getGlobalSetting null-t ad ha nincs érték', () => {
      expect(service.getGlobalSetting('missing')).toBeNull();
    });

    it('getGlobalSetting JSON-t parse-ol', () => {
      crudSpy.getItem.mockReturnValue('{"theme":"dark"}');
      expect(service.getGlobalSetting('appearance')).toEqual({ theme: 'dark' });
    });

    it('getGlobalSetting string-et ad vissza ha nem JSON', () => {
      crudSpy.getItem.mockReturnValue('simple-string');
      expect(service.getGlobalSetting('key')).toBe('simple-string');
    });

    it('setGlobalSetting string-et közvetlenül ment', () => {
      service.setGlobalSetting('theme', 'dark');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:global:theme', 'dark');
    });

    it('setGlobalSetting objektumot JSON-ként ment', () => {
      service.setGlobalSetting('config', { a: 1 });
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:global:config', '{"a":1}');
    });

    it('removeGlobalSetting törli a kulcsot', () => {
      service.removeGlobalSetting('theme');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:global:theme');
    });
  });

  // === MIGRATION ===

  describe('migrateOldKeys', () => {
    it('migrálja a sidebar_expanded_sections kulcsot', () => {
      localStorage.setItem('sidebar_expanded_sections', '["section1"]');

      // Újra létrehozzuk a service-t, hogy a konstruktor fusson
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TabloStorageUiService,
          { provide: TabloStorageCrudService, useValue: crudSpy },
          { provide: LoggerService, useValue: { warn: vi.fn() } },
        ],
      });
      service = TestBed.inject(TabloStorageUiService);

      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:global:sidebar_expanded_sections',
        '["section1"]'
      );
      expect(localStorage.getItem('sidebar_expanded_sections')).toBeNull();
    });

    it('törli a régi step info kulcsokat', () => {
      localStorage.setItem('tablo_step_info_shown_claiming', 'true');
      localStorage.setItem('kv:order-finalization:currentStep', '2');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TabloStorageUiService,
          { provide: TabloStorageCrudService, useValue: crudSpy },
          { provide: LoggerService, useValue: { warn: vi.fn() } },
        ],
      });
      service = TestBed.inject(TabloStorageUiService);

      expect(localStorage.getItem('tablo_step_info_shown_claiming')).toBeNull();
      expect(localStorage.getItem('kv:order-finalization:currentStep')).toBeNull();
    });
  });
});
