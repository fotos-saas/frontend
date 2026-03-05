import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VoteCrudService } from './vote-crud.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

vi.mock('../helpers/vote-mappers', () => ({
  mapPollFromApi: vi.fn((data: unknown) => data),
}));

describe('VoteCrudService', () => {
  let service: VoteCrudService;
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
    service = TestBed.inject(VoteCrudService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createPoll', () => {
    it('FormData-val POST kérést küld', async () => {
      const request = {
        title: 'Test Poll',
        type: 'custom',
        description: 'Leírás',
        options: [{ label: 'Option A' }, { label: 'Option B' }],
      };

      const promise = firstValueFrom(service.createPoll(request as any));
      const req = httpMock.expectOne((r) => r.url.includes('/polls'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true, message: 'OK', data: { id: 1, title: 'Test Poll' } });

      const result = await promise;
      expect(result).toBeTruthy();
    });
  });

  describe('updatePoll', () => {
    it('_method PUT spoofing-gal POST kérést küld', () => {
      service.updatePoll(1, { title: 'Updated' }).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/polls/1'));
      expect(req.request.method).toBe('POST');
      const body = req.request.body as FormData;
      expect(body.get('_method')).toBe('PUT');
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('deletePoll', () => {
    it('DELETE kérést küld', async () => {
      const promise = firstValueFrom(service.deletePoll(1));
      const req = httpMock.expectOne((r) => r.url.includes('/polls/1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'OK' });
      await promise;
    });
  });
});
