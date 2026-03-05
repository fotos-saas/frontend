import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VoteParticipantsService } from './vote-participants.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('VoteParticipantsService', () => {
  let service: VoteParticipantsService;
  let httpMock: HttpTestingController;

  const mockGuestService = {
    getGuestSessionHeader: vi.fn().mockReturnValue(new HttpHeaders()),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestService, useValue: mockGuestService },
      ],
    });
    service = TestBed.inject(VoteParticipantsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getParticipants', () => {
    it('résztvevőket betölti és mappeli', async () => {
      const apiResponse = {
        success: true,
        data: [{
          id: 1, guest_name: 'Anna', guest_email: 'a@a.com',
          is_banned: false, is_extra: false, last_activity_at: null,
          created_at: '2024-01-01', votes_count: 3,
        }],
        statistics: {
          total: 1, active: 1, banned: 0, extra_count: 0,
          regular_count: 1, active_24h: 1,
          expected_class_size: 30, participation_rate: 50,
        },
        current_guest_id: 1,
      };

      const promise = firstValueFrom(service.getParticipants());
      const req = httpMock.expectOne((r) => r.url.includes('/participants'));
      req.flush(apiResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].guestName).toBe('Anna');
      expect(result.data[0].guestEmail).toBe('a@a.com');
      expect(result.statistics.total).toBe(1);
      expect(result.statistics.extraCount).toBe(0);
      expect(result.currentGuestId).toBe(1);
    });

    it('hibát dob ha success=false', async () => {
      const promise = firstValueFrom(service.getParticipants()).catch(() => 'error');
      const req = httpMock.expectOne((r) => r.url.includes('/participants'));
      req.flush({ success: false, data: [], statistics: { total: 0, active: 0, banned: 0, extra_count: 0, regular_count: 0, active_24h: 0, expected_class_size: null, participation_rate: null }, current_guest_id: null });

      const result = await promise;
      expect(result).toBe('error');
    });
  });

  describe('toggleExtra', () => {
    it('extra státusz toggle-t küld', async () => {
      const promise = firstValueFrom(service.toggleExtra(5));
      const req = httpMock.expectOne((r) => r.url.includes('/guests/5/extra'));
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, message: 'OK', is_extra: true });

      const result = await promise;
      expect(result.isExtra).toBe(true);
    });
  });
});
