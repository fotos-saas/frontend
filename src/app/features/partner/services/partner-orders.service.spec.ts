import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { PartnerOrdersService } from './partner-orders.service';
import { PartnerOrderListService } from './partner-order-list.service';
import { PartnerOrderDetailService } from './partner-order-detail.service';

describe('PartnerOrdersService (Facade)', () => {
  let service: PartnerOrdersService;
  let listService: PartnerOrderListService;
  let detailService: PartnerOrderDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerOrdersService);
    listService = TestBed.inject(PartnerOrderListService);
    detailService = TestBed.inject(PartnerOrderDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getClients delegates to listService', () => {
    const spy = vi.spyOn(listService, 'getClients').mockReturnValue(of({} as any));
    service.getClients({ page: 1 });
    expect(spy).toHaveBeenCalledWith({ page: 1 });
  });

  it('getAlbum delegates to detailService', () => {
    const spy = vi.spyOn(detailService, 'getAlbum').mockReturnValue(of({} as any));
    service.getAlbum(5);
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('createClient delegates to listService', () => {
    const spy = vi.spyOn(listService, 'createClient').mockReturnValue(of({} as any));
    service.createClient({ name: 'Test' });
    expect(spy).toHaveBeenCalledWith({ name: 'Test' });
  });

  it('deleteAlbum delegates to detailService', () => {
    const spy = vi.spyOn(detailService, 'deleteAlbum').mockReturnValue(of({} as any));
    service.deleteAlbum(3);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('getStatusLabel delegates to listService', () => {
    const spy = vi.spyOn(listService, 'getStatusLabel').mockReturnValue('Vázlat');
    const result = service.getStatusLabel('draft' as any);
    expect(spy).toHaveBeenCalledWith('draft');
    expect(result).toBe('Vázlat');
  });
});
