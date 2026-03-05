import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerEmailService } from './partner-email.service';

describe('PartnerEmailService', () => {
  let service: PartnerEmailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getEmail should GET', () => {
    service.getEmail(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/5');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('markRead should PUT', () => {
    service.markRead(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/5/read');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('markReplied should PUT', () => {
    service.markReplied(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/5/replied');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('replyToEmail should POST reply data', () => {
    service.replyToEmail(1, 5, { body: 'Reply text' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/5/reply');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getStats should GET', () => {
    service.getStats(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/stats');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('downloadAttachment should GET blob', () => {
    service.downloadAttachment(1, 5, 0).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/5/attachments/0');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('triggerSync should POST', () => {
    service.triggerSync(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/sync');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });
  });

  it('getSyncStatus should GET', () => {
    service.getSyncStatus(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/emails/sync-status');
    expect(req.request.method).toBe('GET');
    req.flush({ running: false });
  });
});
