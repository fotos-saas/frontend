import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { ElectronCacheService } from '@core/services/electron-cache.service';
import { ElectronNotificationService } from '@core/services/electron-notification.service';
import { PartnerProjectService } from './partner-project.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { BatchWorkspaceItem, BatchJobState, BatchQueueState, BatchQueueStatus } from '../models/batch.types';
import { BatchWorkflow, BatchProjectData } from './batch-workflows/batch-workflow.interface';
import { GeneratePsdWorkflow } from './batch-workflows/generate-psd.workflow';
import { selectTabloSize } from '@shared/utils/tablo-size.util';
import { firstValueFrom } from 'rxjs';

const CACHE_KEY = 'batch_queue_state';
const PERSIST_DEBOUNCE = 500;

/** Hiba amit a checkAbort() dob pause/cancel eseten */
class BatchAbortError extends Error {
  constructor(public readonly reason: 'paused' | 'cancelled') {
    super(`Batch ${reason}`);
  }
}

/**
 * Batch Queue Service — workflow-agnosztikus queue state management.
 * Feladatokat futtat egymas utan, state-et perzisztalja ElectronCacheService-en.
 */
@Injectable({
  providedIn: 'root',
})
export class BatchQueueService {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly ngZone = inject(NgZone);
  private readonly cacheService = inject(ElectronCacheService);
  private readonly notificationService = inject(ElectronNotificationService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly photoshopService = inject(PhotoshopService);
  private readonly brandingService = inject(BrandingService);

  /** Regisztralt workflow-k */
  private readonly workflows = new Map<string, BatchWorkflow>();

  /** Persist debounce timer */
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  /** A mega-signal: queue teljes allapota */
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

  constructor() {
    // Workflow-k regisztralasa
    const generatePsd = inject(GeneratePsdWorkflow);
    this.workflows.set(generatePsd.type, generatePsd);
  }

  // ========== Publikus API ==========

  /** Batch inditas a kijelolt workspace elemekbol */
  async startBatch(items: BatchWorkspaceItem[]): Promise<void> {
    if (items.length === 0) return;

    const jobs: BatchJobState[] = items.map(item => ({
      id: item.id,
      projectId: item.projectId,
      projectName: item.projectName,
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

    await this.notificationService.setBadgeString(`${jobs.length}`);
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
    this.onBatchComplete();
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

  /** Queue torlese */
  clearQueue(): void {
    this.updateState({
      jobs: [],
      status: 'idle',
      currentJobId: null,
      startedAt: undefined,
      completedAt: undefined,
    });
    this.notificationService.clearBadge();
  }

  /** App indulaskor: eltarolt allapot visszatoltese */
  async restoreState(): Promise<void> {
    try {
      const saved = await this.cacheService.cacheGet<BatchQueueState>(CACHE_KEY);
      if (!saved || !saved.jobs?.length) return;

      // Felbe szakadt "running" jobokat "failed"-re állitjuk
      const jobs = saved.jobs.map(j =>
        j.status === 'running'
          ? { ...j, status: 'failed' as const, error: 'Megszakadt (app újraindítás)', retryable: true }
          : j,
      );

      const hasPending = jobs.some(j => j.status === 'pending');

      this.updateState({
        ...saved,
        jobs,
        status: hasPending ? 'paused' : 'completed',
        currentJobId: null,
      });

      this.logger.info('Batch queue allapot visszatoltve', { jobCount: jobs.length });
    } catch (err) {
      this.logger.warn('Batch queue allapot visszatoltes sikertelen', err);
    }
  }

  // ========== Belso logika ==========

  /** Kovetkezo pending job feldolgozasa */
  private async processNext(): Promise<void> {
    const state = this.queueState();
    if (state.status !== 'running') return;

    const nextJob = state.jobs.find(j => j.status === 'pending');
    if (!nextJob) {
      // Nincs tobb feladat
      this.updateState({
        status: 'completed',
        currentJobId: null,
        completedAt: new Date().toISOString(),
      });
      this.onBatchComplete();
      return;
    }

    // Job inditas
    this.updateJob(nextJob.id, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    this.updateState({ currentJobId: nextJob.id });

    try {
      const workflow = this.workflows.get(nextJob.workflowType);
      if (!workflow) {
        throw new Error(`Ismeretlen workflow: ${nextJob.workflowType}`);
      }

      // Projekt adatok betoltese
      const projectData = await this.loadProjectData(nextJob);

      // Workflow futtatás
      await workflow.execute(nextJob, projectData, {
        onStep: (stepIndex: number) => {
          this.ngZone.run(() => {
            this.updateJob(nextJob.id, {
              stepIndex,
              currentStep: workflow.stepLabels[stepIndex] ?? `Lépés ${stepIndex + 1}`,
              stepCount: workflow.stepLabels.length,
            });
          });
        },
        checkAbort: () => {
          const currentStatus = this.queueState().status;
          if (currentStatus === 'paused') throw new BatchAbortError('paused');
          if (currentStatus !== 'running') throw new BatchAbortError('cancelled');
        },
      });

      // Sikeres befejezés
      this.ngZone.run(() => {
        this.updateJob(nextJob.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        this.updateBadge();
        this.processNext();
      });
    } catch (err) {
      this.ngZone.run(() => {
        if (err instanceof BatchAbortError) {
          if (err.reason === 'paused') {
            // Visszaallitas pending-re, megvarjuk a resume-ot
            this.updateJob(nextJob.id, {
              status: 'pending',
              startedAt: undefined,
              currentStep: undefined,
              stepIndex: undefined,
            });
            this.updateState({ currentJobId: null });
          }
          return;
        }

        const errorMsg = err instanceof Error ? err.message : 'Ismeretlen hiba';
        this.logger.error(`Batch job sikertelen: ${nextJob.projectName}`, err);
        this.updateJob(nextJob.id, {
          status: 'failed',
          error: errorMsg,
          retryable: true,
          completedAt: new Date().toISOString(),
        });

        this.updateBadge();
        this.processNext();
      });
    }
  }

  /** Projekt adatok betoltese az API-bol */
  private async loadProjectData(job: BatchJobState): Promise<BatchProjectData> {
    const [personsResp, sizesResp] = await Promise.all([
      firstValueFrom(this.projectService.getProjectPersons(job.projectId)),
      firstValueFrom(this.projectService.getTabloSizes()),
    ]);

    const size = selectTabloSize(
      personsResp.data.length,
      sizesResp.sizes,
      sizesResp.threshold,
    );

    if (!size) {
      throw new Error('Nem sikerült tablóméretet választani');
    }

    const psdPath = await this.photoshopService.computePsdPath(size.value, {
      projectName: job.projectName,
      brandName: this.brandingService.brandName(),
    });

    if (!psdPath) {
      throw new Error('Nem sikerült PSD útvonalat meghatározni');
    }

    return {
      persons: personsResp.data,
      extraNames: personsResp.extraNames,
      size,
      psdPath,
    };
  }

  /** Egy job frissitese a queue-ban */
  private updateJob(jobId: string, patch: Partial<BatchJobState>): void {
    this.queueState.update(state => ({
      ...state,
      jobs: state.jobs.map(j =>
        j.id === jobId ? { ...j, ...patch } : j,
      ),
    }));
    this.schedulePersist();
  }

  /** Queue state frissitese */
  private updateState(patch: Partial<BatchQueueState>): void {
    this.queueState.update(state => ({ ...state, ...patch }));
    this.schedulePersist();
  }

  /** Debounced state perzisztalas */
  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.cacheService.cacheSet(CACHE_KEY, this.queueState());
    }, PERSIST_DEBOUNCE);
  }

  /** Badge frissitese a hátralévő jobokkal */
  private updateBadge(): void {
    const pending = this.queueState().jobs.filter(j => j.status === 'pending' || j.status === 'running').length;
    if (pending > 0) {
      this.notificationService.setBadgeString(`${pending}`);
    } else {
      this.notificationService.clearBadge();
    }
  }

  /** Batch befejezésekor: notification + badge clear */
  private async onBatchComplete(): Promise<void> {
    const s = this.summary();
    await this.notificationService.clearBadge();

    if (s.failed > 0) {
      this.toast.warning(
        'Batch befejezve',
        `${s.completed} sikeres, ${s.failed} sikertelen a ${s.total} feladatból`,
      );
      await this.notificationService.showNotification({
        title: 'Batch befejezve',
        body: `${s.completed} sikeres, ${s.failed} sikertelen`,
      });
    } else {
      this.toast.success(
        'Batch kész!',
        `Mind a ${s.total} feladat sikeresen elkészült`,
      );
      await this.notificationService.showNotification({
        title: 'Batch kész!',
        body: `Mind a ${s.total} feladat sikeresen elkészült`,
      });
    }
  }
}
