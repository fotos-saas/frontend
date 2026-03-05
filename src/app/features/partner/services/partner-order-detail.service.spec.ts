import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerOrderDetailService } from './partner-order-detail.service';

describe('PartnerOrderDetailService', () => {
  let service: PartnerOrderDetailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerOrderDetailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAlbum should GET album details', () => {
    service.getAlbum(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1 });
  });

  it('updateAlbum should PUT', () => {
    service.updateAlbum(1, { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteAlbum should DELETE', () => {
    service.deleteAlbum(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('activateAlbum should POST to /activate', () => {
    service.activateAlbum(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/activate');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { id: 1, status: 'claiming' } });
  });

  it('deactivateAlbum should POST to /deactivate', () => {
    service.deactivateAlbum(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/deactivate');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { id: 1, status: 'draft' } });
  });

  it('reopenAlbum should POST to /reopen', () => {
    service.reopenAlbum(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/reopen');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { id: 1, status: 'claiming' } });
  });

  it('toggleAlbumDownload should POST', () => {
    service.toggleAlbumDownload(1).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/toggle-download');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { id: 1, allowDownload: true } });
  });

  it('deletePhoto should DELETE photo', () => {
    service.deletePhoto(1, 10).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/photos/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('downloadSelectedZip should POST with photo_ids', () => {
    service.downloadSelectedZip(1, [1, 2, 3]).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/download-zip');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.photo_ids).toEqual([1, 2, 3]);
    req.flush(new Blob());
  });

  it('exportExcel should POST with photo_ids', () => {
    service.exportExcel(1, [1, 2]).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums/1/export-excel');
    expect(req.request.method).toBe('POST');
    req.flush(new Blob());
  });
});
