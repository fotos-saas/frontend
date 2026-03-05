import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerSchoolService } from './partner-school.service';

describe('PartnerSchoolService', () => {
  let service: PartnerSchoolService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerSchoolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllSchools should GET', () => {
    service.getAllSchools('test').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/schools/all');
    expect(req.request.params.get('search')).toBe('test');
    req.flush([]);
  });

  it('createSchool should POST', () => {
    service.createSchool({ name: 'Test School' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/schools');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('getSchools should GET with params', () => {
    service.getSchools({ search: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/schools');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('getSchool should GET by id', () => {
    service.getSchool(5).subscribe();
    const req = httpMock.expectOne('/api/partner/schools/5/detail');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('deleteSchool should DELETE', () => {
    service.deleteSchool(5).subscribe();
    const req = httpMock.expectOne('/api/partner/schools/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('linkSchools should POST', () => {
    service.linkSchools([1, 2]).subscribe();
    const req = httpMock.expectOne('/api/partner/schools/link');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.school_ids).toEqual([1, 2]);
    req.flush({ success: true, message: 'OK', linkedGroup: 'group1' });
  });

  it('unlinkSchool should DELETE', () => {
    service.unlinkSchool(5).subscribe();
    const req = httpMock.expectOne('/api/partner/schools/5/unlink');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('downloadTeacherPhotosZip should GET blob', () => {
    service.downloadTeacherPhotosZip(5, 'teacher_name').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/schools/5/download-teacher-photos');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
