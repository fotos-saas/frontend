import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotListItem, SnapshotLayer } from '@core/services/electron.types';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';

/**
 * PhotoshopSnapshotService — Snapshot CRUD (save, list, restore, delete, load, rename).
 */
@Injectable({ providedIn: 'root' })
export class PhotoshopSnapshotService {
  private readonly logger = inject(LoggerService);
  private readonly pathService = inject(PhotoshopPathService);
  private readonly settings = inject(PhotoshopSettingsService);
  private readonly psdService = inject(PhotoshopPsdService);
  private readonly jsxService = inject(PhotoshopJsxService);

  private get api() { return this.pathService.api; }

  /** Snapshot mentés: kiolvas a Photoshopból + elmenti a layouts/ mappába */
  async saveSnapshot(
    name: string,
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };

    const layoutResult = await this.jsxService.readFullLayout(boardConfig, targetDocName);
    if (!layoutResult.success || !layoutResult.data) {
      return { success: false, error: layoutResult.error || 'Layout kiolvasás sikertelen' };
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = this.psdService.sanitizeName(name);
    const fileName = `${dateStr}_${slugName}.json`;

    const snapshotData = {
      version: 3,
      snapshotName: name,
      createdAt: now.toISOString(),
      document: layoutResult.data.document,
      board: layoutResult.data.board,
      nameSettings: layoutResult.data.nameSettings,
      layers: layoutResult.data.layers,
    };

    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      this.logger.info(`Snapshot mentve: ${name} (${layoutResult.data.layers.length} layer)`);
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot lista lekérés */
  async listSnapshots(psdPath: string): Promise<SnapshotListItem[]> {
    if (!this.api) return [];
    try {
      const result = await this.api.listSnapshots({ psdPath });
      return result.success ? result.snapshots : [];
    } catch (err) {
      this.logger.error('Snapshot lista hiba', err);
      return [];
    }
  }

  /** Snapshot visszaállítás */
  async restoreSnapshot(
    snapshotPath: string,
    targetDocName?: string,
    restoreGroups?: string[][],
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const loadResult = await this.api.loadSnapshot({ snapshotPath });
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: loadResult.error || 'Snapshot betöltés sikertelen' };
      }
      const snapshotData = loadResult.data as Record<string, unknown>;
      if (restoreGroups && restoreGroups.length > 0) {
        snapshotData['restoreGroups'] = restoreGroups;
      }
      const jsxResult = await this.pathService.runJsx({
        scriptName: 'actions/restore-layout.jsx',
        jsonData: snapshotData,
        targetDocName,
      });
      if (!jsxResult.success) {
        return { success: false, error: jsxResult.error || 'Snapshot visszaállítás sikertelen' };
      }
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot visszaállítás hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot visszaállításnál' };
    }
  }

  /** Snapshot törlés */
  async deleteSnapshot(snapshotPath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.deleteSnapshot({ snapshotPath });
    } catch (err) {
      this.logger.error('Snapshot törlés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot törlésnél' };
    }
  }

  /** Snapshot betöltése (JSON tartalom visszaadása) */
  async loadSnapshot(snapshotPath: string): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.loadSnapshot({ snapshotPath });
    } catch (err) {
      this.logger.error('Snapshot betöltés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot betöltésnél' };
    }
  }

  /** Snapshot közvetlen mentése (módosított adatokkal) */
  async saveSnapshotData(psdPath: string, snapshotData: Record<string, unknown>, fileName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot közvetlen mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot mentése ÚJ fájlként */
  async saveSnapshotDataAsNew(psdPath: string, snapshotData: Record<string, unknown>, originalName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = this.psdService.sanitizeName(originalName);
    const fileName = `${dateStr}_${slugName}-szerkesztett.json`;
    snapshotData['snapshotName'] = `${originalName} (szerkesztett)`;
    snapshotData['createdAt'] = now.toISOString();
    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot új mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot mentése megadott fájlnévvel */
  async saveSnapshotWithFileName(psdPath: string, snapshotData: Record<string, unknown>, fileName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const result = await this.api.saveSnapshot({ psdPath, snapshotData, fileName });
      if (!result.success) return { success: false, error: result.error || 'Snapshot mentés sikertelen' };
      return { success: true };
    } catch (err) {
      this.logger.error('Snapshot mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot mentésnél' };
    }
  }

  /** Snapshot átnevezése */
  async renameSnapshot(snapshotPath: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      return await this.api.renameSnapshot({ snapshotPath, newName });
    } catch (err) {
      this.logger.error('Snapshot átnevezés hiba', err);
      return { success: false, error: 'Váratlan hiba a snapshot átnevezésnél' };
    }
  }

  /** Layout kiolvasás és mentése JSON fájlba a PSD mellé */
  async readAndSaveLayout(
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
    projectId?: number,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.api) return { success: false, error: 'Nem Electron környezet' };
    try {
      const jsxResult = await this.pathService.runJsx({ scriptName: 'actions/read-layout.jsx', targetDocName });
      if (!jsxResult.success || !jsxResult.output) return { success: false, error: jsxResult.error || 'Layout kiolvasás sikertelen' };

      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = jsxResult.output.indexOf(jsonPrefix);
      if (jsonStart === -1) return { success: false, error: 'A JSX nem adott vissza layout adatot' };

      const jsonStr = jsxResult.output.substring(jsonStart + jsonPrefix.length).trim();
      let layoutResult: { document: { name: string; widthPx: number; heightPx: number; dpi: number }; layers: SnapshotLayer[] };
      try { layoutResult = JSON.parse(jsonStr); } catch { return { success: false, error: 'Layout JSON parse hiba' }; }

      const layoutData: Record<string, unknown> = {
        version: 3, updatedAt: new Date().toISOString(),
        document: layoutResult.document,
        board: { widthCm: boardConfig.widthCm, heightCm: boardConfig.heightCm, marginCm: this.settings.marginCm(), gapHCm: this.settings.gapHCm(), gapVCm: this.settings.gapVCm(), gridAlign: this.settings.gridAlign() },
        layers: layoutResult.layers || [],
      };
      if (projectId) layoutData['projectId'] = projectId;

      const saveResult = await this.api.saveLayoutJson({ psdPath, layoutData });
      if (!saveResult.success) return { success: false, error: saveResult.error || 'Layout JSON mentés sikertelen' };
      return { success: true };
    } catch (err) {
      this.logger.error('Layout kiolvasás/mentés hiba', err);
      return { success: false, error: 'Váratlan hiba a layout mentésnél' };
    }
  }
}
