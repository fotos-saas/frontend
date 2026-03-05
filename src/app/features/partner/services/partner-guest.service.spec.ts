import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerGuestService } from './partner-guest.service';

describe('PartnerGuestService', () => {
  let service: PartnerGuestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerGuestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProjectGuestSessions should GET with params', () => {
    service.getProjectGuestSessions(1, { search: 'test', page: 2 }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects/1/guest-sessions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('updateGuestSession should PUT', () => {
    service.updateGuestSession(1, 5, { guest_name: 'Test' }).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/guest-sessions/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteGuestSession should DELETE', () => {
    service.deleteGuestSession(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/guest-sessions/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('toggleBanGuestSession should PATCH', () => {
    service.toggleBanGuestSession(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/guest-sessions/5/ban');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, message: 'OK', isBanned: true });
  });

  it('getSamplePackages should GET', () => {
    service.getSamplePackages(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/sample-packages');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('createSamplePackage should POST', () => {
    service.createSamplePackage(1, 'My Package').subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/sample-packages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('My Package');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteSamplePackage should DELETE', () => {
    service.deleteSamplePackage(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/sample-packages/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('deleteSampleVersion should DELETE', () => {
    service.deleteSampleVersion(1, 5, 10).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/sample-packages/5/versions/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });
});
