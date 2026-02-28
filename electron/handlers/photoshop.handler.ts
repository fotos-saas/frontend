import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Store from 'electron-store';
import log from 'electron-log/main';
import { JsxRunnerService, PhotoshopSchema } from '../services/jsx-runner.service';

// ============ Placed Photos JSON helpers ============

interface PlacedPhotoEntry {
  mediaId: number | null;
  photoUrl: string;
  withFrame: boolean;
  placedAt: string;
}

type PlacedPhotosMap = Record<string, PlacedPhotoEntry>;

function extractPersonId(layerName: string): number | null {
  const idx = layerName.indexOf('---');
  if (idx === -1) return null;
  const id = parseInt(layerName.substring(idx + 3), 10);
  return isNaN(id) ? null : id;
}

function extractMediaId(photoUrl: string): number | null {
  const match = photoUrl.match(/\/storage\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

function updatePlacedPhotosJson(
  psdFilePath: string | undefined,
  jsxOutput: string | undefined,
  layers: Array<{ layerName: string; photoUrl: string }>,
  syncBorder: boolean,
): void {
  // PSD path meghatározása: params-ból vagy JSX output-ból
  let psdDir: string | undefined;

  if (psdFilePath) {
    psdDir = path.dirname(psdFilePath);
  } else if (jsxOutput) {
    // JSX output-ból PSD path kinyerése (CONFIG.PSD_FILE_PATH sorokból)
    const psdMatch = jsxOutput.match(/PSD_FILE_PATH[:\s]+"?([^"\n]+)"?/);
    if (psdMatch) {
      psdDir = path.dirname(psdMatch[1]);
    }
  }

  if (!psdDir) {
    log.info('Placed photos JSON: nincs PSD utvonal, kihagyva');
    return;
  }

  const jsonPath = path.join(psdDir, 'placed-photos.json');

  // Meglévő JSON beolvasása
  let existing: PlacedPhotosMap = {};
  try {
    if (fs.existsSync(jsonPath)) {
      existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
  } catch (err) {
    log.warn('Placed photos JSON olvasasi hiba, uj fajl lesz:', err);
  }

  // Frissítés a behelyezett fotókkal
  const now = new Date().toISOString();
  for (const layer of layers) {
    const personId = extractPersonId(layer.layerName);
    if (personId === null) continue;

    existing[String(personId)] = {
      mediaId: extractMediaId(layer.photoUrl),
      photoUrl: layer.photoUrl,
      withFrame: syncBorder,
      placedAt: now,
    };
  }

  // Visszaírás
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf-8');
    log.info(`Placed photos JSON frissitve: ${jsonPath} (${Object.keys(existing).length} person)`);
  } catch (err) {
    log.error('Placed photos JSON irasi hiba:', err);
  }
}

const psStore = new Store<PhotoshopSchema>({
  name: 'photostack-photoshop',
  defaults: {
    photoshopPath: null,
    workDirectory: null,
    tabloMarginCm: 2,
    tabloStudentSizeCm: 6,
    tabloTeacherSizeCm: 6,
    tabloGapHCm: 2,
    tabloGapVCm: 3,
    tabloNameGapCm: 0.5,
    tabloNameBreakAfter: 1,
    tabloTextAlign: 'center',
    tabloGridAlign: 'center',
    tabloPositionGapCm: 0.15,
    tabloPositionFontSize: 18,
  },
});

// JsxRunnerService instance — exportálva a background mód számára is
export const jsxRunner = new JsxRunnerService(psStore);

export function registerPhotoshopHandlers(_mainWindow: BrowserWindow): void {
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

  // Generate PSD file
  ipcMain.handle('photoshop:generate-psd', async (_event, params: {
    widthCm: number;
    heightCm: number;
    dpi: number;
    mode: string;
    outputPath: string;
    persons?: Array<{ id: number; name: string; type: string }>;
  }) => {
    let personsJsonPath: string | null = null;

    try {
      // Input validacio
      if (typeof params.widthCm !== 'number' || typeof params.heightCm !== 'number') {
        return { success: false, error: 'Ervenytelen meret parameterek' };
      }
      if (params.widthCm <= 0 || params.heightCm <= 0) {
        return { success: false, error: 'A mereteknek pozitivnak kell lenniuk' };
      }
      if (typeof params.outputPath !== 'string' || params.outputPath.length > 500) {
        return { success: false, error: 'Ervenytelen kimeneti eleresi ut' };
      }

      // Kimeneti mappa letrehozasa (rekurziv)
      const outputDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        log.info(`Mappa letrehozva: ${outputDir}`);
      }

      // Python script eleresi ut (extraResources-bol)
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py')
        : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py');

      const args = [
        scriptPath,
        '--width-cm', String(params.widthCm),
        '--height-cm', String(params.heightCm),
        '--dpi', String(params.dpi || 200),
        '--mode', params.mode || 'RGB',
        '--output', params.outputPath,
      ];

      // Szemelyek JSON temp fajlba irasa (ha vannak)
      if (params.persons && params.persons.length > 0) {
        personsJsonPath = path.join(app.getPath('temp'), `psd-persons-${Date.now()}.json`);
        fs.writeFileSync(personsJsonPath, JSON.stringify(params.persons), 'utf-8');
        args.push('--persons-json', personsJsonPath);
        log.info(`Szemelyek JSON irva: ${personsJsonPath} (${params.persons.length} fo)`);
      }

      return new Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>((resolve) => {
        execFile('python3', args, { timeout: 30000 }, (error, stdout, stderr) => {
          // Temp fajl torlese
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }

          if (error) {
            log.error('PSD generalas hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message, stdout: stdout || '', stderr: stderr || '' });
            return;
          }
          log.info('PSD generalva:', stdout.trim());
          resolve({ success: true, stdout: stdout || '', stderr: stderr || '' });
        });
      });
    } catch (error) {
      // Temp fajl torlese hiba eseten is
      if (personsJsonPath && fs.existsSync(personsJsonPath)) {
        try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('PSD generalasi hiba:', error);
      return { success: false, error: 'Nem sikerult a PSD generalasa' };
    }
  });

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

  // ============ JSX — JsxRunnerService delegálás ============

  // Run JSX script (non-streaming) via osascript — delegálva JsxRunnerService-nek
  ipcMain.handle('photoshop:run-jsx', async (_event, params) => {
    return jsxRunner.runJsx(params);
  });

  // Run JSX script with streaming debug logs — delegálva JsxRunnerService-nek
  ipcMain.handle('photoshop:run-jsx-debug', async (_event, params) => {
    const win = _mainWindow;
    return jsxRunner.runJsxStreaming({
      ...params,
      onLog: (line, stream) => {
        try { win.webContents.send('jsx-debug-log', { line, stream }); } catch (_) { /* ignore */ }
      },
    });
  });

  // Generate PSD with streaming debug logs (soronkent kuldi a logokat a renderernek)
  ipcMain.handle('photoshop:generate-psd-debug', async (_event, params: {
    widthCm: number;
    heightCm: number;
    dpi: number;
    mode: string;
    outputPath: string;
    persons?: Array<{ id: number; name: string; type: string }>;
  }) => {
    let personsJsonPath: string | null = null;
    const win = _mainWindow;

    const sendLog = (line: string, stream: 'stdout' | 'stderr') => {
      try { win.webContents.send('psd-debug-log', { line, stream }); } catch (_) { /* ignore */ }
    };

    try {
      // Input validacio
      if (typeof params.widthCm !== 'number' || typeof params.heightCm !== 'number') {
        return { success: false, error: 'Ervenytelen meret parameterek' };
      }
      if (params.widthCm <= 0 || params.heightCm <= 0) {
        return { success: false, error: 'A mereteknek pozitivnak kell lenniuk' };
      }
      if (typeof params.outputPath !== 'string' || params.outputPath.length > 500) {
        return { success: false, error: 'Ervenytelen kimeneti eleresi ut' };
      }

      // Kimeneti mappa letrehozasa (rekurziv)
      const outputDir = path.dirname(params.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        sendLog(`[DEBUG] Mappa letrehozva: ${outputDir}`, 'stdout');
      }

      // Python script eleresi ut
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py')
        : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'python', 'tasks', 'generate_psd.py');

      sendLog(`[DEBUG] Script: ${scriptPath}`, 'stdout');
      sendLog(`[DEBUG] Script letezik: ${fs.existsSync(scriptPath)}`, 'stdout');

      const spawnArgs = [
        scriptPath,
        '--width-cm', String(params.widthCm),
        '--height-cm', String(params.heightCm),
        '--dpi', String(params.dpi || 200),
        '--mode', params.mode || 'RGB',
        '--output', params.outputPath,
      ];

      // Szemelyek JSON temp fajlba irasa
      if (params.persons && params.persons.length > 0) {
        personsJsonPath = path.join(app.getPath('temp'), `psd-persons-${Date.now()}.json`);
        fs.writeFileSync(personsJsonPath, JSON.stringify(params.persons), 'utf-8');
        spawnArgs.push('--persons-json', personsJsonPath);
        sendLog(`[DEBUG] Persons JSON irva: ${personsJsonPath} (${params.persons.length} fo)`, 'stdout');
      }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const child = spawn('python3', spawnArgs, { timeout: 30000 });
        let stderrBuf = '';

        child.stdout.on('data', (data: Buffer) => {
          const text = data.toString('utf-8');
          for (const line of text.split('\n')) {
            if (line.trim()) sendLog(line, 'stdout');
          }
        });

        child.stderr.on('data', (data: Buffer) => {
          const text = data.toString('utf-8');
          stderrBuf += text;
          for (const line of text.split('\n')) {
            if (line.trim()) sendLog(line, 'stderr');
          }
        });

        child.on('close', (code) => {
          // Temp fajl torlese
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }

          if (code !== 0) {
            log.error(`PSD debug generalas hiba (exit ${code}):`, stderrBuf);
            resolve({ success: false, error: stderrBuf || `Exit code: ${code}` });
          } else {
            log.info('PSD debug generalva sikeresen');
            resolve({ success: true });
          }
        });

        child.on('error', (err) => {
          if (personsJsonPath && fs.existsSync(personsJsonPath)) {
            try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
          }
          sendLog(`[DEBUG] HIBA: ${err.message}`, 'stderr');
          log.error('PSD debug spawn hiba:', err);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      if (personsJsonPath && fs.existsSync(personsJsonPath)) {
        try { fs.unlinkSync(personsJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('PSD debug generalasi hiba:', error);
      return { success: false, error: 'Nem sikerult a PSD generalasa' };
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

  // ============ Snapshot rendszer (layouts/ mappa) ============

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

      const hasPlacedPhotos = fs.existsSync(path.join(psdDir, 'placed-photos.json'));

      return { success: true, exists: true, hasLayouts, hasPlacedPhotos };
    } catch (error) {
      log.error('PSD letezés ellenorzes hiba:', error);
      return { success: false, exists: false, hasLayouts: false, hasPlacedPhotos: false };
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

  // Backup PSD file (meglévő PSD + layouts/ mappa másolása _backup_YYYYMMDD_HHmmss suffixszel)
  ipcMain.handle('photoshop:backup-psd', (_event, params: { psdPath: string }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Érvénytelen paraméter' };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Path traversal nem megengedett' };
      }
      if (!fs.existsSync(params.psdPath)) {
        return { success: false, error: 'A PSD fájl nem létezik' };
      }

      const psdDir = path.dirname(params.psdPath);
      const psdBase = path.basename(params.psdPath, '.psd');
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const backupName = `${psdBase}_backup_${timestamp}.psd`;
      const backupPath = path.join(psdDir, backupName);

      // PSD fájl másolása
      fs.copyFileSync(params.psdPath, backupPath);
      log.info(`PSD backup keszult: ${backupPath}`);

      // layouts/ mappa másolása ha létezik
      const layoutsDir = path.join(psdDir, 'layouts');
      if (fs.existsSync(layoutsDir)) {
        const backupLayoutsDir = path.join(psdDir, `layouts_backup_${timestamp}`);
        fs.mkdirSync(backupLayoutsDir, { recursive: true });
        const files = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          fs.copyFileSync(path.join(layoutsDir, file), path.join(backupLayoutsDir, file));
        }
        log.info(`Layouts backup keszult: ${backupLayoutsDir} (${files.length} fajl)`);
      }

      return { success: true, backupPath };
    } catch (error) {
      log.error('PSD backup hiba:', error);
      return { success: false, error: 'Backup készítés sikertelen' };
    }
  });

  // Load snapshot JSON content
  ipcMain.handle('photoshop:load-snapshot', (_event, params: { snapshotPath: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok olvashatoak' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat olvasunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok olvashatoak' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      const content = fs.readFileSync(params.snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      log.info(`Snapshot betoltve: ${params.snapshotPath}`);

      return { success: true, data };
    } catch (error) {
      log.error('Snapshot betoltesi hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a snapshot-ot' };
    }
  });

  // Rename snapshot (snapshotName mezo frissitese a JSON-ben)
  ipcMain.handle('photoshop:rename-snapshot', (_event, params: { snapshotPath: string; newName: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (typeof params.newName !== 'string' || params.newName.trim().length === 0 || params.newName.length > 200) {
        return { success: false, error: 'Ervenytelen nev' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok modosithatoak' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat modositunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok modosithatoak' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      const content = fs.readFileSync(params.snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      data.snapshotName = params.newName.trim();

      fs.writeFileSync(params.snapshotPath, JSON.stringify(data, null, 2), 'utf-8');
      log.info(`Snapshot atnevezve: ${params.snapshotPath} → "${params.newName.trim()}"`);

      return { success: true };
    } catch (error) {
      log.error('Snapshot atnevezesi hiba:', error);
      return { success: false, error: 'Nem sikerult atnevezni a snapshot-ot' };
    }
  });

  // Delete snapshot from layouts/ folder
  ipcMain.handle('photoshop:delete-snapshot', (_event, params: { snapshotPath: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok torolhetok' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat torlunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok torolhetok' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      fs.unlinkSync(params.snapshotPath);
      log.info(`Snapshot torolve: ${params.snapshotPath}`);

      return { success: true };
    } catch (error) {
      log.error('Snapshot torlesi hiba:', error);
      return { success: false, error: 'Nem sikerult torolni a snapshot-ot' };
    }
  });

  // ============ Globalis sablon rendszer (template store) ============

  interface GlobalTemplate {
    version: number;
    type: 'template';
    id: string;
    templateName: string;
    createdAt: string;
    source: { documentName: string; widthPx: number; heightPx: number; dpi: number };
    board: { widthCm: number; heightCm: number; marginCm: number; gapHCm: number; gapVCm: number; gridAlign: string };
    nameSettings: { nameGapCm: number; textAlign: string; nameBreakAfter: number };
    studentSlots: Array<{ index: number; image: { x: number; y: number; width: number; height: number }; name: { x: number; y: number; width: number; height: number; justification: string } | null }>;
    teacherSlots: Array<{ index: number; image: { x: number; y: number; width: number; height: number }; name: { x: number; y: number; width: number; height: number; justification: string } | null }>;
    fixedLayers: Array<{ layerName: string; groupPath: string[]; x: number; y: number; width: number; height: number; kind: string }>;
  }

  interface TemplateStoreSchema {
    globalTemplates: GlobalTemplate[];
  }

  const templateStore = new Store<TemplateStoreSchema>({
    name: 'photostack-templates',
    defaults: {
      globalTemplates: [],
    },
  });

  // Save template
  ipcMain.handle('photoshop:save-template', (_event, params: { templateData: GlobalTemplate }) => {
    try {
      if (!params.templateData || !params.templateData.id) {
        return { success: false, error: 'Ervenytelen sablon adat' };
      }

      const templates = templateStore.get('globalTemplates', []);
      // Feluliras ha mar letezik azonos ID-val
      const idx = templates.findIndex(t => t.id === params.templateData.id);
      if (idx >= 0) {
        templates[idx] = params.templateData;
      } else {
        templates.push(params.templateData);
      }
      templateStore.set('globalTemplates', templates);
      log.info(`Sablon mentve: ${params.templateData.templateName} (${params.templateData.id})`);
      return { success: true };
    } catch (error) {
      log.error('Sablon mentes hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a sablont' };
    }
  });

  // List templates (rovid osszefoglalo)
  ipcMain.handle('photoshop:list-templates', () => {
    try {
      const templates = templateStore.get('globalTemplates', []);
      const list = templates.map(t => ({
        id: t.id,
        templateName: t.templateName,
        createdAt: t.createdAt,
        studentSlotCount: t.studentSlots?.length || 0,
        teacherSlotCount: t.teacherSlots?.length || 0,
        boardWidthCm: t.board?.widthCm || 0,
        boardHeightCm: t.board?.heightCm || 0,
        sourceDocName: t.source?.documentName || '',
      }));
      // Legujabb elol
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { success: true, templates: list };
    } catch (error) {
      log.error('Sablon lista hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a sablon listat', templates: [] };
    }
  });

  // Load template (teljes JSON)
  ipcMain.handle('photoshop:load-template', (_event, params: { templateId: string }) => {
    try {
      if (typeof params.templateId !== 'string' || params.templateId.length > 100) {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      return { success: true, data: tmpl };
    } catch (error) {
      log.error('Sablon betoltes hiba:', error);
      return { success: false, error: 'Nem sikerult betolteni a sablont' };
    }
  });

  // Delete template
  ipcMain.handle('photoshop:delete-template', (_event, params: { templateId: string }) => {
    try {
      if (typeof params.templateId !== 'string') {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const filtered = templates.filter(t => t.id !== params.templateId);
      if (filtered.length === templates.length) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      templateStore.set('globalTemplates', filtered);
      log.info(`Sablon torolve: ${params.templateId}`);
      return { success: true };
    } catch (error) {
      log.error('Sablon torles hiba:', error);
      return { success: false, error: 'Nem sikerult torolni a sablont' };
    }
  });

  // Rename template
  ipcMain.handle('photoshop:rename-template', (_event, params: { templateId: string; newName: string }) => {
    try {
      if (typeof params.templateId !== 'string' || typeof params.newName !== 'string') {
        return { success: false, error: 'Ervenytelen parameterek' };
      }
      if (params.newName.trim().length === 0 || params.newName.length > 200) {
        return { success: false, error: 'Ervenytelen nev' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      tmpl.templateName = params.newName.trim();
      templateStore.set('globalTemplates', templates);
      log.info(`Sablon atnevezve: ${params.templateId} → "${params.newName.trim()}"`);
      return { success: true };
    } catch (error) {
      log.error('Sablon atnevezes hiba:', error);
      return { success: false, error: 'Nem sikerult atnevezni a sablont' };
    }
  });

  // Apply template — pozíciók kiszámítása + JSX futtatás
  ipcMain.handle('photoshop:apply-template', async (_event, params: { templateId: string; targetDocName?: string; psdFilePath?: string }) => {
    try {
      if (typeof params.templateId !== 'string') {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }

      // 1. Sablon betoltese
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }

      // 2. Jelenlegi dokumentum layout kiolvasasa
      const readJsxPath = jsxRunner.resolveJsxPath('actions/read-layout.jsx');
      if (!fs.existsSync(readJsxPath)) {
        return { success: false, error: 'read-layout.jsx nem talalhato' };
      }

      const readJsxCode = jsxRunner.buildJsxScript('actions/read-layout.jsx', undefined, params.targetDocName, params.psdFilePath);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott' };
      }

      // Temp JSX fajl
      const tempReadJsxPath = path.join(app.getPath('temp'), `jsx-read-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempReadJsxPath, readJsxCode, 'utf-8');

      const readAppleScript = jsxRunner.buildFocusPreservingAppleScript(tempReadJsxPath);

      const readOutput = await new Promise<string>((resolve, reject) => {
        execFile('osascript', ['-e', readAppleScript], { timeout: 30000 }, (error, stdout, stderr) => {
          try { fs.unlinkSync(tempReadJsxPath); } catch (_) { /* ignore */ }
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout || '');
        });
      });

      // Parse layout
      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = readOutput.indexOf(jsonPrefix);
      if (jsonStart === -1) {
        return { success: false, error: 'Nem sikerult kiolvasni a dokumentum layoutjat' };
      }

      const jsonStr = readOutput.substring(jsonStart + jsonPrefix.length).trim();
      let currentLayout: {
        document: { name: string; widthPx: number; heightPx: number; dpi: number };
        layers: Array<{ layerId: number; layerName: string; groupPath: string[]; x: number; y: number; width: number; height: number; kind: string; justification?: string }>;
      };

      try {
        currentLayout = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      // 3. Jelenlegi layerek csoportositasa
      const currentStudentImages: typeof currentLayout.layers = [];
      const currentTeacherImages: typeof currentLayout.layers = [];
      const currentStudentNames: typeof currentLayout.layers = [];
      const currentTeacherNames: typeof currentLayout.layers = [];

      for (const l of currentLayout.layers) {
        const gp = l.groupPath;
        if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Students') {
          currentStudentImages.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Teachers') {
          currentTeacherImages.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Students') {
          currentStudentNames.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Teachers') {
          currentTeacherNames.push(l);
        }
      }

      // 4. DPI skalazas faktor
      const docDpi = currentLayout.document.dpi || 200;
      const templateDpi = tmpl.source.dpi || 200;
      const dpiScale = docDpi / templateDpi;

      // 5. Mozgatasok osszeallitasa
      const moves: Array<{ layerName: string; groupPath: string[]; targetX: number; targetY: number; justification?: string }> = [];

      // Referencia a tmpl-re (mar ellenorizve hogy nem undefined)
      const templateRef = tmpl;
      const nameSettings = templateRef.nameSettings;

      // Diak slotok parositas index alapjan
      function buildMoves(
        slots: GlobalTemplate['studentSlots'],
        images: typeof currentStudentImages,
        names: typeof currentStudentNames,
        imgGroupPath: string[],
        nameGroupPath: string[],
        boardConfig: GlobalTemplate['board'],
      ) {
        for (let i = 0; i < images.length; i++) {
          if (i < slots.length) {
            // Sablon slot-ra mozgatas
            const slot = slots[i];
            moves.push({
              layerName: images[i].layerName,
              groupPath: imgGroupPath,
              targetX: Math.round(slot.image.x * dpiScale),
              targetY: Math.round(slot.image.y * dpiScale),
            });

            // Nev layer mozgatasa (ha van)
            if (i < names.length && slot.name) {
              moves.push({
                layerName: names[i].layerName,
                groupPath: nameGroupPath,
                targetX: Math.round(slot.name.x * dpiScale),
                targetY: Math.round(slot.name.y * dpiScale),
                justification: slot.name.justification,
              });
            }
          } else {
            // Overflow — uj grid poziciok szamitasa
            const overflowIdx = i - slots.length;
            if (slots.length === 0) continue;

            const refSlot = slots[0];
            const photoW = Math.round(refSlot.image.width * dpiScale);
            const photoH = Math.round(refSlot.image.height * dpiScale);
            const marginPx = Math.round((boardConfig.marginCm / 2.54) * docDpi);
            const gapHPx = Math.round((boardConfig.gapHCm / 2.54) * docDpi);
            const gapVPx = Math.round((boardConfig.gapVCm / 2.54) * docDpi);
            const boardWidthPx = currentLayout.document.widthPx;

            const columns = Math.max(1, Math.floor((boardWidthPx - 2 * marginPx + gapHPx) / (photoW + gapHPx)));

            // Az utolso slot sor utani pozicio
            const lastSlot = slots[slots.length - 1];
            const lastRowY = Math.round(lastSlot.image.y * dpiScale);
            const nameGapPx = Math.round((nameSettings.nameGapCm / 2.54) * docDpi);
            const nameHeight = lastSlot.name ? Math.round(lastSlot.name.height * dpiScale) : 0;
            const startY = lastRowY + photoH + nameGapPx + nameHeight + gapVPx;

            const col = overflowIdx % columns;
            const row = Math.floor(overflowIdx / columns);
            const overflowX = marginPx + col * (photoW + gapHPx);
            const overflowY = startY + row * (photoH + nameGapPx + nameHeight + gapVPx);

            moves.push({
              layerName: images[i].layerName,
              groupPath: imgGroupPath,
              targetX: overflowX,
              targetY: overflowY,
            });

            // Nev layer overflow
            if (i < names.length) {
              moves.push({
                layerName: names[i].layerName,
                groupPath: nameGroupPath,
                targetX: overflowX,
                targetY: overflowY + photoH + nameGapPx,
                justification: nameSettings.textAlign || 'center',
              });
            }
          }
        }
      }

      buildMoves(templateRef.studentSlots, currentStudentImages, currentStudentNames, ['Images', 'Students'], ['Names', 'Students'], templateRef.board);
      buildMoves(templateRef.teacherSlots, currentTeacherImages, currentTeacherNames, ['Images', 'Teachers'], ['Names', 'Teachers'], templateRef.board);

      if (moves.length === 0) {
        return { success: true, output: 'Nincs mozgatando layer' };
      }

      log.info(`Sablon alkalmazas: ${moves.length} mozgatas (dpiScale: ${dpiScale.toFixed(2)})`);

      // 6. apply-template.jsx futtatasa
      const tempJsonPath = path.join(app.getPath('temp'), `jsx-tmpl-moves-${Date.now()}.json`);
      fs.writeFileSync(tempJsonPath, JSON.stringify({ moves }), 'utf-8');

      const applyJsxCode = jsxRunner.buildJsxScript('actions/apply-template.jsx', tempJsonPath, params.targetDocName, params.psdFilePath);
      const tempApplyJsxPath = path.join(app.getPath('temp'), `jsx-apply-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempApplyJsxPath, applyJsxCode, 'utf-8');

      const applyAppleScript = jsxRunner.buildFocusPreservingAppleScript(tempApplyJsxPath);

      const applyOutput = await new Promise<string>((resolve, reject) => {
        execFile('osascript', ['-e', applyAppleScript], { timeout: 60000 }, (error, stdout, stderr) => {
          try { fs.unlinkSync(tempApplyJsxPath); } catch (_) { /* ignore */ }
          try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout || '');
        });
      });

      log.info('Sablon alkalmazas kesz');
      return { success: true, output: applyOutput };
    } catch (error) {
      log.error('Sablon alkalmazas hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
  });

  // Fotok behelyezese meglevo Smart Object layerekbe
  // A kijelolt layerek fotoihoz letolti a kepeket es a JSX csereli az SO tartalmAt
  ipcMain.handle('photoshop:place-photos', async (_event, params: {
    layers: Array<{ layerName: string; photoUrl: string }>;
    targetDocName?: string;
    psdFilePath?: string;
    syncBorder?: boolean;
  }) => {
    let tempJsonPath: string | null = null;

    try {
      if (!params.layers || params.layers.length === 0) {
        return { success: false, error: 'Nincs layer adat' };
      }

      log.info(`Place photos: ${params.layers.length} layer fotojanak letoltese...`);

      // Fotok parhuzamos letoltese
      const downloadResults = await Promise.all(
        params.layers.map(async (item) => {
          try {
            const ext = item.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
            // URL hash a fájlnévben — ha a fotó URL megváltozik (pl. aktív fotó csere), a cache invalidálódik
            const urlHash = crypto.createHash('md5').update(item.photoUrl).digest('hex').substring(0, 8);
            const fileName = `${item.layerName}-${urlHash}.${ext}`;
            const localPath = await jsxRunner.downloadPhoto(item.photoUrl, fileName);
            return { layerName: item.layerName, photoPath: localPath };
          } catch (err) {
            log.warn(`Foto letoltes sikertelen (${item.layerName}):`, err);
            return null;
          }
        }),
      );

      // Sikeres letoltesek szurese
      const validLayers = downloadResults.filter(
        (r): r is { layerName: string; photoPath: string } => r !== null,
      );

      if (validLayers.length === 0) {
        return { success: false, error: 'Egy foto sem sikerult letolteni' };
      }

      // JSON temp fajl irasa a JSX szamara
      tempJsonPath = path.join(app.getPath('temp'), `jsx-place-photos-${Date.now()}.json`);
      fs.writeFileSync(tempJsonPath, JSON.stringify({ layers: validLayers }), 'utf-8');

      log.info(`Place photos JSON irva: ${tempJsonPath} (${validLayers.length}/${params.layers.length} fotoval)`);

      // JSX futtatasa
      const extraConfig = params.syncBorder ? { SYNC_BORDER: 'true' } : undefined;
      const jsxCode = jsxRunner.buildJsxScript('actions/place-photos.jsx', tempJsonPath, params.targetDocName, params.psdFilePath, extraConfig);
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-place-photos-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = jsxRunner.buildFocusPreservingAppleScript(tempJsxPath);

      return new Promise<{ success: boolean; error?: string; output?: string }>((resolve) => {
        execFile('osascript', ['-e', appleScript], { timeout: 120000 }, (error, stdout, stderr) => {
          // Temp fajlok torlese
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }

          if (error) {
            log.error('Place photos JSX hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message });
            return;
          }
          log.info('Place photos kesz:', stdout.trim().slice(0, 500));

          // Placed photos JSON frissítése
          try {
            updatePlacedPhotosJson(params.psdFilePath, stdout, params.layers, !!params.syncBorder);
          } catch (jsonErr) {
            log.warn('Placed photos JSON frissites sikertelen:', jsonErr);
          }

          resolve({ success: true, output: stdout || '' });
        });
      });
    } catch (error) {
      if (tempJsonPath && fs.existsSync(tempJsonPath)) {
        try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
      }
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

  log.info('Photoshop IPC handlerek regisztralva');
}
