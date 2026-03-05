import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerWorkflowService } from './partner-workflow.service';

describe('PartnerWorkflowService', () => {
  let service: PartnerWorkflowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerWorkflowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getWorkflow should GET by id', () => {
    service.getWorkflow(5).subscribe();
    const req = httpMock.expectOne('/api/partner/workflows/5');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getDashboardStats should GET', () => {
    service.getDashboardStats().subscribe();
    const req = httpMock.expectOne('/api/partner/workflows/stats');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getPendingCount should GET', () => {
    service.getPendingCount().subscribe();
    const req = httpMock.expectOne('/api/partner/workflows/pending-count');
    expect(req.request.method).toBe('GET');
    req.flush({ count: 3 });
  });

  it('getScheduleSettings should GET', () => {
    service.getScheduleSettings().subscribe();
    const req = httpMock.expectOne('/api/partner/workflow-schedules');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('deleteSchedule should DELETE', () => {
    service.deleteSchedule(5).subscribe();
    const req = httpMock.expectOne('/api/partner/workflow-schedules/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
