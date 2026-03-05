import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.charges()).toEqual([]);
    expect(service.summary()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.activeFilter()).toBe('all');
  });

  it('loadCharges should GET and update signals', () => {
    service.loadCharges();
    expect(service.loading()).toBe(true);
    const req = httpMock.expectOne('/api/tablo-frontend/billing');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { charges: [] } });
    expect(service.loading()).toBe(false);
    expect(service.charges()).toEqual([]);
  });

  it('loadCharges should set error on failure', () => {
    service.loadCharges();
    const req = httpMock.expectOne('/api/tablo-frontend/billing');
    req.error(new ProgressEvent('error'));
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('loadSummary should GET summary', () => {
    service.loadSummary();
    const req = httpMock.expectOne('/api/tablo-frontend/billing/summary');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { summary: { total_amount: 100, paid_amount: 80, pending_amount: 20, charges_count: 5 } } });
    expect(service.summary()).toEqual({ totalAmount: 100, paidAmount: 80, pendingAmount: 20, chargesCount: 5 });
  });

  it('filteredCharges should filter by activeFilter', () => {
    service.charges.set([
      { id: 1, status: 'paid' } as any,
      { id: 2, status: 'pending' } as any,
    ]);
    service.activeFilter.set('paid');
    expect(service.filteredCharges().length).toBe(1);
  });

  it('filteredCharges should return all when filter is all', () => {
    service.charges.set([{ id: 1 } as any, { id: 2 } as any]);
    service.activeFilter.set('all');
    expect(service.filteredCharges().length).toBe(2);
  });

  it('startPayment should POST to checkout', () => {
    service.startPayment(5);
    expect(service.paymentLoadingId()).toBe(5);
    const req = httpMock.expectOne('/api/tablo-frontend/billing/5/checkout');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { checkout_url: 'https://stripe.com/checkout' } });
    expect(service.paymentLoadingId()).toBeNull();
  });
});
