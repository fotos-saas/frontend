import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TabloWorkflowService } from './tablo-workflow.service';
import { WorkflowApiService } from './workflow-api.service';
import { WorkflowSecurityService } from './workflow-security.service';

describe('TabloWorkflowService', () => {
  let service: TabloWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TabloWorkflowService,
        { provide: WorkflowApiService, useValue: { loadStepData$: vi.fn(), saveClaimingSelection$: vi.fn() } },
        { provide: WorkflowSecurityService, useValue: { validateGalleryAccess: vi.fn(), sanitizePhotoIds: vi.fn((ids: number[]) => ids) } },
      ],
    });
    service = TestBed.inject(TabloWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
