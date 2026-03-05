import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerTaskService } from './partner-task.service';

describe('PartnerTaskService', () => {
  let service: PartnerTaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerTaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProjectTasks should GET', () => {
    service.getProjectTasks(1).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/tasks');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('toggleComplete should PATCH', () => {
    service.toggleComplete(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/tasks/5/toggle');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('toggleReview should PATCH', () => {
    service.toggleReview(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/tasks/5/review');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('deleteTask should DELETE', () => {
    service.deleteTask(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/tasks/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getAllTasks should GET', () => {
    service.getAllTasks().subscribe();
    const req = httpMock.expectOne('/api/partner/projects/tasks/all');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getPendingCount should GET', () => {
    service.getPendingCount().subscribe();
    const req = httpMock.expectOne('/api/partner/projects/tasks/pending-count');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { count: 5 } });
  });

  it('getAssignees should GET', () => {
    service.getAssignees().subscribe();
    const req = httpMock.expectOne('/api/partner/task-assignees');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });
});
