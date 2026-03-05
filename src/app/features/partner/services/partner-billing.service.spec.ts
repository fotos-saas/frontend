import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerBillingService } from './partner-billing.service';

describe('PartnerBillingService', () => {
  let service: PartnerBillingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerBillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(service.charges()).toEqual([]);
    expect(service.summary()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.activeFilter()).toBe('all');
  });

  it('loadCharges should GET and update signals', () => {
    service.loadCharges();
    expect(service.loading()).toBe(true);
    const req = httpMock.expectOne(r => r.url === '/api/partner/billing');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 } });
    expect(service.loading()).toBe(false);
  });

  it('loadSummary should GET summary data', () => {
    service.loadSummary();
    const req = httpMock.expectOne('/api/partner/billing/summary');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { total: 100, paid: 80 } });
  });

  it('cancelCharge should POST and reload', () => {
    service.cancelCharge(5);
    const req = httpMock.expectOne('/api/partner/billing/5/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK' });
    // After cancel, it reloads charges
    httpMock.match(r => r.url === '/api/partner/billing');
  });

  it('filteredCharges should filter by activeFilter', () => {
    service.charges.set([
      { id: 1, status: 'paid' } as any,
      { id: 2, status: 'pending' } as any,
    ]);
    service.activeFilter.set('paid');
    expect(service.filteredCharges().length).toBe(1);
    expect(service.filteredCharges()[0].id).toBe(1);
  });

  it('filteredCharges should return all when filter is all', () => {
    service.charges.set([
      { id: 1, status: 'paid' } as any,
      { id: 2, status: 'pending' } as any,
    ]);
    service.activeFilter.set('all');
    expect(service.filteredCharges().length).toBe(2);
  });
});
