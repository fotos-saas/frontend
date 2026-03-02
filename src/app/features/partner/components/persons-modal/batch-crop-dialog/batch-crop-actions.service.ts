import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PartnerService } from '../../../services/partner.service';
import { ElectronCropService } from '../../../../../core/services/electron-crop.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { TabloPersonItem } from '../persons-modal.types';
import { CropSettings } from '../../../models/crop.models';
import type { CropFaceLandmarks, CropQualityScores } from '../../../../../core/services/electron.types';

/** Batch crop fázisok */
export type CropPhase = 'idle' | 'downloading' | 'detecting' | 'cropping' | 'review' | 'uploading' | 'done' | 'error';

/** Review item: egy személy vágás eredménye */
export interface CropReviewItem {
  personId: number;
  personName: string;
  inputPath: string;
  outputPath: string;
  thumbnailPath: string;
  face: CropFaceLandmarks | null;
  quality: CropQualityScores | null;
  hasFace: boolean;
  eyesClosed: boolean;
  isBlurry: boolean;
  excluded: boolean;
  error?: string;
}

const UPLOAD_CONCURRENCY = 3;

@Injectable()
export class BatchCropActionsService {
  private readonly partnerService = inject(PartnerService);
  private readonly cropService = inject(ElectronCropService);
  private readonly logger = inject(LoggerService);

  readonly phase = signal<CropPhase>('idle');
  readonly progress = signal(0);
  readonly currentStep = signal('');
  readonly reviewItems = signal<CropReviewItem[]>([]);
  readonly uploadResults = signal<Array<{ personId: number; personName: string; success: boolean; error?: string }>>([]);

  readonly includedCount = computed(() => this.reviewItems().filter(i => !i.excluded && i.hasFace).length);
  readonly excludedCount = computed(() => this.reviewItems().filter(i => i.excluded || !i.hasFace).length);

  /** Is closable? */
  readonly isClosable = computed(() => {
    const p = this.phase();
    return p === 'idle' || p === 'review' || p === 'done' || p === 'error';
  });

  readonly needsCloseConfirm = computed(() => this.phase() === 'review');

  private tempDir = '';
  private cropSettings: CropSettings | null = null;
  private allTempFiles: string[] = [];

  /** Teljes batch: letöltés → detektálás → vágás → review */
  async detectAndCrop(persons: TabloPersonItem[], projectId: number): Promise<void> {
    this.phase.set('downloading');
    this.progress.set(0);
    this.currentStep.set('Beállítások betöltése...');
    this.reviewItems.set([]);
    this.uploadResults.set([]);
    this.allTempFiles = [];

    try {
      // 1. Crop settings betöltése
      const settingsResponse = await firstValueFrom(this.partnerService.getCropSettings());
      if (!settingsResponse.success || !settingsResponse.data.enabled) {
        this.phase.set('error');
        this.currentStep.set('Az automatikus vágás nincs engedélyezve a beállításokban.');
        return;
      }
      this.cropSettings = settingsResponse.data.settings;

      // 2. Temp könyvtár
      const tempDir = await this.cropService.getTempDir();
      if (!tempDir) {
        this.phase.set('error');
        this.currentStep.set('Temp könyvtár nem elérhető.');
        return;
      }
      this.tempDir = tempDir;

      // 3. Fotók letöltése
      this.currentStep.set('Fotók letöltése...');
      const downloadedItems: Array<{
        person: TabloPersonItem;
        inputPath: string;
      }> = [];

      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const photoUrl = person.photoUrl || person.photoThumbUrl;
        if (!photoUrl) continue;

        const ext = this.getExtension(photoUrl);
        const inputPath = `${tempDir}/crop_input_${person.id}_${Date.now()}${ext}`;

        const dlResult = await this.cropService.downloadPhoto(photoUrl, inputPath);
        if (dlResult.success && dlResult.path) {
          downloadedItems.push({ person, inputPath: dlResult.path });
          this.allTempFiles.push(dlResult.path);
        } else {
          this.logger.error(`Fotó letöltés sikertelen: ${person.name}`, dlResult.error);
        }

        this.progress.set(Math.round(((i + 1) / persons.length) * 25));
      }

      if (downloadedItems.length === 0) {
        this.phase.set('error');
        this.currentStep.set('Egyetlen fotó sem volt letölthető.');
        return;
      }

      // 4. Arc detektálás (batch)
      this.phase.set('detecting');
      this.progress.set(25);
      this.currentStep.set('Arc detektálás...');

      const batchDetect = await this.cropService.detectBatch(
        downloadedItems.map(item => ({ input: item.inputPath })),
      );

      this.progress.set(50);

      if (!batchDetect.success || !batchDetect.results) {
        this.phase.set('error');
        this.currentStep.set('Arc detektálás sikertelen: ' + (batchDetect.error || 'ismeretlen hiba'));
        return;
      }

      // 5. Vágás (Sharp, batch)
      this.phase.set('cropping');
      this.currentStep.set('Képek vágása...');

      const cropItems: Array<{
        inputPath: string;
        outputPath: string;
        thumbnailPath: string;
        face: CropFaceLandmarks;
      }> = [];

      const reviewList: CropReviewItem[] = [];

      for (let i = 0; i < batchDetect.results.length; i++) {
        const detectResult = batchDetect.results[i];
        const item = downloadedItems[i];

        if (!detectResult.success || !detectResult.faces?.length) {
          // Nincs arc
          reviewList.push({
            personId: item.person.id,
            personName: item.person.name,
            inputPath: item.inputPath,
            outputPath: '',
            thumbnailPath: '',
            face: null,
            quality: detectResult.quality || null,
            hasFace: false,
            eyesClosed: false,
            isBlurry: detectResult.quality?.is_blurry || false,
            excluded: this.cropSettings?.no_face_action === 'skip',
            error: 'Nem található arc',
          });
          continue;
        }

        // Legnagyobb (vagy első) arc kiválasztása
        const faceIdx = this.cropSettings?.multi_face_action === 'first' ? 0 : 0; // Már rendezve van (largest first)
        const face = detectResult.faces[faceIdx];

        const outputPath = `${tempDir}/crop_out_${item.person.id}_${Date.now()}.jpg`;
        const thumbnailPath = `${tempDir}/crop_thumb_${item.person.id}_${Date.now()}.jpg`;

        this.allTempFiles.push(outputPath, thumbnailPath);

        cropItems.push({
          inputPath: item.inputPath,
          outputPath,
          thumbnailPath,
          face,
        });

        reviewList.push({
          personId: item.person.id,
          personName: item.person.name,
          inputPath: item.inputPath,
          outputPath,
          thumbnailPath,
          face,
          quality: detectResult.quality || null,
          hasFace: true,
          eyesClosed: face.eyes_closed,
          isBlurry: detectResult.quality?.is_blurry || false,
          excluded: false,
        });
      }

      // Sharp batch vágás
      if (cropItems.length > 0) {
        const cropResult = await this.cropService.executeBatchCrop(cropItems, this.cropSettings!);
        this.progress.set(80);

        if (cropResult.success && cropResult.results) {
          // Crop eredmények párosítása
          for (let i = 0; i < cropResult.results.length; i++) {
            const result = cropResult.results[i];
            if (!result.success) {
              const review = reviewList.find(r => r.outputPath === cropItems[i].outputPath);
              if (review) {
                review.error = result.error || 'Vágás sikertelen';
                review.excluded = true;
              }
            }
          }
        } else {
          this.phase.set('error');
          this.currentStep.set('Vágás sikertelen: ' + (cropResult.error || 'ismeretlen hiba'));
          return;
        }
      }

      // 6. Review fázis
      this.reviewItems.set(reviewList);
      this.phase.set('review');
      this.progress.set(100);
      this.currentStep.set(`${reviewList.filter(r => r.hasFace && !r.excluded).length} kép kész az átnézésre`);

    } catch (error: unknown) {
      this.logger.error('Batch crop hiba:', error);
      this.phase.set('error');
      this.currentStep.set('Váratlan hiba: ' + (error instanceof Error ? error.message : 'ismeretlen'));
    }
  }

  /** Review: elem kizárása / visszavétele */
  toggleExclude(personId: number): void {
    this.reviewItems.update(items =>
      items.map(item =>
        item.personId === personId
          ? { ...item, excluded: !item.excluded }
          : item,
      ),
    );
  }

  /** Feltöltés: az elfogadott (nem kizárt) képek feltöltése */
  async uploadAccepted(projectId: number, archiveMode: 'archive' | 'project_only' = 'archive'): Promise<void> {
    const accepted = this.reviewItems().filter(i => !i.excluded && i.hasFace && i.outputPath);
    if (accepted.length === 0) {
      this.phase.set('done');
      this.currentStep.set('Nincs feltölthető kép.');
      return;
    }

    this.phase.set('uploading');
    this.progress.set(0);
    this.currentStep.set('Feltöltés...');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < accepted.length; i += UPLOAD_CONCURRENCY) {
      const chunk = accepted.slice(i, i + UPLOAD_CONCURRENCY);

      const results = await Promise.allSettled(
        chunk.map(async (item) => {
          const readResult = await this.cropService.readProcessedFile(item.outputPath);
          if (!readResult.success || !readResult.data) {
            throw new Error(readResult.error || 'Fájl olvasási hiba');
          }

          const blob = new Blob([readResult.data], { type: 'image/jpeg' });
          const file = new File([blob], `crop_${item.personId}.jpg`, { type: 'image/jpeg' });

          const uploadResult = await firstValueFrom(
            this.partnerService.uploadPersonPhoto(projectId, item.personId, file, {
              archiveMode,
              isCropProcessed: true,
            }),
          );

          if (!uploadResult.success) {
            throw new Error('Feltöltés sikertelen');
          }
          return item;
        }),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const item = chunk[j];
        if (result.status === 'fulfilled') {
          successCount++;
          this.uploadResults.update(r => [...r, {
            personId: item.personId, personName: item.personName, success: true,
          }]);
        } else {
          failCount++;
          this.uploadResults.update(r => [...r, {
            personId: item.personId, personName: item.personName,
            success: false, error: result.reason?.message || 'Feltöltés sikertelen',
          }]);
        }
      }

      this.progress.set(Math.round(((i + chunk.length) / accepted.length) * 100));
    }

    // Cleanup
    await this.cropService.cleanupTemp(this.allTempFiles);

    this.phase.set('done');
    this.currentStep.set(
      successCount > 0
        ? `${successCount} kép sikeresen feltöltve`
        : 'Minden feltöltés sikertelen',
    );
  }

  private getExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const ext = pathname.substring(pathname.lastIndexOf('.'));
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
    } catch {
      return '.jpg';
    }
  }
}
