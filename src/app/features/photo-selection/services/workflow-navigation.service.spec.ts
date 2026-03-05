import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { WorkflowNavigationService } from './workflow-navigation.service';
import { TabloWorkflowService } from './tablo-workflow.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('WorkflowNavigationService', () => {
  let service: WorkflowNavigationService;

  const mockWorkflow = {
    previousStep: vi.fn(),
    nextStep: vi.fn(),
    moveToStep: vi.fn(),
    loadStepData: vi.fn(),
    loadStepDataForViewing: vi.fn(),
  };
  const mockToast = { error: vi.fn() };
  const mockLogger = { error: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkflowNavigationService,
        { provide: TabloWorkflowService, useValue: mockWorkflow },
        { provide: ToastService, useValue: mockToast },
        { provide: LoggerService, useValue: mockLogger },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(WorkflowNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
