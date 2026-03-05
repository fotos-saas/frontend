import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InvoiceSettingsService } from './invoice-settings.service';

describe('InvoiceSettingsService', () => {
  let service: InvoiceSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvoiceSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSettings should GET and map response data', () => {
    const mockSettings = { provider: 'szamlazz', api_key_set: true };
    service.getSettings().subscribe(res => expect(res).toEqual(mockSettings));
    const req = httpMock.expectOne('/api/partner/invoice-settings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockSettings });
  });

  it('updateSettings should PUT settings', () => {
    const mockResponse = { success: true, message: 'OK' };
    service.updateSettings({ invoice_api_key: 'key123' }).subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/partner/invoice-settings');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ invoice_api_key: 'key123' });
    req.flush(mockResponse);
  });

  it('validateApiKey should POST to /validate', () => {
    const mockResponse = { success: true, message: 'Valid' };
    service.validateApiKey().subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/partner/invoice-settings/validate');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
