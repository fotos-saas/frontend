import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrderDataService } from './order-data.service';

describe('OrderDataService', () => {
  let service: OrderDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOrderData should GET', () => {
    service.getOrderData().subscribe();
    const req = httpMock.expectOne('/api/tablo-frontend/order-data');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
