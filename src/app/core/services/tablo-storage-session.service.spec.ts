import { TestBed } from '@angular/core/testing';
import { TabloStorageSessionService, type StoredSession } from './tablo-storage-session.service';
import { TabloStorageCrudService } from './tablo-storage-crud.service';

describe('TabloStorageSessionService', () => {
  let service: TabloStorageSessionService;
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

    TestBed.configureTestingModule({
      providers: [
        TabloStorageSessionService,
        { provide: TabloStorageCrudService, useValue: crudSpy },
      ],
    });

    service = TestBed.inject(TabloStorageSessionService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // === ACTIVE SESSION ===

  describe('getActiveSession', () => {
    it('null-t ad vissza ha nincs aktív session', () => {
      expect(service.getActiveSession()).toBeNull();
    });

    it('sessionStorage-ból olvassa az aktív session-t ha van érvényes token', () => {
      sessionStorage.setItem('tablo:active_session', '123:code');
      // hasValidSession: token létezik
      crudSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tablo:123:code:token') return 'jwt-token';
        return null;
      });

      const result = service.getActiveSession();
      expect(result).toEqual({ projectId: 123, sessionType: 'code' });
    });

    it('localStorage fallback-et használ ha sessionStorage-ban nincs', () => {
      localStorage.setItem('tablo:active_session', '456:share');
      crudSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tablo:456:share:guest_session') return 'guest-token';
        return null;
      });

      const result = service.getActiveSession();
      expect(result).toEqual({ projectId: 456, sessionType: 'share' });
    });

    it('null-t ad vissza ha sessionStorage session érvénytelen (nincs token)', () => {
      sessionStorage.setItem('tablo:active_session', '123:code');
      // Nincs token hozzá
      crudSpy.getItem.mockReturnValue(null);

      // localStorage-ban sincs
      const result = service.getActiveSession();
      expect(result).toBeNull();
    });

    it('share session-t elfogad guest_session tokennel', () => {
      sessionStorage.setItem('tablo:active_session', '789:share');
      crudSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tablo:789:share:guest_session') return 'guest-token';
        return null;
      });

      const result = service.getActiveSession();
      expect(result).toEqual({ projectId: 789, sessionType: 'share' });
    });
  });

  describe('setActiveSession', () => {
    it('mindkét storage-ba ment', () => {
      service.setActiveSession(123, 'code');
      expect(sessionStorage.getItem('tablo:active_session')).toBe('123:code');
      expect(localStorage.getItem('tablo:active_session')).toBe('123:code');
    });
  });

  describe('clearActiveSession', () => {
    it('törli a sessionStorage-ból', () => {
      sessionStorage.setItem('tablo:active_session', '123:code');
      service.clearActiveSession();
      expect(sessionStorage.getItem('tablo:active_session')).toBeNull();
    });
  });

  // === AUTH TOKEN ===

  describe('getAuthToken / setAuthToken', () => {
    it('token-t tárol és lekérdez session kulccsal', () => {
      service.setAuthToken(42, 'preview', 'my-jwt');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:42:preview:token', 'my-jwt');
    });

    it('getAuthToken a crud service-en keresztül olvas', () => {
      crudSpy.getItem.mockReturnValue('stored-jwt');
      const result = service.getAuthToken(42, 'preview');
      expect(result).toBe('stored-jwt');
      expect(crudSpy.getItem).toHaveBeenCalledWith('tablo:42:preview:token');
    });

    it('setAuthToken beállítja az active session-t is', () => {
      service.setAuthToken(42, 'code', 'jwt');
      expect(sessionStorage.getItem('tablo:active_session')).toBe('42:code');
    });
  });

  // === PROJECT DATA ===

  describe('getProject / setProject', () => {
    const mockProject = { id: 10, name: 'Teszt Projekt', schoolName: null, className: null, classYear: null };

    it('projektet ment JSON-ként', () => {
      service.setProject(10, 'code', mockProject as any);
      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:10:code:project',
        JSON.stringify(mockProject)
      );
    });

    it('projektet parse-ol JSON-ból', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify(mockProject));
      const result = service.getProject(10, 'code');
      expect(result).toEqual(mockProject);
    });

    it('null-t ad vissza ha nincs tárolt projekt', () => {
      crudSpy.getItem.mockReturnValue(null);
      expect(service.getProject(10, 'code')).toBeNull();
    });

    it('törli és null-t ad vissza ha hibás JSON', () => {
      crudSpy.getItem.mockReturnValue('not-valid-json{');
      const result = service.getProject(10, 'code');
      expect(result).toBeNull();
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:code:project');
    });
  });

  // === CAN FINALIZE ===

  describe('getCanFinalize / setCanFinalize', () => {
    it('true-t ad vissza ha "true" van tárolva', () => {
      crudSpy.getItem.mockReturnValue('true');
      expect(service.getCanFinalize(1, 'code')).toBe(true);
    });

    it('false-t ad vissza ha bármi más van tárolva', () => {
      crudSpy.getItem.mockReturnValue('false');
      expect(service.getCanFinalize(1, 'code')).toBe(false);

      crudSpy.getItem.mockReturnValue(null);
      expect(service.getCanFinalize(1, 'code')).toBe(false);
    });

    it('boolean-t string-ként ment', () => {
      service.setCanFinalize(1, 'code', true);
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:1:code:can_finalize', 'true');
    });
  });

  // === GUEST SESSION DATA ===

  describe('guest session CRUD', () => {
    it('guest session token-t tárol és olvas', () => {
      service.setGuestSession(5, 'share', 'guest-tok');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:5:share:guest_session', 'guest-tok');
    });

    it('guest name-et tárol és olvas', () => {
      service.setGuestName(5, 'share', 'Kiss Péter');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:5:share:guest_name', 'Kiss Péter');
    });

    it('guest id-t tárol és olvas', () => {
      service.setGuestId(5, 'share', 42);
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:5:share:guest_id', '42');

      crudSpy.getItem.mockReturnValue('42');
      expect(service.getGuestId(5, 'share')).toBe(42);
    });

    it('guest id null ha nincs tárolva', () => {
      crudSpy.getItem.mockReturnValue(null);
      expect(service.getGuestId(5, 'share')).toBeNull();
    });

    it('verification status-t tárol és olvas', () => {
      service.setVerificationStatus(5, 'share', 'verified');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:5:share:verification_status', 'verified');
    });

    it('clearGuestData minden guest adatot töröl', () => {
      service.clearGuestData(5, 'share');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:share:guest_session');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:share:guest_name');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:share:guest_id');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:share:verification_status');
    });

    it('clearGuestSession csak a guest_session-t törli', () => {
      service.clearGuestSession(5, 'share');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:5:share:guest_session');
      expect(crudSpy.removeItem).toHaveBeenCalledTimes(1);
    });
  });

  // === SESSION AUTH CLEANUP ===

  describe('clearSessionAuth', () => {
    it('törli a token, project és can_finalize kulcsokat', () => {
      service.clearSessionAuth(1, 'code');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:code:token');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:code:project');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:1:code:can_finalize');
    });
  });

  describe('clearCurrentSessionAuth', () => {
    it('törli az aktív session auth adatait', () => {
      sessionStorage.setItem('tablo:active_session', '10:code');
      crudSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tablo:10:code:token') return 'jwt';
        return null;
      });

      service.clearCurrentSessionAuth();
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:10:code:token');
    });

    it('nem csinál semmit ha nincs aktív session', () => {
      service.clearCurrentSessionAuth();
      expect(crudSpy.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('clearAllProjectData', () => {
    it('mindhárom session típusra törli az auth adatokat', () => {
      service.clearAllProjectData(99);
      // code, share, preview - mindegyikhez 3 removeItem hívás
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:99:code:token');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:99:share:token');
      expect(crudSpy.removeItem).toHaveBeenCalledWith('tablo:99:preview:token');
    });
  });

  // === SESSION REGISTRY ===

  describe('session registry', () => {
    const mockSession: StoredSession = {
      projectId: 1,
      sessionType: 'code',
      projectName: 'Teszt',
      userName: 'Kis Pista',
      lastUsed: '2025-01-01T00:00:00.000Z',
    };

    it('getStoredSessions üres tömböt ad ha nincs tárolt adat', () => {
      crudSpy.getItem.mockReturnValue(null);
      expect(service.getStoredSessions()).toEqual([]);
    });

    it('getStoredSessions rendezett listát ad vissza (legújabb elöl)', () => {
      const sessions: StoredSession[] = [
        { ...mockSession, projectId: 1, lastUsed: '2025-01-01T00:00:00.000Z' },
        { ...mockSession, projectId: 2, lastUsed: '2025-06-01T00:00:00.000Z' },
      ];
      crudSpy.getItem.mockReturnValue(JSON.stringify(sessions));

      const result = service.getStoredSessions();
      expect(result[0].projectId).toBe(2);
      expect(result[1].projectId).toBe(1);
    });

    it('addSession hozzáad új session-t', () => {
      crudSpy.getItem.mockReturnValue('[]');
      service.addSession(mockSession);
      expect(crudSpy.setItem).toHaveBeenCalledWith(
        'tablo:sessions',
        expect.stringContaining('"projectId":1')
      );
    });

    it('addSession frissíti a meglévő session-t', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      const updated = { ...mockSession, userName: 'Nagy Béla' };
      service.addSession(updated);

      const call = crudSpy.setItem.mock.calls.find(
        (c: string[]) => c[0] === 'tablo:sessions'
      );
      const saved = JSON.parse(call![1]);
      expect(saved).toHaveLength(1);
      expect(saved[0].userName).toBe('Nagy Béla');
    });

    it('removeSession eltávolítja a session-t', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      service.removeSession(1, 'code');

      const call = crudSpy.setItem.mock.calls.find(
        (c: string[]) => c[0] === 'tablo:sessions'
      );
      const saved = JSON.parse(call![1]);
      expect(saved).toHaveLength(0);
    });

    it('updateSessionLastUsed frissíti a lastUsed mezőt', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      service.updateSessionLastUsed(1, 'code');

      const call = crudSpy.setItem.mock.calls.find(
        (c: string[]) => c[0] === 'tablo:sessions'
      );
      const saved = JSON.parse(call![1]);
      expect(new Date(saved[0].lastUsed).getTime()).toBeGreaterThan(
        new Date('2025-01-01T00:00:00.000Z').getTime()
      );
    });

    it('updateSessionUserName frissíti a userName-et', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      service.updateSessionUserName(1, 'code', 'Új Név');

      const call = crudSpy.setItem.mock.calls.find(
        (c: string[]) => c[0] === 'tablo:sessions'
      );
      const saved = JSON.parse(call![1]);
      expect(saved[0].userName).toBe('Új Név');
    });

    it('findSession megtalálja a keresett session-t', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      expect(service.findSession(1, 'code')).toEqual(expect.objectContaining({ projectId: 1 }));
    });

    it('findSession null-t ad ha nincs ilyen session', () => {
      crudSpy.getItem.mockReturnValue(JSON.stringify([mockSession]));
      expect(service.findSession(999, 'code')).toBeNull();
    });
  });

  // === MIGRATION ===

  describe('migrateFromLegacy', () => {
    it('null-t ad vissza ha nincsenek legacy kulcsok', () => {
      expect(service.migrateFromLegacy()).toBeNull();
    });

    it('migrálja a régi kulcsokat az új formátumba', () => {
      const project = { id: 77, name: 'Legacy Projekt', schoolName: null, className: null, classYear: null };
      localStorage.setItem('tablo_auth_token', 'legacy-jwt');
      localStorage.setItem('tablo_project', JSON.stringify(project));
      localStorage.setItem('tablo_token_type', 'code');
      localStorage.setItem('tablo_can_finalize', 'true');

      const result = service.migrateFromLegacy();

      expect(result).toEqual({ projectId: 77, sessionType: 'code' });
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:77:code:token', 'legacy-jwt');
      expect(crudSpy.setItem).toHaveBeenCalledWith('tablo:77:code:can_finalize', expect.any(String));

      // Régi kulcsok törölve
      expect(localStorage.getItem('tablo_auth_token')).toBeNull();
      expect(localStorage.getItem('tablo_project')).toBeNull();
    });

    it('null-t ad vissza ha hibás legacy projekt JSON', () => {
      localStorage.setItem('tablo_auth_token', 'legacy-jwt');
      localStorage.setItem('tablo_project', 'invalid-json{');

      const result = service.migrateFromLegacy();
      expect(result).toBeNull();
      // Régi kulcsok törölve
      expect(localStorage.getItem('tablo_auth_token')).toBeNull();
    });

    it('code-ot használ ha nincs token type tárolva', () => {
      const project = { id: 5, name: 'P' };
      localStorage.setItem('tablo_auth_token', 'jwt');
      localStorage.setItem('tablo_project', JSON.stringify(project));

      const result = service.migrateFromLegacy();
      expect(result?.sessionType).toBe('code');
    });
  });
});
