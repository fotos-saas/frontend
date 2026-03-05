import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerProfileService } from './partner-profile.service';

describe('PartnerProfileService', () => {
  let service: PartnerProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProfile should GET', () => {
    service.getProfile().subscribe();
    const req = httpMock.expectOne('/api/profile');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateProfile should PUT', () => {
    service.updateProfile({ name: 'New Name' } as any).subscribe();
    const req = httpMock.expectOne('/api/profile');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('changePassword should POST', () => {
    service.changePassword({ current_password: 'old', new_password: 'new', new_password_confirmation: 'new' } as any).subscribe();
    const req = httpMock.expectOne('/api/auth/change-password');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK' });
  });
});
