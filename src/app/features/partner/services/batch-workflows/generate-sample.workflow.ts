import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * Minta generálás workflow — flatten export + watermark + feltöltés.
 *
 * Lépések:
 * 0. PSD megnyitása
 * 1. Minta generálás (flatten + watermark + upload)
 *
 * Előfeltétel: PSD fájl létezik a lemezen.
 */
@Injectable({
  providedIn: 'root',
})
export class GenerateSampleWorkflow implements BatchWorkflow {
  readonly type = 'generate-sample' as const;
  readonly label = 'Minta generálás';
  readonly stepLabels = [
    'PSD megnyitása',
    'Minta generálás',
  ];

  private readonly logger = inject(LoggerService);
  private readonly photoshopService = inject(PhotoshopService);

  async execute(
    job: BatchJobState,
    projectData: BatchProjectData,
    { onStep, checkAbort }: BatchWorkflowCallbacks,
  ): Promise<void> {
    const { psdPath } = projectData;
    const ps = this.photoshopService;

    // 0. PSD megnyitása — psdPath signal beállítása + megnyitás Photoshopban
    onStep(0);
    const existsCheck = await ps.checkPsdExists(psdPath);
    if (!existsCheck.exists) {
      throw new Error(`PSD nem található: ${psdPath.split('/').pop()} — először generáld le a PSD-t`);
    }
    ps.psdPath.set(psdPath);

    // Megnyitás Photoshopban (az activateDocByName a runJsx-ben kezeli,
    // de ha nincs nyitva, a PSD_FILE_PATH-ból nyitja meg)
    checkAbort();

    // 1. Minta generálás
    onStep(1);
    const result = await ps.generateSample(
      job.projectId,
      job.projectName,
      false,
      { schoolName: job.schoolName, className: job.className },
    );
    if (!result.success) {
      throw new Error(result.error ?? 'Minta generálás sikertelen');
    }

    this.logger.info(`Minta generálva: ${job.projectName}`, {
      uploadedCount: result.uploadedCount,
    });
  }
}
