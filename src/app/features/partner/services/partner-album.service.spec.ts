import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerAlbumService } from './partner-album.service';

describe('PartnerAlbumService', () => {
  let service: PartnerAlbumService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerAlbumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAlbums should GET', () => {
    service.getAlbums(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/albums');
    expect(req.request.method).toBe('GET');
    req.flush({ albums: {} });
  });

  it('getAlbum should GET specific album type', () => {
    service.getAlbum(1, 'students' as any).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/albums/students');
    expect(req.request.method).toBe('GET');
    req.flush({ album: {} });
  });

  it('clearAlbum should DELETE', () => {
    service.clearAlbum(1, 'students' as any).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/albums/students');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('uploadToAlbum should POST FormData', () => {
    const file = new File(['x'], 'test.jpg');
    service.uploadToAlbum(1, 'students' as any, [file]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/albums/students/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, uploadedCount: 1, photos: [] });
  });

  it('getPendingPhotos should GET', () => {
    service.getPendingPhotos(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/photos/pending');
    expect(req.request.method).toBe('GET');
    req.flush({ photos: [] });
  });

  it('downloadPendingZip should GET blob', () => {
    service.downloadPendingZip(1).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects/1/photos/pending/download-zip');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('deletePendingPhotos should DELETE with mediaIds', () => {
    service.deletePendingPhotos(1, [10, 11]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/photos/pending/delete');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK' });
  });

  it('matchPhotos should POST', () => {
    service.matchPhotos(1, [10, 11]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/photos/match');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, matched: 2 });
  });
});
