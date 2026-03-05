import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DevLoginService } from './dev-login.service';
import { firstValueFrom } from 'rxjs';

describe('DevLoginService', () => {
  let service: DevLoginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DevLoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isDevMode', () => {
    it('localhost-on true', () => {
      // jsdom default: localhost
      expect(service.isDevMode()).toBe(true);
    });
  });

  describe('generateDevLoginUrl', () => {
    it('POST kérést küld', async () => {
      const promise = firstValueFrom(service.generateDevLoginUrl('partner', 1));
      const req = httpMock.expectOne((r) => r.url.includes('/dev/login'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.user_type).toBe('partner');
      expect(req.request.body.identifier).toBe(1);
      req.flush({ url: 'https://example.com/login', token: 'abc123', expiresIn: 300 });

      const result = await promise;
      expect(result.url).toBe('https://example.com/login');
      expect(result.token).toBe('abc123');
    });
  });

  describe('consumeDevLogin', () => {
    it('GET kérést küld a tokennel', async () => {
      const promise = firstValueFrom(service.consumeDevLogin('abc123'));
      const req = httpMock.expectOne((r) => r.url.includes('/dev/login/abc123'));
      expect(req.request.method).toBe('GET');
      req.flush({
        user: { id: 1, name: 'Admin', email: 'a@a.com', type: 'partner' },
        token: 'jwt-token',
        loginType: 'partner',
      });

      const result = await promise;
      expect(result.token).toBe('jwt-token');
      expect(result.user.name).toBe('Admin');
    });
  });
});
