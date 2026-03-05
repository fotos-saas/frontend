import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerBookingService } from './partner-booking.service';

describe('PartnerBookingService', () => {
  let service: PartnerBookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerBookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSessionTypes should GET', () => {
    service.getSessionTypes().subscribe();
    const req = httpMock.expectOne('/api/booking/session-types');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('createSessionType should POST', () => {
    service.createSessionType({ name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/booking/session-types');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('deleteSessionType should DELETE', () => {
    service.deleteSessionType(5).subscribe();
    const req = httpMock.expectOne('/api/booking/session-types/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getAvailability should GET', () => {
    service.getAvailability().subscribe();
    const req = httpMock.expectOne('/api/booking/availability');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('getBookings should GET', () => {
    service.getBookings().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/booking/bookings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('confirmBooking should POST', () => {
    service.confirmBooking(5).subscribe();
    const req = httpMock.expectOne('/api/booking/bookings/5/confirm');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('cancelBooking should POST with reason', () => {
    service.cancelBooking(5, 'no show').subscribe();
    const req = httpMock.expectOne('/api/booking/bookings/5/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('getCalendar should GET with params', () => {
    service.getCalendar('2025-01-01', '2025-01-31', 'month' as any).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/booking/calendar');
    expect(req.request.params.get('start_date')).toBe('2025-01-01');
    req.flush({ data: {} });
  });

  it('downloadBatchTemplate should GET blob', () => {
    service.downloadBatchTemplate().subscribe();
    const req = httpMock.expectOne('/api/booking/batch-import/template');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('getPageSettings should GET', () => {
    service.getPageSettings().subscribe();
    const req = httpMock.expectOne('/api/booking/page-settings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });
});
