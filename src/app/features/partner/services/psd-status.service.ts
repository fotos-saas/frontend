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
  /** Hány személy fotója változott a PSD-be helyezés óta */
  updatedPhotosCount: number;
  /** PSD fájl utolsó mentésének időpontja (ISO string) */
  psdLastModified: string | null;
  /** placed-photos.json utolsó módosításának időpontja (ISO string) */
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

/**
 * PSD létezés + fotóváltozás ellenőrzés a projekt listához.
 *
 * Két üzemmód:
 * 1. **Cache mód** (Electron + PsdCacheService fut): A chokidar watcher cache-éből
 *    olvassa a PSD adatokat. Azonnal elérhető, valós idejű.
 * 2. **Fallback mód** (régi): Egyesével IPC-vel kéri le a PSD-ket.
 *
 * A "Módosult PSD" szűrőhöz batch API-val ellenőrzi az összes placed-photos-t,
 * és a modifiedProjectIds signal-ban tárolja az eredményt.
 */
@Injectable({
  providedIn: 'root',
})
export class PsdStatusService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly electron = inject(ElectronService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly projectService = inject(PartnerProjectService);

  readonly statusMap = signal<Map<number, PsdStatus>>(new Map());
  /** Projekt ID → módosult személy ID-k halmaza */
  readonly changedPersonIdsMap = signal<Map<number, Set<number>>>(new Map());
  /** Módosult PSD-vel rendelkező projekt ID-k (batch check eredménye) */
  readonly modifiedProjectIds = signal<number[]>([]);
  /** Batch check folyamatban */
  readonly batchCheckLoading = signal(false);

  /** Projekt ID → placed-photos.json tartalom (person→media mapping) */
  private placedPhotosCache = new Map<number, Record<string, number>>();
  /** A teljes checkProjects folyamat promise-ja (PSD keresés + háttér API check) */
  private checkProjectsPromise: Promise<void> | null = null;
  readonly loading = signal(false);

  /** folderPath → projectId leképezés (cache-ből történő frissítéshez) */
  private folderToProjectId = new Map<string, number>();

  /** IPC event listener cleanup függvények */
  private cleanupFns: Array<() => void> = [];
  /** Inicializálva van-e a watcher listener */
  private watcherInitialized = false;

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
   * Projektek PSD státusz ellenőrzése.
   * Ha elérhető a PSD cache (chokidar watcher), abból olvassa — gyors.
   * Ha nem, fallback az IPC-s egyesével kérdezésre.
   */
  checkProjects(projects: PartnerProjectListItem[]): Promise<void> {
    this.checkProjectsPromise = this.doCheckProjects(projects);
    return this.checkProjectsPromise;
  }

  /**
   * Batch fotóváltozás ellenőrzés az ÖSSZES cache-elt projekt placed-photos-ára.
   * Visszaadja a modifiedProjectIds-t — ez a "Módosult PSD" szűrő alapja.
   */
  async runBatchCheck(): Promise<number[]> {
    if (!this.electron.isElectron) return [];

    this.batchCheckLoading.set(true);
    try {
      // Összegyűjtjük az összes placed-photos-t a cache-ből
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

      const response = await firstValueFrom(
        this.projectService.batchCheckPhotoChanges(items),
      );
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

  // ============ Belső logika ============

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

      // Először próbáljuk a PSD cache-ből (gyors)
      const cacheEntries = await this.loadFromPsdCache();

      if (cacheEntries.length > 0) {
        this.processFromCache(projects, cacheEntries, brandName);
        this.initWatcherListeners();
      } else {
        // Fallback: egyesével IPC-vel (lassú, de működik cache nélkül)
        await this.checkProjectsViaIpc(projects, brandName);
      }

      this.loading.set(false);

      // Háttérben: fotóváltozás ellenőrzés a meglévő oldalhoz
      const statusMap = this.statusMap();
      const placedMaps = new Map<number, Record<string, number>>();
      for (const [projectId, pp] of this.placedPhotosCache) {
        if (statusMap.has(projectId)) {
          placedMaps.set(projectId, pp);
        }
      }
      await this.checkPhotoChangesInBackground(new Map(statusMap), placedMaps);
    } catch (err) {
      this.logger.error('PSD státusz ellenőrzés hiba', err);
      this.loading.set(false);
    }
  }

  /**
   * PSD cache betöltése az Electron watcher-ből.
   */
  private async loadFromPsdCache(): Promise<PsdCacheEntry[]> {
    try {
      const api = (window as any).electronAPI?.psdCache;
      if (!api) return [];
      return await api.getAll();
    } catch {
      return [];
    }
  }

  /**
   * Cache-ből tölti a projekt PSD státuszokat — O(n) folderPath matching.
   * A projektek folderPath-ját kiszámolja, és a cache-ben keresi.
   */
  private processFromCache(
    projects: PartnerProjectListItem[],
    cacheEntries: PsdCacheEntry[],
    brandName: string | null,
  ): void {
    // Cache index: folderPath → entry
    const cacheMap = new Map<string, PsdCacheEntry>();
    for (const entry of cacheEntries) {
      cacheMap.set(entry.folderPath, entry);
    }

    const newMap = new Map<number, PsdStatus>();
    this.folderToProjectId.clear();

    for (const project of projects) {
      const folderPath = this.ps.computeProjectFolderPath({
        projectName: project.name,
        schoolName: project.schoolName,
        className: project.className,
        brandName,
      });
      if (!folderPath) continue;

      this.folderToProjectId.set(folderPath, project.id);
      const cached = cacheMap.get(folderPath);

      if (cached) {
        newMap.set(project.id, {
          exists: true,
          psdPath: cached.psdPath,
          folderPath,
          hasPlacedPhotos: cached.placedPhotos !== null,
          updatedPhotosCount: 0,
          psdLastModified: cached.psdLastModified,
          placedPhotosLastModified: cached.placedPhotosLastModified,
        });
        if (cached.placedPhotos && Object.keys(cached.placedPhotos).length > 0) {
          this.placedPhotosCache.set(project.id, cached.placedPhotos);
        }
      } else {
        // Nincs a cache-ben → nincs PSD
        newMap.set(project.id, {
          exists: false, psdPath: null, folderPath,
          hasPlacedPhotos: false, updatedPhotosCount: 0,
          psdLastModified: null, placedPhotosLastModified: null,
        });
      }
    }

    // Cache-ből a többi mappához is gyűjtsük a placed-photos-t
    // (nem csak az aktuális oldalon lévőkhöz — a batch check-hez kell)
    this.buildFullPlacedPhotosCache(cacheEntries, brandName);

    this.statusMap.set(newMap);
  }

  /**
   * Az ÖSSZES cache entry placed-photos-át betölti a placedPhotosCache-be.
   * Ez kell a batch check-hez — nem csak az aktuális oldalon lévő projektekhez.
   *
   * folderPath → projectId leképezés: project-info.json-ból nem tudunk olvasni
   * az Angular oldalról, ezért a folderPath-ot a backendnek küldjük,
   * ő majd a projectId-vel dolgozik. DE: a batch endpoint projectId-t vár,
   * szóval itt nem tudunk többet tenni. A teljes cache-t a watcher tölti.
   */
  private buildFullPlacedPhotosCache(entries: PsdCacheEntry[], _brandName: string | null): void {
    // A cache-ben lévő összes placed-photos-t figyelembe vesszük
    // A folderToProjectId-ból tudjuk a leképezést
    // A nem ismert folderPath-okat most kihagyjuk — a batch checkProjects-kor
    // egyre több folderPath→projectId leképezés lesz elérhető
    for (const entry of entries) {
      if (!entry.placedPhotos || Object.keys(entry.placedPhotos).length === 0) continue;
      const projectId = this.folderToProjectId.get(entry.folderPath);
      if (projectId) {
        this.placedPhotosCache.set(projectId, entry.placedPhotos);
      }
    }
  }

  /**
   * Chokidar watcher IPC események figyelése.
   * Ha a workDir-ben változik egy PSD vagy placed-photos.json,
   * azonnal frissíti a cache-t.
   */
  private initWatcherListeners(): void {
    if (this.watcherInitialized) return;
    this.watcherInitialized = true;

    const api = (window as any).electronAPI?.psdCache;
    if (!api) return;

    // PSD cache frissült
    const cleanupUpdated = api.onUpdated((data: { folderPath: string; entry: PsdCacheEntry }) => {
      const projectId = this.folderToProjectId.get(data.folderPath);
      if (!projectId) return;

      const currentMap = new Map(this.statusMap());
      currentMap.set(projectId, {
        exists: true,
        psdPath: data.entry.psdPath,
        folderPath: data.folderPath,
        hasPlacedPhotos: data.entry.placedPhotos !== null,
        updatedPhotosCount: currentMap.get(projectId)?.updatedPhotosCount ?? 0,
        psdLastModified: data.entry.psdLastModified,
        placedPhotosLastModified: data.entry.placedPhotosLastModified,
      });
      this.statusMap.set(currentMap);

      // placed-photos cache frissítés
      if (data.entry.placedPhotos && Object.keys(data.entry.placedPhotos).length > 0) {
        this.placedPhotosCache.set(projectId, data.entry.placedPhotos);
      }
    });
    this.cleanupFns.push(cleanupUpdated);

    // PSD cache eltávolítva (PSD törölve)
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

  /**
   * Fallback: egyesével IPC-vel ellenőriz (ha nincs PSD cache service).
   */
  private async checkProjectsViaIpc(
    projects: PartnerProjectListItem[],
    brandName: string | null,
  ): Promise<void> {
    const newMap = new Map<number, PsdStatus>();
    const placedMaps = new Map<number, Record<string, number>>();

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
    for (const [id, pp] of placedMaps) {
      this.placedPhotosCache.set(id, pp);
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
      psdLastModified: null, placedPhotosLastModified: null,
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
        psdLastModified: null, // Fallback módban nincs mtime info
        placedPhotosLastModified: null,
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
