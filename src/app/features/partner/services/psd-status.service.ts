import { Injectable, inject, signal } from '@angular/core';
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
 * A mappa path-ot egyszer számolja ki (schoolName + className),
 * majd az electron handler keresi meg az első .psd fájlt a mappában.
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
  /** Projekt ID → módosult személy ID-k halmaza */
  readonly changedPersonIdsMap = signal<Map<number, Set<number>>>(new Map());
  /** Projekt ID → placed-photos.json tartalom (person→media mapping) */
  private placedPhotosCache = new Map<number, Record<string, number>>();
  /** A teljes checkProjects folyamat promise-ja (PSD keresés + háttér API check) */
  private checkProjectsPromise: Promise<void> | null = null;
  readonly loading = signal(false);

  getStatus(projectId: number): PsdStatus | null {
    return this.statusMap().get(projectId) ?? null;
  }

  /** Módosult személy ID-k lekérése egy projekthez */
  getChangedPersonIds(projectId: number): Set<number> {
    return this.changedPersonIdsMap().get(projectId) ?? new Set();
  }

  /**
   * Egy projekt fotóváltozásainak friss lekérése.
   * Ha nincs placed-photos cache, megvárja a checkProjects-et,
   * vagy ha az sem fut, saját maga tölti be a placed-photos.json-t IPC-n keresztül.
   * MINDIG frissen kéri le a backendet (nem cache-el).
   */
  async refreshPhotoChanges(
    projectId: number,
    projectContext?: { name: string; schoolName?: string | null; className?: string | null },
  ): Promise<void> {
    if (!this.electron.isElectron) return;

    // Ha nincs cache, megvárjuk a checkProjects-et
    if (!this.placedPhotosCache.has(projectId) && this.checkProjectsPromise) {
      await this.checkProjectsPromise;
    }

    // Ha továbbra sincs cache, és van projekt context, saját magunk töltjük be
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

  /** Badge nullázása egy projekt frissítése után */
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

  /**
   * Egyetlen projekt placed-photos.json betöltése IPC-n keresztül.
   * Csak akkor hívódik ha nincs cache (pl. részletek oldalon F5 után).
   */
  private async loadPlacedPhotosForProject(
    projectId: number,
    context: { name: string; schoolName?: string | null; className?: string | null },
  ): Promise<void> {
    try {
      if (!this.ps.workDir()) {
        await this.ps.detectPhotoshop();
      }
      if (!this.ps.workDir()) return;

      const brandName = this.branding.brandName();
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: context.name,
        schoolName: context.schoolName,
        className: context.className,
        brandName,
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

  checkProjects(projects: PartnerProjectListItem[]): Promise<void> {
    this.checkProjectsPromise = this.doCheckProjects(projects);
    return this.checkProjectsPromise;
  }

  private async doCheckProjects(projects: PartnerProjectListItem[]): Promise<void> {
    if (!this.electron.isElectron || projects.length === 0) return;

    if (!this.ps.workDir()) {
      await this.ps.detectPhotoshop();
    }
    if (!this.ps.workDir()) {
      return;
    }

    this.loading.set(true);

    try {
      const brandName = this.branding.brandName();
      const newMap = new Map<number, PsdStatus>();
      const placedMaps = new Map<number, Record<string, number>>();

      // 5-ösével párhuzamosan — egyetlen IPC hívás per projekt
      for (let i = 0; i < projects.length; i += 5) {
        const batch = projects.slice(i, i + 5);
        const results = await Promise.all(
          batch.map(p => this.checkSingleProject(p, brandName)),
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
      this.placedPhotosCache = placedMaps;
      this.loading.set(false);

      // Fotó-változások ellenőrzése háttérben (nem blokkolja a lista megjelenítést)
      await this.checkPhotoChangesInBackground(newMap, placedMaps);
    } catch (err) {
      this.logger.error('PSD státusz ellenőrzés hiba', err);
      this.loading.set(false);
    }
  }

  /** Egyetlen projekt ellenőrzése — mappa keresés, nem size iteráció */
  private async checkSingleProject(
    project: PartnerProjectListItem,
    brandName: string | null,
  ): Promise<PsdCheckResult> {
    const noResult: PsdCheckResult = {
      exists: false, psdPath: null, folderPath: null,
      hasPlacedPhotos: false, updatedPhotosCount: 0, placedPhotos: null,
    };

    try {
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: project.name,
        schoolName: project.schoolName,
        className: project.className,
        brandName,
      });
      if (!folderPath) return noResult;

      const result = await this.ps.findProjectPsd(folderPath);
      if (!result.exists) return noResult;

      return {
        exists: true,
        psdPath: result.psdPath,
        folderPath,
        hasPlacedPhotos: result.hasPlacedPhotos,
        updatedPhotosCount: 0,
        placedPhotos: result.placedPhotos,
      };
    } catch (err) {
      this.logger.error(`[PSD] #${project.id} hiba`, err);
      return noResult;
    }
  }

  /**
   * Háttérben ellenőrzi a fotóváltozásokat a backend API-val.
   * A placed-photos.json tartalmát (personId->mediaId) elküldi a backendnek,
   * ami összehasonlítja az aktuális effective media ID-kkel.
   */
  private async checkPhotoChangesInBackground(
    statusMap: Map<number, PsdStatus>,
    placedMaps: Map<number, Record<string, number>>,
  ): Promise<void> {
    if (placedMaps.size === 0) return;

    const projectIds = [...placedMaps.keys()];
    const batchResults = new Map<number, Set<number>>();
    let hasStatusChanges = false;

    // 3-asával párhuzamosan — eredményeket gyűjtjük
    for (let i = 0; i < projectIds.length; i += 3) {
      const batch = projectIds.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(async (projectId) => {
          const placedPhotos = placedMaps.get(projectId)!;
          const result = await firstValueFrom(
            this.projectService.checkPhotoChanges(projectId, placedPhotos),
          );
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

    // Egyszer a végén merge-öljük a meglévő adattal (nem felülírjuk!)
    const merged = new Map(this.changedPersonIdsMap());
    for (const [projectId, personIds] of batchResults) {
      merged.set(projectId, personIds);
    }
    this.changedPersonIdsMap.set(merged);

    if (hasStatusChanges) {
      this.statusMap.set(new Map(statusMap));
    }
  }
}
