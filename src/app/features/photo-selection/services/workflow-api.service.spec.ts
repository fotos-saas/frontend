import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WorkflowApiService } from './workflow-api.service';

describe('WorkflowApiService', () => {
  let service: WorkflowApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkflowApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadStepData$ should GET', () => {
    service.loadStepData$(10).subscribe();
    const req = httpMock.expectOne('/api/tablo/step-data/10');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('loadStepData$ with step should add query param', () => {
    service.loadStepData$(10, 'claiming').subscribe();
    const req = httpMock.expectOne('/api/tablo/step-data/10?step=claiming');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('loadStepDataForViewing$ should GET with readonly', () => {
    service.loadStepDataForViewing$(10, 'retouch').subscribe();
    const req = httpMock.expectOne('/api/tablo/step-data/10?step=retouch&readonly=true');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('saveClaimingSelection$ should POST', () => {
    service.saveClaimingSelection$(10, [1, 2]).subscribe();
    const req = httpMock.expectOne('/api/tablo/claiming');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.photoIds).toEqual([1, 2]);
    req.flush({});
  });

  it('autoSaveRetouchSelection$ should POST', () => {
    service.autoSaveRetouchSelection$(10, [3]).subscribe();
    const req = httpMock.expectOne('/api/tablo/retouch/auto-save');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('autoSaveTabloSelection$ should POST', () => {
    service.autoSaveTabloSelection$(10, 5).subscribe();
    const req = httpMock.expectOne('/api/tablo/tablo/auto-save');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('clearTabloSelection$ should POST', () => {
    service.clearTabloSelection$(10).subscribe();
    const req = httpMock.expectOne('/api/tablo/tablo/clear');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('finalizeTabloSelection$ should POST', () => {
    service.finalizeTabloSelection$(10, 5).subscribe();
    const req = httpMock.expectOne('/api/tablo/workflow/finalize');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('requestModification$ should POST', () => {
    service.requestModification$(10).subscribe();
    const req = httpMock.expectOne('/api/tablo/workflow/request-modification');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, was_free: true, message: 'OK' });
  });

  it('nextStep$ should POST', () => {
    service.nextStep$(10).subscribe();
    const req = httpMock.expectOne('/api/tablo/next-step');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('previousStep$ should POST', () => {
    service.previousStep$(10).subscribe();
    const req = httpMock.expectOne('/api/tablo/previous-step');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('moveToStep$ should POST', () => {
    service.moveToStep$(10, 'claiming').subscribe();
    const req = httpMock.expectOne('/api/tablo/move-to-step');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.targetStep).toBe('claiming');
    req.flush({});
  });
});
