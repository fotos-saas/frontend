import { Injectable, inject, NgZone } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PartnerProjectService } from './partner-project.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { ToastService } from '@core/services/toast.service';
import { BatchJobState, BatchQueueState } from '../models/batch.types';
import { BatchWorkflow, BatchProjectData } from './batch-workflows/batch-workflow.interface';
import { GeneratePsdWorkflow } from './batch-workflows/generate-psd.workflow';
import { GenerateSampleWorkflow } from './batch-workflows/generate-sample.workflow';
import { FinalizeWorkflow } from './batch-workflows/finalize.workflow';
import { selectTabloSize } from '@shared/utils/tablo-size.util';
import { firstValueFrom } from 'rxjs';

/** Hiba amit a checkAbort() dob pause/cancel esetén */
class BatchAbortError extends Error {
  constructor(public readonly reason: 'paused' | 'cancelled') {
    super(`Batch ${reason}`);
  }
}

/** Callback-ek a queue facade felé */
export interface JobRunnerCallbacks {
  getStatus: () => BatchQueueState['status'];
  onJobUpdate: (jobId: string, patch: Partial<BatchJobState>) => void;
  onJobCompleted: (jobId: string) => void;
  onJobFailed: (jobId: string, error: string) => void;
  onJobPaused: (jobId: string) => void;
  onProcessNext: () => void;
}

/**
 * Batch job futtatás — egy-egy job végrehajtása workflow-val.
 * Felelős: projekt adat betöltés, backup, workflow futtatás, hiba kezelés.
 */
@Injectable({
  providedIn: 'root',
})
export class BatchJobRunnerService {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly ngZone = inject(NgZone);
  private readonly projectService = inject(PartnerProjectService);
  private readonly photoshopService = inject(PhotoshopService);
  private readonly brandingService = inject(BrandingService);

  /** Regisztrált workflow-k */
  private readonly workflows = new Map<string, BatchWorkflow>();

  constructor() {
    const generatePsd = inject(GeneratePsdWorkflow);
    const generateSample = inject(GenerateSampleWorkflow);
    const finalize = inject(FinalizeWorkflow);
    this.workflows.set(generatePsd.type, generatePsd);
    this.workflows.set(generateSample.type, generateSample);
    this.workflows.set(finalize.type, finalize);
  }

  /** Előfeltételek ellenőrzése batch indítás előtt */
  validatePrerequisites(): boolean {
    if (!this.photoshopService.isConfigured()) {
      this.toast.error(
        'Photoshop nem található',
        'Ellenőrizd a Photoshop beállításokat a Tablókészítő → Beállítások oldalon.',
      );
      return false;
    }

    if (!this.photoshopService.workDir()) {
      this.toast.error(
        'Munka mappa nincs beállítva',
        'Állítsd be a munka mappát a Tablókészítő → Beállítások oldalon, mielőtt batch-et indítanál.',
      );
      return false;
    }

    return true;
  }

  /** Photoshop detektálás */
  async detectPhotoshop(): Promise<void> {
    await this.photoshopService.detectPhotoshop();
  }

  /** Egy job feldolgozása */
  async executeJob(job: BatchJobState, callbacks: JobRunnerCallbacks): Promise<void> {
    try {
      const workflow = this.workflows.get(job.workflowType);
      if (!workflow) {
        throw new Error(`Ismeretlen workflow: ${job.workflowType}`);
      }

      // Projekt adatok betöltése
      const projectData = await this.loadProjectData(job);

      // Backup: minta/véglegesítés előtt backup a meglévő PSD-ről
      if (job.workflowType !== 'generate-psd') {
        const existsCheck = await this.photoshopService.checkPsdExists(projectData.psdPath);
        if (existsCheck.exists) {
          this.logger.info(`Backup készítés: ${projectData.psdPath}`);
          const backupResult = await this.photoshopService.backupPsd(projectData.psdPath);
          if (!backupResult.success) {
            throw new Error(`Backup sikertelen: ${backupResult.error}`);
          }
        }
      }

      // Workflow futtatás
      await workflow.execute(job, projectData, {
        onStep: (stepIndex: number) => {
          this.ngZone.run(() => {
            callbacks.onJobUpdate(job.id, {
              stepIndex,
              currentStep: workflow.stepLabels[stepIndex] ?? `Lépés ${stepIndex + 1}`,
              stepCount: workflow.stepLabels.length,
            });
          });
        },
        checkAbort: () => {
          const currentStatus = callbacks.getStatus();
          if (currentStatus === 'paused') throw new BatchAbortError('paused');
          if (currentStatus !== 'running') throw new BatchAbortError('cancelled');
        },
      });

      // Sikeres befejezés
      this.ngZone.run(() => {
        callbacks.onJobCompleted(job.id);
        callbacks.onProcessNext();
      });
    } catch (err) {
      this.ngZone.run(() => {
        if (err instanceof BatchAbortError) {
          if (err.reason === 'paused') {
            callbacks.onJobPaused(job.id);
          }
          return;
        }

        const errorMsg = err instanceof Error ? err.message : 'Ismeretlen hiba';
        this.logger.error(`Batch job sikertelen: ${job.projectName}`, err);
        callbacks.onJobFailed(job.id, errorMsg);
        callbacks.onProcessNext();
      });
    }
  }

  /** Projekt adatok betöltése az API-ból */
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
      schoolName: job.schoolName,
      className: job.className,
      brandName: this.brandingService.brandName(),
    });

    if (!psdPath) {
      throw new Error('Nem sikerült PSD útvonalat meghatározni — ellenőrizd a munka mappa beállítást');
    }

    return {
      persons: personsResp.data,
      extraNames: personsResp.extraNames,
      size,
      psdPath,
      brandName: this.brandingService.brandName(),
    };
  }
}
