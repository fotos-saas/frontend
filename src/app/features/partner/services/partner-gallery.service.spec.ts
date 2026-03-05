import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerGalleryService } from './partner-gallery.service';

describe('PartnerGalleryService', () => {
  let service: PartnerGalleryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerGalleryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getGallery should GET', () => {
    service.getGallery(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createGallery should POST', () => {
    service.createGallery(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('uploadGalleryPhotos should POST FormData', () => {
    const file = new File(['x'], 'test.jpg');
    service.uploadGalleryPhotos(1, [file]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/photos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, message: 'OK', uploadedCount: 1, photos: [] });
  });

  it('deleteGalleryPhoto should DELETE single photo', () => {
    service.deleteGalleryPhoto(1, 10).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/photos/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('deleteGalleryPhotos should DELETE multiple', () => {
    service.deleteGalleryPhotos(1, [10, 11]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/photos');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body.photo_ids).toEqual([10, 11]);
    req.flush({ success: true, message: 'OK', deletedCount: 2 });
  });

  it('setGalleryDeadline should POST deadline', () => {
    service.setGalleryDeadline(1, '2025-12-31').subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/deadline');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.deadline).toBe('2025-12-31');
    req.flush({ success: true, message: 'OK', data: { deadline: '2025-12-31' } });
  });

  it('getGalleryProgress should GET', () => {
    service.getGalleryProgress(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/progress');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getMonitoring should GET', () => {
    service.getMonitoring(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/monitoring');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getPersonSelections should GET', () => {
    service.getPersonSelections(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/monitoring/person/5/selections');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('downloadGalleryZip should POST blob', () => {
    service.downloadGalleryZip(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/download-zip');
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('exportMonitoringExcel should POST blob', () => {
    service.exportMonitoringExcel(1, 'all').subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/gallery/monitoring/export-excel');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.filter).toBe('all');
    req.flush(new Blob());
  });
});
