import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PrepaymentPublicService } from './prepayment-public.service';

describe('PrepaymentPublicService', () => {
  let service: PrepaymentPublicService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PrepaymentPublicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPrepayment should GET by token', () => {
    service.getPrepayment('abc123').subscribe();
    const req = httpMock.expectOne('/api/prepayment/abc123');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('createCheckout should POST', () => {
    service.createCheckout('abc123', {} as any).subscribe();
    const req = httpMock.expectOne('/api/prepayment/abc123/checkout');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getSuccess should GET', () => {
    service.getSuccess('abc123').subscribe();
    const req = httpMock.expectOne('/api/prepayment/abc123/success');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });
});
