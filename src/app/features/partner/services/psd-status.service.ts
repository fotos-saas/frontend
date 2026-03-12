import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';
import { ElectronService } from '@core/services/electron.service';
import { PhotoshopService } from './photoshop.service';
import { BrandingService } from './branding.service';
import { PartnerProjectService } from './partner-project.service';
import { PartnerProjectListItem } from '../models/partner.models';

export interface PsdStatus {
  exists: boolean;
  psdPath: string | null;
  folderPath: string | null;
  hasPlacedPhotos: boolean;
  updatedPhotosCount: number;
  psdLastModified: string | null;
  placedPhotosLastModified: string | null;
}

interface PsdCacheEntry {
  folderPath: string;
  psdPath: string;
  psdLastModified: string;
  placedPhotos: Record<string, number> | null;
  placedPhotosLastModified: string | null;
}

interface PsdCheckResult extends PsdStatus {
  placedPhotos: Record<string, number> | null;
}

@Injectable({ providedIn: 'root' })
export class PsdStatusService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly electron = inject(ElectronService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly projectService = inject(PartnerProjectService);

  readonly statusMap = signal<Map<number, PsdStatus>>(new Map());
  readonly changedPersonIdsMap = signal<Map<number, Set<number>>>(new Map());
  readonly modifiedProjectIds = signal<number[]>([]);
  readonly batchCheckLoading = signal(false);
  readonly loading = signal(false);

  private placedPhotosCache = new Map<number, Record<string, number>>();
  private checkProjectsPromise: Promise<void> | null = null;
  private folderToProjectId = new Map<string, number>();
  private cleanupFns: Array<() => void> = [];
  private watcherInitialized = false;

  getStatus(projectId: number): PsdStatus | null {
    return this.statusMap().get(projectId) ?? null;
  }

  getChangedPersonIds(projectId: number): Set<number> {
    return this.changedPersonIdsMap().get(projectId) ?? new Set();
  }

  async refreshPhotoChanges(
    projectId: number,
    projectContext?: { name: string; schoolName?: string | null; className?: string | null },
  ): Promise<void> {
    if (!this.electron.isElectron) return;

    if (!this.placedPhotosCache.has(projectId) && this.checkProjectsPromise) {
      await this.checkProjectsPromise;
    }

    if (!this.placedPhotosCache.has(projectId) && projectContext) {
      await this.loadPlacedPhotosForProject(projectId, projectContext);
    }

    const placedPhotos = this.placedPhotosCache.get(projectId);
    if (!placedPhotos || Object.keys(placedPhotos).length === 0) return;

    try {
      const result = await firstValueFrom(
        this.projectService.checkPhotoChanges(projectId, placedPhotos),
      );
      const changedIds = [
        ...result.changed.map(c => c.personId),
        ...(result.newPhotos ?? []).map(c => c.personId),
      ];
      const personIdsMap = new Map(this.changedPersonIdsMap());
      personIdsMap.set(projectId, new Set(changedIds));
      this.changedPersonIdsMap.set(personIdsMap);
    } catch (err) {
      this.logger.error(`[PSD] Fotó-változás lekérés hiba #${projectId}:`, err);
    }
  }

  clearUpdatedCount(projectId: number): void {
    const map = this.statusMap();
    const status = map.get(projectId);
    if (status && status.updatedPhotosCount > 0) {
      status.updatedPhotosCount = 0;
      this.statusMap.set(new Map(map));
    }
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

  checkProjects(projects: PartnerProjectListItem[]): Promise<void> {
    this.checkProjectsPromise = this.doCheckProjects(projects);
    return this.checkProjectsPromise;
  }

  async runBatchCheck(): Promise<number[]> {
    if (!this.electron.isElectron) return [];

    this.batchCheckLoading.set(true);
    try {
      const items: Array<{ projectId: number; placedPhotos: Record<string, number> }> = [];
      for (const [projectId, placedPhotos] of this.placedPhotosCache) {
        if (Object.keys(placedPhotos).length > 0) {
          items.push({ projectId, placedPhotos });
        }
      }

      if (items.length === 0) {
        this.modifiedProjectIds.set([]);
        return [];
      }

      const response = await firstValueFrom(this.projectService.batchCheckPhotoChanges(items));
      const ids = response.data.modifiedProjectIds;
      this.modifiedProjectIds.set(ids);
      this.logger.info(`[PSD] Batch check kész: ${ids.length} módosult / ${response.data.checkedCount} ellenőrizve`);
      return ids;
    } catch (err) {
      this.logger.error('[PSD] Batch check hiba:', err);
      return [];
    } finally {
      this.batchCheckLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  private async loadPlacedPhotosForProject(
    projectId: number,
    context: { name: string; schoolName?: string | null; className?: string | null },
  ): Promise<void> {
    try {
      if (!this.ps.workDir()) await this.ps.detectPhotoshop();
      if (!this.ps.workDir()) return;

      const brandName = this.branding.brandName();
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: context.name, schoolName: context.schoolName,
        className: context.className, brandName,
      });
      if (!folderPath) return;

      const result = await this.ps.findProjectPsd(folderPath);
      if (result.exists && result.placedPhotos && Object.keys(result.placedPhotos).length > 0) {
        this.placedPhotosCache.set(projectId, result.placedPhotos);
      }
    } catch (err) {
      this.logger.error(`[PSD] placed-photos betöltés hiba #${projectId}:`, err);
    }
  }

  private async doCheckProjects(projects: PartnerProjectListItem[]): Promise<void> {
    if (!this.electron.isElectron || projects.length === 0) return;

    if (!this.ps.workDir()) await this.ps.detectPhotoshop();
    if (!this.ps.workDir()) return;

    this.loading.set(true);
    try {
      const brandName = this.branding.brandName();
      const cacheEntries = await this.loadFromPsdCache();

      if (cacheEntries.length > 0) {
        this.processFromCache(projects, cacheEntries, brandName);
        this.initWatcherListeners();
      } else {
        await this.checkProjectsViaIpc(projects, brandName);
      }

      this.loading.set(false);

      const statusMap = this.statusMap();
      const placedMaps = new Map<number, Record<string, number>>();
      for (const [projectId, pp] of this.placedPhotosCache) {
        if (statusMap.has(projectId)) placedMaps.set(projectId, pp);
      }
      await this.checkPhotoChangesInBackground(new Map(statusMap), placedMaps);
    } catch (err) {
      this.logger.error('PSD státusz ellenőrzés hiba', err);
      this.loading.set(false);
    }
  }

  private async loadFromPsdCache(): Promise<PsdCacheEntry[]> {
    try {
      const api = (window as any).electronAPI?.psdCache;
      if (!api) return [];
      return await api.getAll();
    } catch { return []; }
  }

  private processFromCache(
    projects: PartnerProjectListItem[], cacheEntries: PsdCacheEntry[], brandName: string | null,
  ): void {
    const cacheMap = new Map<string, PsdCacheEntry>();
    for (const entry of cacheEntries) cacheMap.set(entry.folderPath, entry);

    const newMap = new Map<number, PsdStatus>();
    this.folderToProjectId.clear();

    for (const project of projects) {
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: project.name, schoolName: project.schoolName,
        className: project.className, brandName,
      });
      if (!folderPath) continue;

      this.folderToProjectId.set(folderPath, project.id);
      const cached = cacheMap.get(folderPath);

      if (cached) {
        newMap.set(project.id, {
          exists: true, psdPath: cached.psdPath, folderPath,
          hasPlacedPhotos: cached.placedPhotos !== null, updatedPhotosCount: 0,
          psdLastModified: cached.psdLastModified, placedPhotosLastModified: cached.placedPhotosLastModified,
        });
        if (cached.placedPhotos && Object.keys(cached.placedPhotos).length > 0) {
          this.placedPhotosCache.set(project.id, cached.placedPhotos);
        }
      } else {
        newMap.set(project.id, {
          exists: false, psdPath: null, folderPath,
          hasPlacedPhotos: false, updatedPhotosCount: 0,
          psdLastModified: null, placedPhotosLastModified: null,
        });
      }
    }

    this.buildFullPlacedPhotosCache(cacheEntries);
    this.statusMap.set(newMap);
  }

  private buildFullPlacedPhotosCache(entries: PsdCacheEntry[]): void {
    for (const entry of entries) {
      if (!entry.placedPhotos || Object.keys(entry.placedPhotos).length === 0) continue;
      const projectId = this.folderToProjectId.get(entry.folderPath);
      if (projectId) this.placedPhotosCache.set(projectId, entry.placedPhotos);
    }
  }

  private initWatcherListeners(): void {
    if (this.watcherInitialized) return;
    this.watcherInitialized = true;

    const api = (window as any).electronAPI?.psdCache;
    if (!api) return;

    const cleanupUpdated = api.onUpdated((data: { folderPath: string; entry: PsdCacheEntry }) => {
      const projectId = this.folderToProjectId.get(data.folderPath);
      if (!projectId) return;

      const currentMap = new Map(this.statusMap());
      currentMap.set(projectId, {
        exists: true, psdPath: data.entry.psdPath, folderPath: data.folderPath,
        hasPlacedPhotos: data.entry.placedPhotos !== null,
        updatedPhotosCount: currentMap.get(projectId)?.updatedPhotosCount ?? 0,
        psdLastModified: data.entry.psdLastModified,
        placedPhotosLastModified: data.entry.placedPhotosLastModified,
      });
      this.statusMap.set(currentMap);

      if (data.entry.placedPhotos && Object.keys(data.entry.placedPhotos).length > 0) {
        this.placedPhotosCache.set(projectId, data.entry.placedPhotos);
      }
    });
    this.cleanupFns.push(cleanupUpdated);

    const cleanupRemoved = api.onRemoved((data: { folderPath: string }) => {
      const projectId = this.folderToProjectId.get(data.folderPath);
      if (!projectId) return;

      const currentMap = new Map(this.statusMap());
      currentMap.set(projectId, {
        exists: false, psdPath: null, folderPath: data.folderPath,
        hasPlacedPhotos: false, updatedPhotosCount: 0,
        psdLastModified: null, placedPhotosLastModified: null,
      });
      this.statusMap.set(currentMap);
      this.placedPhotosCache.delete(projectId);
    });
    this.cleanupFns.push(cleanupRemoved);
  }

  private async checkProjectsViaIpc(projects: PartnerProjectListItem[], brandName: string | null): Promise<void> {
    const newMap = new Map<number, PsdStatus>();
    const placedMaps = new Map<number, Record<string, number>>();

    for (let i = 0; i < projects.length; i += 5) {
      const batch = projects.slice(i, i + 5);
      const results = await Promise.all(batch.map(p => this.checkSingleProject(p, brandName)));
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
    for (const [id, pp] of placedMaps) this.placedPhotosCache.set(id, pp);
  }

  private async checkSingleProject(project: PartnerProjectListItem, brandName: string | null): Promise<PsdCheckResult> {
    const noResult: PsdCheckResult = {
      exists: false, psdPath: null, folderPath: null,
      hasPlacedPhotos: false, updatedPhotosCount: 0, placedPhotos: null,
      psdLastModified: null, placedPhotosLastModified: null,
    };

    try {
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: project.name, schoolName: project.schoolName,
        className: project.className, brandName,
      });
      if (!folderPath) return noResult;

      const result = await this.ps.findProjectPsd(folderPath);
      if (!result.exists) return noResult;

      return {
        exists: true, psdPath: result.psdPath, folderPath,
        hasPlacedPhotos: result.hasPlacedPhotos, updatedPhotosCount: 0,
        placedPhotos: result.placedPhotos,
        psdLastModified: null, placedPhotosLastModified: null,
      };
    } catch (err) {
      this.logger.error(`[PSD] #${project.id} hiba`, err);
      return noResult;
    }
  }

  private async checkPhotoChangesInBackground(
    statusMap: Map<number, PsdStatus>, placedMaps: Map<number, Record<string, number>>,
  ): Promise<void> {
    if (placedMaps.size === 0) return;

    const projectIds = [...placedMaps.keys()];
    const batchResults = new Map<number, Set<number>>();
    let hasStatusChanges = false;

    for (let i = 0; i < projectIds.length; i += 3) {
      const batch = projectIds.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(async (projectId) => {
          const placedPhotos = placedMaps.get(projectId)!;
          const result = await firstValueFrom(this.projectService.checkPhotoChanges(projectId, placedPhotos));
          const changedIds = [
            ...result.changed.map(c => c.personId),
            ...(result.newPhotos ?? []).map(c => c.personId),
          ];
          return { projectId, changedCount: changedIds.length, changedIds };
        }),
      );

      for (const r of results) {
        if (r.status === 'rejected') {
          this.logger.error('[PSD] Fotó-változás API hiba:', r.reason);
        } else {
          batchResults.set(r.value.projectId, new Set(r.value.changedIds));
          if (r.value.changedCount > 0) {
            const status = statusMap.get(r.value.projectId);
            if (status) {
              statusMap.set(r.value.projectId, { ...status, updatedPhotosCount: r.value.changedCount });
              hasStatusChanges = true;
            }
          }
        }
      }
    }

    const merged = new Map(this.changedPersonIdsMap());
    for (const [projectId, personIds] of batchResults) merged.set(projectId, personIds);
    this.changedPersonIdsMap.set(merged);

    if (hasStatusChanges) this.statusMap.set(new Map(statusMap));
  }
}
