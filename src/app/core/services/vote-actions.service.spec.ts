import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VoteActionsService } from './vote-actions.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

vi.mock('../helpers/vote-mappers', () => ({
  mapResultsFromApi: vi.fn((data: unknown) => data),
}));

describe('VoteActionsService', () => {
  let service: VoteActionsService;
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
    service = TestBed.inject(VoteActionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getResults', () => {
    it('eredményeket lekéri', async () => {
      const promise = firstValueFrom(service.getResults(1));
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/results'));
      req.flush({ success: true, data: { options: [] } });

      const result = await promise;
      expect(result).toBeTruthy();
    });
  });

  describe('vote', () => {
    it('szavazatot küld', async () => {
      const promise = firstValueFrom(service.vote(1, 5));
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/vote'));
      expect(req.request.body.option_id).toBe(5);
      req.flush({
        success: true, message: 'OK',
        data: { vote_id: 10, my_votes: [5], can_vote_more: false },
      });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data?.voteId).toBe(10);
      expect(result.data?.myVotes).toEqual([5]);
    });
  });

  describe('removeVote', () => {
    it('DELETE kérést küld', async () => {
      const promise = firstValueFrom(service.removeVote(1, 5));
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/vote'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'OK', data: { my_votes: [] } });

      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('optionId nélkül is működik', () => {
      service.removeVote(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/vote'));
      expect(req.request.body).toEqual({});
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('closePoll', () => {
    it('POST kérést küld', async () => {
      const promise = firstValueFrom(service.closePoll(1));
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/close'));
      req.flush({ success: true, message: 'OK' });
      await promise;
    });
  });

  describe('reopenPoll', () => {
    it('POST kérést küld close_at-tal', () => {
      service.reopenPoll(1, '2024-12-31').subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1/reopen'));
      expect(req.request.body.close_at).toBe('2024-12-31');
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('setClassSize', () => {
    it('PUT kérést küld', async () => {
      const promise = firstValueFrom(service.setClassSize(30));
      const req = httpMock.expectOne((r) => r.url.includes('/class-size'));
      expect(req.request.body.expected_class_size).toBe(30);
      req.flush({ success: true, message: 'OK', data: { expected_class_size: 30 } });

      const result = await promise;
      expect(result.expected_class_size).toBe(30);
    });
  });
});
