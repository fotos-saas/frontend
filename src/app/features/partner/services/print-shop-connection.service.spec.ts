import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  PrintShopConnectionService,
  PrintShopConnection,
  AvailablePrintShopResponse,
  ConnectionResponse,
} from './print-shop-connection.service';

describe('PrintShopConnectionService', () => {
  let service: PrintShopConnectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PrintShopConnectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getConnections
  // ============================================================================
  describe('getConnections', () => {
    it('should GET /partner/print-shop-connections', () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            printShop: { id: 10, name: 'TestNyomda', email: 'nyomda@test.hu', phone: null },
            status: 'active' as const,
            statusName: 'Aktív',
            initiatedBy: 'photo_studio' as const,
            createdAt: '2026-01-01',
          },
        ],
        message: 'OK',
      };

      service.getConnections().subscribe(result => {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].printShop.name).toBe('TestNyomda');
        expect(result.message).toBe('OK');
      });

      const req = httpMock.expectOne('/api/partner/print-shop-connections');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // searchAvailablePrintShops
  // ============================================================================
  describe('searchAvailablePrintShops', () => {
    it('should GET /partner/available-print-shops with page param', () => {
      const mockResponse: AvailablePrintShopResponse = {
        data: [{ id: 1, name: 'Nyomda Kft.' }],
        current_page: 1,
        last_page: 1,
        total: 1,
      };

      service.searchAvailablePrintShops('', 1).subscribe(result => {
        expect(result.data).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === '/api/partner/available-print-shops' && r.params.get('page') === '1'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(mockResponse);
    });

    it('should include search param when provided', () => {
      service.searchAvailablePrintShops('Nyomda', 2).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/partner/available-print-shops' &&
        r.params.get('search') === 'Nyomda' &&
        r.params.get('page') === '2'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 2, last_page: 2, total: 0 });
    });

    it('should trim search string and ignore whitespace-only', () => {
      service.searchAvailablePrintShops('   ', 1).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/partner/available-print-shops' && !r.params.has('search')
      );
      req.flush({ data: [], current_page: 1, last_page: 1, total: 0 });
    });

    it('should trim search string with valid content', () => {
      service.searchAvailablePrintShops('  Teszt  ', 1).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/partner/available-print-shops' && r.params.get('search') === 'Teszt'
      );
      req.flush({ data: [], current_page: 1, last_page: 1, total: 0 });
    });

    it('should default to page 1 if not specified', () => {
      service.searchAvailablePrintShops('test').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/partner/available-print-shops' && r.params.get('page') === '1'
      );
      req.flush({ data: [], current_page: 1, last_page: 1, total: 0 });
    });
  });

  // ============================================================================
  // sendConnectionRequest
  // ============================================================================
  describe('sendConnectionRequest', () => {
    it('should POST /partner/print-shop-connections with print_shop_id', () => {
      const mockResponse = {
        data: { id: 99, status: 'pending' } as ConnectionResponse,
        message: 'Kérelem elküldve',
      };

      service.sendConnectionRequest(42).subscribe(result => {
        expect(result.data.id).toBe(99);
        expect(result.data.status).toBe('pending');
        expect(result.message).toBe('Kérelem elküldve');
      });

      const req = httpMock.expectOne('/api/partner/print-shop-connections');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ print_shop_id: 42 });
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // removeConnection
  // ============================================================================
  describe('removeConnection', () => {
    it('should DELETE /partner/print-shop-connections/:id', () => {
      service.removeConnection(7).subscribe(result => {
        expect(result.message).toBe('Törölve');
      });

      const req = httpMock.expectOne('/api/partner/print-shop-connections/7');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Törölve' });
    });
  });
});
