import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ClientAuthService } from './client-auth.service';

describe('ClientAuthService', () => {
  let service: ClientAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(ClientAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getToken should return null when no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getHeaders should return HttpHeaders', () => {
    const headers = service.getHeaders();
    expect(headers).toBeTruthy();
  });

  it('getClientInfo should return null when no info', () => {
    expect(service.getClientInfo()).toBeNull();
  });

  it('getProfile should GET with auth headers', () => {
    service.getProfile().subscribe();
    const req = httpMock.expectOne('/api/client/profile');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('register should POST', () => {
    service.register('test@test.com', 'pass123', 'pass123').subscribe();
    const req = httpMock.expectOne('/api/client/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('test@test.com');
    req.flush({
      token: 'tok123',
      client: { id: 1, name: 'Test', email: 'test@test.com', phone: null, wantsNotifications: false },
      user: { isRegistered: true },
      albums: [],
      branding: null,
    });
  });

  it('loginWithPassword should POST', () => {
    service.loginWithPassword('test@test.com', 'pass123').subscribe();
    const req = httpMock.expectOne('/api/client/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'tok456',
      client: { id: 1, name: 'Test', email: 'test@test.com', phone: null, wantsNotifications: false },
      user: { isRegistered: true },
      albums: [],
      branding: null,
    });
  });
});
