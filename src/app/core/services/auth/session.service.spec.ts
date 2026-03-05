import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { TabloStorageService } from '../tablo-storage.service';
import { TokenService } from '../token.service';
import { GuestService } from '../guest.service';
import { FilterPersistenceService } from '../filter-persistence.service';
import { SentryService } from '../sentry.service';
import { environment } from '../../../../environments/environment';
import type { TabloProject, ValidateSessionResponse } from '../../models/auth.models';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let storageSpy: Record<string, ReturnType<typeof vi.fn>>;
  let tokenSpy: Record<string, ReturnType<typeof vi.fn>>;
  let guestSpy: Record<string, ReturnType<typeof vi.fn>>;
  let filterSpy: Record<string, ReturnType<typeof vi.fn>>;
  let sentrySpy: Record<string, ReturnType<typeof vi.fn>>;

  const mockProject: TabloProject = {
    id: 42,
    name: 'Teszt Projekt',
    schoolName: 'Teszt Iskola',
    className: '12.A',
    classYear: '2025',
  };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };

    storageSpy = {
      migrateFromLegacy: vi.fn().mockReturnValue(null),
      getActiveSession: vi.fn().mockReturnValue(null),
      getProject: vi.fn().mockReturnValue(null),
      setProject: vi.fn(),
      setActiveSession: vi.fn(),
      updateSessionLastUsed: vi.fn(),
      clearCurrentSessionAuth: vi.fn(),
      clearActiveSession: vi.fn(),
      removeSession: vi.fn(),
      getGuestSession: vi.fn().mockReturnValue(null),
    };

    tokenSpy = {
      hasToken: vi.fn().mockReturnValue(false),
      clearToken: vi.fn(),
      reinitialize: vi.fn(),
      setCanFinalize: vi.fn(),
    };

    guestSpy = {
      initializeFromStorage: vi.fn(),
    };

    filterSpy = {
      clearAllFilters: vi.fn(),
    };

    sentrySpy = {
      setUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: TabloStorageService, useValue: storageSpy },
        { provide: TokenService, useValue: tokenSpy },
        { provide: GuestService, useValue: guestSpy },
        { provide: FilterPersistenceService, useValue: filterSpy },
        { provide: SentryService, useValue: sentrySpy },
      ],
    });

    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('registerCallbacks', () => {
    it('callback-eket regisztrál és azok hívódnak', () => {
      const onSessionRestored = vi.fn();
      const onSessionValidated = vi.fn();
      const onAuthCleared = vi.fn();
      const onMarketerLogout = vi.fn();

      service.registerCallbacks({
        onSessionRestored,
        onSessionValidated,
        onAuthCleared,
        onMarketerLogout,
      });

      // clearAuth-ban teszteljük az onAuthCleared callback-et
      service.clearAuth();
      expect(onAuthCleared).toHaveBeenCalled();
    });
  });

  describe('initializeFromStorage', () => {
    it('nem autentikált ha nincs aktív session', () => {
      const result = service.initializeFromStorage();
      expect(result).toEqual({ project: null, isAuthenticated: false });
    });

    it('migrált session-t preferálja', () => {
      storageSpy['migrateFromLegacy'].mockReturnValue({ projectId: 10, sessionType: 'code' });
      storageSpy['getProject'].mockReturnValue(mockProject);
      tokenSpy['hasToken'].mockReturnValue(true);

      const result = service.initializeFromStorage();
      expect(result.isAuthenticated).toBe(true);
      expect(result.project).toEqual(mockProject);
    });

    it('share session-t guest_session tokennel elfogadja', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });
      storageSpy['getGuestSession'].mockReturnValue('guest-token');
      storageSpy['getProject'].mockReturnValue(mockProject);

      const result = service.initializeFromStorage();
      expect(result.isAuthenticated).toBe(true);
    });

    it('nem autentikált ha nincs token a code session-höz', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'code' });
      storageSpy['getProject'].mockReturnValue(mockProject);
      tokenSpy['hasToken'].mockReturnValue(false);

      const result = service.initializeFromStorage();
      expect(result.isAuthenticated).toBe(false);
    });

    it('nem autentikált ha nincs projekt adat', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'code' });
      storageSpy['getProject'].mockReturnValue(null);
      tokenSpy['hasToken'].mockReturnValue(true);

      const result = service.initializeFromStorage();
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('restoreSession', () => {
    it('sikeresen visszaállít egy session-t', () => {
      storageSpy['getProject'].mockReturnValue(mockProject);
      tokenSpy['hasToken'].mockReturnValue(true);

      const onSessionRestored = vi.fn();
      service.registerCallbacks({
        onSessionRestored,
        onSessionValidated: vi.fn(),
        onAuthCleared: vi.fn(),
        onMarketerLogout: vi.fn(),
      });

      const result = service.restoreSession(42, 'code');
      expect(result).toBe(true);
      expect(storageSpy['setActiveSession']).toHaveBeenCalledWith(42, 'code');
      expect(tokenSpy['reinitialize']).toHaveBeenCalled();
      expect(onSessionRestored).toHaveBeenCalledWith(mockProject);
    });

    it('false-t ad vissza ha nincs projekt adat', () => {
      storageSpy['getProject'].mockReturnValue(null);

      const result = service.restoreSession(42, 'code');
      expect(result).toBe(false);
    });

    it('share session-t guest session-nel állítja vissza', () => {
      storageSpy['getProject'].mockReturnValue(mockProject);
      storageSpy['getGuestSession'].mockReturnValue('guest-tok');

      const result = service.restoreSession(42, 'share');
      expect(result).toBe(true);
      expect(guestSpy['initializeFromStorage']).toHaveBeenCalled();
    });

    it('share session false ha nincs guest session', () => {
      storageSpy['getProject'].mockReturnValue(mockProject);
      storageSpy['getGuestSession'].mockReturnValue(null);

      const result = service.restoreSession(42, 'share');
      expect(result).toBe(false);
    });

    it('code session false ha nincs token', () => {
      storageSpy['getProject'].mockReturnValue(mockProject);
      tokenSpy['hasToken'].mockReturnValue(false);

      const result = service.restoreSession(42, 'code');
      expect(result).toBe(false);
    });
  });

  describe('validateSession', () => {
    it('GET kérést küld és tárolja a választ', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 42, sessionType: 'code' });

      const onSessionValidated = vi.fn();
      service.registerCallbacks({
        onSessionRestored: vi.fn(),
        onSessionValidated,
        onAuthCleared: vi.fn(),
        onMarketerLogout: vi.fn(),
      });

      const response: ValidateSessionResponse = {
        valid: true,
        project: mockProject,
        canFinalize: true,
        user: { passwordSet: true },
      };

      service.validateSession().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/validate-session`);
      req.flush(response);

      expect(storageSpy['setProject']).toHaveBeenCalledWith(42, 'code', mockProject);
      expect(tokenSpy['setCanFinalize']).toHaveBeenCalledWith(42, 'code', true);
      expect(onSessionValidated).toHaveBeenCalledWith(mockProject, true, true);
    });

    it('401 esetén törli az auth adatokat', () => {
      service.validateSession().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/validate-session`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(tokenSpy['clearToken']).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('POST kérést küld és törli az auth adatokat', () => {
      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/logout`);
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(tokenSpy['clearToken']).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('szerver hiba esetén is törli a lokális adatokat', () => {
      service.logout().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/logout`);
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(tokenSpy['clearToken']).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clearAuth', () => {
    it('minden auth adatot töröl és login-ra navigál', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 42, sessionType: 'code' });

      service.clearAuth();

      expect(tokenSpy['clearToken']).toHaveBeenCalled();
      expect(storageSpy['clearCurrentSessionAuth']).toHaveBeenCalled();
      expect(storageSpy['removeSession']).toHaveBeenCalledWith(42, 'code');
      expect(filterSpy['clearAllFilters']).toHaveBeenCalled();
      expect(sentrySpy['setUser']).toHaveBeenCalledWith(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('nem hívja removeSession-t ha nincs aktív session', () => {
      service.clearAuth();
      expect(storageSpy['removeSession']).not.toHaveBeenCalled();
    });
  });

  describe('logoutAdmin', () => {
    it('törli a marketer adatokat és login-ra navigál', () => {
      sessionStorage.setItem('marketer_token', 'jwt');
      sessionStorage.setItem('marketer_user', '{}');

      service.logoutAdmin();

      expect(sessionStorage.getItem('marketer_token')).toBeNull();
      expect(sessionStorage.getItem('marketer_user')).toBeNull();
      expect(tokenSpy['clearToken']).toHaveBeenCalled();
      expect(storageSpy['clearActiveSession']).toHaveBeenCalled();
      expect(filterSpy['clearAllFilters']).toHaveBeenCalled();
      expect(sentrySpy['setUser']).toHaveBeenCalledWith(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getMarketerToken', () => {
    it('sessionStorage-ból olvassa a tokent', () => {
      sessionStorage.setItem('marketer_token', 'my-jwt');
      expect(service.getMarketerToken()).toBe('my-jwt');
    });

    it('null ha nincs token', () => {
      expect(service.getMarketerToken()).toBeNull();
    });
  });

  describe('getStoredMarketerUser', () => {
    it('parse-olja a tárolt user-t', () => {
      sessionStorage.setItem('marketer_user', JSON.stringify({ id: 1, name: 'Admin' }));
      expect(service.getStoredMarketerUser()).toEqual({ id: 1, name: 'Admin' });
    });

    it('null ha nincs tárolt user', () => {
      expect(service.getStoredMarketerUser()).toBeNull();
    });

    it('null ha hibás JSON', () => {
      sessionStorage.setItem('marketer_user', 'invalid{');
      expect(service.getStoredMarketerUser()).toBeNull();
    });
  });

  describe('initializeMarketerSession', () => {
    it('sikeres ha van token és valid role', () => {
      sessionStorage.setItem('marketer_token', 'jwt');
      sessionStorage.setItem('marketer_user', JSON.stringify({
        id: 1, name: 'Admin', email: 'a@b.hu', type: 'marketer', roles: ['marketer'],
      }));

      const result = service.initializeMarketerSession();
      expect(result.success).toBe(true);
      expect(result.user?.roles).toContain('marketer');
    });

    it('sikeres partner role-lal', () => {
      sessionStorage.setItem('marketer_token', 'jwt');
      sessionStorage.setItem('marketer_user', JSON.stringify({
        id: 2, name: 'Partner', email: 'p@b.hu', type: 'marketer', roles: ['partner'],
      }));

      expect(service.initializeMarketerSession().success).toBe(true);
    });

    it('sikertelen ha nincs token', () => {
      sessionStorage.setItem('marketer_user', JSON.stringify({
        id: 1, name: 'Admin', email: 'a@b.hu', type: 'marketer', roles: ['marketer'],
      }));

      expect(service.initializeMarketerSession().success).toBe(false);
    });

    it('sikertelen ha nincs valid role', () => {
      sessionStorage.setItem('marketer_token', 'jwt');
      sessionStorage.setItem('marketer_user', JSON.stringify({
        id: 1, name: 'Guest', email: 'g@b.hu', type: 'tablo-guest', roles: ['tablo-guest'],
      }));

      expect(service.initializeMarketerSession().success).toBe(false);
    });
  });

  describe('getActiveSessions', () => {
    it('GET kérést küld', () => {
      service.getActiveSessions().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/sessions`);
      expect(req.request.method).toBe('GET');
      req.flush({ sessions: [] });
    });
  });

  describe('revokeSession', () => {
    it('DELETE kérést küld a token ID-val', () => {
      service.revokeSession(5).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/sessions/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Session visszavonva' });
    });
  });

  describe('revokeAllSessions', () => {
    it('DELETE kérést küld', () => {
      service.revokeAllSessions().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/sessions`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Visszavonva', revoked_count: 3 });
    });
  });
});
