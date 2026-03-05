import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TabloAuthService } from './tablo-auth.service';
import { TabloStorageService } from '../tablo-storage.service';
import { TokenService } from '../token.service';
import { GuestService } from '../guest.service';
import { SentryService } from '../sentry.service';
import { environment } from '../../../../environments/environment';
import type { LoginResponse, TabloProject } from '../../models/auth.models';

describe('TabloAuthService', () => {
  let service: TabloAuthService;
  let httpMock: HttpTestingController;
  let storageSpy: Record<string, ReturnType<typeof vi.fn>>;
  let tokenSpy: Record<string, ReturnType<typeof vi.fn>>;
  let guestSpy: Record<string, ReturnType<typeof vi.fn>>;
  let sentrySpy: Record<string, ReturnType<typeof vi.fn>>;

  const mockProject: TabloProject = {
    id: 42,
    name: 'Teszt Projekt',
    schoolName: 'Teszt Iskola',
    className: '12.A',
    classYear: '2025',
    partnerId: 10,
    contacts: [{ id: 1, name: 'Kiss Pista', email: null, phone: null }],
  };

  const mockLoginResponse: LoginResponse = {
    user: { id: 1, name: 'Teszt User', email: 'teszt@test.hu', type: 'tablo-guest', passwordSet: true },
    project: mockProject,
    token: 'jwt-token-123',
    tokenType: 'code',
    canFinalize: true,
  };

  beforeEach(() => {
    storageSpy = {
      setProject: vi.fn(),
      addSession: vi.fn(),
      getActiveSession: vi.fn(),
    };

    tokenSpy = {
      setToken: vi.fn(),
      updateTokenMetadata: vi.fn(),
      getActiveSession: vi.fn(),
    };

    guestSpy = {
      storeGuestSessionFromLogin: vi.fn(),
      setRestoredSession: vi.fn(),
    };

    sentrySpy = {
      setUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TabloAuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TabloStorageService, useValue: storageSpy },
        { provide: TokenService, useValue: tokenSpy },
        { provide: GuestService, useValue: guestSpy },
        { provide: SentryService, useValue: sentrySpy },
      ],
    });

    service = TestBed.inject(TabloAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('registerCallbacks', () => {
    it('callback-eket regisztrál', () => {
      const onAuthSuccess = vi.fn();
      const onPasswordSetChange = vi.fn();
      service.registerCallbacks({ onAuthSuccess, onPasswordSetChange });

      // Teszteljük, hogy a callback hívódik storeAuthData-ban
      service.storeAuthData(mockLoginResponse, 'code');
      expect(onAuthSuccess).toHaveBeenCalledWith(mockProject, true);
    });
  });

  describe('login', () => {
    it('POST kérést küld a kóddal', () => {
      service.login('123456').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-access-code`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code: '123456' });
      req.flush(mockLoginResponse);
    });

    it('tablo login esetén tárolja az auth adatokat', () => {
      service.login('123456').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-access-code`);
      req.flush(mockLoginResponse);

      expect(tokenSpy['setToken']).toHaveBeenCalledWith(42, 'code', 'jwt-token-123');
      expect(storageSpy['setProject']).toHaveBeenCalledWith(42, 'code', mockProject);
    });

    it('client login esetén sessionStorage-ba ment', () => {
      const clientResponse: LoginResponse = {
        ...mockLoginResponse,
        loginType: 'client',
        project: undefined,
        client: { id: 5, name: 'Client', email: null, phone: null },
        albums: [],
      };

      service.login('654321').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-access-code`);
      req.flush(clientResponse);

      expect(sessionStorage.getItem('client_token')).toBe('jwt-token-123');
      expect(sessionStorage.getItem('client_info')).toContain('Client');
    });

    it('client login branding-et is menti', () => {
      const clientResponse: LoginResponse = {
        ...mockLoginResponse,
        loginType: 'client',
        project: undefined,
        client: { id: 5, name: 'Client', email: null, phone: null },
        branding: { brandName: 'Brand', logoUrl: null, hideBrandName: false },
      };

      service.login('654321').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-access-code`);
      req.flush(clientResponse);

      expect(sessionStorage.getItem('client_branding')).toContain('Brand');
    });

    it('hibát kezel és magyar hibaüzenetet ad', () => {
      service.login('bad').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-access-code`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('loginWithShareToken', () => {
    it('POST kérést küld a share tokennel', () => {
      service.loginWithShareToken('abc123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-tablo-share`);
      expect(req.request.body).toEqual({ token: 'abc123' });
      req.flush(mockLoginResponse);
    });

    it('restore tokent is elküldi ha van', () => {
      service.loginWithShareToken('abc123', 'restore-tok').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-tablo-share`);
      expect(req.request.body).toEqual({ token: 'abc123', restore: 'restore-tok' });
      req.flush(mockLoginResponse);
    });

    it('restored session-t tárol ha a válaszban van', () => {
      const responseWithRestore = {
        ...mockLoginResponse,
        restoredSession: { sessionToken: 'rst', guestName: 'Gábor', guestEmail: null },
      };

      service.loginWithShareToken('abc').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-tablo-share`);
      req.flush(responseWithRestore);

      expect(guestSpy['setRestoredSession']).toHaveBeenCalledWith(responseWithRestore.restoredSession);
    });
  });

  describe('loginWithPreviewToken', () => {
    it('POST kérést küld a preview tokennel', () => {
      service.loginWithPreviewToken('prev-tok').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-tablo-preview`);
      expect(req.request.body).toEqual({ token: 'prev-tok' });
      req.flush(mockLoginResponse);
    });

    it('preview token típussal tárolja az adatokat', () => {
      service.loginWithPreviewToken('prev-tok').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-tablo-preview`);
      req.flush(mockLoginResponse);

      expect(storageSpy['setProject']).toHaveBeenCalled();
    });
  });

  describe('storeAuthData', () => {
    it('tokent és projektet tárol', () => {
      service.storeAuthData(mockLoginResponse, 'code');

      expect(tokenSpy['setToken']).toHaveBeenCalledWith(42, 'code', 'jwt-token-123');
      expect(tokenSpy['updateTokenMetadata']).toHaveBeenCalledWith(42, 'code', true);
      expect(storageSpy['setProject']).toHaveBeenCalledWith(42, 'code', mockProject);
    });

    it('response tokenType-ot használja ha van', () => {
      const response = { ...mockLoginResponse, tokenType: 'share' as const };
      service.storeAuthData(response, 'code');

      expect(tokenSpy['setToken']).toHaveBeenCalledWith(42, 'share', 'jwt-token-123');
    });

    it('default tokenType-ot használja ha nincs a response-ban', () => {
      const response = { ...mockLoginResponse, tokenType: undefined };
      service.storeAuthData(response, 'preview');

      expect(tokenSpy['setToken']).toHaveBeenCalledWith(42, 'preview', 'jwt-token-123');
    });

    it('guest session-t tárol ha van a response-ban', () => {
      const response = {
        ...mockLoginResponse,
        guestSession: { sessionToken: 'gs-tok', guestName: 'Vendég' },
      };

      service.storeAuthData(response, 'code');

      expect(guestSpy['storeGuestSessionFromLogin']).toHaveBeenCalledWith(
        42, 'code', 'gs-tok', 'Vendég'
      );
    });

    it('session registry-t frissíti', () => {
      service.storeAuthData(mockLoginResponse, 'code');
      expect(storageSpy['addSession']).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 42,
          sessionType: 'code',
          projectName: 'Teszt Projekt',
        })
      );
    });

    it('preview session-nél "Admin előnézet" nevet használ', () => {
      const response = { ...mockLoginResponse, tokenType: 'preview' as const };
      service.storeAuthData(response, 'preview');

      expect(storageSpy['addSession']).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'Admin előnézet',
        })
      );
    });

    it('Sentry user context-et beállítja', () => {
      service.storeAuthData(mockLoginResponse, 'code');

      expect(sentrySpy['setUser']).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          username: 'Teszt User',
        })
      );
    });

    it('passwordSet callback-et hívja ha van a user-ben', () => {
      const onPasswordSetChange = vi.fn();
      service.registerCallbacks({ onAuthSuccess: vi.fn(), onPasswordSetChange });

      service.storeAuthData(mockLoginResponse, 'code');
      expect(onPasswordSetChange).toHaveBeenCalledWith(true);
    });
  });
});
