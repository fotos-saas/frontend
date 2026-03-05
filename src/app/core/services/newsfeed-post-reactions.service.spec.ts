import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NewsfeedPostReactionsService } from './newsfeed-post-reactions.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('NewsfeedPostReactionsService', () => {
  let service: NewsfeedPostReactionsService;
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
    service = TestBed.inject(NewsfeedPostReactionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggleReaction', () => {
    it('reakció toggle-t küld', async () => {
      const promise = firstValueFrom(service.toggleReaction(1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1/like'));
      expect(req.request.method).toBe('POST');
      req.flush({
        success: true,
        data: { liked: true, has_reacted: true, user_reaction: '\u2764\uFE0F', reactions: {}, likes_count: 3 },
      });

      const result = await promise;
      expect(result.hasReacted).toBe(true);
      expect(result.likesCount).toBe(3);
    });
  });

  describe('pinPost', () => {
    it('POST kérést küld', async () => {
      const promise = firstValueFrom(service.pinPost(1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1/pin'));
      req.flush({ success: true });

      const result = await promise;
      expect(result.success).toBe(true);
    });
  });

  describe('unpinPost', () => {
    it('POST kérést küld', async () => {
      const promise = firstValueFrom(service.unpinPost(1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1/unpin'));
      req.flush({ success: true });

      const result = await promise;
      expect(result.success).toBe(true);
    });
  });
});
