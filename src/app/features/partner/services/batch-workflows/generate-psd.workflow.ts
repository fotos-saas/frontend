import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * PSD generálás workflow — teljes tabló PSD létrehozása.
 *
 * Lépések:
 * 1. PSD generálás és megnyitás Photoshopban
 * 2. Név layerek hozzáadása
 * 3. Kép layerek hozzáadása
 * 4. Rács elrendezés
 * 5. Pillanatkép mentése
 */
@Injectable({
  providedIn: 'root',
})
export class GeneratePsdWorkflow implements BatchWorkflow {
  readonly type = 'generate-psd' as const;
  readonly label = 'PSD generálás';
  readonly stepLabels = [
    'PSD generálás',
    'Név layerek',
    'Kép layerek',
    'Rács elrendezés',
    'Pillanatkép',
  ];

  private readonly logger = inject(LoggerService);
  private readonly photoshopService = inject(PhotoshopService);

  async execute(
    job: BatchJobState,
    projectData: BatchProjectData,
    { onStep, checkAbort }: BatchWorkflowCallbacks,
  ): Promise<void> {
    const { persons, extraNames, size, psdPath } = projectData;
    const ps = this.photoshopService;
    const dimensions = ps.parseSizeValue(size.value);

    if (!dimensions) {
      throw new Error(`Érvénytelen méret: ${size.value}`);
    }

    // Dokumentum neve a PSD path-ból (fájlnév kiterjesztés nélkül)
    const docName = psdPath.split('/').pop()?.replace('.psd', '') ?? undefined;

    // 1. PSD generálás
    onStep(0);
    const genResult = await ps.generateAndOpenPsd(size, {
      projectName: job.projectName,
      className: undefined,
      brandName: undefined,
      persons: persons.map(p => ({ id: p.id, name: p.name, type: p.type })),
    });
    if (!genResult.success) {
      throw new Error(genResult.error ?? 'PSD generálás sikertelen');
    }
    checkAbort();

    // 2. Név layerek
    onStep(1);
    const nameResult = await ps.addNameLayers(
      persons.map(p => ({ id: p.id, name: p.name, type: p.type })),
      docName,
    );
    if (!nameResult.success) {
      throw new Error(nameResult.error ?? 'Név layerek hozzáadása sikertelen');
    }
    checkAbort();

    // 3. Kép layerek
    onStep(2);
    const imageResult = await ps.addImageLayers(
      persons.map(p => ({ id: p.id, name: p.name, type: p.type, photoUrl: p.photoUrl })),
      undefined,
      docName,
    );
    if (!imageResult.success) {
      throw new Error(imageResult.error ?? 'Kép layerek hozzáadása sikertelen');
    }
    checkAbort();

    // 4. Rács elrendezés
    onStep(3);
    const gridResult = await ps.arrangeGrid(
      { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
      docName,
    );
    if (!gridResult.success) {
      throw new Error(gridResult.error ?? 'Rács elrendezés sikertelen');
    }
    checkAbort();

    // 5. Pillanatkép mentése
    onStep(4);
    const snapshotResult = await ps.saveSnapshot(
      'batch-initial',
      { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
      psdPath,
      docName,
    );
    if (!snapshotResult.success) {
      this.logger.warn('Pillanatkép mentés sikertelen (nem kritikus)', snapshotResult.error);
    }
  }
}
