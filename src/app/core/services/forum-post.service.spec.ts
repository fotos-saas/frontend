import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ForumPostService } from './forum-post.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

vi.mock('../models/forum-api.types', () => ({
  mapApiPostToDiscussionPost: vi.fn((p: any) => ({ id: p.id, content: p.content })),
  mapApiMediaToPostMedia: vi.fn((m: any) => ({ id: m.id, url: m.url })),
}));

describe('ForumPostService', () => {
  let service: ForumPostService;
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
    service = TestBed.inject(ForumPostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createPost', () => {
    it('JSON body-val küld ha nincs média', async () => {
      const promise = firstValueFrom(service.createPost(1, { content: 'Hello' }));
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/discussions/1/posts'));
      expect(req.request.body.content).toBe('Hello');
      req.flush({ data: { id: 10, content: 'Hello' } });

      const result = await promise;
      expect(result.id).toBe(10);
    });

    it('FormData-val küld ha van média', () => {
      const file = new File([''], 'test.jpg');
      service.createPost(1, { content: 'Hi', media: [file] as any }).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1/posts'));
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ data: { id: 11, content: 'Hi' } });
    });
  });

  describe('updatePost', () => {
    it('PUT kérést küld', () => {
      service.updatePost(5, 'Updated content').subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/posts/5'));
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { media: [] }, message: 'OK' });
    });

    it('FormData POST-ot küld ha van média', () => {
      const file = new File([''], 'img.jpg');
      service.updatePost(5, 'Updated', [file]).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/posts/5'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { media: [] }, message: 'OK' });
    });
  });

  describe('deletePost', () => {
    it('DELETE kérést küld', () => {
      service.deletePost(5).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/posts/5'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('toggleReaction', () => {
    it('reakció toggle-t küld', async () => {
      const promise = firstValueFrom(service.toggleReaction(5));
      const req = httpMock.expectOne((r) => r.url.includes('/posts/5/like'));
      req.flush({
        success: true,
        data: { has_reacted: true, user_reaction: null, reactions: {}, likes_count: 1 },
      });

      const result = await promise;
      expect(result.hasReacted).toBe(true);
    });
  });
});
