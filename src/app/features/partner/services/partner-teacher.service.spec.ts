import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerTeacherService } from './partner-teacher.service';

describe('PartnerTeacherService', () => {
  let service: PartnerTeacherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerTeacherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTeachers should GET with params', () => {
    service.getTeachers({ search: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/teachers');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getTeacher should GET by id', () => {
    service.getTeacher(5).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/5');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('createTeacher should POST', () => {
    service.createTeacher({ name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteTeacher should DELETE', () => {
    service.deleteTeacher(5).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('uploadTeacherPhoto should POST FormData', () => {
    const file = new File(['x'], 'photo.jpg');
    service.uploadTeacherPhoto(5, file, 2025).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/5/photos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('getClassYears should GET', () => {
    service.getClassYears().subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/class-years');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('exportCsv should GET blob', () => {
    service.exportCsv().subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/export-csv');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('linkTeachers should POST', () => {
    service.linkTeachers([1, 2]).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/link');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('unlinkTeacher should DELETE', () => {
    service.unlinkTeacher(5).subscribe();
    const req = httpMock.expectOne('/api/partner/teachers/5/unlink');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });
});
