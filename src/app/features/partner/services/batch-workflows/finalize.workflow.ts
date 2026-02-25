import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * Véglegesítés workflow — flatten export + feltöltés (watermark nélkül).
 *
 * Lépések:
 * 0. PSD megnyitása
 * 1. Véglegesítés (flatten + upload)
 * 2. Kistabló (flatten + 3000px resize + upload)
 *
 * Előfeltétel: PSD fájl létezik a lemezen.
 */
@Injectable({
  providedIn: 'root',
})
export class FinalizeWorkflow implements BatchWorkflow {
  readonly type = 'finalize' as const;
  readonly label = 'Véglegesítés';
  readonly stepLabels = [
    'PSD megnyitása',
    'Véglegesítés',
    'Kistabló',
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

    // 0. PSD megnyitása
    onStep(0);
    const existsCheck = await ps.checkPsdExists(psdPath);
    if (!existsCheck.exists) {
      throw new Error(`PSD nem található: ${psdPath.split('/').pop()} — először generáld le a PSD-t`);
    }
    ps.psdPath.set(psdPath);
    checkAbort();

    // 1. Véglegesítés (flatten + közvetlen feltöltés)
    onStep(1);
    const finalResult = await ps.generateFinal(
      job.projectId,
      job.projectName,
      { schoolName: job.schoolName, className: job.className },
    );
    if (!finalResult.success) {
      throw new Error(finalResult.error ?? 'Véglegesítés sikertelen');
    }
    checkAbort();

    // 2. Kistabló (flatten + 3000px resize + feltöltés)
    onStep(2);
    const smallResult = await ps.generateSmallTablo(
      job.projectId,
      job.projectName,
      { schoolName: job.schoolName, className: job.className },
    );
    if (!smallResult.success) {
      throw new Error(smallResult.error ?? 'Kistabló generálás sikertelen');
    }

    this.logger.info(`Véglegesítés kész: ${job.projectName}`);
  }
}
