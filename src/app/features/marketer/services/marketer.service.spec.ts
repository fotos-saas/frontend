import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MarketerService } from './marketer.service';

describe('MarketerService', () => {
  let service: MarketerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MarketerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStats should GET', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne('/api/marketer/stats');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getProjects should GET with params', () => {
    service.getProjects({ search: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/marketer/projects');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getProjectDetails should GET', () => {
    service.getProjectDetails(1).subscribe();
    const req = httpMock.expectOne('/api/marketer/projects/1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getSchools should GET', () => {
    service.getSchools().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/marketer/schools');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('getCities should GET', () => {
    service.getCities().subscribe();
    const req = httpMock.expectOne('/api/marketer/schools/cities');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
