import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PublicBookingService } from './public-booking.service';

describe('PublicBookingService', () => {
  let service: PublicBookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicBookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPartner should GET by slug', () => {
    service.getPartner('my-studio').subscribe();
    const req = httpMock.expectOne('/api/public/booking/my-studio');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { partner: {}, session_types: [] } });
  });

  it('getAvailableDates should GET with params', () => {
    service.getAvailableDates('my-studio', 1, '2025-01').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/public/booking/my-studio/available-dates');
    expect(req.request.params.get('session_type_id')).toBe('1');
    req.flush({ data: [] });
  });

  it('getAvailableSlots should GET with params', () => {
    service.getAvailableSlots('my-studio', 1, '2025-01-15').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/public/booking/my-studio/available-slots');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });
});
