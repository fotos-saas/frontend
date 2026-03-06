import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';
import { ElectronService } from '@core/services/electron.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { PartnerProjectService } from './partner-project.service';
import { PartnerProjectListItem, TabloSize, TabloSizeThreshold } from '../models/partner.models';
import { resolveProjectTabloSize } from '@shared/utils/tablo-size.util';

export interface PsdStatus {
  exists: boolean;
  psdPath: string | null;
  folderPath: string | null;
  hasPlacedPhotos: boolean;
  /** Hány személy fotója változott a PSD-be helyezés óta */
  updatedPhotosCount: number;
}

interface PsdCheckResult extends PsdStatus {
  placedPhotos: Record<string, number> | null;
}

/**
 * PSD létezés ellenőrzés a projekt listához.
 * Háttérben ellenőrzi minden projekthez hogy van-e PSD fájl.
 * Ha van placed-photos.json, a backend API-val összehasonlítja az aktuális fotókkal.
 *
 * FONTOS: Csak akkor működik, ha a workDir be van állítva a PhotoshopService-ben.
 */
@Injectable({
  providedIn: 'root',
})
export class PsdStatusService {
  private readonly logger = inject(LoggerService);
  private readonly electron = inject(ElectronService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly projectService = inject(PartnerProjectService);

  readonly statusMap = signal<Map<number, PsdStatus>>(new Map());
  readonly loading = signal(false);

  private tabloSizesCache: { sizes: TabloSize[]; threshold: TabloSizeThreshold | null } | null = null;

  getStatus(projectId: number): PsdStatus | null {
    return this.statusMap().get(projectId) ?? null;
  }

  openInPhotoshop(projectId: number): void {
    const status = this.getStatus(projectId);
    if (status?.exists && status.psdPath) {
      this.ps.openPsdFile(status.psdPath);
    }
  }

  revealFolder(projectId: number): void {
    const status = this.getStatus(projectId);
    if (status?.exists && status.psdPath) {
      this.ps.revealInFinder(status.psdPath);
    }
  }

  async checkProjects(projects: PartnerProjectListItem[]): Promise<void> {
    if (!this.electron.isElectron || projects.length === 0) return;

    if (!this.ps.workDir()) {
      await this.ps.detectPhotoshop();
    }
    if (!this.ps.workDir()) {
      this.logger.warn('[PSD] workDir nem elérhető, PSD ellenőrzés kihagyva');
      return;
    }
    this.logger.info(`[PSD] checkProjects: ${projects.length} projekt, workDir=${this.ps.workDir()}`);

    this.loading.set(true);

    try {
      if (!this.tabloSizesCache) {
        const resp = await firstValueFrom(this.projectService.getTabloSizes());
        this.tabloSizesCache = { sizes: resp.sizes, threshold: resp.threshold };
      }

      const { sizes, threshold } = this.tabloSizesCache;
      const brandName = this.branding.brandName();
      const newMap = new Map<number, PsdStatus>();
      const placedMaps = new Map<number, Record<string, number>>();

      // 5-ösével párhuzamosan — PSD létezés + placed-photos.json beolvasás
      for (let i = 0; i < projects.length; i += 5) {
        const batch = projects.slice(i, i + 5);
        const results = await Promise.all(
          batch.map(p => this.checkSingleProject(p, sizes, threshold, brandName)),
        );
        results.forEach((result, idx) => {
          const projectId = batch[idx].id;
          const { placedPhotos, ...status } = result;
          newMap.set(projectId, status);
          if (placedPhotos && Object.keys(placedPhotos).length > 0) {
            placedMaps.set(projectId, placedPhotos);
          }
        });
      }

      this.statusMap.set(newMap);
      this.loading.set(false);

      // Fotó-változások ellenőrzése háttérben (nem blokkolja a lista megjelenítést)
      this.checkPhotoChangesInBackground(projects, newMap, placedMaps);
    } catch (err) {
      this.logger.error('PSD státusz ellenőrzés hiba', err);
      this.loading.set(false);
    }
  }

  private async checkSingleProject(
    project: PartnerProjectListItem,
    sizes: TabloSize[],
    threshold: TabloSizeThreshold | null,
    brandName: string | null,
  ): Promise<PsdCheckResult> {
    const noResult: PsdCheckResult = {
      exists: false, psdPath: null, folderPath: null,
      hasPlacedPhotos: false, updatedPhotosCount: 0, placedPhotos: null,
    };

    try {
      const context = {
        projectName: project.name,
        schoolName: project.schoolName,
        className: project.className,
        brandName,
      };

      const preferredSize = resolveProjectTabloSize(project, sizes, threshold);
      const orderedSizes = preferredSize
        ? [preferredSize, ...sizes.filter(s => s.value !== preferredSize.value)]
        : sizes;

      for (const size of orderedSizes) {
        const psdPath = await this.ps.computePsdPath(size.value, context);
        if (!psdPath) continue;

        const result = await this.ps.checkPsdExists(psdPath);
        if (result.exists) {
          const folderPath = psdPath.substring(0, psdPath.lastIndexOf('/'));
          return {
            exists: true,
            psdPath,
            folderPath,
            hasPlacedPhotos: result.hasPlacedPhotos,
            updatedPhotosCount: 0,
            placedPhotos: result.placedPhotos,
          };
        }
      }

      return noResult;
    } catch (err) {
      this.logger.error(`[PSD] #${project.id} hiba`, err);
      return noResult;
    }
  }

  /**
   * Háttérben ellenőrzi a fotóváltozásokat a backend API-val.
   * A placed-photos.json tartalmát (personId→mediaId) elküldi a backendnek,
   * ami összehasonlítja az aktuális effective media ID-kkel.
   */
  private async checkPhotoChangesInBackground(
    projects: PartnerProjectListItem[],
    statusMap: Map<number, PsdStatus>,
    placedMaps: Map<number, Record<string, number>>,
  ): Promise<void> {
    if (placedMaps.size === 0) return;

    const projectIds = [...placedMaps.keys()];
    let hasUpdates = false;

    // 3-asával párhuzamosan
    for (let i = 0; i < projectIds.length; i += 3) {
      const batch = projectIds.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(async (projectId) => {
          const placedPhotos = placedMaps.get(projectId)!;
          const result = await firstValueFrom(
            this.projectService.checkPhotoChanges(projectId, placedPhotos),
          );
          return { projectId, changedCount: result.changed.length };
        }),
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.changedCount > 0) {
          const status = statusMap.get(r.value.projectId);
          if (status) {
            status.updatedPhotosCount = r.value.changedCount;
            hasUpdates = true;
          }
        }
      }
    }

    if (hasUpdates) {
      this.statusMap.set(new Map(statusMap));
    }
  }
}
