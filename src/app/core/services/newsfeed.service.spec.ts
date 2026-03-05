import { TestBed } from '@angular/core/testing';
import { NewsfeedService } from './newsfeed.service';
import { NewsfeedPostService } from './newsfeed-post.service';
import { NewsfeedCommentService } from './newsfeed-comment.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('NewsfeedService (Facade)', () => {
  let service: NewsfeedService;

  const mockPostService = {
    isLoading: signal(false),
    posts$: of([]),
    loadPosts: vi.fn().mockReturnValue(of([])),
    getUpcomingEvents: vi.fn().mockReturnValue(of([])),
    getPost: vi.fn().mockReturnValue(of({})),
    createPost: vi.fn().mockReturnValue(of({})),
    updatePost: vi.fn().mockReturnValue(of({})),
    deleteMedia: vi.fn().mockReturnValue(of({ success: true })),
    deletePost: vi.fn().mockReturnValue(of({ success: true })),
    toggleReaction: vi.fn().mockReturnValue(of({})),
    pinPost: vi.fn().mockReturnValue(of({ success: true })),
    unpinPost: vi.fn().mockReturnValue(of({ success: true })),
  };

  const mockCommentService = {
    toggleCommentReaction: vi.fn().mockReturnValue(of({})),
    getComments: vi.fn().mockReturnValue(of([])),
    createComment: vi.fn().mockReturnValue(of({})),
    deleteComment: vi.fn().mockReturnValue(of({ success: true })),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NewsfeedService,
        { provide: NewsfeedPostService, useValue: mockPostService },
        { provide: NewsfeedCommentService, useValue: mockCommentService },
      ],
    });
    service = TestBed.inject(NewsfeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('post delegálás', () => {
    it('loadPosts a post service-re delegál', () => {
      service.loadPosts({ type: 'announcement' });
      expect(mockPostService.loadPosts).toHaveBeenCalledWith({ type: 'announcement' });
    });

    it('getPost a post service-re delegál', () => {
      service.getPost(1);
      expect(mockPostService.getPost).toHaveBeenCalledWith(1);
    });

    it('createPost a post service-re delegál', () => {
      const req = { postType: 'announcement' as const, title: 'Test' };
      service.createPost(req);
      expect(mockPostService.createPost).toHaveBeenCalledWith(req, undefined);
    });

    it('deletePost a post service-re delegál', () => {
      service.deletePost(1);
      expect(mockPostService.deletePost).toHaveBeenCalledWith(1);
    });

    it('pinPost delegál', () => {
      service.pinPost(1);
      expect(mockPostService.pinPost).toHaveBeenCalledWith(1);
    });
  });

  describe('comment delegálás', () => {
    it('getComments a comment service-re delegál', () => {
      service.getComments(1, 10);
      expect(mockCommentService.getComments).toHaveBeenCalledWith(1, 10);
    });

    it('createComment a comment service-re delegál', () => {
      service.createComment(1, 'Hello');
      expect(mockCommentService.createComment).toHaveBeenCalledWith(1, 'Hello', undefined);
    });

    it('deleteComment a comment service-re delegál', () => {
      service.deleteComment(5, 1);
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('isLoading', () => {
    it('post service isLoading-ját adja vissza', () => {
      expect(service.isLoading()).toBe(false);
    });
  });
});
