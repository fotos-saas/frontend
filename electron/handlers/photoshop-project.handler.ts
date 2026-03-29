/**
 * Photoshop project/file operation IPC handlers
 *
 * Handlers:
 *   photoshop:reveal-in-finder, open-file, get-work-dir, set-work-dir, browse-work-dir
 *   photoshop:save-layout-json, save-snapshot, list-snapshots, check-psd-exists
 *   photoshop:find-project-psd, refresh-placed-json, write-project-info
 */

import { ipcMain, dialog, shell, app } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import log from 'electron-log/main';
import { PhotoshopSchema } from '../services/jsx-runner.service';
import { updatePlacedPhotosJson, readPlacedPhotos } from './photoshop-utils';

export function registerProjectHandlers(psStore: Store<PhotoshopSchema>): void {
  // Megmutatja a fajlt a Finderben / Explorerben
  ipcMain.handle('photoshop:reveal-in-finder', (_event, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.length > 500) {
        return { success: false, error: 'Ervenytelen eleresi ut' };
      }
      shell.showItemInFolder(path.resolve(filePath));
      return { success: true };
    } catch (error) {
      log.error('Reveal in finder hiba:', error);
      return { success: false, error: 'Nem sikerult megnyitni' };
    }
  });

  // Open file with default application (Photoshop)
  ipcMain.handle('photoshop:open-file', async (_event, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.length > 500) {
        return { success: false, error: 'Ervenytelen fajl eleresi ut' };
      }

      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'A fajl nem talalhato' };
      }

      const psPath = psStore.get('photoshopPath', null);

      if (process.platform === 'darwin') {
        // macOS: AppleScript-tel megnyitjuk a fajlt PS-ben
        const fileName = path.basename(filePath);
        // Ellenorizzuk hogy a fajl mar nyitva van-e PS-ben
        const checkScript = `
          tell application id "com.adobe.Photoshop"
            set isOpen to false
            repeat with d in documents
              if name of d is "${fileName.replace(/"/g, '\\"')}" then
                set isOpen to true
                set current document to d
                exit repeat
              end if
            end repeat
            return isOpen
          end tell
        `;
        const isAlreadyOpen = await new Promise<boolean>((resolve) => {
          execFile('osascript', ['-e', checkScript], (err, stdout) => {
            resolve(!err && stdout.trim() === 'true');
          });
        });

        if (isAlreadyOpen) {
          // Mar nyitva van, csak aktivaljuk a PS-t
          execFile('osascript', ['-e', 'tell application id "com.adobe.Photoshop" to activate']);
        } else {
          // Megnyitas: open -a kezeli az ekezetes utvonalakat
          await new Promise<void>((resolve, reject) => {
            execFile('open', ['-a', 'Adobe Photoshop 2026', filePath], (err) => {
              if (err) {
                log.error('PSD megnyitas hiba (open -a):', err.message);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
      } else {
        if (psPath) {
          // Windows: Photoshop.exe file.psd
          const child = execFile(psPath, [filePath], { detached: true, stdio: 'ignore' } as never);
          child.unref();
        } else {
          const child = execFile('start', ['""', filePath], { shell: true, detached: true, stdio: 'ignore' } as never);
          child.unref();
        }
      }

      log.info(`PSD megnyitva: ${filePath}`);
      return { success: true };
    } catch (error) {
      log.error('PSD megnyitasi hiba:', error);
      return { success: false, error: 'Nem sikerult megnyitni a fajlt' };
    }
  });

  // Get work directory
  ipcMain.handle('photoshop:get-work-dir', () => {
    return psStore.get('workDirectory', null);
  });

  // Set work directory
  ipcMain.handle('photoshop:set-work-dir', (_event, dirPath: string) => {
    try {
      if (typeof dirPath !== 'string' || dirPath.length > 500) {
        return { success: false, error: 'Ervenytelen eleresi ut' };
      }

      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return { success: false, error: 'A megadott eleresi ut nem egy mappa' };
      }

      psStore.set('workDirectory', dirPath);
      log.info(`Munka mappa beallitva: ${dirPath}`);
      return { success: true };
    } catch (error) {
      log.error('Munka mappa beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az eleresi utat' };
    }
  });

  // Browse for work directory
  ipcMain.handle('photoshop:browse-work-dir', async () => {
    try {
      const currentDir = psStore.get('workDirectory', null);

      const result = await dialog.showOpenDialog({
        title: 'Munka mappa kiválasztása',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: currentDir || app.getPath('documents'),
      });

      if (result.canceled || !result.filePaths.length) {
        return { cancelled: true };
      }

      return { cancelled: false, path: result.filePaths[0] };
    } catch (error) {
      log.error('Munka mappa browse hiba:', error);
      return { cancelled: true };
    }
  });

  // Save layout JSON file next to PSD
  ipcMain.handle('photoshop:save-layout-json', (_event, params: {
    psdPath: string;
    layoutData: Record<string, unknown>;
  }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Ervenytelen PSD eleresi ut' };
      }

      if (!params.psdPath.endsWith('.psd')) {
        return { success: false, error: 'A fajlnak .psd kiterjesztesunek kell lennie' };
      }

      // Biztonsag: path traversal vedelem
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Ervenytelen fajl utvonal' };
      }

      const jsonPath = params.psdPath.replace(/\.psd$/i, '.json');
      const jsonContent = JSON.stringify(params.layoutData, null, 2);

      fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
      log.info(`Layout JSON mentve: ${jsonPath} (${jsonContent.length} byte)`);

      return { success: true, jsonPath };
    } catch (error) {
      log.error('Layout JSON mentesi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a layout JSON-t' };
    }
  });

  // Save snapshot JSON to layouts/ folder next to PSD
  ipcMain.handle('photoshop:save-snapshot', (_event, params: {
    psdPath: string;
    snapshotData: Record<string, unknown>;
    fileName: string;
  }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Ervenytelen PSD eleresi ut' };
      }
      if (!params.psdPath.endsWith('.psd')) {
        return { success: false, error: 'A fajlnak .psd kiterjesztesunek kell lennie' };
      }
      if (params.psdPath.includes('..') || params.fileName.includes('..') || params.fileName.includes('/')) {
        return { success: false, error: 'Ervenytelen fajl utvonal' };
      }

      const psdDir = path.dirname(params.psdPath);
      const layoutsDir = path.join(psdDir, 'layouts');

      if (!fs.existsSync(layoutsDir)) {
        fs.mkdirSync(layoutsDir, { recursive: true });
      }

      const snapshotPath = path.join(layoutsDir, params.fileName);
      const jsonContent = JSON.stringify(params.snapshotData, null, 2);
      fs.writeFileSync(snapshotPath, jsonContent, 'utf-8');
      log.info(`Snapshot mentve: ${snapshotPath} (${jsonContent.length} byte)`);

      return { success: true, snapshotPath };
    } catch (error) {
      log.error('Snapshot mentesi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a snapshot-ot' };
    }
  });

  // List snapshots from layouts/ folder
  ipcMain.handle('photoshop:list-snapshots', (_event, params: { psdPath: string }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Ervenytelen PSD eleresi ut', snapshots: [] };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal', snapshots: [] };
      }

      const psdDir = path.dirname(params.psdPath);
      const layoutsDir = path.join(psdDir, 'layouts');

      if (!fs.existsSync(layoutsDir)) {
        return { success: true, snapshots: [] };
      }

      const files = fs.readdirSync(layoutsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse(); // Legujabb elol

      const snapshots = files.map(fileName => {
        const filePath = path.join(layoutsDir, fileName);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          const version = data.version || 1;

          // v3: layers[] tömb, v2: persons[] tömb
          const layerCount = Array.isArray(data.layers) ? data.layers.length : 0;
          const personCount = Array.isArray(data.persons) ? data.persons.length : 0;

          return {
            fileName,
            filePath,
            snapshotName: data.snapshotName || fileName.replace('.json', ''),
            createdAt: data.createdAt || null,
            personCount: version >= 3 ? layerCount : personCount,
            layerCount,
            version,
          };
        } catch {
          return {
            fileName,
            filePath,
            snapshotName: fileName.replace('.json', ''),
            createdAt: null,
            personCount: 0,
            layerCount: 0,
            version: 1,
          };
        }
      });

      return { success: true, snapshots };
    } catch (error) {
      log.error('Snapshot lista hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a snapshot listat', snapshots: [] };
    }
  });

  // Check if PSD file exists and has layouts/ directory
  ipcMain.handle('photoshop:check-psd-exists', (_event, params: { psdPath: string }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, exists: false, hasLayouts: false };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, exists: false, hasLayouts: false };
      }

      const exists = fs.existsSync(params.psdPath);
      if (!exists) {
        return { success: true, exists: false, hasLayouts: false };
      }

      const psdDir = path.dirname(params.psdPath);
      const layoutsDir = path.join(psdDir, 'layouts');
      let hasLayouts = false;

      if (fs.existsSync(layoutsDir)) {
        const jsonFiles = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
        hasLayouts = jsonFiles.length > 0;
      }

      const { hasPlacedPhotos, placedPhotos, majorityWithFrame } = readPlacedPhotos(psdDir);

      return { success: true, exists: true, hasLayouts, hasPlacedPhotos, placedPhotos, majorityWithFrame };
    } catch (error) {
      log.error('PSD letezés ellenorzes hiba:', error);
      return { success: false, exists: false, hasLayouts: false, hasPlacedPhotos: false, placedPhotos: null, majorityWithFrame: true };
    }
  });

  // Projekt PSD keresése mappa alapján (nem pontos fájlnév, hanem mappában az első .psd)
  ipcMain.handle('photoshop:find-project-psd', (_event, params: { folderPath: string }) => {
    try {
      if (typeof params.folderPath !== 'string' || params.folderPath.length > 500) {
        return { success: false, exists: false };
      }
      if (params.folderPath.includes('..')) {
        return { success: false, exists: false };
      }

      if (!fs.existsSync(params.folderPath)) {
        return { success: true, exists: false };
      }

      // Első .psd fájl keresése a mappában
      const files = fs.readdirSync(params.folderPath);
      const psdFile = files.find(f => f.toLowerCase().endsWith('.psd'));
      if (!psdFile) {
        return { success: true, exists: false };
      }

      const psdPath = path.join(params.folderPath, psdFile);

      // layouts/ mappa ellenőrzés
      const layoutsDir = path.join(params.folderPath, 'layouts');
      let hasLayouts = false;
      if (fs.existsSync(layoutsDir)) {
        const jsonFiles = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
        hasLayouts = jsonFiles.length > 0;
      }

      const { hasPlacedPhotos, placedPhotos, majorityWithFrame } = readPlacedPhotos(params.folderPath);

      return { success: true, exists: true, psdPath, hasLayouts, hasPlacedPhotos, placedPhotos, majorityWithFrame };
    } catch (error) {
      log.error('Projekt PSD keresés hiba:', error);
      return { success: false, exists: false };
    }
  });

  // Placed-photos.json újragenerálása PS megnyitása nélkül (csak JSON frissítés)
  ipcMain.handle('photoshop:refresh-placed-json', (_event, params: {
    psdFilePath: string;
    layers: Array<{ layerName: string; photoUrl: string }>;
    syncBorder?: boolean;
  }) => {
    log.info('[REFRESH-JSON-HANDLER] hívás érkezett, psdFilePath:', params.psdFilePath, 'layers:', params.layers?.length);
    try {
      if (typeof params.psdFilePath !== 'string' || params.psdFilePath.includes('..') || params.psdFilePath.length > 500) {
        log.warn('[REFRESH-JSON-HANDLER] érvénytelen PSD útvonal');
        return { success: false, error: 'Érvénytelen PSD útvonal' };
      }
      log.info('[REFRESH-JSON-HANDLER] updatePlacedPhotosJson hívás...');
      updatePlacedPhotosJson(params.psdFilePath, undefined, params.layers, !!params.syncBorder);
      log.info('[REFRESH-JSON-HANDLER] kész, count:', params.layers.length);
      return { success: true, count: params.layers.length };
    } catch (error) {
      log.error('[REFRESH-JSON-HANDLER] hiba:', error);
      return { success: false, error: 'JSON frissítés sikertelen' };
    }
  });

  // Project-info.json írása a PSD mappájába (projekt azonosítás overlay toolbar számára)
  ipcMain.handle('photoshop:write-project-info', (_event, params: {
    psdFilePath: string;
    projectId: number;
    projectName?: string;
    schoolName?: string;
    className?: string;
  }) => {
    try {
      if (typeof params.psdFilePath !== 'string' || params.psdFilePath.includes('..') || params.psdFilePath.length > 500) {
        return { success: false, error: 'Érvénytelen PSD útvonal' };
      }
      if (typeof params.projectId !== 'number' || params.projectId <= 0) {
        return { success: false, error: 'Érvénytelen projectId' };
      }
      const psdDir = path.dirname(params.psdFilePath);
      if (!fs.existsSync(psdDir)) {
        fs.mkdirSync(psdDir, { recursive: true });
      }
      const infoPath = path.join(psdDir, 'project-info.json');
      const info = {
        projectId: params.projectId,
        projectName: params.projectName || null,
        schoolName: params.schoolName || null,
        className: params.className || null,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');
      log.info(`Project-info.json irva: ${infoPath} (projectId: ${params.projectId})`);
      return { success: true };
    } catch (error) {
      log.error('Project-info.json irasi hiba:', error);
      return { success: false, error: 'Nem sikerült a project-info.json írása' };
    }
  });
}
