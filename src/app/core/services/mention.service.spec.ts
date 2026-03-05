import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MentionService, MentionParticipant } from './mention.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';

describe('MentionService', () => {
  let service: MentionService;
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
    service = TestBed.inject(MentionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchParticipants', () => {
    it('üres query esetén üres tömböt ad vissza', async () => {
      const result = await firstValueFrom(service.searchParticipants(''));
      expect(result).toEqual([]);
    });

    it('API-ból betölti a résztvevőket', async () => {
      const mockData: MentionParticipant[] = [
        { id: '1', type: 'guest', name: 'Anna', display: '@Anna' },
      ];

      const promise = firstValueFrom(service.searchParticipants('Ann'));

      const req = httpMock.expectOne((r) => r.url.includes('/participants/search'));
      expect(req.request.params.get('q')).toBe('Ann');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush({ success: true, data: mockData });

      const result = await promise;
      expect(result).toEqual(mockData);
    });

    it('hiba esetén üres tömböt ad vissza', async () => {
      const promise = firstValueFrom(service.searchParticipants('test'));

      const req = httpMock.expectOne((r) => r.url.includes('/participants/search'));
      req.error(new ProgressEvent('error'));

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  describe('formatMentions', () => {
    it('nem változtat ha nincs mention', () => {
      expect(service.formatMentions('Hello world', [])).toBe('Hello world');
    });

    it('mention-öket span elemekké alakítja', () => {
      const result = service.formatMentions('Hello @Anna, hi @Bob!', ['Anna', 'Bob']);
      expect(result).toContain('<span class="mention">@Anna</span>');
      expect(result).toContain('<span class="mention">@Bob</span>');
    });

    it('regex speciális karaktereket escapeli', () => {
      const result = service.formatMentions('Hi @John.Doe', ['John.Doe']);
      expect(result).toContain('<span class="mention">@John.Doe</span>');
    });
  });
});
