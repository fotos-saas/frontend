import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AddonService } from './addon.service';

describe('AddonService', () => {
  let service: AddonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AddonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAddons should GET /api/addons', () => {
    const mockResponse = { addons: [], plan: 'basic', billing_cycle: 'monthly' as const };
    service.getAddons().subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/addons');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('getActiveAddons should GET /api/addons/active', () => {
    const mockResponse = { addons: [] };
    service.getActiveAddons().subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/addons/active');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('subscribe should POST /api/addons/:key/subscribe', () => {
    const mockResponse = { message: 'OK', subscription_item_id: 'si_123' };
    service.subscribe('community_pack').subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/addons/community_pack/subscribe');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('cancel should DELETE /api/addons/:key', () => {
    const mockResponse = { message: 'Cancelled' };
    service.cancel('community_pack').subscribe(res => expect(res).toEqual(mockResponse));
    const req = httpMock.expectOne('/api/addons/community_pack');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('getFeatureIcon should return correct icons', () => {
    expect(service.getFeatureIcon('forum')).toBe('message-circle');
    expect(service.getFeatureIcon('unknown')).toBe('check');
  });

  it('getFeatureName should return correct Hungarian names', () => {
    expect(service.getFeatureName('forum')).toBe('Fórum');
    expect(service.getFeatureName('unknown')).toBe('unknown');
  });
});
