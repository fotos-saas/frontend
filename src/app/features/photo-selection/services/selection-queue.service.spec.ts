import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { SelectionQueueService } from './selection-queue.service';
import { TabloWorkflowService } from './tablo-workflow.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('SelectionQueueService', () => {
  let service: SelectionQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SelectionQueueService,
        { provide: TabloWorkflowService, useValue: {} },
        { provide: ToastService, useValue: { error: vi.fn() } },
        { provide: LoggerService, useValue: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(SelectionQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
