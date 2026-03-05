import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUsage should GET', () => {
    service.getUsage().subscribe();
    const req = httpMock.expectOne('/api/storage/usage');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('setAddon should POST with gb', () => {
    service.setAddon(50).subscribe();
    const req = httpMock.expectOne('/api/storage/addon');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.gb).toBe(50);
    req.flush({});
  });

  it('removeAddon should DELETE', () => {
    service.removeAddon().subscribe();
    const req = httpMock.expectOne('/api/storage/addon');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
