import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PartnerService } from '../../../services/partner.service';
import { ElectronPortraitService } from '../../../../../core/services/electron-portrait.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { TabloPersonItem } from '../persons-modal.types';
import { PortraitSettings, PortraitSettingsResponse } from '../../../models/portrait.models';
import { PortraitProcessingSettings } from '../../../../../core/services/electron.types';

/** Batch feldolgozás fázis */
export type BatchPhase = 'idle' | 'downloading' | 'processing' | 'uploading' | 'done' | 'error';

/** Egyedi személy eredménye */
export interface BatchPersonResult {
  personId: number;
  personName: string;
  success: boolean;
  error?: string;
}

/** Összesített eredmény */
export interface BatchResult {
  successful: number;
  failed: number;
}

const UPLOAD_CONCURRENCY = 3;

@Injectable()
export class BatchPortraitActionsService {
  private readonly partnerService = inject(PartnerService);
  private readonly portraitService = inject(ElectronPortraitService);
  private readonly logger = inject(LoggerService);

  // ============ Kijelölés mód ============

  readonly selectionMode = signal(false);
  readonly selectedPersonIds = signal<Set<number>>(new Set());

  /** Kijelölhető személyek (akiknek VAN fotójuk) */
  readonly selectablePersons = computed(() => (persons: TabloPersonItem[]) =>
    persons.filter(p => p.hasPhoto && (p.photoUrl || p.photoThumbUrl))
  );

  readonly selectedCount = computed(() => this.selectedPersonIds().size);

  toggleSelectionMode(): void {
    if (this.selectionMode()) {
      this.selectionMode.set(false);
      this.selectedPersonIds.set(new Set());
    } else {
      this.selectionMode.set(true);
    }
  }

  togglePersonSelection(personId: number): void {
    const current = new Set(this.selectedPersonIds());
    if (current.has(personId)) {
      current.delete(personId);
    } else {
      current.add(personId);
    }
    this.selectedPersonIds.set(current);
  }

  toggleSelectAll(selectablePersons: TabloPersonItem[]): void {
    const selectableIds = selectablePersons.map(p => p.id);
    const current = this.selectedPersonIds();
    const allSelected = selectableIds.every(id => current.has(id));

    if (allSelected) {
      this.selectedPersonIds.set(new Set());
    } else {
      this.selectedPersonIds.set(new Set(selectableIds));
    }
  }

  isAllSelected(selectablePersons: TabloPersonItem[]): boolean {
    if (selectablePersons.length === 0) return false;
    const current = this.selectedPersonIds();
    return selectablePersons.every(p => current.has(p.id));
  }

  resetSelection(): void {
    this.selectionMode.set(false);
    this.selectedPersonIds.set(new Set());
  }

  // ============ Batch feldolgozás ============

  readonly phase = signal<BatchPhase>('idle');
  readonly progress = signal(0);
  readonly currentStep = signal('');
  readonly results = signal<BatchPersonResult[]>([]);

  /** Teljes batch feldolgozás futtatása */
  async processAll(persons: TabloPersonItem[], projectId: number): Promise<BatchResult> {
    this.phase.set('downloading');
    this.progress.set(0);
    this.currentStep.set('Beállítások betöltése...');
    this.results.set([]);

    try {
      // 1. Portrait settings betöltése
      const settingsResponse = await firstValueFrom(this.partnerService.getPortraitSettings());
      if (!settingsResponse.success || !settingsResponse.data.enabled) {
        this.phase.set('error');
        this.currentStep.set('A portré háttércsere nincs engedélyezve a beállításokban.');
        return { successful: 0, failed: persons.length };
      }

      const settings = settingsResponse.data.settings;
      const backgroundImageUrl = settingsResponse.data.background_image_url;

      // 2. Temp könyvtár lekérése
      const tempDir = await this.portraitService.getTempDir();
      if (!tempDir) {
        this.phase.set('error');
        this.currentStep.set('Temp könyvtár nem elérhető.');
        return { successful: 0, failed: persons.length };
      }

      // 3. Ha background_type === 'image' → háttérkép letöltése
      let localBgPath: string | undefined;
      if (settings.background_type === 'image' && backgroundImageUrl) {
        this.currentStep.set('Háttérkép letöltése...');
        const bgResult = await this.portraitService.downloadBackground(
          backgroundImageUrl,
          `${tempDir}/background_${Date.now()}.jpg`,
        );
        if (!bgResult.success || !bgResult.path) {
          this.phase.set('error');
          this.currentStep.set('Háttérkép letöltése sikertelen: ' + (bgResult.error || 'ismeretlen hiba'));
          return { successful: 0, failed: persons.length };
        }
        localBgPath = bgResult.path;
      }

      // 4. Személyek fotóinak letöltése
      this.currentStep.set('Fotók letöltése...');
      const downloadedItems: Array<{
        person: TabloPersonItem;
        inputPath: string;
        outputPath: string;
      }> = [];

      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const photoUrl = person.photoUrl || person.photoThumbUrl;
        if (!photoUrl) continue;

        const ext = this.getExtension(photoUrl);
        const inputPath = `${tempDir}/input_${person.id}_${Date.now()}${ext}`;
        const outputPath = `${tempDir}/output_${person.id}_${Date.now()}${ext}`;

        const dlResult = await this.portraitService.downloadBackground(photoUrl, inputPath);
        if (dlResult.success && dlResult.path) {
          downloadedItems.push({ person, inputPath: dlResult.path, outputPath });
        } else {
          this.results.update(r => [...r, {
            personId: person.id, personName: person.name, success: false,
            error: 'Fotó letöltése sikertelen',
          }]);
        }

        this.progress.set(Math.round(((i + 1) / persons.length) * 30));
      }

      if (downloadedItems.length === 0) {
        this.phase.set('error');
        this.currentStep.set('Egyetlen fotó sem volt letölthető.');
        return { successful: 0, failed: persons.length };
      }

      // 5. Python feldolgozás (batch)
      this.phase.set('processing');
      this.progress.set(30);
      this.currentStep.set('Feldolgozás folyamatban...');

      const processingSettings = this.buildProcessingSettings(settings, localBgPath);
      const batchItems = downloadedItems.map(item => ({
        input: item.inputPath,
        output: item.outputPath,
      }));

      const batchResult = await this.portraitService.processBatch(batchItems, processingSettings);

      this.progress.set(65);

      if (!batchResult.success && !batchResult.results) {
        this.phase.set('error');
        this.currentStep.set('Feldolgozás sikertelen: ' + (batchResult.error || 'ismeretlen hiba'));
        return { successful: 0, failed: persons.length };
      }

      // Feldolgozás eredmények párosítása
      const processedItems: Array<{
        person: TabloPersonItem;
        outputPath: string;
      }> = [];

      if (batchResult.results) {
        for (let i = 0; i < batchResult.results.length; i++) {
          const result = batchResult.results[i];
          const item = downloadedItems[i];
          if (result.success && result.output) {
            processedItems.push({ person: item.person, outputPath: result.output });
          } else {
            this.results.update(r => [...r, {
              personId: item.person.id, personName: item.person.name,
              success: false, error: result.error || 'Feldolgozás sikertelen',
            }]);
          }
        }
      }

      // 6. Feldolgozott képek feltöltése (concurrency-limited)
      this.phase.set('uploading');
      this.currentStep.set('Feltöltés...');

      let successCount = 0;
      let failCount = this.results().filter(r => !r.success).length;

      for (let i = 0; i < processedItems.length; i += UPLOAD_CONCURRENCY) {
        const chunk = processedItems.slice(i, i + UPLOAD_CONCURRENCY);

        const uploadResults = await Promise.allSettled(
          chunk.map(async (item) => {
            // Fájl beolvasása
            const readResult = await this.portraitService.readProcessedFile({ filePath: item.outputPath });
            if (!readResult.success || !readResult.data) {
              throw new Error(readResult.error || 'Fájl olvasási hiba');
            }

            // ArrayBuffer → File
            const blob = new Blob([readResult.data], { type: 'image/jpeg' });
            const file = new File([blob], `portrait_${item.person.id}.jpg`, { type: 'image/jpeg' });

            // Feltöltés
            const uploadResult = await firstValueFrom(
              this.partnerService.uploadPersonPhoto(projectId, item.person.id, file),
            );

            if (!uploadResult.success) {
              throw new Error('Feltöltés sikertelen');
            }

            return item;
          }),
        );

        for (let j = 0; j < uploadResults.length; j++) {
          const result = uploadResults[j];
          const item = chunk[j];
          if (result.status === 'fulfilled') {
            successCount++;
            this.results.update(r => [...r, {
              personId: item.person.id, personName: item.person.name, success: true,
            }]);
          } else {
            failCount++;
            this.results.update(r => [...r, {
              personId: item.person.id, personName: item.person.name,
              success: false, error: result.reason?.message || 'Feltöltés sikertelen',
            }]);
          }
        }

        this.progress.set(65 + Math.round(((i + chunk.length) / processedItems.length) * 35));
      }

      // 7. Cleanup
      this.currentStep.set('Takarítás...');
      const allTempFiles = [
        ...downloadedItems.map(i => i.inputPath),
        ...downloadedItems.map(i => i.outputPath),
        ...(localBgPath ? [localBgPath] : []),
      ];
      await this.portraitService.cleanupTemp(allTempFiles);

      // 8. Kész
      this.phase.set('done');
      this.progress.set(100);
      this.currentStep.set(
        successCount > 0
          ? `${successCount} kép sikeresen feldolgozva`
          : 'Minden feldolgozás sikertelen',
      );

      return { successful: successCount, failed: failCount };
    } catch (error: unknown) {
      this.logger.error('Batch portrait feldolgozás hiba:', error);
      this.phase.set('error');
      this.currentStep.set('Váratlan hiba: ' + (error instanceof Error ? error.message : 'ismeretlen'));
      return { successful: 0, failed: persons.length };
    }
  }

  /** Processing settings összeállítása a backend settings-ből */
  private buildProcessingSettings(settings: PortraitSettings, bgImagePath?: string): PortraitProcessingSettings {
    return {
      mode: settings.mode,
      background_type: settings.background_type,
      preset_name: settings.preset_name,
      background_image_path: bgImagePath || settings.background_type === 'image' ? bgImagePath : null,
      color_r: settings.color_r,
      color_g: settings.color_g,
      color_b: settings.color_b,
      gradient_start_r: settings.gradient_start_r,
      gradient_start_g: settings.gradient_start_g,
      gradient_start_b: settings.gradient_start_b,
      gradient_end_r: settings.gradient_end_r,
      gradient_end_g: settings.gradient_end_g,
      gradient_end_b: settings.gradient_end_b,
      gradient_direction: settings.gradient_direction,
      edge_inset: settings.edge_inset,
      feather_radius: settings.feather_radius,
      decontaminate: settings.decontaminate,
      decontaminate_strength: settings.decontaminate_strength,
      hair_refinement: settings.hair_refinement,
      hair_refinement_strength: settings.hair_refinement_strength,
      edge_smoothing: settings.edge_smoothing,
      add_shadow: settings.add_shadow,
      shadow_opacity: settings.shadow_opacity,
      darken_amount: settings.darken_amount,
      target_brightness: settings.target_brightness,
      output_quality: settings.output_quality,
    };
  }

  /** Fájlkiterjesztés kinyerése URL-ből */
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
