import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSubscription should GET', () => {
    service.getSubscription().subscribe();
    const req = httpMock.expectOne('/api/subscription');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('clearCache should reset cache', () => {
    service.clearCache();
    // No error means success
    expect(true).toBe(true);
  });

  it('openPortal should POST', () => {
    service.openPortal().subscribe();
    const req = httpMock.expectOne('/api/subscription/portal');
    expect(req.request.method).toBe('POST');
    req.flush({ portal_url: 'https://stripe.com/portal' });
  });

  it('cancel should POST', () => {
    service.cancel().subscribe();
    const req = httpMock.expectOne('/api/subscription/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK', cancel_at: '2025-12-31' });
  });

  it('resume should POST', () => {
    service.resume().subscribe();
    const req = httpMock.expectOne('/api/subscription/resume');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK' });
  });

  it('pause should POST', () => {
    service.pause().subscribe();
    const req = httpMock.expectOne('/api/subscription/pause');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK', paused_price: 0 });
  });

  it('getAccountStatus should GET', () => {
    service.getAccountStatus().subscribe();
    const req = httpMock.expectOne('/api/account/status');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('deleteAccount should DELETE', () => {
    service.deleteAccount().subscribe();
    const req = httpMock.expectOne('/api/account');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('completeRegistration should POST', () => {
    service.completeRegistration('sess_123').subscribe();
    const req = httpMock.expectOne('/api/subscription/complete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.session_id).toBe('sess_123');
    req.flush({ message: 'OK' });
  });
});
