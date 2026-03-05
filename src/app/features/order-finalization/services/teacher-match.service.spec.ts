import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TeacherMatchService } from './teacher-match.service';

describe('TeacherMatchService', () => {
  let service: TeacherMatchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherMatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('matchTeacherNames with projectId should POST to partner URL', () => {
    service.matchTeacherNames(['Kiss János'], 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/5/match-teachers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.teacher_names).toEqual(['Kiss János']);
    req.flush({ success: true, matches: [] });
  });

  it('matchTeacherNames without projectId should POST to tablo-frontend URL', () => {
    service.matchTeacherNames(['Nagy Éva']).subscribe();
    const req = httpMock.expectOne('/api/tablo-frontend/match-teachers');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, matches: [{ name: 'Nagy Éva', matched: true }] });
  });
});
