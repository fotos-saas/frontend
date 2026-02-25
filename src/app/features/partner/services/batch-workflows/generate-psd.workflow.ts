import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * PSD generálás workflow — teljes tabló PSD létrehozása.
 *
 * Lépések:
 * 0. PSD létezés ellenőrzés (ha létezik → hiba, nem generálunk)
 * 1. PSD generálás és megnyitás Photoshopban
 * 2. Név layerek hozzáadása
 * 3. Kép layerek hozzáadása
 * 4. Rács elrendezés
 * 5. Pillanatkép mentése
 *
 * A PSD nyitva marad Photoshopban szerkesztésre — a user maga menti/zárja.
 *
 * FONTOS: Ha a PSD fájl már létezik, a workflow HIBÁT dob.
 * A felhasználónak törölnie/átneveznie kell a meglévő fájlt.
 */
@Injectable({
  providedIn: 'root',
})
export class GeneratePsdWorkflow implements BatchWorkflow {
  readonly type = 'generate-psd' as const;
  readonly label = 'PSD generálás';
  readonly stepLabels = [
    'Ellenőrzés',
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
    const { persons, extraNames, size, psdPath, brandName } = projectData;
    const ps = this.photoshopService;
    const dimensions = ps.parseSizeValue(size.value);

    if (!dimensions) {
      throw new Error(`Érvénytelen méret: ${size.value}`);
    }

    // 0. PSD létezés ellenőrzés — ha már van fájl, NEM generálunk
    onStep(0);
    const existsCheck = await ps.checkPsdExists(psdPath);
    if (existsCheck.exists) {
      throw new Error(`PSD már létezik: ${psdPath.split('/').pop()} — töröld vagy nevezd át a meglévő fájlt`);
    }
    checkAbort();

    // PSD path signal beállítása — a runJsx wrapper ezt használja a dokumentum fókuszhoz
    ps.psdPath.set(psdPath);

    // Dokumentum neve a PSD path-ból (kiterjesztéssel — a PS document.name .psd-vel adja vissza!)
    const docName = psdPath.split('/').pop() ?? undefined;

    // 1. PSD generálás — className és brandName a helyes mappa/fájlnévhez
    onStep(1);
    const genResult = await ps.generateAndOpenPsd(size, {
      projectName: job.projectName,
      schoolName: job.schoolName,
      className: job.className,
      brandName,
      persons: persons.map(p => ({ id: p.id, name: p.name, type: p.type })),
    });
    if (!genResult.success) {
      throw new Error(genResult.error ?? 'PSD generálás sikertelen');
    }
    checkAbort();

    // 2. Név layerek
    onStep(2);
    const nameResult = await ps.addNameLayers(
      persons.map(p => ({ id: p.id, name: p.name, type: p.type })),
      docName,
    );
    if (!nameResult.success) {
      throw new Error(nameResult.error ?? 'Név layerek hozzáadása sikertelen');
    }
    checkAbort();

    // 3. Kép layerek
    onStep(3);
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
    onStep(4);
    const gridResult = await ps.arrangeGrid(
      { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
      docName,
    );
    if (!gridResult.success) {
      throw new Error(gridResult.error ?? 'Rács elrendezés sikertelen');
    }
    checkAbort();

    // 5. Pillanatkép mentése
    onStep(5);
    const snapshotResult = await ps.saveSnapshot(
      'batch-initial',
      { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
      psdPath,
      docName,
    );
    if (!snapshotResult.success) {
      this.logger.warn('Pillanatkép mentés sikertelen (nem kritikus)', snapshotResult.error);
    }

    // PSD nyitva marad Photoshopban — a user pimpeli és maga menti
  }
}
