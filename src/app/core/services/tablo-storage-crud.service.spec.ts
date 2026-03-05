import { TestBed } from '@angular/core/testing';
import { TabloStorageCrudService } from './tablo-storage-crud.service';
import { LoggerService } from './logger.service';

describe('TabloStorageCrudService', () => {
  let service: TabloStorageCrudService;
  let loggerSpy: { warn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    loggerSpy = { warn: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        TabloStorageCrudService,
        { provide: LoggerService, useValue: loggerSpy },
      ],
    });

    localStorage.clear();
    service = TestBed.inject(TabloStorageCrudService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setItem', () => {
    it('értéket ment a localStorage-ba', () => {
      service.setItem('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('memory fallback-et használ ha localStorage.setItem hibát dob', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      service.setItem('test-key', 'test-value');

      // A getItem-nek a memory fallback-ből kell olvasnia
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      expect(service.getItem('test-key')).toBe('test-value');

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    it('warn log-ot ír ha localStorage nem elérhető', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      service.setItem('fail-key', 'fail-value');
      expect(loggerSpy.warn).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('getItem', () => {
    it('értéket olvas a localStorage-ból', () => {
      localStorage.setItem('read-key', 'read-value');
      expect(service.getItem('read-key')).toBe('read-value');
    });

    it('null-t ad vissza ha nincs ilyen kulcs', () => {
      expect(service.getItem('nonexistent')).toBeNull();
    });

    it('memory fallback-ből olvas ha localStorage.getItem hibát dob', () => {
      // Először mentünk - ez a memory fallback-be is menti
      service.setItem('fallback-key', 'fallback-value');

      // Ezután a localStorage nem elérhető
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });

      expect(service.getItem('fallback-key')).toBe('fallback-value');

      vi.restoreAllMocks();
    });
  });

  describe('removeItem', () => {
    it('törli az értéket a localStorage-ból', () => {
      localStorage.setItem('del-key', 'del-value');
      service.removeItem('del-key');
      expect(localStorage.getItem('del-key')).toBeNull();
    });

    it('törli a memory fallback-ből is', () => {
      service.setItem('mem-key', 'mem-value');
      service.removeItem('mem-key');

      // localStorage is törölve + memory is törölve
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      expect(service.getItem('mem-key')).toBeNull();
      vi.restoreAllMocks();
    });

    it('nem dob hibát ha localStorage.removeItem hibát dob', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });

      expect(() => service.removeItem('any-key')).not.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('Safari Private mode detektálás', () => {
    it('normál módban localStorage-t használ', () => {
      // Az alapértelmezett működés: localStorage elérhető
      service.setItem('normal-key', 'normal-value');
      expect(localStorage.getItem('normal-key')).toBe('normal-value');
    });
  });
});
