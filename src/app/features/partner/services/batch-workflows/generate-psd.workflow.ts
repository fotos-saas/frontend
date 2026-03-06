import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../photoshop.service';
import { BatchWorkflow, BatchProjectData, BatchWorkflowCallbacks } from './batch-workflow.interface';
import { BatchJobState } from '../../models/batch.types';

/**
 * PSD generálás workflow — teljes tabló PSD létrehozása.
 *
 * Lépések:
 * 0. PSD létezés ellenőrzés
 * 1. PSD generálás és megnyitás Photoshopban
 * 2. Layer nevek javítása + Guide-ok
 * 3. Felirat layerek
 * 4. Név layerek
 * 5. Kép layerek + Tablóelrendezés
 * 6. Mentés és bezárás
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
    'Layer nevek + Guide-ok',
    'Feliratok',
    'Név layerek',
    'Kép layerek + Elrendezés',
    'Mentés és bezárás',
  ];

  private readonly logger = inject(LoggerService);
  private readonly photoshopService = inject(PhotoshopService);

  async execute(
    job: BatchJobState,
    projectData: BatchProjectData,
    { onStep, checkAbort }: BatchWorkflowCallbacks,
  ): Promise<void> {
    const { persons, size, psdPath, brandName } = projectData;
    const ps = this.photoshopService;
    const dimensions = ps.parseSizeValue(size.value);

    if (!dimensions) {
      throw new Error(`Érvénytelen méret: ${size.value}`);
    }

    const personsData = persons.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      photoUrl: p.photoUrl,
    }));

    // 0. PSD létezés ellenőrzés — ha létezik, bezárjuk PS-ben (a generátor felülírja)
    onStep(0);
    this.logger.info(`[Batch PSD] Ellenőrzés: ${job.projectName}, személyek: ${personsData.length}, méret: ${size.value}`);
    const existsCheck = await ps.checkPsdExists(psdPath);
    if (existsCheck.exists) {
      this.logger.info(`[Batch PSD] PSD már létezik, újrageneráljuk: ${psdPath.split('/').pop()}`);
      const existingDocName = psdPath.split('/').pop() ?? undefined;
      await ps.closeDocumentWithoutSaving(existingDocName);
    }
    checkAbort();

    // PSD path signal beállítása
    ps.psdPath.set(psdPath);
    const docName = psdPath.split('/').pop() ?? undefined;

    // 1. PSD generálás és megnyitás
    onStep(1);
    this.logger.info(`[Batch PSD] Generálás: ${docName}`);
    const genResult = await ps.generateAndOpenPsd(size, {
      projectName: job.projectName,
      schoolName: job.schoolName,
      className: job.className,
      brandName,
      persons: personsData.length > 0 ? personsData : undefined,
    });
    if (!genResult.success) {
      throw new Error(genResult.error ?? 'PSD generálás sikertelen');
    }
    checkAbort();

    // 2. Layer nevek javítása (kötőjel → alulvonás) + Guide-ok
    onStep(2);
    this.logger.info(`[Batch PSD] Layer nevek + Guide-ok`);
    await this.fixLayerNames(persons);
    // Várunk hogy a PS feldolgozza
    await new Promise(resolve => setTimeout(resolve, 2000));

    const guideResult = await ps.addGuides(docName);
    if (!guideResult.success) {
      this.logger.warn('[Batch PSD] Guide-ok sikertelen', guideResult.error);
    }
    checkAbort();

    // 3. Felirat layerek
    onStep(3);
    this.logger.info(`[Batch PSD] Feliratok`);
    const subtitles = ps.buildSubtitles({
      schoolName: job.schoolName,
      className: job.className,
      classYear: job.classYear,
    });
    if (subtitles.length > 0) {
      const subResult = await ps.addSubtitleLayers(subtitles, docName);
      if (!subResult.success) {
        this.logger.warn('[Batch PSD] Felirat layerek sikertelen', subResult.error);
      }
    }
    // Várunk a PS-re a következő lépés előtt
    await new Promise(resolve => setTimeout(resolve, 1000));
    checkAbort();

    // 4. Név layerek
    onStep(4);
    this.logger.info(`[Batch PSD] Név layerek: ${personsData.length} fő`);
    if (personsData.length > 0) {
      const nameResult = await ps.addNameLayers(personsData, docName);
      if (!nameResult.success) {
        this.logger.warn('[Batch PSD] Név layerek sikertelen', nameResult.error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    checkAbort();

    // 5. Kép layerek + Tablóelrendezés
    onStep(5);
    this.logger.info(`[Batch PSD] Kép layerek + Elrendezés`);
    if (personsData.length > 0) {
      const imageResult = await ps.addImageLayers(personsData, undefined, docName);
      if (imageResult.success) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const layoutResult = await ps.arrangeTabloLayout(
          { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
          docName,
        );
        if (!layoutResult.success) {
          this.logger.warn('[Batch PSD] Tablóelrendezés sikertelen', layoutResult.error);
        }
      } else {
        this.logger.warn('[Batch PSD] Kép layerek sikertelen', imageResult.error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    checkAbort();

    // 6. Pillanatkép + Mentés és bezárás
    onStep(6);
    this.logger.info(`[Batch PSD] Pillanatkép + Mentés és bezárás`);
    const snapshotResult = await ps.saveSnapshot(
      'batch-initial',
      { widthCm: dimensions.widthCm, heightCm: dimensions.heightCm },
      psdPath,
      docName,
    );
    if (!snapshotResult.success) {
      this.logger.warn('[Batch PSD] Pillanatkép mentés sikertelen (nem kritikus)', snapshotResult.error);
    }

    const closeResult = await ps.saveAndCloseDocument(docName);
    if (!closeResult.success) {
      this.logger.warn('[Batch PSD] Dokumentum bezárás sikertelen', closeResult.error);
    }
    this.logger.info(`[Batch PSD] KÉSZ: ${job.projectName}`);
  }

  /** Layer nevek javítása: kötőjel → alulvonás a slug részben */
  private async fixLayerNames(persons: Array<{ id: number; name: string }>): Promise<void> {
    const renameMap: Array<{ old: string; new: string }> = [];
    for (const p of persons) {
      const stripped = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const badSlug = stripped.replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const goodSlug = stripped.replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
      if (badSlug !== goodSlug) {
        renameMap.push({ old: `${badSlug}---${p.id}`, new: `${goodSlug}---${p.id}` });
      }
    }
    if (renameMap.length > 0) {
      await window.electronAPI?.photoshop.runJsx({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: { renameMap },
      });
    }
  }
}
