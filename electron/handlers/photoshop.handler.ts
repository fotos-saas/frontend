import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import Store from 'electron-store';
import log from 'electron-log/main';
import sharp from 'sharp';

interface PhotoshopSchema {
  photoshopPath: string | null;
  workDirectory: string | null;
  tabloMarginCm: number;
  tabloStudentSizeCm: number;
  tabloTeacherSizeCm: number;
  tabloGapHCm: number;
  tabloGapVCm: number;
  tabloNameGapCm: number;
  tabloNameBreakAfter: number;
  tabloTextAlign: string;
  tabloGridAlign: string;
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
  },
});

/** Default Photoshop install helyek (macOS + Windows) */
const DEFAULT_PS_PATHS_MAC = [
  '/Applications/Adobe Photoshop 2026/Adobe Photoshop 2026.app',
  '/Applications/Adobe Photoshop 2025/Adobe Photoshop 2025.app',
  '/Applications/Adobe Photoshop 2024/Adobe Photoshop 2024.app',
  '/Applications/Adobe Photoshop CC 2024/Adobe Photoshop CC 2024.app',
];

const DEFAULT_PS_PATHS_WIN = [
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2026\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe',
  'C:\\Program Files\\Adobe\\Adobe Photoshop CC 2024\\Photoshop.exe',
];

function isValidPhotoshopPath(psPath: string): boolean {
  if (!fs.existsSync(psPath)) return false;

  if (process.platform === 'darwin') {
    // macOS: .app bundle = directory
    return psPath.endsWith('.app') && fs.statSync(psPath).isDirectory();
  } else {
    // Windows: .exe file
    return psPath.endsWith('.exe') && fs.statSync(psPath).isFile();
  }
}

function findPhotoshopInstallation(): string | null {
  const paths = process.platform === 'darwin' ? DEFAULT_PS_PATHS_MAC : DEFAULT_PS_PATHS_WIN;

  for (const psPath of paths) {
    if (isValidPhotoshopPath(psPath)) {
      return psPath;
    }
  }
  return null;
}

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

      if (!isValidPhotoshopPath(psPath)) {
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

      if (!isValidPhotoshopPath(psPath)) {
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
      if (savedPath && isValidPhotoshopPath(savedPath)) {
        return { found: true, path: savedPath };
      }

      // Ha a mentett path nem valid, keressuk a default helyeken
      const foundPath = findPhotoshopInstallation();
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
        // macOS: AppleScript-tel ellenorizzuk hogy a fajl mar nyitva van-e PS-ben
        // Ha igen, csak aktivaljuk — ha nem, megnyitjuk
        const fileName = path.basename(filePath);
        const script = `
          tell application id "com.adobe.Photoshop"
            activate
            set isOpen to false
            repeat with d in documents
              if name of d is "${fileName.replace(/"/g, '\\"')}" then
                set isOpen to true
                set current document to d
                exit repeat
              end if
            end repeat
            if not isOpen then
              open POSIX file "${filePath.replace(/"/g, '\\"')}"
            end if
          end tell
        `;
        const child = execFile('osascript', ['-e', script]);
        child.unref();
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

  // ============ JSX ExtendScript futtatás ============

  // JSX scriptek kihelyezese a workDir/scripts/ mappaba
  // Ha a mappa nem letezik → friss masolas
  // Ha a forrasfajl ujabb mint a cel → feluliras
  function deployJsxScripts(workDir: string): void {
    const sourceBase = app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript')
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript');

    const targetBase = path.join(workDir, 'scripts');

    // Rekurzivan masol egy mappat, csak ujabb fajlokat irja felul
    function syncDir(srcDir: string, dstDir: string): void {
      if (!fs.existsSync(dstDir)) {
        fs.mkdirSync(dstDir, { recursive: true });
      }

      const entries = fs.readdirSync(srcDir, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const dstPath = path.join(dstDir, entry.name);

        if (entry.isDirectory()) {
          syncDir(srcPath, dstPath);
        } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
          let needsCopy = true;
          if (fs.existsSync(dstPath)) {
            const srcMtime = fs.statSync(srcPath).mtimeMs;
            const dstMtime = fs.statSync(dstPath).mtimeMs;
            if (srcMtime <= dstMtime) {
              needsCopy = false;
            }
          }
          if (needsCopy) {
            fs.copyFileSync(srcPath, dstPath);
            log.info(`JSX deploy: ${path.relative(targetBase, dstPath)}`);
          }
        }
      }
    }

    try {
      syncDir(sourceBase, targetBase);
      log.info(`JSX scriptek kihelyezve: ${targetBase}`);
    } catch (error) {
      log.error('JSX deploy hiba:', error);
    }
  }

  // Ekezetmentes slug (layerName generalashoz)
  // Unicode NFD normalizacio: ekezetes → alap + combining mark, majd mark strip
  // Univerzalis: magyar, nemet, francia, stb. mind mukodik
  function sanitizeNameForLayer(text: string, personId?: number): string {
    let result = text
      .normalize('NFD')                    // pl. "á" → "a" + combining acute
      .replace(/[\u0300-\u036f]/g, '')     // combining diacritical marks torlese
      .replace(/\u0150/g, 'O').replace(/\u0151/g, 'o')  // Ő/ő (kettős ékezet — NFD nem bontja)
      .replace(/\u0170/g, 'U').replace(/\u0171/g, 'u')  // Ű/ű (kettős ékezet — NFD nem bontja)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (personId !== undefined) {
      result += `---${personId}`;
    }
    return result;
  }

  // Nev tordelese:
  // Rovid prefix (Dr., Cs., Id., Ifj. — max 2 betu pont nelkul) a kovetkezo szohoz tartozik,
  // NEM onallo nevresz. A "valodi" nevreszek szama dont: <3 → nem tor.
  // Kotojeles szo utan torjuk ha 3+ valodi nevresz van.
  // Photoshop \r-t hasznal sortoresnek (nem \n!)
  function breakName(name: string, breakAfter: number): string {
    if (breakAfter <= 0) return name;
    const words = name.split(' ');
    if (words.length < 2) return name;
    // "Valodi" nevreszek szamolasa (rovid prefix nem szamit)
    const isPrefix = (w: string) => w.replace(/\./g, '').length <= 2;
    const realCount = words.filter(w => !isPrefix(w)).length;
    // Kevesebb mint 3 valodi nevresz → nem tordelunk
    if (realCount < 3) return name;
    // Kotojeles nev: a kotojeles szo utan torjuk
    const hyphenIndex = words.findIndex(w => w.indexOf('-') !== -1);
    if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
      return words.slice(0, hyphenIndex + 1).join(' ') + '\r' + words.slice(hyphenIndex + 1).join(' ');
    }
    // Normal nev: breakAfter valodi szo utan
    let realWordCount = 0;
    let breakIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (!isPrefix(words[i])) realWordCount++;
      if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
    }
    if (breakIndex === -1) return name;
    return words.slice(0, breakIndex).join(' ') + '\r' + words.slice(breakIndex).join(' ');
  }

  // PersonsData előkészítése a JSX számára
  // Python logika: számolás, szétválogatás, elnevezések — JSX csak végrehajtó
  function preparePersonsForJsx(personsData: Array<{ id: number; name: string; type: string }>) {
    const breakAfter = psStore.get('tabloNameBreakAfter', 1);
    const textAlign = psStore.get('tabloTextAlign', 'center');
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    const layers = [
      ...students.map(p => ({
        layerName: sanitizeNameForLayer(p.name, p.id),
        displayText: breakName(p.name, breakAfter),
        group: 'Students',
      })),
      ...teachers.map(p => ({
        layerName: sanitizeNameForLayer(p.name, p.id),
        displayText: breakName(p.name, breakAfter),
        group: 'Teachers',
      })),
    ];

    return {
      layers,
      textAlign,
      stats: { students: students.length, teachers: teachers.length, total: personsData.length },
    };
  }

  // Foto letoltese URL-rol temp mappaba + opcionalis sharp elomeretezes
  // targetSize megadasa eseten cover logika: kitolti a celmeretet (crop kozeprol)
  function downloadPhoto(url: string, fileName: string, targetSize?: { width: number; height: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(app.getPath('temp'), 'psd-photos');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Ha van targetSize, a vegso fajl a resized/ almappaba kerul
      const resizedDir = path.join(tempDir, 'resized');
      const rawPath = path.join(tempDir, fileName);
      const finalPath = targetSize ? path.join(resizedDir, fileName) : rawPath;

      // Ha a vegso fajl mar letezik es friss (5 perc), hasznaljuk
      if (fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (Date.now() - stats.mtimeMs < FIVE_MINUTES && stats.size > 0) {
          log.info(`Cached foto: ${fileName}`);
          resolve(finalPath);
          return;
        }
      }

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(rawPath);

      log.info(`Foto letoltese: ${url} → ${fileName}`);

      protocol.get(url, (response) => {
        // Redirect kezeles
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(rawPath);
            downloadPhoto(redirectUrl, fileName, targetSize).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(rawPath, () => {});
          reject(new Error(`Foto letoltes sikertelen: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();

          // Ha nincs meretezes, kesz
          if (!targetSize) {
            log.info(`Foto letoltve: ${fileName}`);
            resolve(rawPath);
            return;
          }

          // Sharp cover resize: kitolti a celmeretet, kozeprol vagja
          if (!fs.existsSync(resizedDir)) {
            fs.mkdirSync(resizedDir, { recursive: true });
          }

          sharp(rawPath)
            .resize(targetSize.width, targetSize.height, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 95 })
            .toFile(finalPath)
            .then(() => {
              log.info(`Foto meretezve: ${fileName} → ${targetSize.width}x${targetSize.height}`);
              resolve(finalPath);
            })
            .catch((err: Error) => {
              log.warn(`Sharp meretezes sikertelen (${fileName}), eredeti kep hasznalata:`, err.message);
              resolve(rawPath); // fallback: eredeti kep
            });
        });
      }).on('error', (err) => {
        fs.unlink(rawPath, () => {});
        reject(err);
      });
    });
  }

  // Image layerek előkészítése a JSX számára
  // Méretek cm → px átszámítása, elnevezések, csoportosítás, fotó letöltés
  // FONTOS: a pixelszámítás a DOKUMENTUM DPI-jével történik (200),
  // nem a kép DPI-jével (300), mert a placeholder a PSD-ben lesz!
  async function prepareImageLayersForJsx(
    personsData: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>,
    imageSizeCm: { widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number },
    docDpi: number = 200,
  ) {
    const students = personsData.filter(p => p.type !== 'teacher');
    const teachers = personsData.filter(p => p.type === 'teacher');

    // cm → px: a DOKUMENTUM DPI-jével szamolunk, hogy a PSD-ben helyes meretu legyen
    const widthPx = Math.round((imageSizeCm.widthCm / 2.54) * docDpi);
    const heightPx = Math.round((imageSizeCm.heightCm / 2.54) * docDpi);

    // Fotok parhuzamos letoltese (csak ahol van photoUrl)
    const allPersons = [...students, ...teachers];
    const downloadResults = await Promise.all(
      allPersons.map(async (p) => {
        if (!p.photoUrl) return null;
        try {
          const layerName = sanitizeNameForLayer(p.name, p.id);
          const ext = p.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${layerName}.${ext}`;
          return await downloadPhoto(p.photoUrl, fileName, { width: widthPx, height: heightPx });
        } catch (err) {
          log.warn(`Foto letoltes sikertelen (${p.name}):`, err);
          return null;
        }
      }),
    );

    // Layers felepitese a letoltesi eredmenyekkel
    const layers = allPersons.map((p, idx) => ({
      layerName: sanitizeNameForLayer(p.name, p.id),
      group: p.type === 'teacher' ? 'Teachers' : 'Students',
      widthPx,
      heightPx,
      photoPath: downloadResults[idx] || null,
    }));

    const withPhoto = downloadResults.filter(r => r !== null).length;

    return {
      layers,
      stats: { students: students.length, teachers: teachers.length, total: personsData.length, withPhoto },
      imageSizeCm,
      studentSizeCm: imageSizeCm.studentSizeCm || 0,
      teacherSizeCm: imageSizeCm.teacherSizeCm || 0,
    };
  }

  // JSX script utvonal feloldasa: workDir/scripts/ elsodleges, Electron fallback
  function resolveJsxPath(scriptName: string): string {
    // 1. Ha van workDir es a fajl letezik benne → onnan olvassuk
    const workDir = psStore.get('workDirectory', null);
    if (workDir) {
      const workDirPath = path.join(workDir, 'scripts', scriptName);
      if (fs.existsSync(workDirPath)) {
        return workDirPath;
      }
    }

    // 2. Fallback: eredeti Electron scripts/ hely
    return app.isPackaged
      ? path.join(process.resourcesPath, 'scripts', 'photoshop', 'extendscript', scriptName)
      : path.join(__dirname, '..', '..', 'scripts', 'photoshop', 'extendscript', scriptName);
  }

  // JSX #include direktívák feloldása (inline-olja a fájl tartalmát)
  function resolveIncludes(scriptContent: string, scriptDir: string): string {
    return scriptContent.replace(
      /\/\/\s*#include\s+"([^"]+)"/g,
      (_match, includePath) => {
        const fullPath = path.resolve(scriptDir, includePath);
        if (!fs.existsSync(fullPath)) {
          log.warn(`JSX #include fajl nem talalhato: ${fullPath}`);
          return `// HIBA: #include fajl nem talalhato: ${includePath}`;
        }
        const includeContent = fs.readFileSync(fullPath, 'utf-8');
        // Rekurzív #include feloldás
        return resolveIncludes(includeContent, path.dirname(fullPath));
      },
    );
  }

  // JSX script osszeallitasa: deploy + CONFIG beallitasok + #include feloldas + action kod
  function buildJsxScript(scriptName: string, dataFilePath?: string, targetDocName?: string, psdFilePath?: string): string {
    // Scriptek kihelyezese a workDir-be (ha van beallitva)
    const workDir = psStore.get('workDirectory', null);
    if (workDir) {
      deployJsxScripts(workDir);
    }

    const scriptPath = resolveJsxPath(scriptName);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`JSX script nem talalhato: ${scriptPath}`);
    }

    let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    const scriptDir = path.dirname(scriptPath);

    // #include direktívák feloldása
    scriptContent = resolveIncludes(scriptContent, scriptDir);

    // CONFIG override-ok beallitasa a CONFIG blokk UTAN
    const configOverrides: string[] = [];
    if (dataFilePath) {
      const escapedPath = dataFilePath.replace(/\\/g, '/');
      configOverrides.push(`CONFIG.DATA_FILE_PATH = "${escapedPath}";`);
    }
    if (targetDocName) {
      const escapedName = targetDocName.replace(/"/g, '\\"');
      configOverrides.push(`CONFIG.TARGET_DOC_NAME = "${escapedName}";`);
    }
    if (psdFilePath) {
      const escapedPsd = psdFilePath.replace(/\\/g, '/');
      configOverrides.push(`CONFIG.PSD_FILE_PATH = "${escapedPsd}";`);
    }

    if (configOverrides.length > 0) {
      const overrideBlock = '\n' + configOverrides.join('\n') + '\n';
      const configStart = scriptContent.indexOf('var CONFIG');
      if (configStart > -1) {
        const configEnd = scriptContent.indexOf('};', configStart);
        if (configEnd > -1) {
          scriptContent = scriptContent.slice(0, configEnd + 2) + overrideBlock + scriptContent.slice(configEnd + 2);
        }
      }
    }

    return scriptContent;
  }

  // AppleScript: JSX futtatasa fokusz megtartassal
  // Elotti frontmost app-ot menti, JSX utan visszaallitja
  // FONTOS: Ha az Electron app volt a frontmost, NEM aktivaljuk vissza,
  // mert az a main window-t is elorehozza (pl. overlay polling eseten)
  function buildFocusPreservingAppleScript(jsxFilePath: string): string {
    const appName = app.getName();
    return [
      'set _frontApp to name of (info for (path to frontmost application))',
      'tell application id "com.adobe.Photoshop"',
      `  set _result to do javascript file "${jsxFilePath}"`,
      'end tell',
      `if _frontApp is not "${appName}" then`,
      '  tell application _frontApp to activate',
      'end if',
      'return _result',
    ].join('\n');
  }

  // Run JSX script (non-streaming) via osascript
  ipcMain.handle('photoshop:run-jsx', async (_event, params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    psdFilePath?: string;
    personsData?: Array<{ id: number; name: string; type: string }>;
    imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number };
    jsonData?: Record<string, unknown>;
  }) => {
    let tempJsonPath: string | null = null;

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }

      // Biztonsag: script nev nem tartalmazhat path traversal-t
      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      // Ha personsData-t kaptunk, előkészítjük és temp JSON fajlba irjuk
      let dataFilePath = params.dataFilePath;
      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX persons JSON irva: ${tempJsonPath} (${prepared.stats.total} fo: ${prepared.stats.students} diak, ${prepared.stats.teachers} tanar)`);
      }

      // Ha imageData-t kaptunk, image layerek előkészítése (async — fotó letöltéssel)
      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        const prepared = await prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(prepared), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX images JSON irva: ${tempJsonPath} (${prepared.stats.total} fo, ${prepared.stats.withPhoto} fotoval, ${prepared.layers[0]?.widthPx}x${prepared.layers[0]?.heightPx} px)`);
      }

      // Ha jsonData-t kaptunk (altalanos JSON adat, pl. guide margo), temp fajlba irjuk
      if (!dataFilePath && params.jsonData) {
        tempJsonPath = path.join(app.getPath('temp'), `jsx-data-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
        dataFilePath = tempJsonPath;
        log.info(`JSX jsonData irva: ${tempJsonPath}`);
      }

      const jsxCode = buildJsxScript(params.scriptName, dataFilePath, params.targetDocName, params.psdFilePath);
      log.info(`JSX script futtatasa: ${params.scriptName} (${jsxCode.length} karakter)`);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      // A JSX kodot temp fajlba irjuk, mert tul hosszu lenne a parancssorba
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-script-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = buildFocusPreservingAppleScript(tempJsxPath);

      return new Promise<{ success: boolean; error?: string; output?: string }>((resolve) => {
        execFile('osascript', ['-e', appleScript], { timeout: 60000 }, (error, stdout, stderr) => {
          // Temp fajlok torlese
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }

          if (error) {
            log.error('JSX futtatasi hiba:', error.message, stderr);
            resolve({ success: false, error: stderr || error.message });
            return;
          }
          log.info('JSX sikeresen lefutott:', stdout.trim().slice(0, 500));
          resolve({ success: true, output: stdout || '' });
        });
      });
    } catch (error) {
      if (tempJsonPath && fs.existsSync(tempJsonPath)) {
        try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('JSX futtatasi hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
  });

  // Run JSX script with streaming debug logs
  ipcMain.handle('photoshop:run-jsx-debug', async (_event, params: {
    scriptName: string;
    dataFilePath?: string;
    targetDocName?: string;
    psdFilePath?: string;
    personsData?: Array<{ id: number; name: string; type: string }>;
    imageData?: { persons: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>; widthCm: number; heightCm: number; dpi: number; studentSizeCm?: number; teacherSizeCm?: number };
    jsonData?: Record<string, unknown>;
  }) => {
    const win = _mainWindow;
    let tempJsonPath: string | null = null;

    const sendLog = (line: string, stream: 'stdout' | 'stderr') => {
      try { win.webContents.send('jsx-debug-log', { line, stream }); } catch (_) { /* ignore */ }
    };

    try {
      if (typeof params.scriptName !== 'string' || params.scriptName.length > 200) {
        return { success: false, error: 'Ervenytelen script nev' };
      }

      if (params.scriptName.includes('..') || params.scriptName.startsWith('/')) {
        return { success: false, error: 'Ervenytelen script utvonal' };
      }

      // Ha personsData-t kaptunk, előkészítjük és temp JSON fajlba irjuk
      let dataFilePath = params.dataFilePath;
      if (!dataFilePath && params.personsData && params.personsData.length > 0) {
        const prepared = preparePersonsForJsx(params.personsData);
        tempJsonPath = path.join(app.getPath('temp'), `jsx-persons-debug-${Date.now()}.json`);
        const jsonStr = JSON.stringify(prepared);
        fs.writeFileSync(tempJsonPath, jsonStr, 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Persons JSON irva: ${tempJsonPath} (${prepared.stats.total} fo: ${prepared.stats.students} diak, ${prepared.stats.teachers} tanar)`, 'stdout');
      }

      // Ha imageData-t kaptunk, image layerek előkészítése (async — fotó letöltéssel)
      if (!dataFilePath && params.imageData && params.imageData.persons.length > 0) {
        sendLog(`[DEBUG] Fotok letoltese...`, 'stdout');
        const prepared = await prepareImageLayersForJsx(params.imageData.persons, {
          widthCm: params.imageData.widthCm,
          heightCm: params.imageData.heightCm,
          dpi: params.imageData.dpi,
          studentSizeCm: params.imageData.studentSizeCm,
          teacherSizeCm: params.imageData.teacherSizeCm,
        });
        tempJsonPath = path.join(app.getPath('temp'), `jsx-images-debug-${Date.now()}.json`);
        const jsonStr = JSON.stringify(prepared);
        fs.writeFileSync(tempJsonPath, jsonStr, 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] Images JSON irva: ${tempJsonPath} (${prepared.stats.total} fo, ${prepared.stats.withPhoto} fotoval, ${prepared.layers[0]?.widthPx}x${prepared.layers[0]?.heightPx} px)`, 'stdout');
      }

      // Ha jsonData-t kaptunk, temp fajlba irjuk
      if (!dataFilePath && params.jsonData) {
        tempJsonPath = path.join(app.getPath('temp'), `jsx-data-debug-${Date.now()}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(params.jsonData), 'utf-8');
        dataFilePath = tempJsonPath;
        sendLog(`[DEBUG] JSON data irva: ${tempJsonPath}`, 'stdout');
      }

      const jsxCode = buildJsxScript(params.scriptName, dataFilePath, params.targetDocName, params.psdFilePath);
      sendLog(`[DEBUG] JSX script: ${params.scriptName} (${jsxCode.length} karakter)`, 'stdout');

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott (osascript)' };
      }

      // Temp JSX fajl
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-debug-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');
      sendLog(`[DEBUG] Temp JSX irva: ${tempJsxPath}`, 'stdout');

      const appleScript = buildFocusPreservingAppleScript(tempJsxPath);

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const child = spawn('osascript', ['-e', appleScript], { timeout: 60000 });
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
          // Temp fajlok torlese
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }

          if (code !== 0) {
            log.error(`JSX debug hiba (exit ${code}):`, stderrBuf);
            resolve({ success: false, error: stderrBuf || `Exit code: ${code}` });
          } else {
            log.info('JSX debug sikeresen lefutott');
            resolve({ success: true });
          }
        });

        child.on('error', (err) => {
          try { fs.unlinkSync(tempJsxPath); } catch (_) { /* ignore */ }
          if (tempJsonPath && fs.existsSync(tempJsonPath)) {
            try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          }
          sendLog(`[DEBUG] HIBA: ${err.message}`, 'stderr');
          log.error('JSX debug spawn hiba:', err);
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      if (tempJsonPath && fs.existsSync(tempJsonPath)) {
        try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
      }
      log.error('JSX debug futtatasi hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
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
      const readJsxPath = resolveJsxPath('actions/read-layout.jsx');
      if (!fs.existsSync(readJsxPath)) {
        return { success: false, error: 'read-layout.jsx nem talalhato' };
      }

      const readJsxCode = buildJsxScript('actions/read-layout.jsx', undefined, params.targetDocName, params.psdFilePath);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott' };
      }

      // Temp JSX fajl
      const tempReadJsxPath = path.join(app.getPath('temp'), `jsx-read-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempReadJsxPath, readJsxCode, 'utf-8');

      const readAppleScript = buildFocusPreservingAppleScript(tempReadJsxPath);

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

      const applyJsxCode = buildJsxScript('actions/apply-template.jsx', tempJsonPath, params.targetDocName, params.psdFilePath);
      const tempApplyJsxPath = path.join(app.getPath('temp'), `jsx-apply-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempApplyJsxPath, applyJsxCode, 'utf-8');

      const applyAppleScript = buildFocusPreservingAppleScript(tempApplyJsxPath);

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
            const fileName = `${item.layerName}.${ext}`;
            const localPath = await downloadPhoto(item.photoUrl, fileName);
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
      const jsxCode = buildJsxScript('actions/place-photos.jsx', tempJsonPath, params.targetDocName, params.psdFilePath);
      const tempJsxPath = path.join(app.getPath('temp'), `jsx-place-photos-${Date.now()}.jsx`);
      fs.writeFileSync(tempJsxPath, jsxCode, 'utf-8');

      const appleScript = buildFocusPreservingAppleScript(tempJsxPath);

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
