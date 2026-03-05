import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NewsfeedPostCrudService } from './newsfeed-post-crud.service';
import { GuestService } from './guest.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('NewsfeedPostCrudService', () => {
  let service: NewsfeedPostCrudService;
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
    service = TestBed.inject(NewsfeedPostCrudService);
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
      const request = { postType: 'announcement' as const, title: 'Test' };
      const promise = firstValueFrom(service.createPost(request));
      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/newsfeed'));
      expect(req.request.body.post_type).toBe('announcement');
      req.flush({ success: true, data: { id: 1, post_type: 'announcement', title: 'Test' } });

      const result = await promise;
      expect(result.id).toBe(1);
    });

    it('FormData-val küld ha van média', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const request = { postType: 'event' as const, title: 'Event' };

      service.createPost(request, [file]).subscribe();

      const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/newsfeed'));
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true, data: { id: 2, post_type: 'event', title: 'Event' } });
    });
  });

  describe('updatePost', () => {
    it('PUT kérést küld ha nincs média', () => {
      service.updatePost(1, { title: 'Updated' }).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1'));
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { id: 1, title: 'Updated' } });
    });

    it('FormData POST-ot küld ha van média', () => {
      const file = new File([''], 'img.jpg', { type: 'image/jpeg' });
      service.updatePost(1, { title: 'Updated' }, [file]).subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true, data: { id: 1 } });
    });
  });

  describe('deleteMedia', () => {
    it('DELETE kérést küld', () => {
      service.deleteMedia(5).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/media/5'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('deletePost', () => {
    it('DELETE kérést küld', () => {
      service.deletePost(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/newsfeed/1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });
});
