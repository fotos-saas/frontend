import { Injectable, inject, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayContext } from '../../core/services/electron.types';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Fotó szinkronizálás (sync photos + refresh placed JSON).
 */
@Injectable()
export class OverlaySyncService {
  private readonly ngZone = inject(NgZone);
  private readonly project = inject(OverlayProjectService);
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly settings = inject(OverlaySettingsService);
  private readonly polling = inject(OverlayPollingService);
  private readonly logger = inject(LoggerService);

  /** Fotó szinkronizálás — sync-photos gomb */
  async syncPhotos(mode: 'all' | 'missing' | 'selected', context: OverlayContext): Promise<void> {
    if (!window.electronAPI) { this.logger.debug('[SYNC] no electronAPI'); return; }

    this.logger.debug('[SYNC] mode:', mode);
    let layerNames: string[];
    if (mode === 'selected') {
      const { names } = await this.ps.getFreshSelectedLayerNames();
      layerNames = names;
      this.logger.debug('[SYNC] selected layerNames:', layerNames);
      if (layerNames.length === 0) { this.logger.debug('[SYNC] ABORT: no selected layers'); return; }
    } else {
      layerNames = await this.ps.getImageLayerNames();
      this.logger.debug('[SYNC] all/missing layerNames count:', layerNames.length);
    }

    // Layer névből person ID kinyerése
    const layerPersonMap = new Map<number, string>();
    for (const name of layerNames) {
      const match = name.match(/---(\d+)$/);
      if (match) {
        layerPersonMap.set(parseInt(match[1], 10), name);
      }
    }
    this.logger.debug('[SYNC] layerPersonMap size:', layerPersonMap.size);
    if (layerPersonMap.size === 0) { this.logger.debug('[SYNC] ABORT: no person IDs in layer names'); return; }

    // Person-ök fotó URL-jének lekérése
    let persons = this.project.persons();
    const pid = await this.project.resolveProjectId(context);
    this.logger.debug('[SYNC] projectId:', pid);
    if (pid) {
      persons = await this.project.fetchPersons(pid);
    }

    // Fotó URL-ek összegyűjtése
    const photosToSync: Array<{ layerName: string; photoUrl: string }> = [];
    for (const [personId, layerName] of layerPersonMap) {
      const person = persons.find(p => p.id === personId);
      this.logger.debug('[SYNC] person', personId, '→', person?.name, 'photoUrl:', person?.photoUrl?.substring(0, 50));
      if (person?.photoUrl) {
        photosToSync.push({ layerName, photoUrl: person.photoUrl });
      }
    }

    this.logger.debug('[SYNC] photosToSync:', photosToSync.length);
    if (photosToSync.length === 0) { this.logger.debug('[SYNC] ABORT: no photos to sync'); return; }

    // Behelyezés — a withBusy automatikusan szünetelteti a pollingot
    await this.ps.withBusy('sync-photos', async () => {
      await window.electronAPI!.photoshop.placePhotos({
        layers: photosToSync,
        syncBorder: this.settings.syncWithBorder(),
        psdFilePath: this.polling.activeDoc().path ?? undefined,
      });
    });
  }

  /** Placed JSON frissítése — placed-photos.json újragenerálás API adatokból */
  async refreshPlacedJson(context: OverlayContext): Promise<void> {
    this.logger.debug('[REFRESH-JSON] START');
    if (!window.electronAPI) { this.logger.debug('[REFRESH-JSON] ABORT: no electronAPI'); return; }

    const psdFilePath = this.polling.activeDoc().path;
    this.logger.debug('[REFRESH-JSON] psdFilePath:', psdFilePath);
    if (!psdFilePath) { this.logger.debug('[REFRESH-JSON] ABORT: nincs PSD útvonal'); return; }

    const pid = await this.project.resolveProjectId(context);
    this.logger.debug('[REFRESH-JSON] pid:', pid);
    if (!pid) { this.logger.debug('[REFRESH-JSON] ABORT: nincs projectId'); return; }

    await this.ps.withBusy('refresh-placed-json', async () => {
      const persons = await this.project.fetchPersons(pid);

      // Minden személy aki fotóval rendelkezik → layers tömbbe
      const layers: Array<{ layerName: string; photoUrl: string }> = [];
      for (const person of persons) {
        if (person.photoUrl) {
          const slug = person.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
          layers.push({ layerName: `${slug}---${person.id}`, photoUrl: person.photoUrl });
        }
      }
      this.logger.debug('[REFRESH-JSON] layers to write:', layers.length);
      if (layers.length === 0) { this.logger.debug('[REFRESH-JSON] ABORT: nincs fotó'); return; }

      this.logger.debug('[REFRESH-JSON] calling refreshPlacedJson IPC...');
      const result = await window.electronAPI!.photoshop.refreshPlacedJson({
        psdFilePath,
        layers,
        syncBorder: this.settings.syncWithBorder(),
      });
      this.logger.debug('[REFRESH-JSON] IPC result:', result);
    });
  }
}
