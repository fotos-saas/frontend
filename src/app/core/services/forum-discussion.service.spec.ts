import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ForumDiscussionService } from './forum-discussion.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('ForumDiscussionService', () => {
  let service: ForumDiscussionService;
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
    service = TestBed.inject(ForumDiscussionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadDiscussions', () => {
    it('beszélgetéseket betölti és cache-eli', async () => {
      const apiData = [{
        id: 1, title: 'Test', slug: 'test', creator_name: 'Admin',
        is_creator_contact: true, is_pinned: false, is_locked: false,
        posts_count: 3, views_count: 10, created_at: '2024-01-01',
      }];

      const promise = firstValueFrom(service.loadDiscussions());
      const req = httpMock.expectOne((r) => r.url.includes('/discussions'));
      req.flush({ data: apiData });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Test');
      expect(result[0].creatorType).toBe('contact');
      expect(service.discussionsCache().length).toBe(1);
      expect(service.isLoading()).toBe(false);
    });

    it('szűrőket átadja paraméterként', () => {
      service.loadDiscussions({ search: 'test', templateId: 5, sortBy: 'most_posts' }).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions'));
      expect(req.request.params.get('search')).toBe('test');
      expect(req.request.params.get('template_id')).toBe('5');
      expect(req.request.params.get('sort_by')).toBe('most_posts');
      req.flush({ data: [] });
    });

    it('hiba esetén isLoading-ot false-ra állítja', async () => {
      const promise = firstValueFrom(service.loadDiscussions()).catch(() => 'error');
      const req = httpMock.expectOne((r) => r.url.includes('/discussions'));
      req.error(new ProgressEvent('error'));
      await promise;
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('getDiscussion', () => {
    it('beszélgetés részleteit lekéri', async () => {
      const apiData = {
        discussion: {
          id: 1, title: 'Test', slug: 'test', creator_name: 'Admin',
          is_creator_contact: false, is_pinned: true, is_locked: false,
          can_add_posts: true, posts_count: 2, views_count: 5, created_at: '2024-01-01',
        },
        posts: { current_page: 1, data: [], total: 0 },
      };

      const promise = firstValueFrom(service.getDiscussion('test'));
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/test'));
      req.flush({ success: true, data: apiData });

      const result = await promise;
      expect(result.title).toBe('Test');
      expect(result.creatorType).toBe('guest');
      expect(result.isPinned).toBe(true);
    });
  });

  describe('createDiscussion', () => {
    it('új beszélgetést hoz létre és cache-be teszi', async () => {
      const newDiscussion = { id: 2, title: 'New' };
      const promise = firstValueFrom(service.createDiscussion({ title: 'New', content: 'Body' } as any));
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/discussions'));
      req.flush({ data: newDiscussion });

      const result = await promise;
      expect(result).toEqual(newDiscussion as any);
      expect(service.discussionsCache().length).toBe(1);
    });
  });

  describe('lockDiscussion / unlockDiscussion', () => {
    it('lock POST kérést küld', () => {
      service.lockDiscussion(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1/lock'));
      expect(req.request.method).toBe('POST');
      req.flush({ data: { id: 1, isLocked: true } });
    });

    it('unlock POST kérést küld', () => {
      service.unlockDiscussion(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1/unlock'));
      expect(req.request.method).toBe('POST');
      req.flush({ data: { id: 1, isLocked: false } });
    });
  });

  describe('pinDiscussion / unpinDiscussion', () => {
    it('pin POST kérést küld', () => {
      service.pinDiscussion(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1/pin'));
      req.flush({ data: { id: 1, isPinned: true } });
    });

    it('unpin POST kérést küld', () => {
      service.unpinDiscussion(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1/unpin'));
      req.flush({ data: { id: 1, isPinned: false } });
    });
  });

  describe('updateDiscussion', () => {
    it('PUT kérést küld az update adatokkal', () => {
      service.updateDiscussion(1, { title: 'Updated' }).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/discussions/1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.title).toBe('Updated');
      req.flush({ data: { id: 1, title: 'Updated' } });
    });
  });

  describe('updateDiscussionInCache', () => {
    it('frissíti a cache-ben lévő beszélgetést', () => {
      service.discussionsCache.set([
        { id: 1, title: 'Old' } as any,
        { id: 2, title: 'Other' } as any,
      ]);
      service.updateDiscussionInCache({ id: 1, title: 'New' } as any);
      expect(service.discussionsCache()[0].title).toBe('New');
    });

    it('nem módosít ha nincs a cache-ben', () => {
      service.discussionsCache.set([{ id: 1, title: 'Old' } as any]);
      service.updateDiscussionInCache({ id: 99, title: 'New' } as any);
      expect(service.discussionsCache().length).toBe(1);
      expect(service.discussionsCache()[0].title).toBe('Old');
    });
  });
});
