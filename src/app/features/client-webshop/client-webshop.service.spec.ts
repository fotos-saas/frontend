import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClientWebshopService } from './client-webshop.service';

describe('ClientWebshopService', () => {
  let service: ClientWebshopService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientWebshopService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getConfig should GET', () => {
    service.getConfig('token123').subscribe();
    const req = httpMock.expectOne('/api/shop/token123/config');
    expect(req.request.method).toBe('GET');
    req.flush({ config: {}, source_type: 'album', source_name: 'Test' });
  });

  it('getProducts should GET', () => {
    service.getProducts('token123').subscribe();
    const req = httpMock.expectOne('/api/shop/token123/products');
    expect(req.request.method).toBe('GET');
    req.flush({ products: [] });
  });

  it('getPhotos should GET', () => {
    service.getPhotos('token123').subscribe();
    const req = httpMock.expectOne('/api/shop/token123/photos');
    expect(req.request.method).toBe('GET');
    req.flush({ photos: [] });
  });

  it('createCheckout should POST', () => {
    service.createCheckout('token123', { items: [] } as any).subscribe();
    const req = httpMock.expectOne('/api/shop/token123/checkout');
    expect(req.request.method).toBe('POST');
    req.flush({ checkout_url: 'https://stripe.com', order_number: 'ORD-001' });
  });
});
