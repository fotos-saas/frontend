import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { PartnerProjectService } from '../partner-project.service';
import { PsdStatusService } from '../psd-status.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * Képek frissítése workflow — megváltozott és új fotók cseréje a PSD-ben.
 *
 * Lépések:
 * 0. PSD megnyitása
 * 1. Változások lekérdezése (backend API)
 * 2. Fotók cseréje (placePhotos)
 * 3. Mentés és bezárás
 *
 * A syncBorder értéket a placed-photos.json withFrame többségéből határozza meg.
 */
@Injectable({
  providedIn: 'root',
})
export class RefreshPhotosWorkflow implements BatchWorkflow {
  readonly type = 'refresh-photos' as const;
  readonly label = 'Képek frissítése';
  readonly stepLabels = [
    'PSD megnyitása',
    'Változások lekérdezése',
    'Fotók cseréje',
    'Mentés és bezárás',
  ];

  private readonly logger = inject(LoggerService);
  private readonly ps = inject(PhotoshopService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly psdStatus = inject(PsdStatusService);

  private wait(ms = 1500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute(
    job: BatchJobState,
    projectData: BatchProjectData,
    { onStep, checkAbort }: BatchWorkflowCallbacks,
  ): Promise<void> {
    const { psdPath } = projectData;
    const tag = `[Batch Refresh] ${job.projectName}`;
    const docName = psdPath.split('/').pop() ?? undefined;

    // 0. PSD ellenőrzés + placed-photos.json beolvasás
    onStep(0);
    const existsCheck = await this.ps.checkPsdExists(psdPath);
    if (!existsCheck.exists) {
      throw new Error(`PSD nem található: ${docName} — először generáld le a PSD-t`);
    }
    if (!existsCheck.hasPlacedPhotos || !existsCheck.placedPhotos) {
      throw new Error(`Nincs placed-photos.json — először generáld le a PSD-t képekkel`);
    }

    const placedPhotos = existsCheck.placedPhotos;
    const syncBorder = existsCheck.majorityWithFrame;
    this.ps.psdPath.set(psdPath);
    checkAbort();

    // 1. Változások lekérdezése a backend API-ból
    onStep(1);
    const result = await firstValueFrom(
      this.projectService.checkPhotoChanges(job.projectId, placedPhotos),
    );

    const allUpdates = [...result.changed, ...result.newPhotos];
    if (allUpdates.length === 0) {
      this.logger.info(`${tag} Nincs változás, kihagyva`);
      return;
    }

    this.logger.info(`${tag} ${result.changed.length} változott, ${result.newPhotos.length} új — syncBorder=${syncBorder}`);
    checkAbort();

    // 2. PSD megnyitás + fotók cseréje
    onStep(2);
    const openResult = await this.ps.openPsdFile(psdPath);
    if (!openResult.success) {
      throw new Error(`PSD megnyitás sikertelen: ${openResult.error}`);
    }
    await this.wait(2000);

    const layers = allUpdates.map(p => {
      const slug = p.personName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
      return { layerName: `${slug}---${p.personId}`, photoUrl: p.newPhotoUrl };
    });

    const placeResult = await this.ps.placePhotos(layers, docName, syncBorder);
    if (!placeResult.success) {
      throw new Error(`Fotók cseréje sikertelen: ${placeResult.error}`);
    }
    await this.wait();
    checkAbort();

    // 3. Mentés és bezárás
    onStep(3);
    const closeResult = await this.ps.saveAndCloseDocument(docName);
    if (!closeResult.success) {
      this.logger.warn(`${tag} Bezárás sikertelen`, closeResult.error);
    }

    // Badge nullázása a projekt listán
    this.psdStatus.clearUpdatedCount(job.projectId);

    this.logger.info(`${tag} KÉSZ — ${layers.length} fotó frissítve`);
  }
}
