import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerOrderSyncService } from './partner-order-sync.service';

describe('PartnerOrderSyncService', () => {
  let service: PartnerOrderSyncService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerOrderSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOrderSyncStatus should GET project sync status', () => {
    service.getOrderSyncStatus(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/order-sync');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('reparseNames should POST to reparse', () => {
    service.reparseNames(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/order-sync/reparse');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: {}, message: 'OK' });
  });

  it('updateRoster should PUT roster data', () => {
    const payload = { students: [] } as any;
    service.updateRoster(1, payload).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/order-sync/roster');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK' });
  });

  it('checkSync should GET pending count', () => {
    service.checkSync().subscribe();
    const req = httpMock.expectOne('/api/partner/order-sync/check');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { pending_count: 3 } });
  });

  it('triggerSync should POST to trigger', () => {
    service.triggerSync().subscribe();
    const req = httpMock.expectOne('/api/partner/order-sync/trigger');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { created: 1, processed: 1, failed: 0, errors: [] } });
  });
});
