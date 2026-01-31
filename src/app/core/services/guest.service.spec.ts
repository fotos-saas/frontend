/**
 * GuestService Unit Tests
 *
 * Tesztek:
 * - Guest regisztráció
 * - Session validálás
 * - Cross-device link küldés
 * - Heartbeat
 * - Session kezelés (clear, getters)
 * - LocalStorage kezelés
 * - Hibakezelés
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import {
  GuestService,
  GuestSession,
  GuestRegisterResponse,
  GuestValidateResponse
} from './guest.service';
import { TabloStorageService } from './tablo-storage.service';
import { AuthService, TokenType } from './auth.service';
import { environment } from '../../../environments/environment';

describe('GuestService', () => {
  let service: GuestService;
  let httpMock: HttpTestingController;
  let storageServiceMock: { getActiveSession: ReturnType<typeof vi.fn> };
  let authServiceMock: { isGuest: ReturnType<typeof vi.fn>; getTokenType: ReturnType<typeof vi.fn> };
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  const API_BASE = `${environment.apiUrl}/tablo-frontend/guest`;

  const mockActiveSession = {
    projectId: 123,
    sessionType: 'share' as TokenType
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock canvas getContext for device fingerprinting (jsdom doesn't support it)
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      textBaseline: '',
      font: '',
      fillText: vi.fn()
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    // Mock canvas toDataURL
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');

    storageServiceMock = {
      getActiveSession: vi.fn().mockReturnValue(mockActiveSession)
    };

    authServiceMock = {
      isGuest: vi.fn(),
      getTokenType: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GuestService,
        { provide: TabloStorageService, useValue: storageServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(GuestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();

    // Restore original canvas methods
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  // ==================== INITIALIZATION TESZTEK ====================

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have no session initially when localStorage is empty', () => {
      expect(service.hasGuestSession()).toBe(false);
      expect(service.guestName()).toBeNull();
    });

    it('should load stored session from localStorage on init', () => {
      // Set up localStorage before creating service
      localStorage.setItem('tablo:123:share:guest_session', 'stored-session-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Tárolt Vendég');

      // Re-create service to trigger loadStoredSession
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });

      const newService = TestBed.inject(GuestService);
      expect(newService.hasGuestSession()).toBe(true);
      expect(newService.guestName()).toBe('Tárolt Vendég');
    });
  });

  // ==================== REGISTER TESZTEK ====================

  describe('register', () => {
    it('should register guest successfully', async () => {
      const mockResponse: GuestRegisterResponse = {
        success: true,
        message: 'Sikeres regisztráció!',
        data: {
          id: 1,
          session_token: 'new-session-token-uuid',
          guest_name: 'Új Vendég',
          guest_email: 'uj@example.com'
        }
      };

      const registerPromise = firstValueFrom(service.register('Új Vendég', 'uj@example.com'));

      const req = httpMock.expectOne(`${API_BASE}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.guest_name).toBe('Új Vendég');
      expect(req.request.body.guest_email).toBe('uj@example.com');
      expect(req.request.body.device_identifier).toBeDefined();

      req.flush(mockResponse);

      const session = await registerPromise;
      expect(session.sessionToken).toBe('new-session-token-uuid');
      expect(session.guestName).toBe('Új Vendég');
      expect(session.guestEmail).toBe('uj@example.com');
    });

    it('should register guest without email', async () => {
      const mockResponse: GuestRegisterResponse = {
        success: true,
        message: 'Sikeres regisztráció!',
        data: {
          id: 2,
          session_token: 'session-token',
          guest_name: 'Vendég Név',
          guest_email: null
        }
      };

      const registerPromise = firstValueFrom(service.register('Vendég Név'));

      const req = httpMock.expectOne(`${API_BASE}/register`);
      expect(req.request.body.guest_email).toBeUndefined();

      req.flush(mockResponse);

      const session = await registerPromise;
      expect(session.guestEmail).toBeNull();
    });

    it('should update hasGuestSession signal after registration', async () => {
      const mockResponse: GuestRegisterResponse = {
        success: true,
        message: 'OK',
        data: {
          id: 3,
          session_token: 'token',
          guest_name: 'Test',
          guest_email: null
        }
      };

      expect(service.hasGuestSession()).toBe(false);

      const registerPromise = firstValueFrom(service.register('Test'));

      const req = httpMock.expectOne(`${API_BASE}/register`);
      req.flush(mockResponse);

      await registerPromise;

      expect(service.hasGuestSession()).toBe(true);
    });

    it('should store session in localStorage after registration', async () => {
      const mockResponse: GuestRegisterResponse = {
        success: true,
        message: 'OK',
        data: {
          id: 4,
          session_token: 'stored-token',
          guest_name: 'Stored Name',
          guest_email: null
        }
      };

      const registerPromise = firstValueFrom(service.register('Stored Name'));

      const req = httpMock.expectOne(`${API_BASE}/register`);
      req.flush(mockResponse);

      await registerPromise;

      expect(localStorage.getItem('tablo:123:share:guest_session')).toBe('stored-token');
      expect(localStorage.getItem('tablo:123:share:guest_name')).toBe('Stored Name');
    });

    it('should throw error when registration fails', async () => {
      const registerPromise = firstValueFrom(service.register('Test')).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/register`);
      // HTTP hiba szimulálása az üzenettel, hogy a handleError megkapja
      req.flush({ message: 'Regisztráció sikertelen' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await registerPromise;
      expect(error.message).toBe('Regisztráció sikertelen');
    });

    it('should handle network error', async () => {
      const registerPromise = firstValueFrom(service.register('Test')).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/register`);
      req.error(new ProgressEvent('error'), { status: 0 });

      const error = await registerPromise;
      expect(error.message).toBe('Nincs internetkapcsolat.');
    });

    it('should handle rate limit error', async () => {
      const registerPromise = firstValueFrom(service.register('Test')).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/register`);
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });

      const error = await registerPromise;
      expect(error.message).toBe('Túl sok kérés. Várj egy kicsit!');
    });
  });

  // ==================== VALIDATE SESSION TESZTEK ====================

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'existing-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Existing Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const mockResponse: GuestValidateResponse = {
        success: true,
        valid: true,
        data: {
          id: 5,
          session_token: 'existing-token',
          guest_name: 'Existing Guest',
          guest_email: null
        }
      };

      const validatePromise = firstValueFrom(service.validateSession());

      const req = httpMock.expectOne(`${API_BASE}/validate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.session_token).toBe('existing-token');

      req.flush(mockResponse);

      const isValid = await validatePromise;
      expect(isValid).toBe(true);
    });

    it('should return false and clear session when invalid', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'existing-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Existing Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const mockResponse: GuestValidateResponse = {
        success: false,
        valid: false
      };

      const validatePromise = firstValueFrom(service.validateSession());

      const req = httpMock.expectOne(`${API_BASE}/validate`);
      req.flush(mockResponse);

      const isValid = await validatePromise;
      expect(isValid).toBe(false);
      expect(service.hasGuestSession()).toBe(false);
    });

    it('should return false when no session exists', async () => {
      const isValid = await firstValueFrom(service.validateSession());
      expect(isValid).toBe(false);
    });

    it('should handle validation error and clear session', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'existing-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Existing Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const validatePromise = firstValueFrom(service.validateSession());

      const req = httpMock.expectOne(`${API_BASE}/validate`);
      req.error(new ProgressEvent('error'), { status: 500 });

      const isValid = await validatePromise;
      expect(isValid).toBe(false);
      expect(service.hasGuestSession()).toBe(false);
    });
  });

  // ==================== SEND DEVICE LINK TESZTEK ====================

  describe('sendDeviceLink', () => {
    it('should send device link successfully', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'test-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Test Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const mockResponse = {
        success: true,
        message: 'Link elküldve a megadott email címre!'
      };

      const sendPromise = firstValueFrom(service.sendDeviceLink('test@example.com'));

      const req = httpMock.expectOne(`${API_BASE}/send-link`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.session_token).toBe('test-token');
      expect(req.request.body.email).toBe('test@example.com');

      req.flush(mockResponse);

      const response = await sendPromise;
      expect(response.success).toBe(true);
      expect(response.message).toBe('Link elküldve a megadott email címre!');
    });

    it('should throw error when no session exists', async () => {
      const error = await firstValueFrom(service.sendDeviceLink('test@example.com')).catch(e => e);
      expect(error.message).toBe('Nincs aktív session');
    });
  });

  // ==================== HEARTBEAT TESZTEK ====================

  describe('sendHeartbeat', () => {
    it('should send heartbeat successfully', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'heartbeat-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Heartbeat Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const heartbeatPromise = firstValueFrom(service.sendHeartbeat());

      const req = httpMock.expectOne(`${API_BASE}/heartbeat`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.session_token).toBe('heartbeat-token');

      req.flush({ success: true });

      await heartbeatPromise;
    });

    it('should not send heartbeat when no session exists', async () => {
      const result = await firstValueFrom(service.sendHeartbeat());
      expect(result).toBeUndefined();
    });

    it('should silently handle heartbeat errors', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'heartbeat-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Heartbeat Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      const heartbeatPromise = firstValueFrom(service.sendHeartbeat());

      const req = httpMock.expectOne(`${API_BASE}/heartbeat`);
      req.error(new ProgressEvent('error'), { status: 500 });

      const result = await heartbeatPromise;
      expect(result).toBeUndefined();
    });
  });

  // ==================== CLEAR SESSION TESZTEK ====================

  describe('clearSession', () => {
    it('should clear session from state', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'clear-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Clear Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      expect(service.hasGuestSession()).toBe(true);

      service.clearSession();

      expect(service.hasGuestSession()).toBe(false);
      expect(service.guestName()).toBeNull();
    });

    it('should clear session from localStorage', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'clear-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Clear Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      expect(localStorage.getItem('tablo:123:share:guest_session')).toBe('clear-token');

      service.clearSession();

      expect(localStorage.getItem('tablo:123:share:guest_session')).toBeNull();
      expect(localStorage.getItem('tablo:123:share:guest_name')).toBeNull();
    });

    it('should update guestSession$ observable', async () => {
      // Set up session first
      localStorage.setItem('tablo:123:share:guest_session', 'clear-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Clear Guest');

      // Re-create service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      service = TestBed.inject(GuestService);
      httpMock = TestBed.inject(HttpTestingController);

      service.clearSession();

      const session = await firstValueFrom(service.guestSession$);
      expect(session).toBeNull();
    });
  });

  // ==================== GUEST SESSION HEADER TESZTEK ====================

  describe('getGuestSessionHeader', () => {
    it('should return empty headers when no session', () => {
      const headers = service.getGuestSessionHeader();
      expect(headers.has('X-Guest-Session')).toBe(false);
    });

    it('should return headers with session token when session exists', () => {
      localStorage.setItem('tablo:123:share:guest_session', 'header-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Header Guest');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      const serviceWithSession = TestBed.inject(GuestService);

      const headers = serviceWithSession.getGuestSessionHeader();
      expect(headers.get('X-Guest-Session')).toBe('header-token');
    });
  });

  // ==================== GET SESSION TOKEN TESZTEK ====================

  describe('getSessionToken', () => {
    it('should return null when no session', () => {
      expect(service.getSessionToken()).toBeNull();
    });

    it('should return token when session exists', () => {
      localStorage.setItem('tablo:123:share:guest_session', 'get-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Token Guest');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      const serviceWithSession = TestBed.inject(GuestService);

      expect(serviceWithSession.getSessionToken()).toBe('get-token');
    });
  });

  // ==================== HAS REGISTERED SESSION TESZTEK ====================

  describe('hasRegisteredSession', () => {
    it('should return false when no session', () => {
      expect(service.hasRegisteredSession()).toBe(false);
    });

    it('should return true when session exists', () => {
      localStorage.setItem('tablo:123:share:guest_session', 'registered-token');
      localStorage.setItem('tablo:123:share:guest_name', 'Registered Guest');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          GuestService,
          { provide: TabloStorageService, useValue: storageServiceMock },
          { provide: AuthService, useValue: authServiceMock }
        ]
      });
      const serviceWithSession = TestBed.inject(GuestService);

      expect(serviceWithSession.hasRegisteredSession()).toBe(true);
    });
  });

  // ==================== DEVICE IDENTIFIER TESZTEK ====================

  describe('device identifier', () => {
    it('should generate device identifier during registration', async () => {
      const mockResponse: GuestRegisterResponse = {
        success: true,
        message: 'OK',
        data: {
          id: 6,
          session_token: 'token',
          guest_name: 'Test',
          guest_email: null
        }
      };

      const registerPromise = firstValueFrom(service.register('Test'));

      const req = httpMock.expectOne(`${API_BASE}/register`);
      expect(req.request.body.device_identifier).toBeDefined();
      expect(typeof req.request.body.device_identifier).toBe('string');
      expect(req.request.body.device_identifier.length).toBeGreaterThan(0);

      req.flush(mockResponse);

      await registerPromise;
    });
  });
});
