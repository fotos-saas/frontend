import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerQrService } from './partner-qr.service';

describe('PartnerQrService', () => {
  let service: PartnerQrService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerQrService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProjectQrCodes should GET', () => {
    service.getProjectQrCodes(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/qr-codes');
    expect(req.request.method).toBe('GET');
    req.flush({ qrCodes: [] });
  });

  it('deactivateQrCode should DELETE', () => {
    service.deactivateQrCode(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/qr-codes/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('pinQrCode should POST', () => {
    service.pinQrCode(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/qr-codes/5/pin');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK' });
  });
});
