import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NewsfeedCommentService } from './newsfeed-comment.service';
import { GuestService } from './guest.service';
import { NewsfeedPostService } from './newsfeed-post.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

vi.mock('../models/newsfeed-api.types', () => ({
  mapApiCommentToNewsfeedComment: vi.fn((c: any) => ({
    id: c.id, content: c.content, authorName: c.author_name || 'Test',
    authorType: c.author_type || 'guest', isEdited: false, canDelete: false,
    createdAt: c.created_at || '', parentId: null,
  })),
}));

describe('NewsfeedCommentService', () => {
  let service: NewsfeedCommentService;
  let httpMock: HttpTestingController;

  const mockGuestService = {
    getGuestSessionHeader: vi.fn().mockReturnValue(new HttpHeaders()),
  };
  const mockPostService = {
    incrementCommentsInCache: vi.fn(),
    decrementCommentsInCache: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestService, useValue: mockGuestService },
        { provide: NewsfeedPostService, useValue: mockPostService },
      ],
    });
    service = TestBed.inject(NewsfeedCommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggleCommentReaction', () => {
    it('reakció toggle-t küld', async () => {
      const promise = firstValueFrom(service.toggleCommentReaction(1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed-comments/1/like'));
      req.flush({
        success: true,
        data: { has_reacted: true, user_reaction: '\u2764\uFE0F', reactions: {}, likes_count: 5 },
      });

      const result = await promise;
      expect(result.hasReacted).toBe(true);
      expect(result.likesCount).toBe(5);
    });
  });

  describe('getComments', () => {
    it('kommenteket betölti', async () => {
      const promise = firstValueFrom(service.getComments(1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1/comments'));
      req.flush({ success: true, data: { data: [{ id: 1, content: 'Hello' }] } });

      const result = await promise;
      expect(result.length).toBe(1);
    });
  });

  describe('createComment', () => {
    it('kommentet hoz létre és incrementálja a cache-t', async () => {
      const promise = firstValueFrom(service.createComment(1, 'Test comment'));
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/newsfeed/1/comments'));
      expect(req.request.body.content).toBe('Test comment');
      req.flush({ success: true, data: { id: 10, content: 'Test comment' } });

      await promise;
      expect(mockPostService.incrementCommentsInCache).toHaveBeenCalledWith(1);
    });

    it('parentId-val küld', () => {
      service.createComment(1, 'Reply', 5).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1/comments'));
      expect(req.request.body.parent_id).toBe(5);
      req.flush({ success: true, data: { id: 11, content: 'Reply' } });
    });
  });

  describe('deleteComment', () => {
    it('kommentet töröl és decrementálja a cache-t', async () => {
      const promise = firstValueFrom(service.deleteComment(5, 1));
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed-comments/5'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });

      await promise;
      expect(mockPostService.decrementCommentsInCache).toHaveBeenCalledWith(1);
    });
  });
});
