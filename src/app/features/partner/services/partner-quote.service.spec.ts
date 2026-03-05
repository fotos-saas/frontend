import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerQuoteService } from './partner-quote.service';

describe('PartnerQuoteService', () => {
  let service: PartnerQuoteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerQuoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getQuotes should GET with params', () => {
    service.getQuotes({ search: 'test', status: 'draft' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/quotes');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getQuote should GET by id', () => {
    service.getQuote(5).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('createQuote should POST', () => {
    service.createQuote({ title: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('updateQuote should PUT', () => {
    service.updateQuote(5, { title: 'Updated' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('deleteQuote should DELETE', () => {
    service.deleteQuote(5).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('duplicateQuote should POST', () => {
    service.duplicateQuote(5).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5/duplicate');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('updateStatus should PATCH', () => {
    service.updateStatus(5, 'sent').subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5/status');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('downloadPdf should GET blob', () => {
    service.downloadPdf(5).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5/pdf');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('sendEmail should POST', () => {
    service.sendEmail(5, { to_email: 'test@test.com', subject: 'Hi', body: 'Body' }).subscribe();
    const req = httpMock.expectOne('/api/partner/quotes/5/send-email');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('getPdfPreviewUrl should return URL string', () => {
    const url = service.getPdfPreviewUrl(5);
    expect(url).toContain('/api/partner/quotes/5/pdf/preview');
  });
});
