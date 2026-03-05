import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerEmailTemplateService } from './partner-email-template.service';

describe('PartnerEmailTemplateService', () => {
  let service: PartnerEmailTemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerEmailTemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTemplates should GET', () => {
    service.getTemplates().subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getTemplate should GET by name', () => {
    service.getTemplate('welcome').subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates/welcome');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('getVariables should GET', () => {
    service.getVariables().subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates/variables');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('updateTemplate should PUT', () => {
    service.updateTemplate('welcome', { subject: 'Test', body: 'Body' }).subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates/welcome');
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('resetToDefault should DELETE /name/reset', () => {
    service.resetToDefault('welcome').subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates/welcome/reset');
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null });
  });

  it('preview should POST', () => {
    service.preview('welcome', { subject: 'Test', body: 'Body' }).subscribe();
    const req = httpMock.expectOne('/api/partner/email-templates/welcome/preview');
    expect(req.request.method).toBe('POST');
    req.flush({ data: { html: '<p>test</p>' } });
  });
});
