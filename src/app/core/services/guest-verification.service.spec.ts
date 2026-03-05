import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GuestVerificationService } from './guest-verification.service';
import { GuestSessionService } from './guest-session.service';
import { TabloStorageService } from './tablo-storage.service';
import { environment } from '../../../environments/environment';
import type { RegisterWithIdentificationResponse, VerificationStatusResponse } from '../models/guest.models';

describe('GuestVerificationService', () => {
  let service: GuestVerificationService;
  let httpMock: HttpTestingController;
  let sessionSpy: Record<string, ReturnType<typeof vi.fn>>;
  let storageSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    sessionSpy = {
      getDeviceIdentifier: vi.fn().mockReturnValue('device-abc'),
      getCurrentSession: vi.fn().mockReturnValue(null),
      storeSessionToken: vi.fn(),
      storeGuestName: vi.fn(),
      storeGuestId: vi.fn(),
      setGuestSession: vi.fn(),
      handleInvalidSession: vi.fn(),
      handleError: vi.fn().mockImplementation((error: any) => {
        const { throwError } = require('rxjs');
        return throwError(() => new Error(error.error?.message || 'Hiba'));
      }),
    };

    storageSpy = {
      getActiveSession: vi.fn().mockReturnValue(null),
      setVerificationStatus: vi.fn(),
      getVerificationStatus: vi.fn().mockReturnValue(null),
      updateSessionUserName: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GuestVerificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestSessionService, useValue: sessionSpy },
        { provide: TabloStorageService, useValue: storageSpy },
      ],
    });

    service = TestBed.inject(GuestVerificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('signals', () => {
    it('alapértelmezett signal értékek', () => {
      expect(service.verificationStatus()).toBe('verified');
      expect(service.isPending()).toBe(false);
      expect(service.personId()).toBeNull();
      expect(service.personName()).toBeNull();
    });

    it('deprecated alias-ok működnek', () => {
      expect(service.missingPersonId()).toBeNull();
      expect(service.missingPersonName()).toBeNull();
    });
  });

  describe('searchPersons', () => {
    it('üres tömböt ad ha a query rövidebb 2 karakternél', () => {
      service.searchPersons('a').subscribe(result => {
        expect(result).toEqual([]);
      });
      // Nem szabad HTTP kérésnek lennie
    });

    it('GET kérést küld ha a query legalább 2 karakter', () => {
      service.searchPersons('Ki').subscribe(result => {
        expect(result).toHaveLength(1);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/persons/search`
      );
      expect(req.request.params.get('q')).toBe('Ki');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush({
        success: true,
        data: [{ id: 1, name: 'Kiss', type: 'student', type_label: 'Diák', has_photo: true, is_claimed: false }],
      });
    });

    it('üres tömböt ad ha a válasz success=false', () => {
      service.searchPersons('Ab').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/persons/search`
      );
      req.flush({ success: false, data: [] });
    });

    it('üres tömböt ad hálózati hiba esetén', () => {
      service.searchPersons('Ab').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/persons/search`
      );
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('searchMissingPersons (deprecated)', () => {
    it('searchPersons-re delegál', () => {
      service.searchMissingPersons('Ki').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/persons/search`
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('registerWithIdentification', () => {
    it('sikeres regisztráció után frissíti a state-et', () => {
      storageSpy['getActiveSession'].mockReturnValue({ projectId: 5, sessionType: 'share' });

      const response: RegisterWithIdentificationResponse = {
        success: true,
        message: 'OK',
        has_conflict: false,
        data: {
          id: 20,
          session_token: 'new-tok',
          guest_name: 'Vendég Pista',
          guest_email: null,
          verification_status: 'pending',
          is_pending: true,
          missing_person_id: 3,
          missing_person_name: 'Kiss Pista',
        },
      };

      service.registerWithIdentification('Vendég Pista', 3, 'v@test.hu').subscribe(result => {
        expect(result.sessionToken).toBe('new-tok');
        expect(result.verificationStatus).toBe('pending');
        expect(result.isPending).toBe(true);
        expect(result.missingPersonId).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/register-with-identification`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.nickname).toBe('Vendég Pista');
      expect(req.request.body.missing_person_id).toBe(3);
      expect(req.request.body.device_identifier).toBe('device-abc');
      req.flush(response);

      // State frissítés
      expect(service.verificationStatus()).toBe('pending');
      expect(service.isPending()).toBe(true);
      expect(service.personId()).toBe(3);
      expect(service.personName()).toBe('Kiss Pista');

      // Storage hívások
      expect(sessionSpy['storeSessionToken']).toHaveBeenCalledWith(5, 'share', 'new-tok');
      expect(sessionSpy['storeGuestName']).toHaveBeenCalledWith(5, 'share', 'Vendég Pista');
      expect(sessionSpy['storeGuestId']).toHaveBeenCalledWith(5, 'share', 20);
      expect(storageSpy['setVerificationStatus']).toHaveBeenCalledWith(5, 'share', 'pending');
      expect(storageSpy['updateSessionUserName']).toHaveBeenCalledWith(5, 'share', 'Vendég Pista');
      expect(sessionSpy['setGuestSession']).toHaveBeenCalled();
    });

    it('hibát dob ha success=false', () => {
      service.registerWithIdentification('Fail').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/guest/register-with-identification`);
      req.flush({ message: 'Hiba' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('verification status storage', () => {
    it('storeVerificationStatus delegál a storage-ra', () => {
      service.storeVerificationStatus(5, 'share', 'verified');
      expect(storageSpy['setVerificationStatus']).toHaveBeenCalledWith(5, 'share', 'verified');
    });

    it('getStoredVerificationStatus érvényes status-t ad', () => {
      storageSpy['getVerificationStatus'].mockReturnValue('pending');
      expect(service.getStoredVerificationStatus(5, 'share')).toBe('pending');
    });

    it('getStoredVerificationStatus null-t ad érvénytelen status esetén', () => {
      storageSpy['getVerificationStatus'].mockReturnValue('invalid_status');
      expect(service.getStoredVerificationStatus(5, 'share')).toBeNull();
    });

    it('getStoredVerificationStatus null-t ad ha nincs tárolt érték', () => {
      storageSpy['getVerificationStatus'].mockReturnValue(null);
      expect(service.getStoredVerificationStatus(5, 'share')).toBeNull();
    });
  });

  describe('checkVerificationStatus', () => {
    it('success: false-t ad ha nincs aktív session', () => {
      service.checkVerificationStatus().subscribe(result => {
        expect(result.success).toBe(false);
      });
    });

    it('GET kérést küld ha van session', () => {
      sessionSpy['getCurrentSession'].mockReturnValue({ sessionToken: 'tok', guestName: 'V', guestEmail: null });

      const response: VerificationStatusResponse = {
        success: true,
        data: {
          verification_status: 'verified',
          is_verified: true,
          is_pending: false,
          is_rejected: false,
          is_banned: false,
          missing_person_name: null,
        },
      };

      service.checkVerificationStatus().subscribe(result => {
        expect(result.success).toBe(true);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/verification-status`
      );
      expect(req.request.params.get('session_token')).toBe('tok');
      req.flush(response);
    });

    it('success: false-t ad hálózati hiba esetén', () => {
      sessionSpy['getCurrentSession'].mockReturnValue({ sessionToken: 'tok', guestName: 'V', guestEmail: null });

      service.checkVerificationStatus().subscribe(result => {
        expect(result.success).toBe(false);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/guest/verification-status`
      );
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('helper methods', () => {
    it('isSessionPending az isPending signal-t olvassa', () => {
      expect(service.isSessionPending()).toBe(false);
    });

    it('hasPersonIdentification a personId signal-t olvassa', () => {
      expect(service.hasPersonIdentification()).toBe(false);
    });
  });

  describe('admin methods', () => {
    it('getPendingSessions GET kérést küld', () => {
      service.getPendingSessions().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/admin/pending-sessions`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [], count: 0 });
    });

    it('resolveConflict POST kérést küld', () => {
      service.resolveConflict(10, true).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tablo-frontend/admin/guests/10/resolve-conflict`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ approve: true });
      req.flush({ success: true, message: 'Elfogadva' });
    });
  });
});
