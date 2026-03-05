import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerPrepaymentService } from './partner-prepayment.service';

describe('PartnerPrepaymentService', () => {
  let service: PartnerPrepaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerPrepaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getConfigs should GET', () => {
    service.getConfigs().subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/configs');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getConfig should GET by id', () => {
    service.getConfig(5).subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/configs/5');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('createConfig should POST', () => {
    service.createConfig({ name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/configs');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('deleteConfig should DELETE', () => {
    service.deleteConfig(5).subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/configs/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getPrepayments should GET', () => {
    service.getPrepayments().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/prepayment');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('markPaid should POST', () => {
    service.markPaid(5, { payment_method: 'cash' }).subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/5/mark-paid');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('cancelPrepayment should POST', () => {
    service.cancelPrepayment(5).subscribe();
    const req = httpMock.expectOne('/api/partner/prepayment/5/cancel');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('getStats should GET', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/prepayment/stats');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });
});
