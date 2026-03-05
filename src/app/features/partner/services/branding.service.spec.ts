import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { BrandingService } from './branding.service';

describe('BrandingService', () => {
  let service: BrandingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BrandingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.brandName()).toBeNull();
    expect(service.logoUrl()).toBeNull();
    expect(service.faviconUrl()).toBeNull();
    expect(service.hideBrandName()).toBe(false);
  });

  it('updateState should set signals from branding data', () => {
    service.updateState({
      brand_name: 'Test Brand',
      is_active: true,
      hide_brand_name: true,
      logo_url: '/logo.png',
      favicon_url: '/favicon.png',
      og_image_url: null,
    });
    expect(service.brandName()).toBe('Test Brand');
    expect(service.logoUrl()).toBe('/logo.png');
    expect(service.hideBrandName()).toBe(true);
  });

  it('updateState should handle null branding', () => {
    service.updateState(null);
    expect(service.brandName()).toBeNull();
    expect(service.logoUrl()).toBeNull();
  });

  it('getBranding should GET (no cache)', () => {
    service.getBranding().subscribe();
    const req = httpMock.expectOne('/api/partner/branding');
    expect(req.request.method).toBe('GET');
    req.flush({ branding: null });
  });

  it('getBranding should use cache on second call', () => {
    service.getBranding().subscribe();
    const req = httpMock.expectOne('/api/partner/branding');
    req.flush({ branding: null });

    // Second call should not make HTTP request
    service.getBranding().subscribe(res => {
      expect(res.branding).toBeNull();
    });
    httpMock.expectNone('/api/partner/branding');
  });

  it('clearCache should reset cache', () => {
    service.getBranding().subscribe();
    httpMock.expectOne('/api/partner/branding').flush({ branding: null });

    service.clearCache();

    service.getBranding().subscribe();
    const req = httpMock.expectOne('/api/partner/branding');
    req.flush({ branding: null });
  });

  it('saveBranding should POST FormData', () => {
    service.saveBranding({
      brand_name: 'Test',
      is_active: true,
      hide_brand_name: false,
    }).subscribe();
    const req = httpMock.expectOne('/api/partner/branding');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ message: 'OK', branding: {} });
  });
});
