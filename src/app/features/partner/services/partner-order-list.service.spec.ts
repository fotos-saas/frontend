import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerOrderListService } from './partner-order-list.service';

describe('PartnerOrderListService', () => {
  let service: PartnerOrderListService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerOrderListService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getClients should GET /api/partner/orders/clients', () => {
    service.getClients({ page: 1, search: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/orders/clients');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getClient should GET single client', () => {
    service.getClient(5).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/clients/5');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5, name: 'Test' });
  });

  it('createClient should POST', () => {
    service.createClient({ name: 'Test' }).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/clients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Test');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('updateClient should PUT', () => {
    service.updateClient(5, { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/clients/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteClient should DELETE', () => {
    service.deleteClient(5).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/clients/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('generateCode should POST', () => {
    service.generateCode(5).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/clients/5/generate-code');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: { accessCode: 'ABC', accessCodeEnabled: true, accessCodeExpiresAt: null } });
  });

  it('getAlbums should GET with filters', () => {
    service.getAlbums({ status: 'draft' as any, type: 'selection' as any }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/orders/albums');
    expect(req.request.params.get('status')).toBe('draft');
    expect(req.request.params.get('type')).toBe('selection');
    req.flush({ data: [], meta: {} });
  });

  it('createAlbum should POST', () => {
    service.createAlbum({ client_id: 1, name: 'Album', type: 'selection' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/orders/albums');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('getStatusColor should return valid classes', () => {
    expect(service.getStatusColor('draft' as any)).toContain('bg-gray');
    expect(service.getStatusColor('completed' as any)).toContain('bg-green');
  });

  it('getTypeLabel should return Hungarian labels', () => {
    expect(service.getTypeLabel('selection' as any)).toBe('Képválasztás');
    expect(service.getTypeLabel('tablo' as any)).toBe('Tablókép');
  });
});
