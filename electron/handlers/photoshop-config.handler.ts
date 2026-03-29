/**
 * Photoshop config/settings IPC handlers
 *
 * Handlers:
 *   photoshop:get-path, set-path, launch, check-installed, browse-path, get-downloads-path
 *   photoshop:get/set-margin, student-size, teacher-size, gap-h, gap-v,
 *             name-gap, name-break-after, text-align, grid-align,
 *             position-gap, position-font-size
 */

import { ipcMain, dialog, app } from 'electron';
import { execFile } from 'child_process';
import Store from 'electron-store';
import log from 'electron-log/main';
import { JsxRunnerService, PhotoshopSchema } from '../services/jsx-runner.service';

export function registerConfigHandlers(psStore: Store<PhotoshopSchema>, jsxRunner: JsxRunnerService): void {
  // Get saved path
  ipcMain.handle('photoshop:get-path', () => {
    return psStore.get('photoshopPath', null);
  });

  // Set & validate path
  ipcMain.handle('photoshop:set-path', (_event, psPath: string) => {
    try {
      if (typeof psPath !== 'string' || psPath.length > 500) {
        return { success: false, error: 'Ervenytelen eleresi ut' };
      }

      if (!jsxRunner.isValidPhotoshopPath(psPath)) {
        return { success: false, error: 'A megadott eleresi uton nem talalhato Photoshop' };
      }

      psStore.set('photoshopPath', psPath);
      log.info(`Photoshop path beallitva: ${psPath}`);
      return { success: true };
    } catch (error) {
      log.error('Photoshop path beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az eleresi utat' };
    }
  });

  // Launch Photoshop
  ipcMain.handle('photoshop:launch', () => {
    try {
      const psPath = psStore.get('photoshopPath', null);
      if (!psPath) {
        return { success: false, error: 'Nincs beallitva Photoshop eleresi ut' };
      }

      if (!jsxRunner.isValidPhotoshopPath(psPath)) {
        return { success: false, error: 'A Photoshop nem talalhato a beallitott helyen' };
      }

      if (process.platform === 'darwin') {
        // macOS: open -a paranccsal inditjuk
        const child = execFile('open', ['-a', psPath]);
        child.unref();
      } else {
        // Windows: kozvetlen execFile
        const child = execFile(psPath, { detached: true, stdio: 'ignore' } as never);
        child.unref();
      }

      log.info(`Photoshop elinditva: ${psPath}`);
      return { success: true };
    } catch (error) {
      log.error('Photoshop inditasi hiba:', error);
      return { success: false, error: 'Nem sikerult elinditani a Photoshop-ot' };
    }
  });

  // Auto-detect Photoshop
  ipcMain.handle('photoshop:check-installed', () => {
    try {
      // Elobb nezzuk a mentett path-ot
      const savedPath = psStore.get('photoshopPath', null);
      if (savedPath && jsxRunner.isValidPhotoshopPath(savedPath)) {
        return { found: true, path: savedPath };
      }

      // Ha a mentett path nem valid, keressuk a default helyeken
      const foundPath = jsxRunner.findPhotoshopInstallation();
      if (foundPath) {
        psStore.set('photoshopPath', foundPath);
        log.info(`Photoshop auto-detektalva: ${foundPath}`);
        return { found: true, path: foundPath };
      }

      return { found: false, path: null };
    } catch (error) {
      log.error('Photoshop detektalasi hiba:', error);
      return { found: false, path: null };
    }
  });

  // Browse for Photoshop
  ipcMain.handle('photoshop:browse-path', async () => {
    try {
      if (process.platform === 'darwin') {
        // macOS: nativ "Choose Application" dialogus osascript-tel
        // Az Electron dialog nem tudja .app bundle-t kivalasztani (mappaként kezeli)
        return new Promise<{ cancelled: boolean; path?: string }>((resolve) => {
          execFile('osascript', [
            '-e',
            'POSIX path of (choose application with prompt "Válaszd ki a Photoshop alkalmazást" as alias)',
          ], { timeout: 60000 }, (error, stdout) => {
            if (error) {
              // User Cancel = -128 error
              resolve({ cancelled: true });
              return;
            }
            const appPath = stdout.trim().replace(/\/$/, ''); // trailing slash eltavolitasa
            resolve({ cancelled: false, path: appPath });
          });
        });
      } else {
        // Windows: exe fajlt valasztunk
        const result = await dialog.showOpenDialog({
          title: 'Photoshop kiválasztása',
          properties: ['openFile'],
          filters: [{ name: 'Futtatható fájlok', extensions: ['exe'] }],
          defaultPath: 'C:\\Program Files\\Adobe',
        });

        if (result.canceled || !result.filePaths.length) {
          return { cancelled: true };
        }

        return { cancelled: false, path: result.filePaths[0] };
      }
    } catch (error) {
      log.error('Photoshop browse hiba:', error);
      return { cancelled: true };
    }
  });

  // Get Downloads path
  ipcMain.handle('photoshop:get-downloads-path', () => {
    return app.getPath('downloads');
  });

  // ============ Tablo settings handlers ============

  // Get tablo margin
  ipcMain.handle('photoshop:get-margin', () => {
    return psStore.get('tabloMarginCm', 2);
  });

  // Set tablo margin
  ipcMain.handle('photoshop:set-margin', (_event, marginCm: number) => {
    try {
      if (typeof marginCm !== 'number' || marginCm < 0 || marginCm > 10) {
        return { success: false, error: 'Ervenytelen margo ertek (0-10 cm)' };
      }

      psStore.set('tabloMarginCm', marginCm);
      log.info(`Tablo margo beallitva: ${marginCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo margo beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a margo erteket' };
    }
  });

  // Get tablo student photo size
  ipcMain.handle('photoshop:get-student-size', () => {
    return psStore.get('tabloStudentSizeCm', 6);
  });

  // Set tablo student photo size
  ipcMain.handle('photoshop:set-student-size', (_event, sizeCm: number) => {
    try {
      if (typeof sizeCm !== 'number' || sizeCm < 1 || sizeCm > 30) {
        return { success: false, error: 'Ervenytelen kepmeret ertek (1-30 cm)' };
      }
      psStore.set('tabloStudentSizeCm', sizeCm);
      log.info(`Tablo diak kepmeret beallitva: ${sizeCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo diak kepmeret beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a kepmeret erteket' };
    }
  });

  // Get tablo teacher photo size
  ipcMain.handle('photoshop:get-teacher-size', () => {
    return psStore.get('tabloTeacherSizeCm', 6);
  });

  // Set tablo teacher photo size
  ipcMain.handle('photoshop:set-teacher-size', (_event, sizeCm: number) => {
    try {
      if (typeof sizeCm !== 'number' || sizeCm < 1 || sizeCm > 30) {
        return { success: false, error: 'Ervenytelen kepmeret ertek (1-30 cm)' };
      }
      psStore.set('tabloTeacherSizeCm', sizeCm);
      log.info(`Tablo tanar kepmeret beallitva: ${sizeCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo tanar kepmeret beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a kepmeret erteket' };
    }
  });

  // Get tablo gap vizszintes (kepek kozotti tavolsag)
  ipcMain.handle('photoshop:get-gap-h', () => {
    return psStore.get('tabloGapHCm', 2);
  });

  // Set tablo gap vizszintes
  ipcMain.handle('photoshop:set-gap-h', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 10) {
        return { success: false, error: 'Ervenytelen vizszintes gap ertek (0-10 cm)' };
      }

      psStore.set('tabloGapHCm', gapCm);
      log.info(`Tablo vizszintes gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo vizszintes gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // Get tablo gap fuggoleges (sorok kozotti tavolsag)
  ipcMain.handle('photoshop:get-gap-v', () => {
    return psStore.get('tabloGapVCm', 3);
  });

  // Set tablo gap fuggoleges
  ipcMain.handle('photoshop:set-gap-v', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 10) {
        return { success: false, error: 'Ervenytelen fuggoleges gap ertek (0-10 cm)' };
      }

      psStore.set('tabloGapVCm', gapCm);
      log.info(`Tablo fuggoleges gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo fuggoleges gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // Get name gap (tav a kep aljabol)
  ipcMain.handle('photoshop:get-name-gap', () => {
    return psStore.get('tabloNameGapCm', 0.5);
  });

  // Set name gap
  ipcMain.handle('photoshop:set-name-gap', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 5) {
        return { success: false, error: 'Ervenytelen nev gap ertek (0-5 cm)' };
      }
      psStore.set('tabloNameGapCm', gapCm);
      log.info(`Tablo nev gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo nev gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // Get name break after (hany szo utan tordeljon)
  ipcMain.handle('photoshop:get-name-break-after', () => {
    return psStore.get('tabloNameBreakAfter', 1);
  });

  // Set name break after
  ipcMain.handle('photoshop:set-name-break-after', (_event, breakAfter: number) => {
    try {
      if (typeof breakAfter !== 'number' || breakAfter < 0 || breakAfter > 5) {
        return { success: false, error: 'Ervenytelen tordeles ertek (0-5)' };
      }
      psStore.set('tabloNameBreakAfter', breakAfter);
      log.info(`Tablo nev tordeles beallitva: ${breakAfter} szo utan`);
      return { success: true };
    } catch (error) {
      log.error('Tablo nev tordeles beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a tordeles erteket' };
    }
  });

  // Get text align (nevek igazitasa)
  ipcMain.handle('photoshop:get-text-align', () => {
    return psStore.get('tabloTextAlign', 'center');
  });

  // Set text align
  ipcMain.handle('photoshop:set-text-align', (_event, align: string) => {
    try {
      if (!['left', 'center', 'right'].includes(align)) {
        return { success: false, error: 'Ervenytelen igazitas (left/center/right)' };
      }
      psStore.set('tabloTextAlign', align);
      log.info(`Tablo text igazitas beallitva: ${align}`);
      return { success: true };
    } catch (error) {
      log.error('Tablo text igazitas beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az igazitas erteket' };
    }
  });

  // Get grid align (kepek igazitasa a sorban)
  ipcMain.handle('photoshop:get-grid-align', () => {
    return psStore.get('tabloGridAlign', 'center');
  });

  // Set grid align
  ipcMain.handle('photoshop:set-grid-align', (_event, align: string) => {
    try {
      if (!['left', 'center', 'right'].includes(align)) {
        return { success: false, error: 'Ervenytelen grid igazitas (left/center/right)' };
      }
      psStore.set('tabloGridAlign', align);
      log.info(`Tablo grid igazitas beallitva: ${align}`);
      return { success: true };
    } catch (error) {
      log.error('Tablo grid igazitas beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni az igazitas erteket' };
    }
  });

  // Get position gap (pozicio szoveg tavolsaga a nev alja alatt)
  ipcMain.handle('photoshop:get-position-gap', () => {
    return psStore.get('tabloPositionGapCm', 0.15);
  });

  // Set position gap
  ipcMain.handle('photoshop:set-position-gap', (_event, gapCm: number) => {
    try {
      if (typeof gapCm !== 'number' || gapCm < 0 || gapCm > 5) {
        return { success: false, error: 'Ervenytelen pozicio gap ertek (0-5 cm)' };
      }
      psStore.set('tabloPositionGapCm', gapCm);
      log.info(`Tablo pozicio gap beallitva: ${gapCm} cm`);
      return { success: true };
    } catch (error) {
      log.error('Tablo pozicio gap beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a gap erteket' };
    }
  });

  // Get position font size
  ipcMain.handle('photoshop:get-position-font-size', () => {
    return psStore.get('tabloPositionFontSize', 18);
  });

  // Set position font size
  ipcMain.handle('photoshop:set-position-font-size', (_event, fontSize: number) => {
    try {
      if (typeof fontSize !== 'number' || fontSize < 6 || fontSize > 100) {
        return { success: false, error: 'Ervenytelen pozicio font meret (6-100 pt)' };
      }
      psStore.set('tabloPositionFontSize', fontSize);
      log.info(`Tablo pozicio font meret beallitva: ${fontSize} pt`);
      return { success: true };
    } catch (error) {
      log.error('Tablo pozicio font meret beallitasi hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a font meretet' };
    }
  });
}
