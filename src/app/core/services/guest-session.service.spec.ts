import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GuestSessionService } from './guest-session.service';
import { TabloStorageService } from './tablo-storage.service';
import { environment } from '../../../environments/environment';
import type { GuestRegisterResponse, GuestValidateResponse, GuestUpdateResponse } from './guest.models';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let httpMock: HttpTestingController;
  let storageSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    storageSpy = {
      getActiveSession: vi.fn().mockReturnValue(null),
      getGuestSession: vi.fn().mockReturnValue(null),
      getGuestName: vi.fn().mockReturnValue(null),
      getGuestId: vi.fn().mockReturnValue(null),
      setGuestSession: vi.fn(),
      setGuestName: vi.fn(),
      setGuestId: vi.fn(),
      clearGuestData: vi.fn(),
      updateSessionUserName: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GuestSessionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TabloStorageService, useValue: storageSpy },
      ],
    });

    service = TestBed.inject(GuestSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('inicializálás', () => {
    it('alapértelmezetten nincs guest session', () => {
      expect(service.guestSessionSignal()).toBeNull();
      expect(service.hasGuestSession()).toBe(false);
      expect(service.guestName()).toBeNull();
    });

    it('loadStoredSession betölti a tárolt session-t', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 1, sessionType: 'share' });
      storageSpy['getGuestSession'].mockReturnValue('stored-token');
      storageSpy['getGuestName'].mockReturnValue('Tárolt Vendég');

      service.loadStoredSession();

      expect(service.guestSessionSignal()).toEqual({
        sessionToken: 'stored-token',
        guestName: 'Tárolt Vendég',
        guestEmail: null,
      });
    });

    it('loadStoredSession nem csinál semmit ha nincs aktív session', () => {
      service.loadStoredSession();
      expect(service.guestSessionSignal()).toBeNull();
    });
  });

  describe('register', () => {
    it('sikeres regisztráció után tárolja az adatokat', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });

      const response: GuestRegisterResponse = {
        success: true,
        message: 'OK',
        data: {
          id: 10,
          session_token: 'new-token',
          guest_name: 'Új Vendég',
          guest_email: 'v@test.hu',
        },
      };

      service.register('Új Vendég', 'v@test.hu').subscribe(result => {
        expect(result.sessionToken).toBe('new-token');
        expect(result.guestName).toBe('Új Vendég');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.guest_name).toBe('Új Vendég');
      req.flush(response);

      expect(service.guestSessionSignal()?.sessionToken).toBe('new-token');
      expect(storageSpy['setGuestSession']).toHaveBeenCalledWith(5, 'share', 'new-token');
      expect(storageSpy['setGuestName']).toHaveBeenCalledWith(5, 'share', 'Új Vendég');
      expect(storageSpy['setGuestId']).toHaveBeenCalledWith(5, 'share', 10);
    });

    it('sikertelen regisztráció hibát dob', () => {
      service.register('Fail').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/register`);
      req.flush({ message: 'Regisztráció sikertelen' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('updateGuestInfo', () => {
    it('frissíti a guest adatokat', () => {
      // Set initial session
      service.setGuestSession({ sessionToken: 'tok', guestName: 'Old', guestEmail: null });
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });

      const response: GuestUpdateResponse = {
        success: true,
        message: 'OK',
        data: { session_token: 'tok', guest_name: 'Updated', guest_email: 'u@t.hu' },
      };

      service.updateGuestInfo('Updated', 'u@t.hu').subscribe(result => {
        expect(result.guestName).toBe('Updated');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/update`);
      expect(req.request.method).toBe('PUT');
      req.flush(response);
    });

    it('hibát dob ha nincs aktív session', () => {
      service.updateGuestInfo('Fail').subscribe({
        error: (err) => {
          expect(err.message).toContain('Nincs aktív session');
        },
      });
    });
  });

  describe('validateSession', () => {
    it('false-t ad ha nincs aktív session', () => {
      service.validateSession().subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('true-t ad érvényes session esetén', () => {
      service.setGuestSession({ sessionToken: 'valid-tok', guestName: 'V', guestEmail: null });
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });

      const response: GuestValidateResponse = {
        success: true,
        valid: true,
        data: { id: 10, session_token: 'valid-tok', guest_name: 'V', guest_email: null },
      };

      service.validateSession().subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/validate`);
      req.flush(response);
    });

    it('false-t ad és törli a session-t ha invalid', () => {
      service.setGuestSession({ sessionToken: 'bad-tok', guestName: 'V', guestEmail: null });

      service.validateSession().subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/validate`);
      req.flush({ success: true, valid: false });

      expect(service.guestSessionSignal()).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('törli a session-t és a storage-ból is', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });
      service.setGuestSession({ sessionToken: 'tok', guestName: 'V', guestEmail: null });

      service.clearSession();

      expect(service.guestSessionSignal()).toBeNull();
      expect(storageSpy['clearGuestData']).toHaveBeenCalledWith(5, 'share');
    });
  });

  describe('storeGuestSessionFromLogin', () => {
    it('tárolja a session-t a storage-ban és a signal-ban', () => {
      service.storeGuestSessionFromLogin(42, 'code', 'login-tok', 'Login Vendég');

      expect(storageSpy['setGuestSession']).toHaveBeenCalledWith(42, 'code', 'login-tok');
      expect(storageSpy['setGuestName']).toHaveBeenCalledWith(42, 'code', 'Login Vendég');
      expect(service.guestSessionSignal()).toEqual({
        sessionToken: 'login-tok',
        guestName: 'Login Vendég',
        guestEmail: null,
      });
    });
  });

  describe('setRestoredSession', () => {
    it('tárolja a visszaállított session-t', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 10, sessionType: 'share' });

      service.setRestoredSession({
        sessionToken: 'rst-tok',
        guestName: 'Restored',
        guestEmail: 'r@t.hu',
      });

      expect(storageSpy['setGuestSession']).toHaveBeenCalledWith(10, 'share', 'rst-tok');
      expect(service.guestSessionSignal()?.guestName).toBe('Restored');
    });
  });

  describe('getGuestSessionHeader', () => {
    it('X-Guest-Session header-t ad ha van session', () => {
      service.setGuestSession({ sessionToken: 'hdr-tok', guestName: 'V', guestEmail: null });

      const headers = service.getGuestSessionHeader();
      expect(headers.get('X-Guest-Session')).toBe('hdr-tok');
    });

    it('üres header-t ad ha nincs session', () => {
      const headers = service.getGuestSessionHeader();
      expect(headers.get('X-Guest-Session')).toBeNull();
    });
  });

  describe('getSessionToken', () => {
    it('token-t ad vissza ha van session', () => {
      service.setGuestSession({ sessionToken: 'my-tok', guestName: 'V', guestEmail: null });
      expect(service.getSessionToken()).toBe('my-tok');
    });

    it('null-t ad ha nincs session', () => {
      expect(service.getSessionToken()).toBeNull();
    });
  });

  describe('hasRegisteredSession', () => {
    it('true ha van session', () => {
      service.setGuestSession({ sessionToken: 'tok', guestName: 'V', guestEmail: null });
      expect(service.hasRegisteredSession()).toBe(true);
    });

    it('false ha nincs session', () => {
      expect(service.hasRegisteredSession()).toBe(false);
    });
  });

  describe('checkSessionStatus', () => {
    it('invalid-ot ad ha nincs session', () => {
      service.checkSessionStatus().subscribe(result => {
        expect(result.valid).toBe(false);
      });
    });

    it('HTTP kérést küld ha van session', () => {
      service.setGuestSession({ sessionToken: 'tok', guestName: 'V', guestEmail: null });

      service.checkSessionStatus().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/session-status`
      );
      expect(req.request.params.get('session_token')).toBe('tok');
      req.flush({ valid: true });
    });
  });

  describe('handleInvalidSession', () => {
    it('törli a session-t és event-et emitál', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });
      service.setGuestSession({ sessionToken: 'tok', guestName: 'V', guestEmail: null });

      let emitted = false;
      service.sessionInvalidated$.subscribe(event => {
        expect(event.reason).toBe('banned');
        expect(event.message).toBe('Letiltva');
        emitted = true;
      });

      service.handleInvalidSession('banned', 'Letiltva');

      expect(emitted).toBe(true);
      expect(service.guestSessionSignal()).toBeNull();
    });
  });

  describe('sendHeartbeat', () => {
    it('undefined-ot ad ha nincs session', () => {
      service.sendHeartbeat().subscribe(result => {
        expect(result).toBeUndefined();
      });
    });

    it('POST kérést küld ha van session', () => {
      service.setGuestSession({ sessionToken: 'hb-tok', guestName: 'V', guestEmail: null });

      service.sendHeartbeat().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/heartbeat`);
      expect(req.request.body.session_token).toBe('hb-tok');
      req.flush({ success: true });
    });
  });

  describe('sendDeviceLink', () => {
    it('hibát dob ha nincs session', () => {
      service.sendDeviceLink('a@b.hu').subscribe({
        error: (err) => {
          expect(err.message).toContain('Nincs aktív session');
        },
      });
    });

    it('POST kérést küld ha van session', () => {
      service.setGuestSession({ sessionToken: 'dl-tok', guestName: 'V', guestEmail: null });

      service.sendDeviceLink('a@b.hu').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/send-link`);
      expect(req.request.body.email).toBe('a@b.hu');
      req.flush({ success: true, message: 'Elküldve' });
    });
  });

  describe('requestRestoreLink', () => {
    it('POST kérést küld az email-lel', () => {
      service.requestRestoreLink('r@b.hu').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/request-restore-link`);
      expect(req.request.body).toEqual({ email: 'r@b.hu' });
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('getDeviceIdentifier', () => {
    it('string-et ad vissza', () => {
      const result = service.getDeviceIdentifier();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('handleError', () => {
    it('server message-et használja ha van', () => {
      const error = { error: { message: 'Specifikus hiba' }, status: 422 } as any;
      service.handleError(error).subscribe({
        error: (err) => expect(err.message).toBe('Specifikus hiba'),
      });
    });

    it('nincs internet üzenetet ad 0 status esetén', () => {
      const error = { error: {}, status: 0 } as any;
      service.handleError(error).subscribe({
        error: (err) => expect(err.message).toContain('internet'),
      });
    });

    it('túl sok kérés üzenetet ad 429 esetén', () => {
      const error = { error: {}, status: 429 } as any;
      service.handleError(error).subscribe({
        error: (err) => expect(err.message).toContain('Túl sok'),
      });
    });
  });
});
