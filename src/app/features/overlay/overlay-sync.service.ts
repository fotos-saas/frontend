import { Injectable, inject, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayContext } from '../../core/services/electron.types';

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

  /** Fotó szinkronizálás — sync-photos gomb */
  async syncPhotos(mode: 'all' | 'missing' | 'selected', context: OverlayContext): Promise<void> {
    if (!window.electronAPI) { console.log('[SYNC] no electronAPI'); return; }

    console.log('[SYNC] mode:', mode);
    let layerNames: string[];
    if (mode === 'selected') {
      const { names } = await this.ps.getFreshSelectedLayerNames();
      layerNames = names;
      console.log('[SYNC] selected layerNames:', layerNames);
      if (layerNames.length === 0) { console.log('[SYNC] ABORT: no selected layers'); return; }
    } else {
      layerNames = await this.ps.getImageLayerNames();
      console.log('[SYNC] all/missing layerNames count:', layerNames.length);
    }

    // Layer névből person ID kinyerése
    const layerPersonMap = new Map<number, string>();
    for (const name of layerNames) {
      const match = name.match(/---(\d+)$/);
      if (match) {
        layerPersonMap.set(parseInt(match[1], 10), name);
      }
    }
    console.log('[SYNC] layerPersonMap size:', layerPersonMap.size);
    if (layerPersonMap.size === 0) { console.log('[SYNC] ABORT: no person IDs in layer names'); return; }

    // Person-ök fotó URL-jének lekérése
    let persons = this.project.persons();
    const pid = await this.project.resolveProjectId(context);
    console.log('[SYNC] projectId:', pid);
    if (pid) {
      persons = await this.project.fetchPersons(pid);
    }

    // Fotó URL-ek összegyűjtése
    const photosToSync: Array<{ layerName: string; photoUrl: string }> = [];
    for (const [personId, layerName] of layerPersonMap) {
      const person = persons.find(p => p.id === personId);
      console.log('[SYNC] person', personId, '→', person?.name, 'photoUrl:', person?.photoUrl?.substring(0, 50));
      if (person?.photoUrl) {
        photosToSync.push({ layerName, photoUrl: person.photoUrl });
      }
    }

    console.log('[SYNC] photosToSync:', photosToSync.length);
    if (photosToSync.length === 0) { console.log('[SYNC] ABORT: no photos to sync'); return; }

    // Behelyezés a Photoshopba
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
    console.log('[REFRESH-JSON] START');
    if (!window.electronAPI) { console.log('[REFRESH-JSON] ABORT: no electronAPI'); return; }

    const psdFilePath = this.polling.activeDoc().path;
    console.log('[REFRESH-JSON] psdFilePath:', psdFilePath);
    if (!psdFilePath) { console.log('[REFRESH-JSON] ABORT: nincs PSD útvonal'); return; }

    const pid = await this.project.resolveProjectId(context);
    console.log('[REFRESH-JSON] pid:', pid);
    if (!pid) { console.log('[REFRESH-JSON] ABORT: nincs projectId'); return; }

    await this.ps.withBusy('refresh-placed-json', async () => {
      const persons = await this.project.fetchPersons(pid);

      // Minden személy aki fotóval rendelkezik → layers tömbbe
      const layers: Array<{ layerName: string; photoUrl: string }> = [];
      for (const person of persons) {
        if (person.photoUrl) {
          const slug = person.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
          layers.push({ layerName: `${slug}---${person.id}`, photoUrl: person.photoUrl });
        }
      }
      console.log('[REFRESH-JSON] layers to write:', layers.length);
      if (layers.length === 0) { console.log('[REFRESH-JSON] ABORT: nincs fotó'); return; }

      console.log('[REFRESH-JSON] calling refreshPlacedJson IPC...');
      const result = await window.electronAPI!.photoshop.refreshPlacedJson({
        psdFilePath,
        layers,
        syncBorder: this.settings.syncWithBorder(),
      });
      console.log('[REFRESH-JSON] IPC result:', result);
    });
  }
}
