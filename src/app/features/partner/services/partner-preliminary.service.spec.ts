import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerPreliminaryService } from './partner-preliminary.service';

describe('PartnerPreliminaryService', () => {
  let service: PartnerPreliminaryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerPreliminaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createProject should POST', () => {
    service.createProject({ name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/preliminary-projects');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('getLinkCandidates should GET with search', () => {
    service.getLinkCandidates('test').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/preliminary-projects/link-candidates');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ success: true, data: [] });
  });

  it('getLinkPreview should GET', () => {
    service.getLinkPreview(1, 2).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/preliminary-projects/1/link-preview');
    expect(req.request.params.get('target_project_id')).toBe('2');
    req.flush({ success: true, data: {} });
  });

  it('linkProject should POST', () => {
    service.linkProject(1, { target_project_id: 2 } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/preliminary-projects/1/link');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteProject should DELETE', () => {
    service.deleteProject(1).subscribe();
    const req = httpMock.expectOne('/api/partner/preliminary-projects/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });
});
