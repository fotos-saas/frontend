import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartnerSwitchService } from './partner-switch.service';
import { environment } from '../../../../environments/environment';

describe('PartnerSwitchService', () => {
  let service: PartnerSwitchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PartnerSwitchService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PartnerSwitchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMyPartners', () => {
    it('lekérdezi a partnereket és kicsomagolja a data wrapper-t', () => {
      const mockResponse = {
        data: {
          partners: [{ partner_id: 1, partner_name: 'Teszt', partner_type: null, role: 'partner', role_name: 'Partner' }],
          current_partner_id: 1,
        },
      };

      service.getMyPartners().subscribe(result => {
        expect(result.partners).toHaveLength(1);
        expect(result.current_partner_id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/my-partners`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('hibát kezel és hibaüzenetet ad vissza', () => {
      service.getMyPartners().subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/my-partners`);
      req.flush({ message: 'Nem található' }, { status: 404, statusText: 'Not Found' });
    });

    it('alapértelmezett hibaüzenetet használ ha nincs server message', () => {
      service.getMyPartners().subscribe({
        error: (err) => {
          expect(err.message).toContain('partner váltás');
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/my-partners`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('switchPartner', () => {
    it('POST-ot küld partner_id-val és kicsomagolja a data wrapper-t', () => {
      const mockResponse = {
        data: {
          user: { id: 1, name: 'Test', email: 'test@test.hu', type: 'marketer' as const },
          token: 'new-jwt',
          switched_to: { partner_id: 2, partner_name: 'Új Partner', role: 'partner', role_name: 'Partner' },
        },
      };

      service.switchPartner(2).subscribe(result => {
        expect(result.token).toBe('new-jwt');
        expect(result.switched_to.partner_id).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/switch-partner`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ partner_id: 2 });
      req.flush(mockResponse);
    });
  });

  describe('getPendingInvitations', () => {
    it('lekérdezi a függő meghívókat', () => {
      const mockResponse = {
        data: {
          invitations: [],
          count: 0,
        },
      };

      service.getPendingInvitations().subscribe(result => {
        expect(result.count).toBe(0);
        expect(result.invitations).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/pending-invitations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('acceptInvitation', () => {
    it('POST-ot küld a meghívó kóddal', () => {
      const mockResponse = {
        message: 'Meghívó elfogadva',
        token: 'jwt',
        user: { id: 1, name: 'Test', email: 'test@test.hu', type: 'marketer' as const },
        partner: { id: 3, name: 'Partner Kft.' },
        role: 'designer',
        roleName: 'Tervező',
      };

      service.acceptInvitation('ABC123').subscribe(result => {
        expect(result.message).toBe('Meghívó elfogadva');
        expect(result.partner.id).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/invite/accept`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code: 'ABC123' });
      req.flush(mockResponse);
    });
  });
});
