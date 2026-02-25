import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';
import { ElectronService } from '@core/services/electron.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { PartnerProjectService } from './partner-project.service';
import { PartnerProjectListItem, TabloSize, TabloSizeThreshold } from '../models/partner.models';
import { selectTabloSize } from '@shared/utils/tablo-size.util';

export interface PsdStatus {
  exists: boolean;
  psdPath: string | null;
  folderPath: string | null;
}

/**
 * PSD létezés ellenőrzés a projekt listához.
 * Háttérben ellenőrzi minden projekthez hogy van-e PSD fájl.
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

    this.loading.set(true);

    try {
      // Tablóméretek lekérése (egyszer, cache)
      if (!this.tabloSizesCache) {
        const resp = await firstValueFrom(this.projectService.getTabloSizes());
        this.tabloSizesCache = { sizes: resp.sizes, threshold: resp.threshold };
      }

      const { sizes, threshold } = this.tabloSizesCache;
      const brandName = this.branding.brandName();
      const newMap = new Map<number, PsdStatus>();

      // 5-ösével párhuzamosan
      for (let i = 0; i < projects.length; i += 5) {
        const batch = projects.slice(i, i + 5);
        const results = await Promise.all(
          batch.map(p => this.checkSingleProject(p, sizes, threshold, brandName)),
        );
        results.forEach((status, idx) => {
          newMap.set(batch[idx].id, status);
        });
      }

      this.statusMap.set(newMap);
    } catch (err) {
      this.logger.error('PSD státusz ellenőrzés hiba', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async checkSingleProject(
    project: PartnerProjectListItem,
    sizes: TabloSize[],
    threshold: TabloSizeThreshold | null,
    brandName: string | null,
  ): Promise<PsdStatus> {
    try {
      const size = selectTabloSize(project.personsCount, sizes, threshold);
      if (!size) return { exists: false, psdPath: null, folderPath: null };

      const psdPath = await this.ps.computePsdPath(size.value, {
        projectName: project.name,
        schoolName: project.schoolName,
        className: project.className,
        brandName,
      });
      if (!psdPath) return { exists: false, psdPath: null, folderPath: null };

      const result = await this.ps.checkPsdExists(psdPath);
      const folderPath = psdPath.substring(0, psdPath.lastIndexOf('/'));

      return { exists: result.exists, psdPath, folderPath };
    } catch {
      return { exists: false, psdPath: null, folderPath: null };
    }
  }
}
