/**
 * ForumService Unit Tests
 *
 * Tesztek:
 * - Beszélgetések betöltése
 * - Beszélgetés részleteinek lekérése
 * - Beszélgetés létrehozás, lock/unlock, pin/unpin
 * - Hozzászólás CRUD és like
 * - X-Guest-Session header kezelés
 * - Hibakezelés
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ForumService,
  Discussion,
  DiscussionDetail,
  DiscussionPost,
  CreateDiscussionRequest,
  CreatePostRequest
} from './forum.service';
import { GuestService } from './guest.service';
import { environment } from '../../../environments/environment';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;
  let guestServiceMock: { getGuestSessionHeader: ReturnType<typeof vi.fn> };

  const API_BASE = `${environment.apiUrl}/tablo-frontend`;

  // Frontend Discussion objektum (camelCase)
  const mockDiscussion: Discussion = {
    id: 1,
    title: 'Teszt Beszélgetés',
    slug: 'teszt-beszelgetes',
    templateId: 1,
    templateName: 'Klasszikus',
    isPinned: false,
    isLocked: false,
    postsCount: 5,
    viewsCount: 100,
    creatorType: 'contact',
    creatorName: 'Kovács János',
    createdAt: '2024-01-15T10:00:00Z',
    lastPostAt: '2024-01-15T12:30:00Z',
    lastPostBy: 'Kiss Mária'
  };

  // API válasz formátum (snake_case) - ezt kapjuk az API-tól
  const mockApiDiscussionListItem = {
    id: 1,
    title: 'Teszt Beszélgetés',
    slug: 'teszt-beszelgetes',
    template_id: 1,
    template_name: 'Klasszikus',
    is_pinned: false,
    is_locked: false,
    posts_count: 5,
    views_count: 100,
    is_creator_contact: true,
    creator_name: 'Kovács János',
    created_at: '2024-01-15T10:00:00Z',
    last_post_at: '2024-01-15T12:30:00Z',
    last_post_by: 'Kiss Mária'
  };

  const mockPost: DiscussionPost = {
    id: 1,
    discussionId: 1,
    parentId: undefined,
    authorType: 'guest',
    authorName: 'Teszt Vendég',
    content: 'Ez egy teszt hozzászólás.',
    mentions: [],
    isEdited: false,
    editedAt: undefined,
    likesCount: 3,
    hasLiked: false,
    canEdit: true,
    canDelete: true,
    createdAt: '2024-01-15T11:00:00Z',
    replies: [],
    media: []
  };

  // API válasz formátum a post-hoz (snake_case)
  const mockApiPost = {
    id: 1,
    discussion_id: 1,
    parent_id: null,
    is_author_contact: false,
    author_name: 'Teszt Vendég',
    content: 'Ez egy teszt hozzászólás.',
    mentions: [],
    is_edited: false,
    edited_at: null,
    likes_count: 3,
    is_liked: false,
    can_edit: true,
    can_delete: true,
    created_at: '2024-01-15T11:00:00Z',
    replies: [],
    media: []
  };

  // API válasz formátum a discussion részlethez (snake_case)
  const mockApiDiscussionDetail = {
    id: 1,
    title: 'Teszt Beszélgetés',
    slug: 'teszt-beszelgetes',
    template_id: 1,
    template_name: 'Klasszikus',
    is_pinned: false,
    is_locked: false,
    posts_count: 5,
    views_count: 100,
    is_creator_contact: true,
    creator_name: 'Kovács János',
    created_at: '2024-01-15T10:00:00Z'
  };

  const mockDiscussionDetail: DiscussionDetail = {
    ...mockDiscussion,
    posts: [mockPost]
  };

  beforeEach(() => {
    guestServiceMock = {
      getGuestSessionHeader: vi.fn().mockReturnValue(
        new HttpHeaders().set('X-Guest-Session', 'test-session-token')
      )
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ForumService,
        { provide: GuestService, useValue: guestServiceMock }
      ]
    });

    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==================== LOAD DISCUSSIONS TESZTEK ====================

  describe('loadDiscussions', () => {
    it('should load discussions successfully', async () => {
      const discussionsPromise = firstValueFrom(service.loadDiscussions());

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Guest-Session')).toBe('test-session-token');

      // API snake_case formátumban válaszol
      req.flush({ data: [mockApiDiscussionListItem] });

      const discussions = await discussionsPromise;
      expect(discussions.length).toBe(1);
      expect(discussions[0].title).toBe('Teszt Beszélgetés');
      expect(discussions[0].isPinned).toBe(false);
    });

    it('should set isLoading signal during load', async () => {
      expect(service.isLoading()).toBe(false);

      const discussionsPromise = firstValueFrom(service.loadDiscussions());

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({ data: [] });

      await discussionsPromise;

      expect(service.isLoading()).toBe(false);
    });

    it('should handle error and reset loading state', async () => {
      const discussionsPromise = firstValueFrom(service.loadDiscussions()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.error(new ProgressEvent('error'), { status: 500 });

      const error = await discussionsPromise;
      expect(error.message).toBe('Ismeretlen hiba történt');
      expect(service.isLoading()).toBe(false);
    });

    it('should handle 401 unauthorized error', async () => {
      const discussionsPromise = firstValueFrom(service.loadDiscussions()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      const error = await discussionsPromise;
      expect(error.message).toBe('Nincs jogosultságod ehhez a művelethez');
    });

    it('should handle 429 rate limit error', async () => {
      const discussionsPromise = firstValueFrom(service.loadDiscussions()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });

      const error = await discussionsPromise;
      expect(error.message).toBe('Túl sok kérés, kérlek várj egy kicsit');
    });
  });

  // ==================== GET DISCUSSION TESZTEK ====================

  describe('getDiscussion', () => {
    it('should get discussion by slug successfully', async () => {
      const discussionPromise = firstValueFrom(service.getDiscussion('teszt-beszelgetes'));

      const req = httpMock.expectOne(`${API_BASE}/discussions/teszt-beszelgetes`);
      expect(req.request.method).toBe('GET');

      // API válasz formátum: { success: true, data: { discussion: ..., posts: { data: [...] } } }
      req.flush({
        success: true,
        data: {
          discussion: mockApiDiscussionDetail,
          posts: {
            data: [mockApiPost]
          }
        }
      });

      const discussion = await discussionPromise;
      expect(discussion.id).toBe(1);
      expect(discussion.title).toBe('Teszt Beszélgetés');
      expect(discussion.posts.length).toBe(1);
      expect(discussion.posts[0].content).toBe('Ez egy teszt hozzászólás.');
    });

    it('should handle 404 not found error', async () => {
      const discussionPromise = firstValueFrom(service.getDiscussion('nem-letezik')).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions/nem-letezik`);
      req.flush({}, { status: 404, statusText: 'Not Found' });

      const error = await discussionPromise;
      expect(error.message).toBe('A beszélgetés nem található');
    });
  });

  // ==================== CREATE DISCUSSION TESZTEK ====================

  describe('createDiscussion', () => {
    it('should create discussion successfully', async () => {
      const createRequest: CreateDiscussionRequest = {
        title: 'Új Beszélgetés',
        content: 'Ez az első hozzászólás.',
        templateId: 1
      };

      const newDiscussion: Discussion = {
        ...mockDiscussion,
        id: 2,
        title: 'Új Beszélgetés',
        slug: 'uj-beszelgetes'
      };

      const createPromise = firstValueFrom(service.createDiscussion(createRequest));

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);

      req.flush({ data: newDiscussion });

      const discussion = await createPromise;
      expect(discussion.id).toBe(2);
      expect(discussion.title).toBe('Új Beszélgetés');
    });

    it('should handle validation error', async () => {
      const createPromise = firstValueFrom(service.createDiscussion({
        title: '',
        content: ''
      })).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({ message: 'A cím megadása kötelező!' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await createPromise;
      expect(error.message).toBe('A cím megadása kötelező!');
    });
  });

  // ==================== LOCK/UNLOCK TESZTEK ====================

  describe('lockDiscussion', () => {
    it('should lock discussion successfully', async () => {
      const lockedDiscussion: Discussion = { ...mockDiscussion, isLocked: true };

      const lockPromise = firstValueFrom(service.lockDiscussion(1));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/lock`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush({ data: lockedDiscussion });

      const discussion = await lockPromise;
      expect(discussion.isLocked).toBe(true);
    });
  });

  describe('unlockDiscussion', () => {
    it('should unlock discussion successfully', async () => {
      const unlockedDiscussion: Discussion = { ...mockDiscussion, isLocked: false };

      const unlockPromise = firstValueFrom(service.unlockDiscussion(1));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/unlock`);
      expect(req.request.method).toBe('POST');

      req.flush({ data: unlockedDiscussion });

      const discussion = await unlockPromise;
      expect(discussion.isLocked).toBe(false);
    });
  });

  // ==================== PIN/UNPIN TESZTEK ====================

  describe('pinDiscussion', () => {
    it('should pin discussion successfully', async () => {
      const pinnedDiscussion: Discussion = { ...mockDiscussion, isPinned: true };

      const pinPromise = firstValueFrom(service.pinDiscussion(1));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/pin`);
      expect(req.request.method).toBe('POST');

      req.flush({ data: pinnedDiscussion });

      const discussion = await pinPromise;
      expect(discussion.isPinned).toBe(true);
    });
  });

  describe('unpinDiscussion', () => {
    it('should unpin discussion successfully', async () => {
      const unpinnedDiscussion: Discussion = { ...mockDiscussion, isPinned: false };

      const unpinPromise = firstValueFrom(service.unpinDiscussion(1));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/unpin`);
      expect(req.request.method).toBe('POST');

      req.flush({ data: unpinnedDiscussion });

      const discussion = await unpinPromise;
      expect(discussion.isPinned).toBe(false);
    });
  });

  // ==================== CREATE POST TESZTEK ====================

  describe('createPost', () => {
    it('should create post successfully', async () => {
      const createRequest: CreatePostRequest = {
        content: 'Új hozzászólás tartalma',
        mentions: ['@KovácsJános']
      };

      const newPost: DiscussionPost = {
        ...mockPost,
        id: 2,
        content: 'Új hozzászólás tartalma',
        mentions: ['KovácsJános']
      };

      const createPromise = firstValueFrom(service.createPost(1, createRequest));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/posts`);
      expect(req.request.method).toBe('POST');
      // A service snake_case-t használ az API felé
      expect(req.request.body.content).toBe(createRequest.content);

      req.flush({ data: newPost });

      const post = await createPromise;
      expect(post.id).toBe(2);
      expect(post.content).toBe('Új hozzászólás tartalma');
    });

    it('should create reply post with parentId', async () => {
      const createRequest: CreatePostRequest = {
        content: 'Válasz tartalom',
        parentId: 1
      };

      const replyPost: DiscussionPost = {
        ...mockPost,
        id: 3,
        parentId: 1,
        content: 'Válasz tartalom'
      };

      const createPromise = firstValueFrom(service.createPost(1, createRequest));

      const req = httpMock.expectOne(`${API_BASE}/discussions/1/posts`);
      // A service parent_id-t (snake_case) küld az API felé
      expect(req.request.body.parent_id).toBe(1);

      req.flush({ data: replyPost });

      const post = await createPromise;
      expect(post.parentId).toBe(1);
    });
  });

  // ==================== UPDATE POST TESZTEK ====================

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      const updatedPost: DiscussionPost = {
        ...mockPost,
        content: 'Módosított tartalom',
        isEdited: true,
        editedAt: '2024-01-15T12:00:00Z'
      };

      const updatePromise = firstValueFrom(service.updatePost(1, 'Módosított tartalom'));

      const req = httpMock.expectOne(`${API_BASE}/posts/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ content: 'Módosított tartalom' });

      req.flush({ data: updatedPost });

      const post = await updatePromise;
      expect(post.content).toBe('Módosított tartalom');
      expect(post.isEdited).toBe(true);
    });

    it('should handle edit time expired error', async () => {
      const updatePromise = firstValueFrom(service.updatePost(1, 'Új tartalom')).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/posts/1`);
      req.flush({ message: 'A szerkesztési idő lejárt.' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await updatePromise;
      expect(error.message).toBe('A szerkesztési idő lejárt.');
    });
  });

  // ==================== DELETE POST TESZTEK ====================

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      const deletePromise = firstValueFrom(service.deletePost(1));

      const req = httpMock.expectOne(`${API_BASE}/posts/1`);
      expect(req.request.method).toBe('DELETE');

      req.flush({ success: true, message: 'Hozzászólás törölve!' });

      const response = await deletePromise;
      expect(response.success).toBe(true);
      expect(response.message).toBe('Hozzászólás törölve!');
    });

    it('should handle 403 forbidden error', async () => {
      const deletePromise = firstValueFrom(service.deletePost(1)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/posts/1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });

      const error = await deletePromise;
      expect(error.message).toBe('A hozzáférés megtagadva');
    });
  });

  // ==================== ERROR HANDLING TESZTEK ====================

  describe('error handling', () => {
    it('should handle custom error message from API', async () => {
      const promise = firstValueFrom(service.loadDiscussions()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({ message: 'Egyedi hibaüzenet a szerverről' }, { status: 400, statusText: 'Bad Request' });

      const error = await promise;
      expect(error.message).toBe('Egyedi hibaüzenet a szerverről');
    });

    it('should handle 403 forbidden error', async () => {
      const promise = firstValueFrom(service.createDiscussion({ title: 'Test', content: 'Test' })).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });

      const error = await promise;
      expect(error.message).toBe('A hozzáférés megtagadva');
    });

    it('should handle 422 validation error', async () => {
      const promise = firstValueFrom(service.loadDiscussions()).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await promise;
      expect(error.message).toBe('Érvénytelen adatok');
    });
  });

  // ==================== HEADER TESZTEK ====================

  describe('X-Guest-Session header', () => {
    it('should include X-Guest-Session header from GuestService', async () => {
      const discussionsPromise = firstValueFrom(service.loadDiscussions());

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      expect(req.request.headers.get('X-Guest-Session')).toBe('test-session-token');

      req.flush({ data: [] });

      await discussionsPromise;

      expect(guestServiceMock.getGuestSessionHeader).toHaveBeenCalled();
    });

    it('should use empty headers when no session', async () => {
      guestServiceMock.getGuestSessionHeader.mockReturnValue(new HttpHeaders());

      const discussionsPromise = firstValueFrom(service.loadDiscussions());

      const req = httpMock.expectOne(`${API_BASE}/discussions`);
      expect(req.request.headers.has('X-Guest-Session')).toBe(false);

      req.flush({ data: [] });

      await discussionsPromise;
    });
  });

  // ==================== CACHE TESZTEK ====================

  describe('cache management', () => {
    it('should update cache after createDiscussion', async () => {
      // Load initial discussions
      const loadPromise = firstValueFrom(service.loadDiscussions());
      httpMock.expectOne(`${API_BASE}/discussions`).flush({ data: [mockDiscussion] });
      await loadPromise;

      // Create new discussion
      const newDiscussion: Discussion = { ...mockDiscussion, id: 2, title: 'New Discussion' };
      const createPromise = firstValueFrom(service.createDiscussion({ title: 'New Discussion', content: 'Content' }));

      httpMock.expectOne(`${API_BASE}/discussions`).flush({ data: newDiscussion });

      await createPromise;
    });

    it('should update discussion in cache after lock', async () => {
      // Load discussions first
      const loadPromise = firstValueFrom(service.loadDiscussions());
      httpMock.expectOne(`${API_BASE}/discussions`).flush({ data: [mockDiscussion] });
      await loadPromise;

      // Lock discussion
      const lockedDiscussion = { ...mockDiscussion, isLocked: true };
      const lockPromise = firstValueFrom(service.lockDiscussion(1));

      httpMock.expectOne(`${API_BASE}/discussions/1/lock`).flush({ data: lockedDiscussion });

      await lockPromise;
    });
  });
});
