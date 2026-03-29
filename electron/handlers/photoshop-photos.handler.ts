/**
 * Photoshop photo placement IPC handlers
 *
 * Handlers:
 *   photoshop:place-photos, save-temp-files, save-drag-order, load-drag-order
 */

import { ipcMain, app, BrowserWindow } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Store from 'electron-store';
import log from 'electron-log/main';
import { JsxRunnerService, PhotoshopSchema } from '../services/jsx-runner.service';
import { updatePlacedPhotosJson } from './photoshop-utils';

export function registerPhotoHandlers(psStore: Store<PhotoshopSchema>, jsxRunner: JsxRunnerService): void {
  // Fotok behelyezese meglevo Smart Object layerekbe
  // KEPENKENT kulon JSX hivas — a PS csak ~5-10 mp-re blokkolt kepenkent,
  // kozben szabad (nem fagy 20 kepnel), es progress event-et kuld a frontendnek.
  ipcMain.handle('photoshop:place-photos', async (_event, params: {
    layers: Array<{ layerName: string; photoUrl: string }>;
    targetDocName?: string;
    psdFilePath?: string;
    syncBorder?: boolean;
    soWidthPx?: number;
    soHeightPx?: number;
  }) => {
    try {
      if (!params.layers || params.layers.length === 0) {
        return { success: false, error: 'Nincs layer adat' };
      }

      const total = params.layers.length;
      const dlStart = Date.now();
      log.info(`Place photos: ${total} layer fotojanak letoltese...`);

      // SO meret lekeres es foto letoltes PARHUZAMOSAN
      let soWidthPx = params.soWidthPx || 0;
      let soHeightPx = params.soHeightPx || 0;

      // SO meret: 1 gyors JSX (boundsNoEffects, nincs SO open)
      const soSizePromise = (!params.syncBorder && soWidthPx <= 0 && params.layers.length > 0)
        ? (async () => {
          try {
            const sizeScript = `
              var _soSize = '';
              try {
                var _doc = app.activeDocument;
                var _grps = [["Images","Students"],["Images","Teachers"]];
                for (var _g = 0; _g < _grps.length; _g++) {
                  var _cur = _doc;
                  for (var _p = 0; _p < _grps[_g].length; _p++) {
                    var _found = false;
                    try { for (var _j = 0; _j < _cur.layerSets.length; _j++) { if (_cur.layerSets[_j].name === _grps[_g][_p]) { _cur = _cur.layerSets[_j]; _found = true; break; } } } catch(e){}
                    if (!_found) { _cur = null; break; }
                  }
                  if (_cur && _cur.artLayers && _cur.artLayers.length > 0) {
                    var _ref = new ActionReference();
                    _ref.putIdentifier(charIDToTypeID("Lyr "), _cur.artLayers[0].id);
                    var _desc = executeActionGet(_ref);
                    var _bk = stringIDToTypeID("boundsNoEffects");
                    var _b = _desc.hasKey(_bk) ? _desc.getObjectValue(_bk) : _desc.getObjectValue(stringIDToTypeID("bounds"));
                    _soSize = '{"w":' + Math.round(_b.getUnitDoubleValue(stringIDToTypeID("right")) - _b.getUnitDoubleValue(stringIDToTypeID("left")))
                      + ',"h":' + Math.round(_b.getUnitDoubleValue(stringIDToTypeID("bottom")) - _b.getUnitDoubleValue(stringIDToTypeID("top"))) + '}';
                    break;
                  }
                }
              } catch(e) {}
              _soSize;
            `;
            const sizeJsxPath = path.join(app.getPath('temp'), `jsx-sosize-${Date.now()}.jsx`);
            fs.writeFileSync(sizeJsxPath, sizeScript, 'utf-8');
            const sizeAs = jsxRunner.buildFocusPreservingAppleScript(sizeJsxPath);
            const sizeResult = await new Promise<string>((resolve) => {
              execFile('osascript', ['-e', sizeAs], { timeout: 10000 }, (_err, stdout) => {
                try { fs.unlinkSync(sizeJsxPath); } catch (_) {}
                resolve(stdout?.trim() || '');
              });
            });
            if (sizeResult.startsWith('{')) {
              const parsed = JSON.parse(sizeResult);
              soWidthPx = parsed.w || 0;
              soHeightPx = parsed.h || 0;
              log.info(`SO size detected: ${soWidthPx}x${soHeightPx}px`);
            }
          } catch (sizeErr) {
            log.warn('SO meret lekeres sikertelen, fallback PS cover:', sizeErr);
          }
        })()
        : Promise.resolve();

      // Fotok letoltese PARHUZAMOSAN az SO meret lekeressel
      const rawDownloads = await Promise.all([
        soSizePromise,
        ...params.layers.map(async (item) => {
          try {
            const ext = item.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const urlHash = crypto.createHash('md5').update(item.photoUrl).digest('hex').substring(0, 8);
            const fileName = `${item.layerName}-${urlHash}.${ext}`;
            const localPath = await jsxRunner.downloadPhoto(item.photoUrl, fileName);
            return { layerName: item.layerName, photoPath: localPath, photoUrl: item.photoUrl };
          } catch (err) {
            log.warn(`Foto letoltes sikertelen (${item.layerName}):`, err);
            return null;
          }
        }),
      ]);

      // rawDownloads[0] = soSizePromise (void), rawDownloads[1..N] = letoltesek
      const rawLayers = rawDownloads.slice(1) as Array<{ layerName: string; photoPath: string; photoUrl: string } | null>;

      const canPreCover = !params.syncBorder && soWidthPx > 0 && soHeightPx > 0;
      if (canPreCover) {
        log.info(`Pre-cover: ${soWidthPx}x${soHeightPx}px (sharp, ${rawLayers.filter(Boolean).length} kep)`);
      }

      // Sharp pre-cover PARHUZAMOSAN (minden kep egyszerrei)
      const downloadResults = await Promise.all(
        rawLayers.map(async (item) => {
          if (!item) return null;
          if (!canPreCover) return { ...item, preCovered: false };
          try {
            const sharp = require('sharp');
            const coveredPath = item.photoPath.replace(/\.[^.]+$/, '_covered.jpg');
            await sharp(item.photoPath)
              .resize(soWidthPx, soHeightPx, { fit: 'cover', position: 'centre' })
              .jpeg({ quality: 98 })
              .toFile(coveredPath);
            return { layerName: item.layerName, photoPath: coveredPath, photoUrl: item.photoUrl, preCovered: true };
          } catch (sharpErr) {
            log.warn(`Sharp pre-cover sikertelen (${item.layerName}), fallback:`, sharpErr);
            return { ...item, preCovered: false };
          }
        }),
      );

      const validLayers = downloadResults.filter(
        (r): r is { layerName: string; photoPath: string; photoUrl: string; preCovered: boolean } => r !== null,
      );

      if (validLayers.length === 0) {
        return { success: false, error: 'Egy foto sem sikerult letolteni' };
      }

      const dlMs = Date.now() - dlStart;
      log.info(`Place photos: ${validLayers.length}/${total} foto letoltve ${dlMs}ms alatt, PS behelyezes indul...`);

      // 2. Progress: letoltes kesz, PS indul
      for (const win of BrowserWindow.getAllWindows()) {
        try {
          win.webContents.send('place-photos-progress', {
            current: 0,
            total: validLayers.length,
            layerName: validLayers[0]?.layerName,
          });
        } catch (_) { /* ignore */ }
      }

      // 3. EGY JSX hivas az OSSZES keppel — 1 history bejegyzes
      const tempJsonPath = path.join(app.getPath('temp'), `jsx-place-photos-${Date.now()}.json`);
      fs.writeFileSync(tempJsonPath, JSON.stringify({ layers: validLayers }), 'utf-8');

      log.info(`Place photos JSON irva: ${tempJsonPath} (${validLayers.length} kep)`);

      const extraConfig = params.syncBorder ? { SYNC_BORDER: 'true' } : undefined;
      const jsxCode = jsxRunner.buildJsxScript('actions/place-photos.jsx', tempJsonPath, params.targetDocName, params.psdFilePath, extraConfig);
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-place-photos-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = jsxRunner.buildFocusPreservingAppleScript(tempJsxPath);

      const result = await new Promise<{ success: boolean; error?: string; output?: string }>((resolve) => {
        execFile('osascript', ['-e', appleScript], { timeout: 600000 }, (error, stdout, stderr) => {
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          if (error) {
            log.error('Place photos JSX hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message });
          } else {
            log.info('Place photos kesz:', stdout?.trim().slice(0, 500));
            resolve({ success: true, output: stdout || '' });
          }
        });
      });

      // Placed photos JSON frissitese
      try {
        updatePlacedPhotosJson(params.psdFilePath, result.output, params.layers, !!params.syncBorder);
      } catch (jsonErr) {
        log.warn('Placed photos JSON frissites sikertelen:', jsonErr);
      }

      // Progress vege
      for (const win of BrowserWindow.getAllWindows()) {
        try {
          win.webContents.send('place-photos-progress', {
            current: validLayers.length,
            total: validLayers.length,
            done: true,
          });
        } catch (_) { /* ignore */ }
      }

      return result;
    } catch (error) {
      log.error('Place photos hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
  });

  // ============ Temp fajl mentes (renderer → main) ============
  ipcMain.handle('photoshop:save-temp-files', async (_event, params: {
    files: Array<{ name: string; data: ArrayBuffer }>;
  }) => {
    try {
      if (!Array.isArray(params.files) || params.files.length === 0) {
        return { success: false, paths: [], error: 'Nincsenek fajlok' };
      }
      if (params.files.length > 50) {
        return { success: false, paths: [], error: 'Maximum 50 fajl engedelyezett' };
      }

      const tempDir = path.join(app.getPath('temp'), 'photostack-action-files');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const paths: string[] = [];
      for (const file of params.files) {
        if (typeof file.name !== 'string' || !file.data) {
          continue;
        }
        // Biztonsagos fajlnev (csak alap karakterek)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(tempDir, `${Date.now()}-${safeName}`);
        fs.writeFileSync(filePath, Buffer.from(file.data));
        paths.push(filePath);
        log.info(`Temp fajl mentve: ${filePath} (${Buffer.from(file.data).length} byte)`);
      }

      return { success: true, paths };
    } catch (error) {
      log.error('Save temp files hiba:', error);
      return { success: false, paths: [], error: error instanceof Error ? error.message : 'Ismeretlen hiba' };
    }
  });

  // ============ Drag Order JSON (PSD melle) ============

  // Save drag-order.json next to PSD
  ipcMain.handle('photoshop:save-drag-order', (_event, params: {
    psdPath: string;
    dragOrderData: Record<string, unknown>;
  }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Ervenytelen PSD eleresi ut' };
      }
      if (!params.psdPath.endsWith('.psd')) {
        return { success: false, error: 'A fajlnak .psd kiterjesztesunek kell lennie' };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Ervenytelen fajl utvonal' };
      }

      const psdDir = path.dirname(params.psdPath);
      const jsonPath = path.join(psdDir, 'drag-order.json');
      const jsonContent = JSON.stringify(params.dragOrderData, null, 2);

      fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
      log.info(`Drag order JSON mentve: ${jsonPath} (${jsonContent.length} byte)`);

      return { success: true, jsonPath };
    } catch (error) {
      log.error('Drag order JSON mentesi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a drag order JSON-t' };
    }
  });

  // Load drag-order.json from PSD directory
  ipcMain.handle('photoshop:load-drag-order', (_event, params: { psdPath: string }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Ervenytelen PSD eleresi ut', data: null };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal', data: null };
      }

      const psdDir = path.dirname(params.psdPath);
      const jsonPath = path.join(psdDir, 'drag-order.json');

      if (!fs.existsSync(jsonPath)) {
        return { success: true, data: null };
      }

      const content = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(content);
      log.info(`Drag order JSON betoltve: ${jsonPath}`);

      return { success: true, data };
    } catch (error) {
      log.error('Drag order JSON betoltesi hiba:', error);
      return { success: false, error: 'Nem sikerult betolteni a drag order JSON-t', data: null };
    }
  });
}
