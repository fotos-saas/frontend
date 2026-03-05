import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GalleryService } from './gallery.service';
import { firstValueFrom } from 'rxjs';

describe('GalleryService', () => {
  let service: GalleryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GalleryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGalleryPhotos', () => {
    it('fotókat betölti és signal-ba menti', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, url: '/img/1.jpg', thumbUrl: '/thumb/1.jpg', previewUrl: '/preview/1.jpg', fileName: 'photo.jpg', size: '2MB', createdAt: '2024-01-01' }],
        gallery: { id: 1, name: 'Galéria', photosCount: 1 },
      };

      const promise = firstValueFrom(service.getGalleryPhotos());
      const req = httpMock.expectOne((r) => r.url.includes('/gallery-photos'));
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(service.photos().length).toBe(1);
      expect(service.galleryInfo()?.name).toBe('Galéria');
      expect(service.isLoading()).toBe(false);
    });

    it('success=false esetén ürít', async () => {
      const promise = firstValueFrom(service.getGalleryPhotos());
      const req = httpMock.expectOne((r) => r.url.includes('/gallery-photos'));
      req.flush({ success: false, message: 'Nincs galéria', data: [], gallery: null });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(service.photos().length).toBe(0);
      expect(service.galleryInfo()).toBeNull();
    });

    it('HTTP hiba esetén fallback választ ad', async () => {
      const promise = firstValueFrom(service.getGalleryPhotos());
      const req = httpMock.expectOne((r) => r.url.includes('/gallery-photos'));
      req.error(new ProgressEvent('error'));

      const result = await promise;
      expect(result.success).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('reset', () => {
    it('állapotot visszaállítja', () => {
      service.reset();
      expect(service.photos()).toEqual([]);
      expect(service.galleryInfo()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });
});
