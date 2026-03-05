import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerWebshopService } from './partner-webshop.service';

describe('PartnerWebshopService', () => {
  let service: PartnerWebshopService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerWebshopService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSettings should GET', () => {
    service.getSettings().subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/settings');
    expect(req.request.method).toBe('GET');
    req.flush({ settings: null });
  });

  it('updateSettings should PUT', () => {
    service.updateSettings({ is_enabled: true } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/settings');
    expect(req.request.method).toBe('PUT');
    req.flush({ settings: {}, message: 'OK' });
  });

  it('initializeWebshop should POST', () => {
    service.initializeWebshop().subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/initialize');
    expect(req.request.method).toBe('POST');
    req.flush({ settings: {}, message: 'OK' });
  });

  it('getPaperSizes should GET', () => {
    service.getPaperSizes().subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/paper-sizes');
    expect(req.request.method).toBe('GET');
    req.flush({ paper_sizes: [] });
  });

  it('createPaperSize should POST', () => {
    service.createPaperSize({ name: '10x15' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/paper-sizes');
    expect(req.request.method).toBe('POST');
    req.flush({ paper_size: {} });
  });

  it('deletePaperSize should DELETE', () => {
    service.deletePaperSize(5).subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/paper-sizes/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'OK' });
  });

  it('getProducts should GET', () => {
    service.getProducts().subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/products');
    expect(req.request.method).toBe('GET');
    req.flush({ products: [], paper_sizes: [], paper_types: [] });
  });

  it('getOrders should GET', () => {
    service.getOrders().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/webshop/orders');
    expect(req.request.method).toBe('GET');
    req.flush({ orders: [], total: 0 });
  });

  it('getWebshopStatus should GET', () => {
    service.getWebshopStatus().subscribe();
    const req = httpMock.expectOne('/api/partner/webshop/status');
    expect(req.request.method).toBe('GET');
    req.flush({ is_enabled: false, is_initialized: false });
  });
});
