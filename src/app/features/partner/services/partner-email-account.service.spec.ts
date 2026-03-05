import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerEmailAccountService } from './partner-email-account.service';

describe('PartnerEmailAccountService', () => {
  let service: PartnerEmailAccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerEmailAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getEmailAccount should GET and map data', () => {
    service.getEmailAccount().subscribe();
    const req = httpMock.expectOne('/api/partner/settings/email-account');
    expect(req.request.method).toBe('GET');
    req.flush({ data: null });
  });

  it('saveEmailAccount should PUT', () => {
    service.saveEmailAccount({ host: 'smtp.test.com' }).subscribe();
    const req = httpMock.expectOne('/api/partner/settings/email-account');
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('deleteEmailAccount should DELETE', () => {
    service.deleteEmailAccount().subscribe();
    const req = httpMock.expectOne('/api/partner/settings/email-account');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('testEmailAccount should POST to /test', () => {
    service.testEmailAccount({ host: 'smtp.test.com' }).subscribe();
    const req = httpMock.expectOne('/api/partner/settings/email-account/test');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
});
