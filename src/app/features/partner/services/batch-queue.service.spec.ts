import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatchQueueService } from './batch-queue.service';
import { BatchQueuePersistService } from './batch-queue-persist.service';
import { BatchJobRunnerService } from './batch-job-runner.service';

describe('BatchQueueService', () => {
  let service: BatchQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BatchQueueService,
        { provide: BatchQueuePersistService, useValue: { schedulePersist: vi.fn() } },
        { provide: BatchJobRunnerService, useValue: { runJob: vi.fn() } },
      ],
    });
    service = TestBed.inject(BatchQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default computed values', () => {
    expect(service.isRunning()).toBe(false);
    expect(service.isPaused()).toBe(false);
    expect(service.hasJobs()).toBe(false);
    expect(service.currentJob()).toBeNull();
  });
});
