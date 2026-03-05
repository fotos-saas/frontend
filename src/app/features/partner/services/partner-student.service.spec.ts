import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerStudentService } from './partner-student.service';

describe('PartnerStudentService', () => {
  let service: PartnerStudentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerStudentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStudents should GET with params', () => {
    service.getStudents({ search: 'test', page: 1 }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/students');
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], meta: {} });
  });

  it('getStudent should GET by id', () => {
    service.getStudent(5).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('createStudent should POST', () => {
    service.createStudent({ name: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/students');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('updateStudent should PUT', () => {
    service.updateStudent(5, { name: 'Updated' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('deleteStudent should DELETE', () => {
    service.deleteStudent(5).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('uploadStudentPhoto should POST FormData', () => {
    const file = new File(['x'], 'photo.jpg');
    service.uploadStudentPhoto(5, file, 2025).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5/photos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('setActivePhoto should PATCH', () => {
    service.setActivePhoto(5, 10).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5/photos/10/active');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, message: 'OK' });
  });

  it('deleteStudentPhoto should DELETE', () => {
    service.deleteStudentPhoto(5, 10).subscribe();
    const req = httpMock.expectOne('/api/partner/students/5/photos/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('getClassYears should GET', () => {
    service.getClassYears().subscribe();
    const req = httpMock.expectOne('/api/partner/students/class-years');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('exportCsv should GET blob', () => {
    service.exportCsv().subscribe();
    const req = httpMock.expectOne('/api/partner/students/export-csv');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
