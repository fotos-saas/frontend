import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerActivityService } from './partner-activity.service';

describe('PartnerActivityService', () => {
  let service: PartnerActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getActivityLog should GET with default filters', () => {
    service.getActivityLog().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/activity-log');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('getActivitySummary should GET summary', () => {
    service.getActivitySummary().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/activity-log/summary');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('toggleProjectReview should POST', () => {
    service.toggleProjectReview([1, 2], true).subscribe();
    const req = httpMock.expectOne('/api/partner/activity-log/review');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.project_ids).toEqual([1, 2]);
    expect(req.request.body.reviewed).toBe(true);
    req.flush({ message: 'OK', count: 2 });
  });

  it('getProjectActivity should GET with pagination', () => {
    service.getProjectActivity(1, 2, 10).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/projects/1/activity');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('10');
    req.flush({ data: [], meta: {} });
  });
});
