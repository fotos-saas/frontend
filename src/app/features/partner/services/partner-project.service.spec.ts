import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerProjectService } from './partner-project.service';

describe('PartnerProjectService', () => {
  let service: PartnerProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStats should GET', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne('/api/partner/stats');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getProjects should GET with params', () => {
    service.getProjects({ search: 'test', page: 2 }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getProjectDetails should GET', () => {
    service.getProjectDetails(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createProject should POST', () => {
    service.createProject({ school_name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/projects');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('updateProject should PUT', () => {
    service.updateProject(1, { status: 'active' }).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteProject should DELETE', () => {
    service.deleteProject(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('togglePhotosUploaded should POST', () => {
    service.togglePhotosUploaded(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/toggle-photos-uploaded');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, message: 'OK', photosUploaded: true });
  });

  it('getProjectPersons should GET', () => {
    service.getProjectPersons(1).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects/1/persons');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('deletePerson should DELETE', () => {
    service.deletePerson(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/persons/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('getProjectsAutocomplete should GET', () => {
    service.getProjectsAutocomplete('test').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects/autocomplete');
    expect(req.request.params.get('search')).toBe('test');
    req.flush([]);
  });
});
