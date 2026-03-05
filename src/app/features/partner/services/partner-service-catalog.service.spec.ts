import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerServiceCatalogService } from './partner-service-catalog.service';

describe('PartnerServiceCatalogService', () => {
  let service: PartnerServiceCatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerServiceCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(service.services()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('loadServices should GET and update signals', () => {
    service.loadServices();
    expect(service.loading()).toBe(true);
    const req = httpMock.expectOne('/api/partner/services');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { services: [{ id: 1, name: 'Test' }] } });
    expect(service.loading()).toBe(false);
    expect(service.services().length).toBe(1);
  });

  it('createService should POST and reload', () => {
    service.createService({ name: 'New Service' } as any);
    const req = httpMock.expectOne('/api/partner/services');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
    // After create, it reloads
    httpMock.match(r => r.url === '/api/partner/services' && r.method === 'GET');
  });

  it('deleteService should DELETE and reload', () => {
    service.deleteService(5);
    const req = httpMock.expectOne('/api/partner/services/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    httpMock.match(r => r.url === '/api/partner/services' && r.method === 'GET');
  });
});
