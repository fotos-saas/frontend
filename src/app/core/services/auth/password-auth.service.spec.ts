import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PasswordAuthService } from './password-auth.service';
import { TabloAuthService } from './tablo-auth.service';
import { SentryService } from '../sentry.service';
import { environment } from '../../../../environments/environment';
import type { LoginResponse } from '../../models/auth.models';

describe('PasswordAuthService', () => {
  let service: PasswordAuthService;
  let httpMock: HttpTestingController;
  let tabloAuthSpy: Record<string, ReturnType<typeof vi.fn>>;
  let sentrySpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    tabloAuthSpy = {
      storeAuthData: vi.fn(),
    };

    sentrySpy = {
      setUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PasswordAuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TabloAuthService, useValue: tabloAuthSpy },
        { provide: SentryService, useValue: sentrySpy },
      ],
    });

    service = TestBed.inject(PasswordAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('registerCallbacks', () => {
    it('callback-eket regisztrál', () => {
      const onMarketerAuthSuccess = vi.fn();
      const onPasswordSetChange = vi.fn();
      service.registerCallbacks({ onMarketerAuthSuccess, onPasswordSetChange });
      // A callback-ek a loginWithPassword-ben tesztelődnek
    });
  });

  describe('loginWithPassword', () => {
    it('POST kérést küld email-lel és jelszóval', () => {
      service.loginWithPassword('test@test.hu', 'secret').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.hu', password: 'secret' });
      req.flush({ user: { id: 1, name: 'Test', email: 'test@test.hu', type: 'marketer', roles: ['marketer'] }, token: 'jwt' });
    });

    it('marketer role esetén sessionStorage-ba ment', () => {
      const onMarketerAuthSuccess = vi.fn();
      service.registerCallbacks({ onMarketerAuthSuccess, onPasswordSetChange: vi.fn() });

      service.loginWithPassword('a@b.hu', 'pw').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({
        user: { id: 1, name: 'Admin', email: 'a@b.hu', type: 'marketer', roles: ['marketer'], partner_id: 5 },
        token: 'admin-jwt',
      });

      expect(sessionStorage.getItem('marketer_token')).toBe('admin-jwt');
      expect(sessionStorage.getItem('marketer_user')).toContain('Admin');
      expect(onMarketerAuthSuccess).toHaveBeenCalled();
      expect(sentrySpy['setUser']).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    });

    it('partner role esetén is sessionStorage-ba ment', () => {
      service.loginWithPassword('p@b.hu', 'pw').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({
        user: { id: 2, name: 'Partner', email: 'p@b.hu', type: 'marketer', roles: ['partner'] },
        token: 'partner-jwt',
      });

      expect(sessionStorage.getItem('marketer_token')).toBe('partner-jwt');
    });

    it('tablo-guest login esetén tabloAuth.storeAuthData-t hívja', () => {
      service.loginWithPassword('g@b.hu', 'pw').subscribe();

      const mockProject = { id: 10, name: 'P' };
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({
        user: { id: 3, name: 'Guest', email: 'g@b.hu', type: 'tablo-guest', roles: ['tablo-guest'] },
        token: 'guest-jwt',
        project: mockProject,
      });

      expect(tabloAuthSpy['storeAuthData']).toHaveBeenCalled();
    });

    it('hibát kezel', () => {
      service.loginWithPassword('bad@b.hu', 'wrong').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('POST kérést küld a regisztrációs adatokkal', () => {
      const data = { name: 'Új User', email: 'uj@test.hu', password: 'pw123', password_confirmation: 'pw123' };

      service.register(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ message: 'Sikeres', user: { id: 10, name: 'Új User', email: 'uj@test.hu' } });
    });
  });

  describe('requestPasswordReset', () => {
    it('POST kérést küld az email-lel', () => {
      service.requestPasswordReset('forgot@test.hu').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.body).toEqual({ email: 'forgot@test.hu' });
      req.flush({ message: 'Email elküldve' });
    });
  });

  describe('resetPassword', () => {
    it('POST kérést küld a reset adatokkal', () => {
      const data = { token: 'rst-tok', email: 'a@b.hu', password: 'new', password_confirmation: 'new' };
      service.resetPassword(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.body).toEqual(data);
      req.flush({ message: 'Jelszó visszaállítva' });
    });
  });

  describe('changePassword', () => {
    it('POST kérést küld', () => {
      const data = { current_password: 'old', password: 'new', password_confirmation: 'new' };
      service.changePassword(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/change-password`);
      expect(req.request.body).toEqual(data);
      req.flush({ message: 'Jelszó módosítva' });
    });
  });

  describe('setPassword', () => {
    it('POST kérést küld és callback-et hív', () => {
      const onPasswordSetChange = vi.fn();
      service.registerCallbacks({ onMarketerAuthSuccess: vi.fn(), onPasswordSetChange });

      service.setPassword('newpw', 'newpw').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/set-password`);
      expect(req.request.body).toEqual({ password: 'newpw', password_confirmation: 'newpw' });
      req.flush({ message: 'OK', user: { id: 1, name: 'User' } });

      expect(onPasswordSetChange).toHaveBeenCalledWith(true);
    });
  });

  describe('verifyEmail', () => {
    it('GET kérést küld az id és hash-sel', () => {
      service.verifyEmail(5, 'abc123hash').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify-email/5/abc123hash`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'Sikeresen megerősítve' });
    });
  });

  describe('resendVerification', () => {
    it('POST kérést küld', () => {
      service.resendVerification('a@b.hu').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
      expect(req.request.body).toEqual({ email: 'a@b.hu' });
      req.flush({ message: 'Elküldve' });
    });
  });

  describe('validateQrCode', () => {
    it('GET kérést küld', () => {
      service.validateQrCode('QR123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/qr-code/QR123/validate`);
      expect(req.request.method).toBe('GET');
      req.flush({ valid: true, project: { id: 1, name: 'P', schoolName: null, className: null, classYear: null } });
    });
  });

  describe('registerFromQr', () => {
    it('POST kérést küld és storeAuthData-t hívja', () => {
      const data = { code: 'QR123', name: 'User', email: 'u@b.hu' };
      service.registerFromQr(data).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register-qr`);
      const mockResponse: LoginResponse = {
        user: { id: 1, name: 'User', email: 'u@b.hu', type: 'tablo-guest' },
        project: { id: 5, name: 'P', schoolName: null, className: null, classYear: null },
        token: 'jwt',
      };
      req.flush(mockResponse);

      expect(tabloAuthSpy['storeAuthData']).toHaveBeenCalled();
    });
  });

  describe('2FA methods', () => {
    it('enable2FA POST kérést küld', () => {
      service.enable2FA().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/2fa/enable`);
      expect(req.request.method).toBe('POST');
      req.flush({ available: true });
    });

    it('confirm2FA POST kérést küld a kóddal', () => {
      service.confirm2FA('123456').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/2fa/confirm`);
      expect(req.request.body).toEqual({ code: '123456' });
      req.flush({ message: 'OK' });
    });

    it('disable2FA POST kérést küld', () => {
      service.disable2FA('654321').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/2fa/disable`);
      expect(req.request.body).toEqual({ code: '654321' });
      req.flush({ message: 'Letiltva' });
    });

    it('verify2FA POST kérést küld', () => {
      service.verify2FA('111222').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/2fa/verify`);
      expect(req.request.body).toEqual({ code: '111222' });
      req.flush({ user: { id: 1, name: 'U', email: null, type: 'marketer' }, token: 'jwt', project: undefined });
    });
  });
});
