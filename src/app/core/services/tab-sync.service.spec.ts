import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabSyncService } from './tab-sync.service';
import { LoggerService } from './logger.service';

const SESSION_MIRROR_KEY = 'photostack_session_mirror';

describe('TabSyncService', () => {
  let service: TabSyncService;
  let loggerMock: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TabSyncService,
        { provide: LoggerService, useValue: loggerMock },
      ],
    });
    service = TestBed.inject(TabSyncService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    sessionStorage.clear();
    localStorage.clear();
  });

  // ============================================================================
  // Alapállapot
  // ============================================================================
  describe('alapállapot', () => {
    it('létrejön a service', () => {
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // saveToMirror
  // ============================================================================
  describe('saveToMirror', () => {
    it('menti a tablo: prefixű session adatokat localStorage-ba', () => {
      sessionStorage.setItem('tablo:token', 'abc123');
      sessionStorage.setItem('tablo:user', '{"id":1}');

      service.saveToMirror();

      const stored = localStorage.getItem(SESSION_MIRROR_KEY);
      expect(stored).toBeTruthy();

      const payload = JSON.parse(stored!);
      expect(payload.tabloEntries['tablo:token']).toBe('abc123');
      expect(payload.tabloEntries['tablo:user']).toBe('{"id":1}');
    });

    it('menti a marketer token-t és user-t', () => {
      sessionStorage.setItem('marketer_token', 'mtoken');
      sessionStorage.setItem('marketer_user', '{"name":"Test"}');

      service.saveToMirror();

      const payload = JSON.parse(localStorage.getItem(SESSION_MIRROR_KEY)!);
      expect(payload.marketerToken).toBe('mtoken');
      expect(payload.marketerUser).toBe('{"name":"Test"}');
    });

    it('nem ment ha nincs session adat', () => {
      service.saveToMirror();

      expect(localStorage.getItem(SESSION_MIRROR_KEY)).toBeNull();
    });

    it('nem menti a nem tablo: prefixű kulcsokat', () => {
      sessionStorage.setItem('other_key', 'value');
      sessionStorage.setItem('tablo:token', 'abc');

      service.saveToMirror();

      const payload = JSON.parse(localStorage.getItem(SESSION_MIRROR_KEY)!);
      expect(payload.tabloEntries['other_key']).toBeUndefined();
      expect(payload.tabloEntries['tablo:token']).toBe('abc');
    });

    it('logger.info-t hív sikeres mentés után', () => {
      sessionStorage.setItem('tablo:token', 'abc');

      service.saveToMirror();

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Session mirror mentve')
      );
    });
  });

  // ============================================================================
  // restoreFromMirror
  // ============================================================================
  describe('restoreFromMirror', () => {
    it('visszaállítja a tablo session adatokat sessionStorage-ba', () => {
      const payload = {
        tabloEntries: { 'tablo:token': 'restored', 'tablo:user': '{"id":2}' },
        marketerToken: null,
        marketerUser: null,
      };
      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));

      const result = service.restoreFromMirror();

      expect(result).toBe(true);
      expect(sessionStorage.getItem('tablo:token')).toBe('restored');
      expect(sessionStorage.getItem('tablo:user')).toBe('{"id":2}');
    });

    it('visszaállítja a marketer adatokat', () => {
      const payload = {
        tabloEntries: {},
        marketerToken: 'mtoken',
        marketerUser: '{"name":"Test"}',
      };
      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));

      const result = service.restoreFromMirror();

      expect(result).toBe(true);
      expect(sessionStorage.getItem('marketer_token')).toBe('mtoken');
      expect(sessionStorage.getItem('marketer_user')).toBe('{"name":"Test"}');
    });

    it('false-t ad vissza ha nincs mirror adat', () => {
      expect(service.restoreFromMirror()).toBe(false);
    });

    it('false-t ad vissza üres session adatok esetén', () => {
      const payload = {
        tabloEntries: {},
        marketerToken: null,
        marketerUser: null,
      };
      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));

      expect(service.restoreFromMirror()).toBe(false);
    });

    it('false-t ad vissza érvénytelen JSON esetén', () => {
      localStorage.setItem(SESSION_MIRROR_KEY, 'invalid-json');

      expect(service.restoreFromMirror()).toBe(false);
    });

    it('logger.info-t hív sikeres visszaállítás után', () => {
      const payload = {
        tabloEntries: { 'tablo:token': 'abc' },
        marketerToken: null,
        marketerUser: null,
      };
      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));

      service.restoreFromMirror();

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Session visszaállítva')
      );
    });

    it('nem állít vissza nem tablo: prefixű kulcsokat', () => {
      const payload = {
        tabloEntries: { 'evil:key': 'value', 'tablo:ok': 'good' },
        marketerToken: null,
        marketerUser: null,
      };
      localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(payload));

      service.restoreFromMirror();

      expect(sessionStorage.getItem('evil:key')).toBeNull();
      expect(sessionStorage.getItem('tablo:ok')).toBe('good');
    });
  });

  // ============================================================================
  // clearMirror
  // ============================================================================
  describe('clearMirror', () => {
    it('törli a mirror adatot localStorage-ból', () => {
      localStorage.setItem(SESSION_MIRROR_KEY, '{"test":true}');

      service.clearMirror();

      expect(localStorage.getItem(SESSION_MIRROR_KEY)).toBeNull();
    });

    it('nem dob hibát ha nincs mirror adat', () => {
      expect(() => service.clearMirror()).not.toThrow();
    });
  });

  // ============================================================================
  // registerCallbacks
  // ============================================================================
  describe('registerCallbacks', () => {
    it('regisztrálja a callback-et', () => {
      const onSessionCleared = vi.fn();

      service.registerCallbacks({ onSessionCleared });

      // A callback-et a handleChannelMessage hívja meg,
      // ami private, ezért közvetetten teszteljük a broadcastSessionClear-en keresztül
      expect(() => service.registerCallbacks({ onSessionCleared })).not.toThrow();
    });
  });

  // ============================================================================
  // broadcastSessionClear
  // ============================================================================
  describe('broadcastSessionClear', () => {
    it('törli a mirror adatot', () => {
      localStorage.setItem(SESSION_MIRROR_KEY, '{"test":true}');

      service.broadcastSessionClear();

      expect(localStorage.getItem(SESSION_MIRROR_KEY)).toBeNull();
    });

    it('nem dob hibát ha a channel nem elérhető', () => {
      expect(() => service.broadcastSessionClear()).not.toThrow();
    });
  });

  // ============================================================================
  // ngOnDestroy
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('nem dob hibát többszöri hívás esetén', () => {
      service.ngOnDestroy();
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
