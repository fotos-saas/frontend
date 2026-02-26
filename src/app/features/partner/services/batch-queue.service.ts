import { Injectable, inject, signal, computed } from '@angular/core';
import { BatchWorkspaceItem, BatchJobState, BatchQueueState, BatchQueueStatus } from '../models/batch.types';
import { BatchQueuePersistService } from './batch-queue-persist.service';
import { BatchJobRunnerService } from './batch-job-runner.service';

/**
 * Batch Queue Service — facade a queue állapot kezeléshez.
 * Delegál: BatchJobRunnerService (futtatás), BatchQueuePersistService (perzisztálás).
 */
@Injectable({
  providedIn: 'root',
})
export class BatchQueueService {
  private readonly persistService = inject(BatchQueuePersistService);
  private readonly jobRunner = inject(BatchJobRunnerService);

  /** A mega-signal: queue teljes állapota */
  readonly queueState = signal<BatchQueueState>({
    jobs: [],
    status: 'idle',
    currentJobId: null,
  });

  // ========== Computed ==========

  readonly currentJob = computed(() => {
    const state = this.queueState();
    return state.currentJobId
      ? state.jobs.find(j => j.id === state.currentJobId) ?? null
      : null;
  });

  readonly isRunning = computed(() => this.queueState().status === 'running');
  readonly isPaused = computed(() => this.queueState().status === 'paused');
  readonly hasJobs = computed(() => this.queueState().jobs.length > 0);

  readonly summary = computed(() => {
    const jobs = this.queueState().jobs;
    return {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
    };
  });

  readonly overallProgress = computed(() => {
    const s = this.summary();
    return s.total === 0 ? 0 : Math.round(((s.completed + s.failed) / s.total) * 100);
  });

  // ========== Publikus API ==========

  /** Batch indítás a kijelölt workspace elemekből */
  async startBatch(items: BatchWorkspaceItem[]): Promise<void> {
    if (items.length === 0) return;

    await this.jobRunner.detectPhotoshop();

    if (!this.jobRunner.validatePrerequisites()) return;

    const jobs: BatchJobState[] = items.map(item => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
      schoolName: item.schoolName,
      className: item.className,
      classYear: item.classYear,
      workflowType: item.workflowType,
      status: 'pending',
    }));

    this.updateState({
      jobs,
      status: 'running',
      currentJobId: null,
      startedAt: new Date().toISOString(),
      completedAt: undefined,
    });

    await this.persistService.setBadgeCount(jobs.length);
    this.processNext();
  }

  /** Szüneteltetés */
  pause(): void {
    if (this.queueState().status !== 'running') return;
    this.updateState({ status: 'paused' });
  }

  /** Folytatás szünetből */
  resume(): void {
    if (this.queueState().status !== 'paused') return;
    this.updateState({ status: 'running' });
    this.processNext();
  }

  /** Megszakítás — pending jobokat cancelled-re állítja */
  cancel(): void {
    const state = this.queueState();
    if (state.status === 'idle' || state.status === 'completed') return;

    const jobs = state.jobs.map(j =>
      j.status === 'pending' ? { ...j, status: 'cancelled' as const } : j,
    );

    this.updateState({
      jobs,
      status: 'completed',
      currentJobId: null,
      completedAt: new Date().toISOString(),
    });
    this.persistService.notifyBatchComplete(this.summary());
  }

  /** Sikertelen job újrapróbálása */
  retryJob(jobId: string): void {
    const state = this.queueState();
    const jobs = state.jobs.map(j =>
      j.id === jobId ? { ...j, status: 'pending' as const, error: undefined, retryable: undefined } : j,
    );

    const newStatus: BatchQueueStatus = state.status === 'completed' ? 'running' : state.status;
    this.updateState({ jobs, status: newStatus, completedAt: undefined });

    if (newStatus === 'running' && !state.currentJobId) {
      this.processNext();
    }
  }

  /** Queue törlése */
  clearQueue(): void {
    this.updateState({
      jobs: [],
      status: 'idle',
      currentJobId: null,
      startedAt: undefined,
      completedAt: undefined,
    });
    this.persistService.clearBadge();
  }

  /** App induláskor: eltárolt állapot visszatöltése */
  async restoreState(): Promise<void> {
    const restored = await this.persistService.restoreState();
    if (restored) {
      this.queueState.set(restored);
    }
  }

  // ========== Belső logika ==========

  /** Következő pending job feldolgozása */
  private processNext(): void {
    const state = this.queueState();
    if (state.status !== 'running') return;

    const nextJob = state.jobs.find(j => j.status === 'pending');
    if (!nextJob) {
      this.updateState({
        status: 'completed',
        currentJobId: null,
        completedAt: new Date().toISOString(),
      });
      this.persistService.notifyBatchComplete(this.summary());
      return;
    }

    // Job indítás
    this.updateJob(nextJob.id, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    this.updateState({ currentJobId: nextJob.id });

    this.jobRunner.executeJob(nextJob, {
      getStatus: () => this.queueState().status,
      onJobUpdate: (id, patch) => this.updateJob(id, patch),
      onJobCompleted: (id) => {
        this.updateJob(id, { status: 'completed', completedAt: new Date().toISOString() });
        this.persistService.updateBadge(this.queueState().jobs);
      },
      onJobFailed: (id, error) => {
        this.updateJob(id, { status: 'failed', error, retryable: true, completedAt: new Date().toISOString() });
        this.persistService.updateBadge(this.queueState().jobs);
      },
      onJobPaused: (id) => {
        this.updateJob(id, { status: 'pending', startedAt: undefined, currentStep: undefined, stepIndex: undefined });
        this.updateState({ currentJobId: null });
      },
      onProcessNext: () => this.processNext(),
    });
  }

  /** Egy job frissítése a queue-ban */
  private updateJob(jobId: string, patch: Partial<BatchJobState>): void {
    this.queueState.update(state => ({
      ...state,
      jobs: state.jobs.map(j =>
        j.id === jobId ? { ...j, ...patch } : j,
      ),
    }));
    this.persistService.schedulePersist(this.queueState());
  }

  /** Queue state frissítése */
  private updateState(patch: Partial<BatchQueueState>): void {
    this.queueState.update(state => ({ ...state, ...patch }));
    this.persistService.schedulePersist(this.queueState());
  }
}
