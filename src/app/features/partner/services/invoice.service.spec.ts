import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InvoiceService } from './invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getInvoices should GET with params', () => {
    service.getInvoices({ page: 1, status: 'paid' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/invoices');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('status')).toBe('paid');
    req.flush({ success: true, data: { items: [], pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 } } });
  });

  it('createInvoice should POST', () => {
    const payload = { client_id: 1, items: [] } as any;
    service.createInvoice(payload).subscribe();
    const req = httpMock.expectOne('/api/partner/invoices');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('syncInvoice should POST to /:id/sync', () => {
    service.syncInvoice(5).subscribe();
    const req = httpMock.expectOne('/api/partner/invoices/5/sync');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('cancelInvoice should POST to /:id/cancel', () => {
    service.cancelInvoice(5).subscribe();
    const req = httpMock.expectOne('/api/partner/invoices/5/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('downloadPdf should GET blob', () => {
    service.downloadPdf(5).subscribe();
    const req = httpMock.expectOne('/api/partner/invoices/5/pdf');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('getStatistics should GET and map data', () => {
    const stats = { total: 10, paid: 8 };
    service.getStatistics(2024).subscribe(res => expect(res).toEqual(stats));
    const req = httpMock.expectOne(r => r.url === '/api/partner/invoices/statistics');
    expect(req.request.params.get('year')).toBe('2024');
    req.flush({ success: true, data: stats });
  });
});
