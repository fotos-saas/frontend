import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NewsfeedPostService } from './newsfeed-post.service';
import { GuestService } from './guest.service';
import { LoggerService } from './logger.service';
import { NewsfeedPostCrudService } from './newsfeed-post-crud.service';
import { NewsfeedPostReactionsService } from './newsfeed-post-reactions.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

vi.mock('../models/newsfeed-api.types', () => ({
  mapApiCommentToNewsfeedComment: vi.fn((c: any) => ({
    id: c.id, content: c.content, authorName: 'Test', authorType: 'guest',
    isEdited: false, canDelete: false, createdAt: '', parentId: null,
  })),
}));

describe('NewsfeedPostService', () => {
  let service: NewsfeedPostService;
  let httpMock: HttpTestingController;

  const mockGuestService = {
    getGuestSessionHeader: vi.fn().mockReturnValue(new HttpHeaders()),
  };
  const mockCrudService = {
    createPost: vi.fn().mockReturnValue(of({ id: 1, post_type: 'announcement', title: 'T', author_name: '', is_pinned: false, likes_count: 0, comments_count: 0, has_liked: false, user_reaction: null, reactions: {}, can_edit: false, can_delete: false, media: [], created_at: '', updated_at: '' })),
    updatePost: vi.fn().mockReturnValue(of({ id: 1, post_type: 'announcement', title: 'U', author_name: '', is_pinned: false, likes_count: 0, comments_count: 0, has_liked: false, user_reaction: null, reactions: {}, can_edit: false, can_delete: false, media: [], created_at: '', updated_at: '' })),
    deleteMedia: vi.fn().mockReturnValue(of({ success: true })),
    deletePost: vi.fn().mockReturnValue(of({ success: true })),
  };
  const mockReactionsService = {
    toggleReaction: vi.fn().mockReturnValue(of({ hasReacted: true, userReaction: null, reactions: {}, likesCount: 1 })),
    pinPost: vi.fn().mockReturnValue(of({ success: true })),
    unpinPost: vi.fn().mockReturnValue(of({ success: true })),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestService, useValue: mockGuestService },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: NewsfeedPostCrudService, useValue: mockCrudService },
        { provide: NewsfeedPostReactionsService, useValue: mockReactionsService },
      ],
    });
    service = TestBed.inject(NewsfeedPostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadPosts', () => {
    it('posztokat betölt és cache-eli', async () => {
      const promise = firstValueFrom(service.loadPosts());
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed'));
      req.flush({ success: true, data: { data: [{ id: 1, post_type: 'announcement', title: 'Test', author_name: 'Admin', is_pinned: false, likes_count: 0, comments_count: 0, has_liked: false, user_reaction: null, reactions: {}, can_edit: false, can_delete: false, media: [], created_at: '', updated_at: '' }] } });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Test');
      expect(service.postsCache().length).toBe(1);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('incrementCommentsInCache', () => {
    it('növeli a commentsCount-ot', () => {
      service.postsCache.set([{ id: 1, commentsCount: 5 } as any]);
      service.incrementCommentsInCache(1);
      expect(service.postsCache()[0].commentsCount).toBe(6);
    });
  });

  describe('decrementCommentsInCache', () => {
    it('csökkenti de nem megy 0 alá', () => {
      service.postsCache.set([{ id: 1, commentsCount: 0 } as any]);
      service.decrementCommentsInCache(1);
      expect(service.postsCache()[0].commentsCount).toBe(0);
    });
  });

  describe('delegálás', () => {
    it('createPost a crudService-re delegál', async () => {
      await firstValueFrom(service.createPost({ postType: 'announcement', title: 'T' }));
      expect(mockCrudService.createPost).toHaveBeenCalled();
    });

    it('deletePost a crudService-re delegál', async () => {
      await firstValueFrom(service.deletePost(1));
      expect(mockCrudService.deletePost).toHaveBeenCalledWith(1);
    });

    it('toggleReaction a reactionsService-re delegál', async () => {
      await firstValueFrom(service.toggleReaction(1));
      expect(mockReactionsService.toggleReaction).toHaveBeenCalled();
    });
  });
});
